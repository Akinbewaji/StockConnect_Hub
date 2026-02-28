import { Router } from "express";
import db from "../db/init.js";
import { productSchema } from "../types/schemas.js";
import { ProductService } from "../services/product.service.js";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all products
router.get("/", (req: any, res) => {
  const { search, category, page, limit } = req.query;
  const businessId = req.user.id;
  
  const pPage = parseInt(page as string) || 1;
  const pLimit = parseInt(limit as string) || 20;
  const offset = (pPage - 1) * pLimit;

  try {
    const result = ProductService.getAll(
      businessId, 
      pLimit, 
      offset, 
      search as string, 
      category as string
    );
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Create product
router.post("/", (req: any, res) => {
  const businessId = req.user.id;
  try {
    const id = ProductService.create(req.body, businessId);
    res.json({ id, ...req.body });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    res.status(500).json({ error: error.message || "Failed to create product" });
  }
});

// Update product
router.put("/:id", (req: any, res) => {
  const { id } = req.params;
  const businessId = req.user.id;

  try {
    const success = ProductService.update(id, req.body, businessId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error: any) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: error.message || "Failed to update product" });
  }
});

// Get product by barcode
router.get("/barcode/:barcode", (req: any, res) => {
  const { barcode } = req.params;
  const businessId = req.user.id;

  try {
    const product = ProductService.getByBarcode(barcode, businessId);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    console.error("Failed to fetch product by barcode:", error);
    res.status(500).json({ error: "Failed to fetch product" });
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
router.get("/low-stock", (req: AuthRequest, res) => {
  const businessId = req.user!.id;
  try {
    const products = ProductService.getLowStockProducts(businessId);
    res.json(products);
  } catch (error) {
    console.error("Failed to fetch low stock products:", error);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
});

// Update reorder threshold
router.patch("/:id/threshold", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { threshold } = req.body;
  const businessId = req.user!.id;

  if (typeof threshold !== 'number' || threshold < 0) {
    return res.status(400).json({ error: "Invalid threshold value" });
  }

  try {
    ProductService.updateReorderThreshold(Number(id), threshold, businessId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update threshold:", error);
    res.status(500).json({ error: "Failed to update threshold" });
  }
});

// Bulk import products
router.post("/bulk-import", (req: AuthRequest, res) => {
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

          ProductService.create({
            ...product,
            reorderThreshold: product.reorderThreshold || product.reorder_threshold || 5,
            costPrice: product.costPrice || product.cost_price || 0,
            imageUrl: product.imageUrl || product.image_url || ""
          }, businessId);
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
