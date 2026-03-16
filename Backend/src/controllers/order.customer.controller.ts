import { Request, Response } from "express";
import axios from "axios";
import db from "../db/init.js";

// Retrieve Paystack Secret Key from environment
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

/**
 * Place order from cart
 */
export async function placeOrder(req: any, res: Response) {
  const { deliveryMethod, deliveryAddressId, paymentMethod, paymentReference } = req.body;
  
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    
    // Fetch all items across ALL active carts for this customer
    const cartItems = await db.prepare(`
      SELECT ci.*, p.price, p.business_id, p.name as product_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.customer_id = ?
    `).all(customer.id);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate absolute total across all vendors
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // 1. If payment method is card, verify with Paystack for the FULL amount
    let finalPaymentStatus = 'unpaid';
    if (paymentMethod === 'card') {
      if (!paymentReference) {
        return res.status(400).json({ error: "Payment reference required for card payments" });
      }

      try {
        const verifyRes = await axios.get(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        });

        const data = verifyRes.data;

        if (!data.status || data.data.status !== "success") {
          return res.status(400).json({ error: "Payment verification failed" });
        }

        // Verify amount (Paystack amount is in kobo)
        if (data.data.amount < totalAmount * 100) {
          return res.status(400).json({ error: "Paid amount is less than order total" });
        }

        finalPaymentStatus = 'paid';
      } catch (err: any) {
        console.error("Paystack verification error:", err.response?.data || err.message);
        return res.status(400).json({ error: "Failed to verify payment with Paystack" });
      }
    }

    // 2. Group items by business_id (Vendor) to split orders
    const itemsByBusiness: { [key: number]: any[] } = {};
    cartItems.forEach((item: any) => {
      if (!itemsByBusiness[item.business_id]) {
        itemsByBusiness[item.business_id] = [];
      }
      itemsByBusiness[item.business_id].push(item);
    });

    const createdOrderIds: number[] = [];

    // 3. Process each vendor order
    for (const businessIdStr in itemsByBusiness) {
        const businessId = parseInt(businessIdStr);
        const groupItems = itemsByBusiness[businessId];
        const groupTotal = groupItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

        // Create the order for this specific vendor
        const orderResult = await db.prepare(`
          INSERT INTO orders (customer_id, total_amount, status, payment_status, payment_method, delivery_method, delivery_address_id, business_id)
          VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
        `).run(customer.id, groupTotal, finalPaymentStatus, paymentMethod || 'cash', deliveryMethod || 'pickup', deliveryAddressId || null, businessId);

        const orderId = orderResult.lastInsertRowid;
        createdOrderIds.push(orderId);

        // Add items to this order
        for (const item of groupItems) {
            await db.prepare(`
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (?, ?, ?, ?)
            `).run(orderId, item.product_id, item.quantity, item.price);

            // Deduct stock
            await db.prepare("UPDATE products SET quantity = quantity - ? WHERE id = ?").run(item.quantity, item.product_id);
            
            // Log stock movement
            await db.prepare("INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)").run(item.product_id, -item.quantity, 'sale');
        }
    }

    // 4. Clear all cart items for this customer
    await db.prepare(`
        DELETE FROM cart_items 
        WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = ?)
    `).run(customer.id);

    res.status(201).json({
      message: "Order(s) placed successfully",
      orderIds: createdOrderIds,
      orderId: createdOrderIds[0] // Fallback for single-order UX compatibility
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
