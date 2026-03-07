import db from "../db/init.js";
import { sendSMS, formatPhoneNumber } from "./africastalking.js";

export class NotificationService {
  static async checkLowStockAndNotify(productId: number, businessId: number) {
    try {
      // 0. Check User Plan
      const user = await (await db.prepare("SELECT plan FROM users WHERE id = ?")).get(businessId) as any;
      if (!user || user.plan === 'free') {
        console.log(`[Notification] Skipping low stock alert: Business ${businessId} is on Free tier.`);
        return;
      }

      // 1. Check if notifications are enabled in settings
      const settings = await (await db.prepare("SELECT low_stock_notifications, business_id FROM settings WHERE business_id = ?")).get(businessId) as any;
      
      if (!settings || settings.low_stock_notifications !== 1) {
        return;
      }

      // 2. Get product details
      const product = await (await db.prepare("SELECT * FROM products WHERE id = ?")).get(productId) as any;
      if (!product || !product.supplier_phone) {
        return;
      }

      // 3. Check if stock is low
      if (product.quantity <= product.reorder_threshold) {
        const business = await (await db.prepare("SELECT business_name FROM users WHERE id = ?")).get(businessId) as any;
        const businessName = business?.business_name || "StockConnect Store";
        
        const message = `Low Stock Alert: ${product.name} is down to ${product.quantity} units at ${businessName}. Please restock soon.`;
        const to = formatPhoneNumber(product.supplier_phone);

        console.log(`[Notification] Sending low stock alert for ${product.name} to ${to}...`);
        
        await sendSMS({
          to: [to],
          message: message
        });
      }
    } catch (error) {
      console.error("Failed to process low stock notification:", error);
    }
  }
}
