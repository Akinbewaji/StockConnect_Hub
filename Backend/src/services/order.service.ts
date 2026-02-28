import db from "../db/init.js";
import { NotificationService } from "./notification.service.js";
import { io } from "../server.js";

export class OrderService {
  static getAll(businessId: number, limit: number = 20, offset: number = 0) {
    const data = db.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.business_id = ? OR o.customer_id IS NULL
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
    `).all(businessId, limit, offset);

    const { total } = db.prepare(`
        SELECT COUNT(*) as total 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE c.business_id = ? OR o.customer_id IS NULL
    `).get(businessId) as any;
    
    return { data, total };
  }

  static create(data: any, businessId: number) {
    const { customerId, items, totalAmount } = data;

    const transaction = db.transaction(() => {
      // 1. Create Order
      const stmt = db.prepare('INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)');
      const info = stmt.run(customerId, totalAmount, 'confirmed');
      const orderId = info.lastInsertRowid;
      
      // 2. Process Items
      const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?)');
      const stockStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
      const movementStmt = db.prepare('INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)');
      const productStmt = db.prepare('SELECT cost_price FROM products WHERE id = ?');
      
      for (const item of items) {
        const product = productStmt.get(item.productId) as any;
        const unitCost = product?.cost_price || 0;
        
        itemStmt.run(orderId, item.productId, item.quantity, item.unitPrice, unitCost);
        stockStmt.run(item.quantity, item.productId);
        movementStmt.run(item.productId, -item.quantity, 'sale');
        
        // Trigger notification check asycnrhonously
        NotificationService.checkLowStockAndNotify(item.productId, businessId).catch(console.error);
      }

      // 3. Update Loyalty Points
      if (customerId) {
        const settings = db.prepare('SELECT * FROM settings WHERE business_id = ?').get(businessId) as any;
        const pointsPerUnit = settings?.loyalty_points_per_unit || 1;
        const unitAmount = settings?.currency_unit_for_points || 100;
        
        const points = Math.floor((totalAmount / unitAmount) * pointsPerUnit);
        const loyaltyStmt = db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?');
        loyaltyStmt.run(points, customerId);
      }
      
      return orderId;
    });

    const orderId = transaction();
    
    // Emit real-time update
    if (io) {
      io.emit("sale_completed", { orderId, businessId });
    }

    return orderId;
  }

  static updateStatus(id: number | string, status: string) {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    const info = stmt.run(status, id);
    
    if (info.changes > 0 && io) {
      io.emit("order_status_updated", { orderId: id, status });
    }
    
    return info.changes > 0;
  }
}
