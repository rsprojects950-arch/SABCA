import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import nodemailer from "npm:nodemailer";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// SMTP Credentials
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER");
const SMTP_PASS = Deno.env.get("SMTP_PASS");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Parse Webhook Payload
        const payload = await req.json();
        const { record, old_record } = payload;

        if (!record || !old_record) {
            return new Response(JSON.stringify({ message: "Invalid payload" }), { headers: corsHeaders, status: 200 });
        }

        // Only fire if status has changed
        if (record.status === old_record.status) {
            return new Response(JSON.stringify({ message: "No status change" }), { headers: corsHeaders, status: 200 });
        }

        const { id: grievanceId, user_id: userId, title, status, division_id, assigned_to } = record;
        const displayId = record.display_id || grievanceId.substring(0, 8).toUpperCase();

        // 2. Fetch Data
        const [userAuth, userProfile, divData, modAuth] = await Promise.all([
            supabase.auth.admin.getUserById(userId),
            supabase.from('profiles').select('full_name').eq('id', userId).single(),
            division_id ? supabase.from('divisions').select('email').eq('id', division_id).single() : Promise.resolve({ data: null }),
            assigned_to ? supabase.auth.admin.getUserById(assigned_to) : Promise.resolve({ data: { user: null } })
        ]);

        const userEmail = userAuth.data?.user?.email;
        const userName = userProfile.data?.full_name || 'User';
        const divisionEmail = divData.data?.email;
        const modEmail = modAuth.data?.user?.email;

        if (!userEmail) {
            return new Response(JSON.stringify({ message: "User email not found" }), { headers: corsHeaders, status: 200 });
        }

        // 3. Setup Transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        // IST Formatting
        const formattedDate = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date());

        // 4. Construct Email
        const ccList = [divisionEmail, modEmail].filter(e => e);
        const mailOptions = {
            from: `"SABCA Updates" <${SMTP_USER}>`,
            to: userEmail,
            cc: ccList.length > 0 ? ccList : undefined,
            subject: `[Update] Grievance Status: ${status} (#${displayId})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #6366F1; padding: 20px;">
                    <h2 style="color: #6366F1; border-bottom: 2px solid #6366F1; padding-bottom: 10px;">Status Update: #${displayId}</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>The status of your grievance "<strong>${title}</strong>" has been updated.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; ">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate} (IST)</p>
                        <p style="font-size: 18px; margin: 10px 0;">New Status: <strong style="color: #4F46E5;">${status}</strong></p>
                    </div>

                    <div style="margin-top: 30px; padding: 15px; background-color: #f4f4f4; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; color: #555; font-size: 14px;">Please open the <strong>SABCA App</strong> to view the full details of this update.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
