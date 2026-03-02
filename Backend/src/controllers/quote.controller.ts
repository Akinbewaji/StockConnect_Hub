import { Request, Response } from "express";
import db from "../db/init.js";
import { io } from "../server.js";
import { webPushService } from "../services/webpush.service.js";

/**
 * Customer requests a quote for a product
 */
export async function requestQuote(req: any, res: Response) {
  const { productId, requestedQuantity, message, attachmentUrl } = req.body;
  const customerUser = req.user; // Token user

  try {
    const customer = db.prepare("SELECT id, name FROM customers WHERE user_id = ?").get(customerUser.id) as any;
    if (!customer) return res.status(404).json({ error: "Customer profile not found" });

    const product = db.prepare("SELECT business_id, name FROM products WHERE id = ?").get(productId) as any;
    if (!product) return res.status(404).json({ error: "Product not found" });

    const result = db.prepare(`
      INSERT INTO quotes (customer_id, business_id, product_id, requested_quantity, customer_message, attachment_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(customer.id, product.business_id, productId, requestedQuantity, message, attachmentUrl || null);

    const quoteId = result.lastInsertRowid;

    // Notify the Seller
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (?, 'quote', 'New Quote Request', ?, ?)
    `).run(product.business_id, `Quote request for ${product.name} from ${customer.name}`, JSON.stringify({ quoteId }));

    if (io) {
      io.to(`seller-${product.business_id}`).emit('new_quote', { quoteId, productId, requestedQuantity });
    }

    webPushService.sendNotification(product.business_id, 'owner', {
      title: 'New Quote Request 📄',
      body: `${customer.name} requested a quote for ${requestedQuantity}x ${product.name}`,
      data: { url: '/admin/quotes' }
    });

    res.status(201).json({ message: "Quote requested successfully", quoteId });
  } catch (error) {
    console.error("Request quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Seller responds to a quote
 */
export async function respondToQuote(req: any, res: Response) {
  const { quoteId } = req.params;
  const { price, sellerMessage, status } = req.body; // status: 'responded', 'rejected'
  const businessUserId = req.user.id;

  try {
    const quote = db.prepare("SELECT * FROM quotes WHERE id = ? AND business_id = ?").get(quoteId, businessUserId) as any;
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    db.prepare(`
      UPDATE quotes 
      SET price = ?, seller_response = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(price || quote.price, sellerMessage, status || 'responded', quoteId);

    // Notify the Customer
    const customer = db.prepare("SELECT user_id FROM customers WHERE id = ?").get(quote.customer_id) as any;
    
    if (customer && customer.user_id) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (?, 'quote', 'Quote Updated', ?, ?)
      `).run(customer.user_id, `The seller responded to your quote request (Quote #${quoteId})`, JSON.stringify({ quoteId }));

      if (io) {
        io.to(`buyer-${customer.user_id}`).emit('quote_updated', { quoteId, status, price });
      }

      webPushService.sendNotification(customer.user_id, 'customer', {
        title: 'Quote Responded 📄',
        body: `A seller responded to your quote request!`,
        data: { url: `/quotes/${quoteId}` }
      });
    }

    res.json({ message: "Quote updated successfully" });
  } catch (error) {
    console.error("Respond quote error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get all pending/active quotes for a seller
 */
export async function getSellerQuotes(req: any, res: Response) {
  const businessUserId = req.user.id;
  try {
    const quotes = db.prepare(`
      SELECT q.*, p.name as product_name, p.image_url, c.name as customer_name 
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      JOIN customers c ON q.customer_id = c.id
      WHERE q.business_id = ?
      ORDER BY q.created_at DESC
    `).all(businessUserId);
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get all quotes for the logged-in customer
 */
export async function getCustomerQuotes(req: any, res: Response) {
  const customerUser = req.user;
  try {
    const customer = db.prepare("SELECT id FROM customers WHERE user_id = ?").get(customerUser.id) as any;
    if (!customer) return res.json([]); // No profile = no quotes

    const quotes = db.prepare(`
      SELECT q.*, p.name as product_name, p.image_url, u.business_name 
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      JOIN users u ON q.business_id = u.id
      WHERE q.customer_id = ?
      ORDER BY q.created_at DESC
    `).all(customer.id);
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
