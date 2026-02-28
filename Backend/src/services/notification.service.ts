import db from "../db/init.js";
import { sendSMS, formatPhoneNumber } from "./africastalking.js";

export class NotificationService {
  static async checkLowStockAndNotify(productId: number, businessId: number) {
    try {
      // 1. Check if notifications are enabled in settings
      const settings = db.prepare("SELECT low_stock_notifications, business_id FROM settings WHERE business_id = ?").get(businessId) as any;
      
      if (!settings || settings.low_stock_notifications !== 1) {
        return;
      }

      // 2. Get product details
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
      if (!product || !product.supplier_phone) {
        return;
      }

      // 3. Check if stock is low
      if (product.quantity <= product.reorder_threshold) {
        const business = db.prepare("SELECT business_name FROM users WHERE id = ?").get(businessId) as any;
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
