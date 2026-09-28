import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Authenticate Requesting User (Must be Admin)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const supabaseClient = createClient(
            SUPABASE_URL,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Extract token from Bearer string
        const token = authHeader.replace("Bearer ", "").trim();

        // 1. Authenticate Requesting User (Must be Admin)
        const { data: { user: executor }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !executor) {
            console.error("Auth Error:", authError);
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        // Check if executor is an admin
        const { data: executorProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', executor.id)
            .single();

        if (profileError || executorProfile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: "Forbidden: Only admins can delete users" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        // 2. Parse User ID to Delete
        const { target_user_id } = await req.json();
        if (!target_user_id) {
            return new Response(JSON.stringify({ error: "Missing target_user_id" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Don't allow admins to delete themselves
        if (target_user_id === executor.id) {
            return new Response(JSON.stringify({ error: "You cannot delete yourself" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        console.log(`Deleting user ${target_user_id} and their data...`);

        // 3. Database Cleanup (Atomic RPC)
        console.log(`Calling delete_user_data_cascade for user: ${target_user_id}`);
        const { error: rpcError } = await supabaseAdmin.rpc('delete_user_data_cascade', {
            p_user_id: target_user_id
        });

        if (rpcError) {
            console.error("RPC Deletion Error:", rpcError);
            throw new Error(`Database cleanup failed: ${rpcError.message}`);
        }

        // 4. Storage cleanup (Best effort)
        try {
            const buckets = ['avatars', 'documents', 'grievance-attachments'];
            for (const bucket of buckets) {
                const { data: files } = await supabaseAdmin.storage.from(bucket).list(target_user_id);
                if (files && files.length > 0) {
                    const paths = files.map(f => `${target_user_id}/${f.name}`);
                    await supabaseAdmin.storage.from(bucket).remove(paths);
                }
            }
        } catch (storageError) {
            console.warn("Storage cleanup warning:", storageError);
        }

        // 5. Auth Deletion
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
        if (deleteError) throw deleteError;

        // 6. Manual profile delete if needed (in case the trigger is missing)
        await supabaseAdmin.from('profiles').delete().eq('id', target_user_id);

        return new Response(JSON.stringify({ success: true, message: "User purged successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Critical Deletion Error:", error);

        // Diagnostic: list tables to see if we missed any
        let tables: any[] = [];
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
            const adminClient = createClient(supabaseUrl!, supabaseServiceKey!)
            const { data } = await adminClient.rpc('get_tables_diagnostic');
            tables = data || [];
        } catch (diagError) {
            console.error("Diag Error:", diagError);
        }

        return new Response(JSON.stringify({
            error: error.message || "Internal Server Error",
            details: error.toString()
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
