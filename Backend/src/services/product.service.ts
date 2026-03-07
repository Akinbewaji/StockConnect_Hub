import db from "../db/init.js";
import { NotificationService } from "./notification.service.js";

export class ProductService {
  static async getAll(
    businessId?: number | string, 
    limit: number = 20, 
    offset: number = 0,
    search?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number
  ) {
    let query = "SELECT * FROM products";
    let countQuery = "SELECT COUNT(*) as total FROM products";
    const params: any[] = [];

    if (businessId) {
      query += " WHERE business_id = ?";
      countQuery += " WHERE business_id = ?";
      params.push(businessId);
    } else {
      // If no businessId, we might still want to filter by search/category
      // Use WHERE 1=1 to make subsequent ANDs easier
      query += " WHERE 1=1";
      countQuery += " WHERE 1=1";
    }

    if (search) {
      query += " AND (name LIKE ? OR category LIKE ?)";
      countQuery += " AND (name LIKE ? OR category LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += " AND category = ?";
      countQuery += " AND category = ?";
      params.push(category);
    }

    if (minPrice !== undefined && !isNaN(minPrice)) {
      query += " AND price >= ?";
      countQuery += " AND price >= ?";
      params.push(minPrice);
    }

    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      query += " AND price <= ?";
      countQuery += " AND price <= ?";
      params.push(maxPrice);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const data = (await (await db.prepare(query)).all(...params, limit, offset)) as any[];
    const { total } = (await (await db.prepare(countQuery)).get(...params)) as any;
    
    return { data, total };
  }

  static async getById(id: number | string) {
    return await (await db.prepare(`
      SELECT p.*, u.business_name 
      FROM products p 
      LEFT JOIN users u ON p.business_id = u.id 
      WHERE p.id = ?
    `)).get(id);
  }

  static async create(data: any, businessId: number) {
    const { name, category, description, price, quantity, reorderThreshold, costPrice, barcode, supplier, imageUrl } = data;
    const stmt = await db.prepare(`
      INSERT INTO products (name, category, description, price, quantity, reorder_threshold, cost_price, barcode, supplier, image_url, business_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = await stmt.run(
      name,
      category,
      description || "",
      price,
      quantity,
      reorderThreshold || 5,
      costPrice || 0,
      barcode || null,
      supplier || "",
      imageUrl || "",
      businessId
    );
    return info.lastInsertRowid;
  }

  static async update(id: number | string, data: any, businessId: number) {
    const { name, category, description, price, quantity, reorderThreshold, costPrice, barcode, supplier, imageUrl } = data;
    const stmt = await db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, description = ?, price = ?, quantity = ?, 
          reorder_threshold = ?, cost_price = ?, barcode = ?, supplier = ?, image_url = ?
      WHERE id = ? AND business_id = ?
    `);
    const info = await stmt.run(
      name,
      category,
      description || "",
      price,
      quantity,
      reorderThreshold || 5,
      costPrice || 0,
      barcode || null,
      supplier || "",
      imageUrl || "",
      id,
      businessId
    );
    
    if (info.changes && info.changes > 0) {
       NotificationService.checkLowStockAndNotify(Number(id), businessId).catch(console.error);
    }
    
    return info.changes && info.changes > 0;
  }

  static async getByBarcode(barcode: string, businessId: number) {
    return await (await db.prepare("SELECT * FROM products WHERE barcode = ? AND business_id = ?")).get(barcode, businessId);
  }

  static async getLowStockProducts(businessId: number) {
    return await (await db.prepare(
      "SELECT * FROM products WHERE business_id = ? AND quantity <= reorder_threshold"
    )).all(businessId);
  }

  static async updateReorderThreshold(id: number, threshold: number, businessId: number) {
    const stmt = await db.prepare(
      "UPDATE products SET reorder_threshold = ? WHERE id = ? AND business_id = ?"
    );
    return await stmt.run(threshold, id, businessId);
  }

  static async delete(id: number | string) {
    const info = await db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return info.changes && info.changes > 0;
  }
}
