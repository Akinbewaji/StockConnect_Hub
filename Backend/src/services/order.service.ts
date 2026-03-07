import db from "../db/init.js";
import { NotificationService } from "./notification.service.js";
import { ReceiptService } from "./receipt.service.js"; // Fixed extension
import { io } from "../server.js";

export class OrderService {
  static async getAll(businessId: number, limit: number = 20, offset: number = 0) {
    const data = await (await db.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.business_id = ? OR o.customer_id IS NULL
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
    `)).all(businessId, limit, offset);

    const { total } = (await (await db.prepare(`
        SELECT COUNT(*) as total 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.business_id = ? OR o.customer_id IS NULL
    `)).get(businessId)) as any;
    
    return { data, total };
  }

  static async create(data: any, businessId: number) {
    const { customerId, items, totalAmount } = data;

    const transaction = async () => {
      // 1. Create Order
      const stmt = await db.prepare('INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)');
      const info = await stmt.run(customerId, totalAmount, 'confirmed');
      const orderId = info.lastInsertRowid;
      
      // 2. Process Items
      const itemStmt = await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)');
      const stockStmt = await db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
      const movementStmt = await db.prepare('INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)');
      const productStmt = await db.prepare('SELECT cost_price FROM products WHERE id = ?');
      
      for (const item of items) {
        const product = (await productStmt.get(item.productId)) as any;
        const unitCost = product?.cost_price || 0;
        
        await itemStmt.run(orderId, item.productId, item.quantity, item.unitPrice, unitCost);
        await stockStmt.run(item.quantity, item.productId);
        await movementStmt.run(item.productId, -item.quantity, 'sale');
        
        // Trigger notification check asycnrhonously
        NotificationService.checkLowStockAndNotify(item.productId, businessId).catch(console.error);
      }

      // 3. Update Loyalty Points (Pro Feature)
      if (customerId) {
        const user = await (await db.prepare("SELECT plan FROM users WHERE id = ?")).get(businessId) as any;
        if (user && user.plan !== 'free') {
          const settings = (await (await db.prepare('SELECT * FROM settings WHERE business_id = ?')).get(businessId)) as any;
          const pointsPerUnit = settings?.loyalty_points_per_unit || 1;
          const unitAmount = settings?.currency_unit_for_points || 100;
          
          const points = Math.floor((totalAmount / unitAmount) * pointsPerUnit);
          const loyaltyStmt = await db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?');
          await loyaltyStmt.run(points, customerId);
        }
      }
      
      return orderId;
    };

    const orderId = await transaction();
    
    // Send receipts asynchronously to both ends
    ReceiptService.sendReceipts(orderId, businessId).catch(console.error);
    
    // Emit real-time update
    if (io) {
      io.emit("sale_completed", { orderId, businessId });
    }

    return orderId;
  }

  static async updateStatus(id: number | string, status: string) {
    const stmt = await db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    const info = await stmt.run(status, id);
    
    if (info.changes && info.changes > 0 && io) {
      io.emit("order_status_updated", { orderId: id, status });
    }
    
    return info.changes && info.changes > 0;
  }
}
