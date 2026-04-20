const { Resend } = require('resend');

/**
 * Initialize Resend lazily to avoid crashes if env is not loaded yet
 */
let resendClient;
function getResendClient() {
    if (!resendClient) {
        if (!process.env.RESEND_API_KEY) {
            console.warn('[InternAlert] RESEND_API_KEY is missing in .env. Email reports will fail.');
            return null;
        }
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

/**
 * Sends the internship report email using Resend
 * Highly stylized and interactive-friendly layout
 */
async function sendReportEmail(email, results, prefs) {
    try {
        const resend = getResendClient();
        if (!resend) return { error: 'Resend not configured' };

        const tableRows = results.map((job, index) => `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${job.title}</h3>
                        <p style="margin: 4px 0 0; color: #3b82f6; font-weight: 600; font-size: 14px;">${job.company}</p>
                    </div>
                    <span style="background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                        ${job.type || 'Internship'}
                    </span>
                </div>
                <p style="margin: 12px 0; color: #64748b; font-size: 13px; line-height: 1.5;">${job.description?.substring(0, 160) || 'No description available'}...</p>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <a href="${job.url}" style="background: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; display: inline-block;">
                        View & Apply
                    </a>
                    <span style="color: #94a3b8; font-size: 12px;">Via ${job.source}</span>
                </div>
            </div>
        `).join('');

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #f8fafc; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #0f172a; margin: 0; letter-spacing: -1px; font-size: 28px;">InternAlert</h1>
                    <p style="color: #64748b; font-size: 16px;">Your Career Radar is Active</p>
                </div>

                <div style="margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #1d4ed8; font-weight: 600;">REPORT SUMMARY</p>
                    <h2 style="margin: 8px 0 0; color: #1e3a8a; font-size: 20px;">${results.length} Matches Found</h2>
                    <div style="margin-top: 12px; font-size: 12px; color: #60a5fa;">
                        Filters: ${prefs?.roles?.join(', ') || 'General'} • ${Array.isArray(prefs?.location) ? prefs.location.join(', ') : (prefs?.location || 'Remote')}
                    </div>
                </div>

                ${tableRows}

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                    <p>Stay sharp. Opportunities wait for no one.</p>
                    <p>&copy; 2026 InternAlert. Built for the ambitious.</p>
                </div>
            </div>
        `;

        return await resend.emails.send({
            from: process.env.EMAIL_FROM || 'InternAlert <radar@internai.jaggu.me>',
            to: email,
            subject: `🚀 ${results.length} New Opportunities Found — InternAlert`,
            html: html,
        });
    } catch (err) {
        console.error('[InternAlert] Failed to send email via Resend:', err.message);
        return { error: err.message };
    }
}

async function sendTestEmail(email) {
    const resend = getResendClient();
    if (!resend) return { error: 'Resend not configured' };

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #f8fafc; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #0f172a; margin: 0; letter-spacing: -1px; font-size: 28px;">InternAlert Connected</h1>
                <p style="color: #64748b; font-size: 16px;">This is a test to confirm your email is synced.</p>
            </div>
            <div style="text-align: center; color: #94a3b8; font-size: 12px;">
                <p>&copy; 2026 InternAlert. Built for the ambitious.</p>
            </div>
        </div>
    `;

    try {
        return await resend.emails.send({
            from: process.env.EMAIL_FROM || 'InternAlert <radar@internai.jaggu.me>',
            to: email,
            subject: '✅ InternAlert Account Synced!',
            html: html,
        });
    } catch (err) {
        console.error('[InternAlert] Failed to send test email:', err.message);
        return { error: err.message };
    }
}

module.exports = {
    sendReportEmail,
    sendTestEmail
};
