import { Request, Response } from "express";
import db from "../db/init.js";

/**
 * Place order from cart
 */
export async function placeOrder(req: any, res: Response) {
  const { deliveryMethod, deliveryAddressId, paymentMethod } = req.body;
  
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const cart = (await db.prepare("SELECT id FROM carts WHERE customer_id = ?").get(customer.id)) as any;
    
    if (!cart) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const cartItems = await db.prepare(`
      SELECT ci.*, p.price, p.business_id, p.quantity as stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `).all(cart.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Start transaction (mocked as async block for now; PG Transactions will be implemented properly later)
    const transaction = async (items: any[], totalAmount: number, dbCustomerId: number, paymentMethod: string, deliveryAddressId?: number, deliveryMethod?: string) => {
      // 1. Create order
      const orderResult = await db.prepare(`
        INSERT INTO orders (customer_id, total_amount, status, payment_status, payment_method, delivery_method, delivery_address_id)
        VALUES (?, ?, 'pending', 'unpaid', ?, ?, ?)
      `).run(customer.id, totalAmount, paymentMethod || 'cash', deliveryMethod || 'pickup', deliveryAddressId || null);

      const orderId = orderResult.lastInsertRowid;

      // 2. Create order items and update stock
      for (const item of cartItems as any[]) {
        await db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES (?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.price);

        await db.prepare(`
          UPDATE products SET quantity = quantity - ? WHERE id = ?
        `).run(item.quantity, item.product_id);

        await db.prepare(`
          INSERT INTO stock_movements (product_id, change_amount, reason)
          VALUES (?, ?, ?)
        `).run(item.product_id, -item.quantity, 'sale');
      }

      // 3. Clear cart
      await db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cart.id);
      
      return orderId;
    };

    const orderId = await transaction(cartItems, totalAmount, customer.id, paymentMethod, deliveryAddressId, deliveryMethod);

    res.status(201).json({
      message: "Order placed successfully",
      orderId
    });
  } catch (error: any) {
    console.error("Place order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get customer orders
 */
export async function getMyOrders(req: any, res: Response) {
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const orders = await db.prepare(`
      SELECT * FROM orders 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(customer.id);
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get order details
 */
export async function getOrderDetails(req: any, res: Response) {
  const { id } = req.params;
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const order = await db.prepare("SELECT * FROM orders WHERE id = ? AND customer_id = ?").get(id, customer.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });

    const items = await db.prepare(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    res.json({ ...order, items });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
