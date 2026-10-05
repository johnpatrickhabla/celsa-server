const nodemailer = require("nodemailer");

/**
 * Checks if a value is a placeholder/default (not real credentials).
 */
function isPlaceholder(val) {
  if (!val) return true;
  const s = val.toLowerCase().trim();
  return (
    s.includes("your-gmail") ||
    s.includes("your-email") ||
    s.includes("example.com") ||
    s.includes("your16char") ||
    s.includes("your-app-password") ||
    s.includes("changeme")
  );
}

/**
 * Singleton pooled transporter — created once, reused for all emails.
 * Pooling avoids the ~4–5s TCP handshake cost on every send.
 */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (!user || !pass || isPlaceholder(user) || isPlaceholder(pass)) {
    return null;
  }

  const service = process.env.SMTP_SERVICE;

  if (service) {
    _transporter = nodemailer.createTransport({
      service,
      pool: true,          // Reuse SMTP connection — avoids reconnect delay
      maxConnections: 3,   // Allow up to 3 simultaneous sends
      maxMessages: 100,    // Recycle connection after 100 messages
      auth: { user, pass },
    });
  } else {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === "true",
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  console.log("[EMAIL SERVICE] Pooled SMTP transporter initialized.");
  return _transporter;
}

/**
 * Parses a "Name <email@x.com>" string into { name, email } for the Brevo API.
 */
function parseAddress(raw, fallbackEmail) {
  const s = (raw || "").trim().replace(/^"|"$/g, "");
  const m = s.match(/^\s*"?([^"<]*)"?\s*<\s*([^>]+)\s*>\s*$/);
  if (m) return { name: m[1].trim() || "CELSA Handicrafts", email: m[2].trim() };
  if (s.includes("@")) return { name: "CELSA Handicrafts", email: s };
  return { name: "CELSA Handicrafts", email: fallbackEmail };
}

/**
 * Sends an email via Brevo's HTTPS API (port 443).
 * Used in production because Render's free tier blocks outbound SMTP ports (25/465/587).
 */
async function sendViaBrevo({ to, toName, subject, html, text }) {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  const sender = parseAddress(
    process.env.BREVO_SENDER || process.env.EMAIL_FROM || process.env.SMTP_FROM,
    process.env.SMTP_USER || process.env.EMAIL_USER
  );

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Brevo API ${res.status}: ${body.message || body.code || "unknown error"}`);
  }
  return body.messageId;
}

/**
 * Sends a password reset verification code email.
 *
 * @param {string} toEmail - Recipient email
 * @param {string} resetCode - 6-digit verification code
 * @param {string} [recipientName] - Optional recipient name
 * @returns {Promise<{success: boolean, simulated?: boolean, error?: any}>}
 */
async function sendPasswordResetEmail(toEmail, resetCode, recipientName = "Valued Customer") {
  try {
    const transporter = getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      `"CELSA Handicrafts" <${process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@celsahandicrafts.com"}>`;

    const year = new Date().getFullYear();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – CELSA Handicrafts</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- HEADER / BRAND -->
          <tr>
            <td style="background-color:#1a1a1a;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">CELSA</span>
                <span style="display:block;font-size:10px;font-weight:600;color:#8b6914;letter-spacing:5px;text-transform:uppercase;margin-top:3px;">HANDICRAFTS</span>
              </div>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <!-- Icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;background-color:#f0fdf4;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;">
                  <span style="font-size:32px;">🔐</span>
                </div>
              </div>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;text-align:center;">Reset Your Password</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                Hi <strong style="color:#111827;">${recipientName || "there"}</strong>, we received a request to reset your CELSA Handicrafts account password.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 28px;" />

              <!-- OTP Label -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-align:center;text-transform:uppercase;letter-spacing:1.5px;">Your verification code</p>

              <!-- OTP Box -->
              <div style="background-color:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px 16px;text-align:center;margin-bottom:12px;">
                <span style="font-size:42px;font-weight:800;color:#15803d;letter-spacing:14px;font-family:'Courier New',Courier,monospace;">${resetCode}</span>
              </div>

              <!-- Expiry notice -->
              <p style="margin:0 0 28px;font-size:13px;color:#ef4444;text-align:center;font-weight:500;">
                ⏱ This code expires in <strong>15 minutes</strong>
              </p>

              <!-- Steps -->
              <div style="background-color:#fafafa;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;">How to reset your password:</p>
                <ol style="margin:0;padding-left:18px;color:#4b5563;font-size:14px;line-height:1.8;">
                  <li>Go back to the CELSA Handicrafts website</li>
                  <li>Enter the 6-digit code above</li>
                  <li>Create and confirm your new password</li>
                </ol>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />

              <!-- Security warning -->
              <div style="background-color:#fef9ec;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  <strong>⚠️ Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your account is still secure.
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">This email was sent by CELSA Handicrafts. Do not reply to this email.</p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${year} CELSA Handicrafts. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `CELSA Handicrafts – Reset Your Password

Hi ${recipientName || "Valued Customer"},

We received a request to reset your CELSA Handicrafts account password.

Your 6-digit verification code is:

  ${resetCode}

This code expires in 15 minutes.

Steps to reset your password:
1. Go back to the CELSA Handicrafts website
2. Enter the 6-digit code above
3. Create and confirm your new password

If you didn't request a password reset, you can safely ignore this email.

© ${year} CELSA Handicrafts. All rights reserved.`;



    const subject = `Your CELSA Handicrafts Password Reset Code: ${resetCode}`;

    // 1) Preferred: Brevo HTTPS API (works on Render free tier)
    if (process.env.BREVO_API_KEY && !isPlaceholder(process.env.BREVO_API_KEY)) {
      const messageId = await sendViaBrevo({
        to: toEmail,
        toName: recipientName,
        subject,
        html: htmlContent,
        text: textContent,
      });
      console.log(`[EMAIL SERVICE] Password reset email sent via Brevo to ${toEmail}. Message ID: ${messageId}`);
      return { success: true, messageId };
    }

    // 2) Fallback: SMTP (local development)
    if (!transporter) {
      console.log("\n========================================================");
      console.log("🔑 [CELSA PASSWORD RESET CODE - SIMULATION/DEV MODE]");
      console.log("⚠️  No BREVO_API_KEY or SMTP credentials configured — email NOT sent.");
      console.log(`📧 Recipient: ${toEmail}`);
      console.log(`🔢 6-Digit Code: ${resetCode}`);
      console.log("⏰ Valid for 15 minutes");
      console.log("========================================================\n");
      return { success: true, simulated: true, code: resetCode };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL SERVICE] Password reset email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${toEmail}:`, error.message);
    return { success: false, error };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
