import { Response } from "express";
import db from "../db/init.js";

/**
 * Submit feedback for an order
 */
export async function submitFeedback(req: any, res: Response) {
  const { id: orderId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5." });
  }

  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    
    // Check if order belongs to customer
    const order = await db.prepare("SELECT id FROM orders WHERE id = ? AND customer_id = ?").get(orderId, customer.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found or doesn't belong to you." });
    }

    // Check if feedback already exists
    const existing = await db.prepare("SELECT id FROM order_feedback WHERE order_id = ?").get(orderId);
    if (existing) {
      return res.status(400).json({ error: "Feedback already submitted for this order." });
    }

    await db.prepare(`
      INSERT INTO order_feedback (order_id, customer_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `).run(orderId, customer.id, rating, comment || null);

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get feedback for an order
 */
export async function getOrderFeedback(req: any, res: Response) {
  const { id: orderId } = req.params;
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const feedback = await db.prepare("SELECT * FROM order_feedback WHERE order_id = ? AND customer_id = ?").get(orderId, customer.id);
    
    res.json(feedback || null);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
