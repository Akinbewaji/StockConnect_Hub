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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are 'StockConnect Advisor', an elite business consultant for West African SMEs. Your goal is to maximize profitability and efficiency using data-driven insights. Be professional, direct, and actionable."
    });

    const lowStockItems = data.inventory.filter((p: any) => p.quantity <= p.reorder_threshold);
    
    const prompt = `
      Context:
      - Name: StockConnect SME Hub
      - Total Sales (7 days): ${JSON.stringify(data.sales)}
      - Inventory Stats: ${data.inventory.length} total items, ${lowStockItems.length} low stock warnings.
      - Low Stock Details: ${JSON.stringify(lowStockItems.slice(0, 5))}
      - Customer Count: ${data.customers.length}
      - Recent Orders Activity: ${JSON.stringify(data.recentOrders.slice(0, 10))}

      User Query: ${query}

      Instructions for Response:
      1. CRITICAL: Use Markdown formatting (headers, bolding, lists).
      2. If query is vague, provide a general "State of Business" report with 3 urgent actions.
      3. If specific (e.g., 'marketing', 'stock'), dive deep into that area using the provided JSON data.
      4. Suggest a specific chart type (Line, Bar, Pie) if visualization helps the answer.
      5. Add a "Financial Tip of the Day" at the end of every response.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("❌ Gemini AI Error:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Invalid or expired API key. Please check your GEMINI_API_KEY.");
    }
    throw new Error("AI Advisor is currently unavailable. " + error.message);
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
