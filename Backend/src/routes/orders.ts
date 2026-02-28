import { Router } from 'express';
import db from '../db/init';
import { orderSchema } from "../types/schemas.js";
import { OrderService } from "../services/order.service.js";

const router = Router();

// Get orders
router.get('/', (req: any, res) => {
  const businessId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = OrderService.getAll(businessId, limit, offset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create order
router.post("/", (req: any, res) => {
  const result = orderSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors
    });
  }

  const { customerId, items, totalAmount, paymentMethod } = result.data;
  const businessId = req.user.id;

  try {
    const orderId = OrderService.create(result.data, businessId);
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
    const success = OrderService.updateStatus(id, status);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
