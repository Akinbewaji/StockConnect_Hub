import db from "../db/init.js";
import { NotificationService } from "./notification.service.js";

export class ProductService {
  static getAll(
    businessId: number, 
    limit: number = 20, 
    offset: number = 0,
    search?: string,
    category?: string
  ) {
    let query = "SELECT * FROM products WHERE business_id = ?";
    let countQuery = "SELECT COUNT(*) as total FROM products WHERE business_id = ?";
    const params: any[] = [businessId];

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

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    const data = db.prepare(query).all(...params, limit, offset);
    const { total } = db.prepare(countQuery).get(...params) as any;
    
    return { data, total };
  }

  static getById(id: number | string) {
    return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  }

  static create(data: any, businessId: number) {
    const { name, category, description, price, quantity, reorderThreshold, costPrice, barcode, supplier, imageUrl } = data;
    const stmt = db.prepare(`
      INSERT INTO products (name, category, description, price, quantity, reorder_threshold, cost_price, barcode, supplier, image_url, business_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
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

  static update(id: number | string, data: any, businessId: number) {
    const { name, category, description, price, quantity, reorderThreshold, costPrice, barcode, supplier, imageUrl } = data;
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, description = ?, price = ?, quantity = ?, 
          reorder_threshold = ?, cost_price = ?, barcode = ?, supplier = ?, image_url = ?
      WHERE id = ? AND business_id = ?
    `);
    const info = stmt.run(
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
    
    if (info.changes > 0) {
       NotificationService.checkLowStockAndNotify(Number(id), businessId).catch(console.error);
    }
    
    return info.changes > 0;
  }

  static getByBarcode(barcode: string, businessId: number) {
    return db.prepare("SELECT * FROM products WHERE barcode = ? AND business_id = ?").get(barcode, businessId);
  }

  static getLowStockProducts(businessId: number) {
    return db.prepare(
      "SELECT * FROM products WHERE business_id = ? AND quantity <= reorder_threshold"
    ).all(businessId);
  }

  static updateReorderThreshold(id: number, threshold: number, businessId: number) {
    const stmt = db.prepare(
      "UPDATE products SET reorder_threshold = ? WHERE id = ? AND business_id = ?"
    );
    return stmt.run(threshold, id, businessId);
  }

  static delete(id: number | string) {
    const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return info.changes > 0;
  }
}
