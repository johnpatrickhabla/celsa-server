const crypto = require("crypto");

const PAYMONGO_BASE_URL = "https://api.paymongo.com";

/**
 * Get the Base64-encoded authorization header for PayMongo API calls.
 */
function getAuthHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not set in environment variables");
  }
  return "Basic " + Buffer.from(secretKey + ":").toString("base64");
}

/**
 * Create a PayMongo Checkout Session (v2).
 *
 * @param {Object} options
 * @param {Array}  options.lineItems     - Array of { name, amount (centavos), quantity }
 * @param {string} options.description   - Description shown on checkout page
 * @param {string} options.referenceNumber - Your internal order number
 * @param {Array}  options.paymentMethodTypes - e.g. ["card", "gcash", "grab_pay", "paymaya"]
 * @param {string} options.successUrl    - Redirect URL on successful payment
 * @param {string} options.cancelUrl     - Redirect URL if customer cancels
 * @param {Object} [options.metadata]    - Optional metadata (e.g. orderId)
 * @returns {Object} PayMongo checkout session response
 */
async function createCheckoutSession({
  lineItems,
  description,
  referenceNumber,
  paymentMethodTypes = ["card", "gcash", "grab_pay", "paymaya"],
  successUrl,
  cancelUrl,
  metadata = {},
}) {
  const response = await fetch(`${PAYMONGO_BASE_URL}/v2/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: lineItems.map((item) => ({
            name: item.name,
            amount: item.amount, // in centavos
            currency: "PHP",
            quantity: item.quantity,
          })),
          description,
          reference_number: referenceNumber,
          payment_method_types: paymentMethodTypes,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata,
        },
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.map((e) => e.detail).join(", ")
        : "PayMongo API error";
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Retrieve a PayMongo Checkout Session by ID.
 *
 * @param {string} sessionId - The checkout session ID (e.g. "cs_...")
 * @returns {Object} PayMongo checkout session
 */
async function retrieveCheckoutSession(sessionId) {
  const response = await fetch(
    `${PAYMONGO_BASE_URL}/v1/checkout_sessions/${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.map((e) => e.detail).join(", ")
        : "Failed to retrieve checkout session";
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Expire (cancel) a PayMongo Checkout Session.
 *
 * @param {string} sessionId
 * @returns {Object}
 */
async function expireCheckoutSession(sessionId) {
  const response = await fetch(
    `${PAYMONGO_BASE_URL}/v1/checkout_sessions/${sessionId}/expire`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.errors && data.errors.length > 0
        ? data.errors.map((e) => e.detail).join(", ")
        : "Failed to expire checkout session";
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Verify a PayMongo webhook signature.
 *
 * PayMongo sends the signature in the `paymongo-signature` header.
 * Format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
 *
 * @param {string|Buffer} rawBody - The raw request body
 * @param {string} signatureHeader - The `paymongo-signature` header value
 * @param {string} webhookSecret - Your webhook secret key from the PayMongo dashboard
 * @returns {boolean} true if signature is valid
 */
function verifyWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) return false;

  try {
    // Parse header parts: t=timestamp, te=test_signature, li=live_signature
    const parts = {};
    signatureHeader.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      parts[key.trim()] = value;
    });

    const timestamp = parts.t;
    if (!timestamp) return false;

    // Construct the signed payload: "timestamp.rawBody"
    const payload =
      timestamp + "." + (typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));

    // Compute HMAC-SHA256
    const computedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // Compare against both test and live signatures
    const testSig = parts.te;
    const liveSig = parts.li;

    if (testSig && crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(testSig))) {
      return true;
    }
    if (liveSig && crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(liveSig))) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

module.exports = {
  createCheckoutSession,
  retrieveCheckoutSession,
  expireCheckoutSession,
  verifyWebhookSignature,
};
