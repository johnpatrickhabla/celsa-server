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
 * Returns true when Gmail API (OAuth2) credentials are configured.
 */
function hasGmailApiConfig() {
  const id = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GMAIL_REFRESH_TOKEN;
  return !!(id && secret && refresh && !isPlaceholder(refresh));
}

/**
 * Sends an email via the Gmail REST API over HTTPS (port 443) using an OAuth2 refresh token.
 * Free, uses the existing Gmail account, and is NOT blocked by Render's free tier
 * (which blocks outbound SMTP ports 25/465/587).
 */
async function sendViaGmailApi({ from, to, subject, html, text }) {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN.trim();

  // 1) Exchange refresh token for a short-lived access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.access_token) {
    throw new Error(
      `Gmail OAuth token error ${tokenRes.status}: ${tokenBody.error || ""} ${tokenBody.error_description || ""}`.trim()
    );
  }

  // 2) Build the raw MIME message with nodemailer (stream transport = no network)
  const composer = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "unix" });
  const { message } = await composer.sendMail({ from, to, subject, html, text });
  const raw = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // 3) Send via Gmail API
  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenBody.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  const sendBody = await sendRes.json().catch(() => ({}));
  if (!sendRes.ok) {
    throw new Error(`Gmail API ${sendRes.status}: ${sendBody.error?.message || "unknown error"}`);
  }
  return sendBody.id;
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

    // 1) Preferred in production: Gmail API over HTTPS (works on Render free tier)
    if (hasGmailApiConfig()) {
      const messageId = await sendViaGmailApi({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });
      console.log(`[EMAIL SERVICE] Password reset email sent via Gmail API to ${toEmail}. Message ID: ${messageId}`);
      return { success: true, messageId };
    }

    // 2) Fallback: SMTP (local development — blocked on Render free tier)
    if (!transporter) {
      console.log("\n========================================================");
      console.log("🔑 [CELSA PASSWORD RESET CODE - SIMULATION/DEV MODE]");
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

/**
 * Resolves the official direct tracking URL for known Philippine courier services.
 */
function getCourierTrackingUrl(courier = "", trackingNumber = "") {
  if (!trackingNumber) return null;
  const c = (courier || "").toLowerCase().trim();
  const trimmed = trackingNumber.trim();
  if (c.includes("flash")) {
    return `https://www.flashexpress.ph/fle/tracking?se=${encodeURIComponent(trimmed)}`;
  }
  if (c.includes("j&t") || c.includes("jt")) {
    return `https://www.jtexpress.ph/trajectoryQuery?bills=${encodeURIComponent(trimmed)}`;
  }
  if (c.includes("lbc")) {
    return `https://www.lbcexpress.com/track/?tracking_no=${encodeURIComponent(trimmed)}`;
  }
  if (c.includes("ninja")) {
    return `https://www.ninjavan.co/en-ph/tracking?id=${encodeURIComponent(trimmed)}`;
  }
  if (c.includes("2go")) {
    return `https://supplychain.2go.com.ph/track/`;
  }
  return null;
}

/**
 * Sends an automated shipment & tracking notification email to the customer.
 */
async function sendShippingEmail({
  toEmail,
  recipientName = "Valued Customer",
  orderNumber,
  courierName = "Courier",
  trackingNumber,
  shippingAddress,
}) {
  try {
    const transporter = getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      `"CELSA Handicrafts" <${process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@celsahandicrafts.com"}>`;

    const year = new Date().getFullYear();
    const directTrackingUrl = getCourierTrackingUrl(courierName, trackingNumber);
    const trackingBtnUrl = directTrackingUrl || "https://celsa-client.vercel.app/my-orders";
    const trackingBtnLabel = directTrackingUrl
      ? `Track on ${courierName} →`
      : "Track on CELSA Website →";

    const formattedAddress = shippingAddress
      ? `${shippingAddress.street || ""}, ${shippingAddress.city || ""}, ${shippingAddress.province || ""}`.replace(/^, |, $/g, "")
      : "";

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Order Has Shipped – CELSA Handicrafts</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">

          <!-- HEADER / BRAND -->
          <tr>
            <td style="background-color:#1c1917;padding:32px 40px;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:4px;text-transform:uppercase;">CELSA</span>
              <span style="display:block;font-size:10px;font-weight:600;color:#c99e32;letter-spacing:5px;text-transform:uppercase;margin-top:3px;">HANDICRAFTS</span>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Icon -->
              <div style="text-align:center;margin-bottom:20px;">
                <div style="display:inline-block;background-color:#ecfdf5;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;border:2px solid #a7f3d0;">
                  <span style="font-size:32px;">🚚</span>
                </div>
              </div>

              <!-- Heading -->
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;text-align:center;">Your Package Is on the Way!</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;text-align:center;line-height:1.6;">
                Hi <strong style="color:#111827;">${recipientName}</strong>, great news! Your CELSA order <strong style="color:#15803d;">#${orderNumber}</strong> has been handed over to the courier and is dispatched for delivery.
              </p>

              <!-- SHIPMENT INFO BOX -->
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:24px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding-bottom:12px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Courier / Carrier</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:20px;font-size:17px;font-weight:700;color:#111827;">
                      ${courierName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking / Waybill Number</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:20px;">
                      <div style="background-color:#ffffff;border:1.5px dashed #15803d;border-radius:8px;padding:12px 16px;display:inline-block;">
                        <span style="font-size:20px;font-weight:800;color:#15803d;font-family:'Courier New',Courier,monospace;letter-spacing:2px;">
                          ${trackingNumber}
                        </span>
                      </div>
                    </td>
                  </tr>
                  ${
                    formattedAddress
                      ? `<tr>
                    <td style="padding-bottom:8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Destination Address</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#374151;line-height:1.5;">${formattedAddress}</td>
                  </tr>`
                      : ""
                  }
                </table>

                <!-- Call to action button -->
                <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
                  <a href="${trackingBtnUrl}" target="_blank" style="display:inline-block;background-color:#15803d;color:#ffffff;font-size:15px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(21,128,61,0.2);">
                    ${trackingBtnLabel}
                  </a>
                </div>
              </div>

              <!-- Helpful Note -->
              <div style="background-color:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  💡 <strong>Tracking Tip:</strong> You can copy the waybill code above and track your parcel anytime directly on the <strong>${courierName}</strong> portal, or track it right inside your CELSA account on our website.
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;line-height:1.5;">
                Thank you for supporting traditional Filipino craftsmanship!
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">This is an automated notification from CELSA Handicrafts.</p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">&copy; ${year} CELSA Handicrafts. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `CELSA Handicrafts – Your Order Has Shipped!

Hi ${recipientName},

Great news! Your CELSA order #${orderNumber} has shipped and is on its way.

Shipment Details:
- Courier: ${courierName}
- Tracking Number: ${trackingNumber}
${formattedAddress ? `- Address: ${formattedAddress}\n` : ""}
Track online: ${trackingBtnUrl}

Thank you for choosing CELSA Handicrafts!

© ${year} CELSA Handicrafts. All rights reserved.`;

    const subject = `🚚 Your CELSA Order #${orderNumber} Has Shipped via ${courierName}!`;

    // 1) Production: Gmail API over HTTPS
    if (hasGmailApiConfig()) {
      const messageId = await sendViaGmailApi({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });
      console.log(`[EMAIL SERVICE] Shipping notification email sent via Gmail API to ${toEmail}. Message ID: ${messageId}`);
      return { success: true, messageId };
    }

    // 2) Fallback: SMTP / Dev Mode
    if (!transporter) {
      console.log("\n========================================================");
      console.log("🚚 [CELSA SHIPPING NOTIFICATION - SIMULATION/DEV MODE]");
      console.log(`📧 Recipient: ${toEmail} (${recipientName})`);
      console.log(`📦 Order: #${orderNumber}`);
      console.log(`🏢 Courier: ${courierName}`);
      console.log(`🏷️ Tracking: ${trackingNumber}`);
      console.log(`🔗 Tracking URL: ${trackingBtnUrl}`);
      console.log("========================================================\n");
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL SERVICE] Shipping email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send shipping email to ${toEmail}:`, error.message);
    return { success: false, error };
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendShippingEmail,
  getCourierTrackingUrl,
};
