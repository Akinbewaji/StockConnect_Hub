import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface BusinessData {
  sales: any[];
  inventory: any[];
  customers: any[];
  recentOrders: any[];
}

/**
 * Generate business insights using Gemini AI
 */
export async function generateBusinessInsights(data: BusinessData, query: string = "Analyze my business status and provide 3 key recommendations for today.") {
  if (!genAI) {
    throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY in your .env file.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a professional business consultant for a small to medium enterprise named "StockConnect".
      I will provide you with my current business data. 
      Please analyze it and answer the following query: "${query}"

      Business Data:
      - Total Sales (last 7 days): ${JSON.stringify(data.sales)}
      - Current Inventory (Products/Stock): ${JSON.stringify(data.inventory.length)} items, including low stock items.
      - Total Customers: ${data.customers.length}
      - Recent Orders Summary: ${JSON.stringify(data.recentOrders)}

      Instructions:
      1. Provide clear, actionable insights.
      2. If asked for graphical representations, suggest what kind of charts (Line, Bar, Pie) would best represent the data for that specific query.
      3. Keep the tone professional, encouraging, and concise.
      4. Format the response in Markdown. Use bolding and lists for readability.
      5. If the query is about "Decision Making", highlight the pros and cons of the suggested actions.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("❌ Gemini AI Error:", error);
    throw new Error("Failed to generate AI insights: " + error.message);
  }
}

/**
 * Specifically format data for a "Daily Report" for WhatsApp
 */
export async function generateDailyWhatsAppSummary(data: BusinessData) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Create a very brief daily business summary for a WhatsApp message.
      Data:
      - Sales Today: ${JSON.stringify(data.sales)}
      - Top Products: ${JSON.stringify(data.recentOrders.slice(0, 3))}
      - Low Stock count: ${data.inventory.filter((p: any) => p.quantity <= p.reorder_threshold).length}
      
      Format:
      📊 *StockConnect Daily Report*
      💰 Total Sales Today: ₦ [Amount]
      📦 Top Selling: [Item1], [Item2]
      ⚠️ Low Stock Items: [Count]
      💡 Insight: [1 sentence advice]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Gemini AI Report Error:", error);
    return null;
  }
}

export default {
  generateBusinessInsights,
  generateDailyWhatsAppSummary
};
