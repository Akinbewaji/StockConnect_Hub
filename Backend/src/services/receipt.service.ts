import db from "../db/init.js";
import { sendSMS } from "./africastalking.js";
import { sendEmail } from "./email.service.js";

export class ReceiptService {
  static async sendReceipts(orderId: number | string, businessId: number) {
    try {
      // 1. Fetch Order Details
      const order = await (await db.prepare(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `)).get(orderId) as any;

      if (!order) return;

      // 2. Fetch Order Items
      const items = await (await db.prepare(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `)).all(orderId) as any[];

      // 3. Fetch Business Details
      const business = await (await db.prepare(`
        SELECT name, business_name, email, phone FROM users WHERE id = ?
      `)).get(businessId) as any;

      const currency = "₦"; // Default or fetch from settings

      // 4. Construct Receipt Message
      let itemSummary = items.map(item => `${item.product_name} x${item.quantity}: ${currency}${(item.unit_price * item.quantity).toLocaleString()}`).join('\n');
      const totalText = `${currency}${Number(order.total_amount).toLocaleString()}`;
      
      const receiptMessage = `
--- RECEIPT ---
Order #${orderId}
Business: ${business?.business_name || 'StockConnect'}
Date: ${new Date(order.created_at).toLocaleDateString()}

Items:
${itemSummary}

Total: ${totalText}
Status: ${order.status.toUpperCase()}
Thank you for your business!
      `;

      // 5. Send SMS to Customer
      if (order.customer_phone) {
        await sendSMS({
          to: [order.customer_phone],
          message: `Receipt from ${business.business_name}: Total ${totalText}. Order #${orderId}. View details at dashboard.`
        });
      }

      // 6. Send Email to Customer
      if (order.customer_email) {
        await sendEmail({
          to: order.customer_email,
          subject: `Receipt: Order #${orderId} from ${business.business_name}`,
          text: receiptMessage
        });
      }

      // 7. Send Email to Seller (Confirmation)
      if (business.email) {
        await sendEmail({
          to: business.email,
          subject: `Sale Confirmed: Order #${orderId}`,
          text: `You have a new completed sale.\n\n${receiptMessage}`
        });
      }

      console.log(`✅ Receipts sent for Order #${orderId}`);
    } catch (error) {
      console.error(`❌ Failed to send receipts for Order #${orderId}:`, error);
    }
  }
}
