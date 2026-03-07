import { Router } from "express";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const router = Router();

router.post("/reset", authenticateToken, checkRole(['owner']), async (req: any, res) => {
  const businessId = req.user.id;

  try {
    // 1. Reset Stock in Products
    await (await db.prepare("UPDATE products SET quantity = 0 WHERE business_id = ?")).run(businessId);

    // 2. Reset Loyalty Points in Customers
    await (await db.prepare("UPDATE customers SET loyalty_points = 0, loyalty_points_claimed = 0 WHERE business_id = ?")).run(businessId);

    // 3. Delete Orders and associated data
    // We need to fetch customer IDs for this business
    const customers = await (await db.prepare("SELECT id FROM customers WHERE business_id = ?")).all(businessId) as { id: number }[];
    const customerIds = customers.map(c => c.id);

    if (customerIds.length > 0) {
      const placeholders = customerIds.map(() => "?").join(",");
      
      // Delete Order Items (indirectly via orders)
      await (await db.prepare(`
        DELETE FROM order_items WHERE order_id IN (
          SELECT id FROM orders WHERE customer_id IN (${placeholders}) OR customer_id IS NULL
        )
      `)).run(...customerIds);
      
      // Delete Orders
      await (await db.prepare(`DELETE FROM orders WHERE customer_id IN (${placeholders})`)).run(...customerIds);
    }
    
    // Also delete orders with no customer_id if they belong to this business-related POS
    // (In our current schema, orders are linked to business via customers.business_id)
    // For direct POS sales without customer, they might be missed if we only use customerIds.
    // However, the current schema links everything through business_id.

    // 4. Delete Stock Movements
    const products = await (await db.prepare("SELECT id FROM products WHERE business_id = ?")).all(businessId) as { id: number }[];
    const productIds = products.map(p => p.id);
    if (productIds.length > 0) {
        const pPlaceholders = productIds.map(() => "?").join(",");
        await (await db.prepare(`DELETE FROM stock_movements WHERE product_id IN (${pPlaceholders})`)).run(...productIds);
    }

    res.json({ success: true, message: "Business data reset successfully to zero/empty." });
  } catch (error: any) {
    console.error("Reset data error:", error);
    res.status(500).json({ error: "Failed to reset data" });
  }
});

export default router;
