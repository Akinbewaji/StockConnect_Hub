import AfricasTalking from "africastalking";

// Initialize Africa's Talking SDK
const username = process.env.AFRICASTALKING_USERNAME || "sandbox";
const apiKey = process.env.AFRICASTALKING_API_KEY || "";

// Only initialize if API key is provided
let africastalking: any = null;
let sms: any = null;

if (apiKey && apiKey.trim() !== "") {
  africastalking = AfricasTalking({
    apiKey,
    username,
  });
  sms = africastalking.SMS;
  console.log("✅ Africa's Talking SDK initialized successfully");
} else {
  console.warn(
    "⚠️  Africa's Talking API key not configured. SMS and WhatsApp features will not work.",
  );
  console.warn("   Please set AFRICASTALKING_API_KEY in your .env file");
}

export interface SendSMSParams {
  to: string[];
  message: string;
  from?: string;
}

export interface SendWhatsAppParams {
  to: string[];
  message: string;
}

/**
 * Send SMS to multiple recipients
 */
export async function sendSMS(params: SendSMSParams) {
  if (!sms) {
    console.error("❌ Africa's Talking SDK not initialized");
    return {
      success: false,
      error:
        "SMS service not configured. Please set AFRICASTALKING_API_KEY in .env file",
    };
  }

  try {
    const options = {
      to: params.to,
      message: params.message,
      from: params.from,
    };

    const result = await sms.send(options);
    console.log("✅ SMS sent successfully:", result);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("❌ SMS sending failed:", error);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
    };
  }
}

/**
 * Send WhatsApp message to multiple recipients
 * Note: This requires Africa's Talking WhatsApp Business API setup
 */
export async function sendWhatsApp(params: SendWhatsAppParams) {
  try {
    // Africa's Talking WhatsApp requires a separate API call
    // This is a placeholder implementation
    // You'll need to implement the actual WhatsApp API integration

    console.log("📱 WhatsApp message queued for:", params.to);
    console.log("Message:", params.message);

    // For now, return a mock success response
    // In production, you'd make an HTTP request to AT's WhatsApp API
    return {
      success: true,
      data: {
        message: "WhatsApp messages queued",
        recipients: params.to,
      },
      warning:
        "WhatsApp integration requires additional setup with Africa's Talking WhatsApp Business API",
    };
  } catch (error: any) {
    console.error("❌ WhatsApp sending failed:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp message",
    };
  }
}

/**
 * Validate phone number format for Africa's Talking
 * Should be in international format: +254XXXXXXXXX
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "");

  // Check if it starts with + and has 10-15 digits
  const regex = /^\+[1-9]\d{9,14}$/;
  return regex.test(cleaned);
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(
  phone: string,
  countryCode: string = "+234",
): string {
  // Remove spaces, dashes, and leading zeros
  let cleaned = phone.replace(/[\s-]/g, "").replace(/^0+/, "");

  // Add country code if not present
  if (!cleaned.startsWith("+")) {
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

export default {
  sendSMS,
  sendWhatsApp,
  validatePhoneNumber,
  formatPhoneNumber,
};
