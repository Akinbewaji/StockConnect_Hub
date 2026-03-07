import { Request, Response } from "express";
import db from "../db/init.js";

/**
 * Get current cart for customer
 */
export async function getCart(req: any, res: Response) {
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    
    // Find active cart for the customer and business (simplified for MVP: one cart)
    let cart = (await db.prepare("SELECT * FROM carts WHERE customer_id = ?").get(customer.id)) as any;
    
    if (!cart) {
      return res.json({ items: [] });
    }

    const items = await db.prepare(`
      SELECT ci.*, p.name, p.price, p.image_url 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
    `).all(cart.id);

    res.json({ id: cart.id, items });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Add item to cart
 */
export async function addToCart(req: any, res: Response) {
  const { productId, quantity } = req.body;
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const product = (await db.prepare("SELECT business_id FROM products WHERE id = ?").get(productId)) as any;
    
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Ensure cart exists or create it
    let cart = (await db.prepare("SELECT id FROM carts WHERE customer_id = ? AND business_id = ?").get(customer.id, product.business_id)) as any;
    
    if (!cart) {
      const result = await (await db.prepare("INSERT INTO carts (customer_id, business_id) VALUES (?, ?)")).run(
        customer.id,
        product.business_id
      );
      cart = { id: result.lastInsertRowid };
    }

    // Add or update item
    const existingItem = (await db.prepare("SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?").get(cart.id, productId)) as any;
    
    if (existingItem) {
      await db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?")
        .run(quantity || 1, existingItem.id);
    } else {
      await db.prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)")
        .run(cart.id, productId, quantity || 1);
    }

    res.json({ message: "Item added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(req: any, res: Response) {
  const { id } = req.params;
  const { quantity } = req.body;
  try {
    if (quantity <= 0) {
      await db.prepare("DELETE FROM cart_items WHERE id = ?").run(id);
    } else {
      await db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(quantity, id);
    }
    res.json({ message: "Cart updated" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(req: any, res: Response) {
  const { id } = req.params;
  try {
    await db.prepare("DELETE FROM cart_items WHERE id = ?").run(id);
    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Clear cart
 */
export async function clearCart(req: any, res: Response) {
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const cart = (await db.prepare("SELECT id FROM carts WHERE customer_id = ?").get(customer.id)) as any;
    if (cart) {
      await db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cart.id);
    }
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
