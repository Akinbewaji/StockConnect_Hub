import { Router } from 'express';
import db from '../db/init';

const router = Router();

// Get orders
router.get('/', (req: any, res) => {
  const businessId = req.user.id;
  const stmt = db.prepare(`
    SELECT o.*, c.name as customer_name 
    FROM orders o 
    LEFT JOIN customers c ON o.customer_id = c.id 
    WHERE c.business_id = ?
    ORDER BY o.created_at DESC
  `);
  const orders = stmt.all(businessId);
  res.json(orders);
});

// Create order
router.post('/', (req: any, res) => {
  const { customerId, items, totalAmount } = req.body;
  const businessId = req.user.id;
  
  const createOrder = db.transaction(() => {
    // 1. Create Order
    const stmt = db.prepare('INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)');
    const info = stmt.run(customerId, totalAmount, 'confirmed');
    const orderId = info.lastInsertRowid;
    
    // 2. Process Items
    const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    const stockStmt = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
    const movementStmt = db.prepare('INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)');
    
    for (const item of items) {
      itemStmt.run(orderId, item.productId, item.quantity, item.unitPrice);
      stockStmt.run(item.quantity, item.productId);
      movementStmt.run(item.productId, -item.quantity, 'sale');
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

  try {
    const orderId = createOrder();
    res.json({ id: orderId, success: true });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    const info = stmt.run(status, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
