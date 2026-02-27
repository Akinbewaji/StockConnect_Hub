import { Router } from "express";
import db from "../db/init.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all products
router.get("/", (req: any, res) => {
  const { search, category } = req.query;
  const businessId = req.user.id;

  let query = "SELECT * FROM products WHERE business_id = ?";
  const params: any[] = [businessId];

  if (search) {
    query += " AND (name LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY created_at DESC";

  const stmt = db.prepare(query);
  const products = stmt.all(...params);
  res.json(products);
});

// Create product
router.post("/", (req: any, res) => {
  const {
    name,
    category,
    description,
    price,
    quantity,
    reorderThreshold,
    supplier,
    imageUrl,
  } = req.body;
  const businessId = req.user.id;

  try {
    const stmt = db.prepare(`
      INSERT INTO products (name, category, description, price, quantity, reorder_threshold, supplier, image_url, business_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      name,
      category,
      description,
      price,
      quantity,
      reorderThreshold,
      supplier,
      imageUrl,
      businessId,
    );
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update stock
router.post("/:id/stock", (req, res) => {
  const { id } = req.params;
  const { quantity, reason } = req.body; // quantity can be positive or negative

  try {
    const updateStmt = db.prepare(
      "UPDATE products SET quantity = quantity + ? WHERE id = ?",
    );
    const logStmt = db.prepare(
      "INSERT INTO stock_movements (product_id, change_amount, reason) VALUES (?, ?, ?)",
    );

    const transaction = db.transaction(() => {
      updateStmt.run(quantity, id);
      logStmt.run(id, quantity, reason || "adjustment");
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Get stock movements
router.get("/movements", (req, res) => {
  const { productId } = req.query;
  try {
    let query = `
      SELECT sm.*, p.name as product_name 
      FROM stock_movements sm 
      JOIN products p ON sm.product_id = p.id 
    `;
    const params: any[] = [];

    if (productId) {
      query += " WHERE sm.product_id = ?";
      params.push(productId);
    }

    query += " ORDER BY sm.created_at DESC LIMIT 50";

    const stmt = db.prepare(query);
    const movements = stmt.all(...params);
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movements" });
  }
});

// Low stock
router.get("/low-stock", (req: any, res) => {
  const businessId = req.user.id;
  const stmt = db.prepare(
    "SELECT * FROM products WHERE business_id = ? AND quantity <= reorder_threshold",
  );
  const products = stmt.all(businessId);
  res.json(products);
});

// Update reorder threshold
router.patch("/:id/threshold", (req, res) => {
  const { id } = req.params;
  const { threshold } = req.body;

  try {
    const stmt = db.prepare(
      "UPDATE products SET reorder_threshold = ? WHERE id = ?",
    );
    stmt.run(threshold, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update threshold" });
  }
});

// Bulk import products
router.post("/bulk-import", (req: any, res) => {
  console.log("Bulk import request received");
  const { products } = req.body;
  const businessId = req.user.id;

  console.log("Products to import:", products?.length || 0);
  console.log("Business ID:", businessId);

  if (!Array.isArray(products) || products.length === 0) {
    console.error("Invalid products data:", products);
    return res
      .status(400)
      .json({ error: "Invalid products data", received: typeof products });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (name, category, description, price, quantity, reorder_threshold, supplier, image_url, business_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    const transaction = db.transaction(() => {
      products.forEach((product, index) => {
        try {
          // Validate required fields
          if (
            !product.name ||
            !product.price ||
            product.quantity === undefined
          ) {
            results.failed++;
            results.errors.push({
              row: index + 1,
              error: "Missing required fields (name, price, quantity)",
              data: product,
            });
            return;
          }

          stmt.run(
            product.name,
            product.category || "Uncategorized",
            product.description || "",
            parseFloat(product.price),
            parseInt(product.quantity),
            parseInt(
              product.reorderThreshold || product.reorder_threshold || 5,
            ),
            product.supplier || "",
            product.imageUrl || product.image_url || "",
            businessId,
          );
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: index + 1,
            error: error.message,
            data: product,
          });
        }
      });
    });

    transaction();
    console.log("Import results:", results);
    res.json(results);
  } catch (error: any) {
    console.error("Import error:", error);
    res
      .status(500)
      .json({ error: "Failed to import products", details: error.message });
  }
});

export default router;
