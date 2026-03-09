import db from "../db/init.js";
import { generateDailyWhatsAppSummary } from "./ai.service.js";
import { sendWhatsApp } from "./africastalking.js";
import nodeCron from "node-cron";

/**
 * Get full business data for a specific owner
 */
export async function getBusinessSummaryData(businessId: number | string) {
  // 1. Sales (last 24 hours)
  const salesStmt = db.prepare(`
    SELECT SUM(total_amount) as total
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.business_id = ? AND o.created_at >= NOW() - INTERVAL '1 day'
      AND o.status != 'cancelled'
  `);
  const salesToday = (await salesStmt.get(businessId)) as any;

  // 2. Low Stock Products
  const stockStmt = db.prepare(`
    SELECT name, quantity, reorder_threshold
    FROM products
    WHERE business_id = ? AND quantity <= reorder_threshold
  `);
  const lowStock = (await stockStmt.all(businessId)) as any[];

  // 3. Customers count
  const customerStmt = db.prepare(`
    SELECT COUNT(*) as count FROM customers WHERE business_id = ?
  `);
  const customerCount = (await customerStmt.get(businessId)) as any;

  // 4. Recent Orders
  const ordersStmt = db.prepare(`
    SELECT o.id, o.total_amount, o.status, c.name as customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.business_id = ?
    ORDER BY o.created_at DESC
    LIMIT 5
  `);
  const recentOrders = (await ordersStmt.all(businessId)) as any[];

  return {
    sales: [{ total: salesToday?.total || 0 }],
    inventory: lowStock,
    customers: new Array(customerCount?.count || 0),
    recentOrders
  };
}

/**
 * Send daily report to a specific business owner
 */
export async function sendDailyReport(businessId: number | string, phone: string) {
  try {
    const data = await getBusinessSummaryData(businessId);
    const summary = await generateDailyWhatsAppSummary(data);

    if (summary) {
      await sendWhatsApp({
        to: [phone],
        message: summary
      });
      console.log(`✅ Daily report sent to business ${businessId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send daily report for business ${businessId}:`, error);
  }
}

/**
 * Schedule daily reports for all businesses
 * Runs at 8:00 PM every day
 */
export function scheduleDailyReports() {
  nodeCron.schedule('0 20 * * *', async () => {
    console.log("⏰ Running scheduled daily reports...");
    
    try {
      // Get all owners with phone numbers
      const owners = (await db.prepare("SELECT id, phone FROM users WHERE role = 'owner'").all()) as any[];
      
      for (const owner of owners) {
        if (owner.phone) {
          await sendDailyReport(owner.id, owner.phone);
        }
      }
    } catch (error) {
      console.error("❌ Error in scheduled reports:", error);
    }
  });
  
  console.log("📅 Daily report scheduler initialized (8:00 PM daily)");
}

export default {
  getBusinessSummaryData,
  sendDailyReport,
  scheduleDailyReports
};
