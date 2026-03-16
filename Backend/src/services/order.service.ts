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
        WHERE o.business_id = ?
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
    `)).all(businessId, limit, offset);

    const { total } = (await (await db.prepare(`
        SELECT COUNT(*) as total 
        FROM orders o 
        WHERE o.business_id = ?
    `)).get(businessId)) as any;
    
    return { data, total };
  }

  static async getById(id: number | string, businessId: number) {
    console.log(`[OrderService] Fetching details for Order #${id} (Business: ${businessId})`);
    const order = (await (await db.prepare(`
        SELECT o.*, c.name as customer_name 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?::INTEGER AND o.business_id = ?::INTEGER
    `)).get(id, businessId)) as any;

    if (!order) {
      console.warn(`[OrderService] Order #${id} not found for Business ${businessId}`);
      return null;
    }

    const items = (await (await db.prepare(`
        SELECT oi.*, p.name 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?::INTEGER
    `)).all(id)) as any[];

    console.log(`[OrderService] Order #${id} items count: ${items.length}`);
    return { ...order, items };
  }

  static async create(data: any, businessId: number) {
    const { customerId, items, totalAmount } = data;

    const transaction = async () => {
      // 1. Create Order
      const stmt = await db.prepare('INSERT INTO orders (customer_id, total_amount, status, business_id) VALUES (?, ?, ?, ?) RETURNING id');
      const info = await stmt.run(customerId, totalAmount, 'confirmed', businessId);
      const orderId = info.lastInsertRowid;
      
      // 2. Process Items
      const itemStmt = await db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_cost) VALUES (?, ?, ?, ?, ?) RETURNING id');
      const stockStmt = await db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
      const movementStmt = await db.prepare('INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?) RETURNING id');
      const productStmt = await db.prepare('SELECT cost_price FROM products WHERE id = ?');
      
      for (const item of items) {
        // Handle both camelCase and snake_case from incoming data
        const prodId = item.productId || item.product_id;
        const qty = item.quantity;
        const price = item.unitPrice || item.unit_price;

        console.log(`[OrderService] Processing item: Product #${prodId}, Qty: ${qty}`);
        const product = (await productStmt.get(prodId)) as any;
        const unitCost = product?.cost_price || 0;
        
        await itemStmt.run(orderId, prodId, qty, price, unitCost);
        await stockStmt.run(qty, prodId);
        await movementStmt.run(prodId, -qty, 'sale');
        
        // Trigger notification check asycnrhonously
        NotificationService.checkLowStockAndNotify(prodId, businessId).catch(console.error);
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
    const transaction = async () => {
      // 1. Get current status to see if it's already cancelled
      const currentOrder = (await (await db.prepare('SELECT status, business_id FROM orders WHERE id = ?')).get(id)) as any;
      console.log(`[OrderService] Updating Order #${id} status from ${currentOrder?.status} to ${status}`);
      
      if (!currentOrder) return false;
      if (currentOrder.status === status) return true;

      // 2. Update status
      const stmt = await db.prepare('UPDATE orders SET status = ? WHERE id = ?');
      const info = await stmt.run(status, id);

      // 3. Handle Restocking if cancelled
      if (status?.toLowerCase() === 'cancelled' && currentOrder.status?.toLowerCase() !== 'cancelled') {
        console.log(`[OrderService] Order #${id} cancelled. Restocking items...`);
        const items = (await (await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?::INTEGER')).all(id)) as any[];
        console.log(`[OrderService] Found ${items.length} items to restock for Order #${id}`);
        
        const restockingStmt = await db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?');
        const movementStmt = await db.prepare('INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)');

        for (const item of items) {
          console.log(`[OrderService] Restocking Product #${item.product_id}: +${item.quantity}`);
          await restockingStmt.run(item.quantity, item.product_id);
          await movementStmt.run(item.product_id, item.quantity, 'order_cancelled');
        }
      }

      if (info.changes && info.changes > 0 && io) {
        io.emit("order_status_updated", { orderId: id, status });
      }

      return info.changes && info.changes > 0;
    };

    return await transaction();
  }

  static async update(id: number | string, data: any, businessId: number) {
    const { status, trackingInfo, paymentStatus } = data;
    const fields: string[] = [];
    const params: any[] = [];

    if (status) {
      // Use the logic in updateStatus if status is changing
      await this.updateStatus(id, status);
    }

    if (trackingInfo !== undefined) {
      fields.push('tracking_info = ?');
      params.push(trackingInfo);
    }

    if (paymentStatus !== undefined) {
      fields.push('payment_status = ?');
      params.push(paymentStatus);
    }

    if (fields.length === 0 && !status) return false;

    if (fields.length > 0) {
      const query = `UPDATE orders SET ${fields.join(', ')} WHERE id = ? AND business_id = ?`;
      params.push(id, businessId);
      const stmt = await db.prepare(query);
      const info = await stmt.run(...params);
      return info.changes && info.changes > 0;
    }

    return true;
  }
}
