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
        const { record } = payload;

        if (!record) {
            return new Response(JSON.stringify({ message: "No record found" }), { headers: corsHeaders, status: 200 });
        }

        const { id: grievanceId, user_id: userId, title, description, category, priority } = record;
        const displayId = record.display_id || grievanceId.substring(0, 8).toUpperCase();

        // 2. Fetch Dynamic Data (Profile, User, Division)
        const [profileRes, authRes] = await Promise.all([
            supabase.from('profiles').select('full_name, phone, division_id, division').eq('id', userId).single(),
            supabase.auth.admin.getUserById(userId)
        ]);

        const profile = profileRes.data;
        const submitterEmail = authRes.data?.user?.email;
        const userName = profile?.full_name || 'N/A';
        const userDivisionName = profile?.division || 'Unknown';
        const divisionId = profile?.division_id;

        // 3. Resolve Division Email Dynamically
        let divisionEmail = "";
        if (divisionId) {
            const { data: divData } = await supabase
                .from('divisions')
                .select('email')
                .eq('id', divisionId)
                .single();
            divisionEmail = divData?.email || "";
        }

        // 4. Fetch Targeted Admin & Moderator Emails
        // Admin: Get all (global oversight)
        // Moderator: Only get those in the same division
        let staffQuery = supabase.from('profiles').select('id');

        if (divisionId) {
            staffQuery = staffQuery.or(`role.eq.admin,and(role.eq.moderator,division_id.eq.${divisionId})`);
        } else {
            staffQuery = staffQuery.eq('role', 'admin');
        }

        const { data: staffProfiles } = await staffQuery;

        const staffEmails: string[] = [];
        if (staffProfiles) {
            const staffUsers = await Promise.all(staffProfiles.map(p => supabase.auth.admin.getUserById(p.id)));
            staffUsers.forEach(res => {
                if (res.data?.user?.email) staffEmails.push(res.data.user.email);
            });
        }

        // 5. Fetch Attachments
        const { data: attachments } = await supabase
            .from('grievance_attachments')
            .select('file_name, file_url')
            .eq('grievance_id', grievanceId);

        let attachmentsHtml = '';
        if (attachments && attachments.length > 0) {
            const links = attachments.map(att =>
                `<li><a href="${att.file_url}" target="_blank" style="color: #E53935; text-decoration: none;">View ${att.file_name}</a></li>`
            ).join('');
            attachmentsHtml = `<h3 style="background-color: #f4f4f4; padding: 10px;">Attachments</h3><ul>${links}</ul>`;
        }

        // 6. SMTP Configuration
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        // Recipients Logic
        const uniqueAdmins = [...new Set(staffEmails)].filter(e => e);
        const toList = [divisionEmail, ...uniqueAdmins].filter(e => e);

        if (toList.length === 0 && !submitterEmail) {
            return new Response(JSON.stringify({ message: "No recipients found" }), { headers: corsHeaders, status: 200 });
        }

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

        const mailOptions = {
            from: `"SABCA Alerts" <${SMTP_USER}>`,
            to: toList.length > 0 ? toList : submitterEmail, // Fallback if no staff found
            cc: submitterEmail ? [submitterEmail] : undefined,
            subject: `[New Grievance] ${title} (#${displayId})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #E53935; border-bottom: 2px solid #E53935; padding-bottom: 10px;">New Grievance: #${displayId}</h2>
                    <p>A new grievance has been submitted for <strong>${userDivisionName}</strong>.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Submission Date</strong></td><td style="padding: 10px; border: 1px solid #eee;">${formattedDate} (IST)</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #eee;"><strong>Title</strong></td><td style="padding: 10px; border: 1px solid #eee;">${title}</td></tr>
                        <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Category</strong></td><td style="padding: 10px; border: 1px solid #eee;">${category}</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #eee;"><strong>Priority</strong></td><td style="padding: 10px; border: 1px solid #eee; color: ${priority === 'High' ? 'red' : 'black'}; font-weight: bold;">${priority}</td></tr>
                        <tr style="background: #f9f9f9;"><td style="padding: 10px; border: 1px solid #eee;"><strong>Submitter</strong></td><td style="padding: 10px; border: 1px solid #eee;">${userName} (${profile?.phone || 'No Phone'})</td></tr>
                    </table>

                    <h3 style="background-color: #f4f4f4; padding: 10px;">Description</h3>
                    <p style="white-space: pre-wrap; padding: 15px; border: 1px solid #eee; background: #fff;">${description}</p>
                    
                    ${attachmentsHtml}
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #f4f4f4; border-radius: 5px; text-align: center;">
                        <p style="margin: 0; color: #555; font-size: 14px;">Please open the <strong>SABCA Admin App</strong> to process this grievance.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);

        return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
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

