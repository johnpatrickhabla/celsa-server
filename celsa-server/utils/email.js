const nodemailer = require("nodemailer");

/**
 * Creates and returns a Nodemailer transporter based on environment variables.
 */
function createTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  // If a specific service like "gmail" is provided
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: { user, pass },
    });
  }

  // Standard SMTP configuration (e.g. Hostinger, SendGrid, Gmail SMTP, Mailgun)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed certificate rejection
    },
  });
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
    const transporter = createTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      `"CELSA Handicrafts" <${process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@celsahandicrafts.com"}>`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #edf2f7;">
          <h1 style="color: #1a202c; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 2px;">CELSA</h1>
          <span style="color: #73511f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 3px; display: block; margin-top: 4px;">Handicrafts</span>
        </div>

        <div style="padding: 24px 0;">
          <h2 style="color: #2d3748; font-size: 20px; margin-top: 0; font-weight: 700;">Password Reset Request</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${recipientName || "there"}</strong>,
          </p>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset your password for your CELSA Handicrafts account. Use the verification code below to complete your password reset:
          </p>

          <div style="background-color: #f7fafc; border: 2px dashed #cbd5e0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="display: block; font-size: 13px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Verification Code</span>
            <span style="font-size: 34px; font-weight: 800; color: #2f855a; letter-spacing: 8px; font-family: monospace;">${resetCode}</span>
            <span style="display: block; font-size: 13px; color: #e53e3e; margin-top: 10px; font-weight: 500;">Valid for 15 minutes</span>
          </div>

          <p style="color: #718096; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            If you did not request this password reset, please ignore this email or reach out to our support team if you suspect unauthorized access.
          </p>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #edf2f7; text-align: center; color: #a0aec0; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} CELSA Handicrafts. All rights reserved.</p>
        </div>
      </div>
    `;

    const textContent = `CELSA Handicrafts - Password Reset Code\n\nHello ${recipientName || "Valued Customer"},\n\nYour password reset verification code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this reset, please ignore this email.`;

    if (!transporter) {
      console.warn(
        `[EMAIL SERVICE] SMTP credentials not set (SMTP_USER / SMTP_PASS). Simulation Mode:\nTo: ${toEmail}\nCode: ${resetCode}`
      );
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your CELSA Handicrafts Password Reset Code: ${resetCode}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL SERVICE] Password reset email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send email to ${toEmail}:`, error);
    return { success: false, error };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
