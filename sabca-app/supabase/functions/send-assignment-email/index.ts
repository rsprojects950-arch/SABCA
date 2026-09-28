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

        const oldAssignedTo = old_record.assigned_to;
        const newAssignedTo = record.assigned_to;

        // Skip if no change or unassigned
        if (oldAssignedTo === newAssignedTo || !newAssignedTo) {
            return new Response(JSON.stringify({ message: "No assignment change" }), { headers: corsHeaders, status: 200 });
        }

        const { id: grievanceId, user_id: userId, title, description, division_id } = record;
        const displayId = record.display_id || grievanceId.substring(0, 8).toUpperCase();

        // 2. Fetch All Required Data
        const [userAuth, userProfile, modAuth, modProfile, divData] = await Promise.all([
            supabase.auth.admin.getUserById(userId),
            supabase.from('profiles').select('full_name, division').eq('id', userId).single(),
            supabase.auth.admin.getUserById(newAssignedTo),
            supabase.from('profiles').select('full_name').eq('id', newAssignedTo).single(),
            division_id ? supabase.from('divisions').select('email').eq('id', division_id).single() : Promise.resolve({ data: null })
        ]);

        const userEmail = userAuth.data?.user?.email;
        const userName = userProfile.data?.full_name || 'User';
        const modEmail = modAuth.data?.user?.email;
        const modName = modProfile.data?.full_name || 'Moderator';
        const divisionEmail = divData.data?.email;

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

        const emailsToSend = [];

        // 4. Email to User
        if (userEmail) {
            emailsToSend.push({
                from: `"SABCA Updates" <${SMTP_USER}>`,
                to: userEmail,
                cc: divisionEmail ? [divisionEmail] : undefined,
                subject: `[Update] Moderator Assigned: #${displayId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #10B981; padding: 20px;">
                        <h2 style="color: #10B981; border-bottom: 2px solid #10B981; padding-bottom: 10px;">Grievance Update: #${displayId}</h2>
                        <p>Dear <strong>${userName}</strong>,</p>
                        <p>A moderator has been assigned to investigate and resolve your grievance.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Date:</strong> ${formattedDate} (IST)</p>
                            <p><strong>Grievance Title:</strong> ${title}</p>
                            <p><strong>Assigned Moderator:</strong> ${modName}</p>
                        </div>
                        <div style="margin-top: 30px; padding: 15px; background-color: #f4f4f4; border-radius: 5px; text-align: center;">
                            <p style="margin: 0; color: #555; font-size: 14px;">Please open the <strong>SABCA App</strong> to track your grievance status.</p>
                        </div>
                    </div>
                `
            });
        }

        // 5. Email to Moderator
        if (modEmail) {
            emailsToSend.push({
                from: `"SABCA Alerts" <${SMTP_USER}>`,
                to: modEmail,
                cc: divisionEmail ? [divisionEmail] : undefined,
                subject: `[New Assignment] Action Required: #${displayId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #3B82F6; padding: 20px;">
                        <h2 style="color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">Assignment: #${displayId}</h2>
                        <p>Dear <strong>${modName}</strong>,</p>
                        <p>You have been assigned to handle a new grievance for <strong>${userProfile.data?.division || 'Unknown Division'}</strong>.</p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Date:</strong> ${formattedDate} (IST)</p>
                            <p><strong>Complainant:</strong> ${userName}</p>
                            <p><strong>Title:</strong> ${title}</p>
                        </div>
                        <h3>Description:</h3>
                        <p style="white-space: pre-wrap; padding: 15px; border: 1px solid #eee; background: #fff;">${description}</p>
                        <div style="margin-top: 30px; padding: 15px; background-color: #f4f4f4; border-radius: 5px; text-align: center;">
                            <p style="margin: 0; color: #555; font-size: 14px;">Please open the <strong>SABCA Admin App</strong> to view and handle this assignment.</p>
                        </div>
                    </div>
                `
            });
        }

        await Promise.allSettled(emailsToSend.map(opts => transporter.sendMail(opts)));

        return new Response(JSON.stringify({ success: true, count: emailsToSend.length }), {
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

