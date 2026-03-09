import AfricasTalking from "africastalking";
import axios from "axios";

// Initialize Africa's Talking SDK
const username = process.env.AFRICASTALKING_USERNAME || "sandbox";
const apiKey = process.env.AFRICASTALKING_API_KEY || "";

// Only initialize if API key is provided
let africastalking: ReturnType<typeof AfricasTalking> | null = null;
let sms: any = null; // AT SDK doesn't always provide good types for sub-modules

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
  if (!apiKey || apiKey.trim() === "") {
    console.error("❌ Africa's Talking SDK not initialized (Missing API Key)");
    return {
      success: false,
      error: "WhatsApp service not configured. Please set AFRICASTALKING_API_KEY in .env file",
    };
  }

  try {
    // Africa's Talking WhatsApp Business API Endpoint
    const url = "https://apis.africastalking.com/v1/whatsapp/message/send";

    const data = {
      username: username,
      to: params.to[0], // AT WhatsApp usually takes one recipient at a time for this endpoint
      message: params.message,
    };

    const config = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apiKey': apiKey
      }
    };

    console.log("📱 Sending WhatsApp message via Africa's Talking to:", params.to);
    
    const response = await axios.post(url, data, config);
    
    console.log("✅ WhatsApp response:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ WhatsApp sending failed:", error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || "Failed to send WhatsApp message",
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
