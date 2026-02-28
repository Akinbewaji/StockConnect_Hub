import { Router } from 'express';
import db from '../db/init';
import { customerSchema } from "../types/schemas.js";
import { CustomerService } from "../services/customer.service.js";

const router = Router();

// Get all customers
router.get('/', (req: any, res) => {
  const { search, page, limit } = req.query;
  const businessId = req.user.id;
  
  const pPage = parseInt(page as string) || 1;
  const pLimit = parseInt(limit as string) || 20;
  const offset = (pPage - 1) * pLimit;

  try {
    const result = CustomerService.getAll(
      businessId, 
      pLimit, 
      offset, 
      search as string
    );
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer
router.post("/", (req: any, res) => {
  const result = customerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: result.error.flatten().fieldErrors 
    });
  }

  const { name, phone, email } = result.data;
  const businessId = req.user.id;

  try {
    const customerId = CustomerService.create(result.data, businessId);
    res.json({ id: customerId, name, phone, email });
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
