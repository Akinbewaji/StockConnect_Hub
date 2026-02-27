import { Router } from 'express';
import db from '../db/init';

const router = Router();

// Get all customers
router.get('/', (req: any, res) => {
  const { search } = req.query;
  const businessId = req.user.id;
  
  let query = 'SELECT * FROM customers WHERE business_id = ?';
  const params: any[] = [businessId];

  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC';

  const stmt = db.prepare(query);
  const customers = stmt.all(...params);
  res.json(customers);
});

// Create customer
router.post('/', (req: any, res) => {
  const { name, phone, email } = req.body;
  const businessId = req.user.id;
  
  try {
    const stmt = db.prepare('INSERT INTO customers (name, phone, email, business_id) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, phone, email, businessId);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get customer details with orders
router.get('/:id', (req, res) => {
  const { id } = req.params;
  try {
    const customerStmt = db.prepare('SELECT * FROM customers WHERE id = ?');
    const customer = customerStmt.get(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ordersStmt = db.prepare(`
      SELECT * FROM orders 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `);
    const orders = ordersStmt.all(id);

    // Fetch items for each order
    const ordersWithItems = orders.map((order: any) => {
      const itemsStmt = db.prepare(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `);
      const items = itemsStmt.all(order.id);
      return { ...order, items };
    });

    res.json({ ...customer, orders: ordersWithItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

export default router;
