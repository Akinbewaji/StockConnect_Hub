import db from "../db/init.js";

export class CustomerService {
  static getAll(
    businessId: number, 
    limit: number = 20, 
    offset: number = 0,
    search?: string
  ) {
    let query = "SELECT * FROM customers WHERE business_id = ?";
    let countQuery = "SELECT COUNT(*) as total FROM customers WHERE business_id = ?";
    const params: any[] = [businessId];

    if (search) {
      query += " AND (name LIKE ? OR phone LIKE ?)";
      countQuery += " AND (name LIKE ? OR phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY name ASC LIMIT ? OFFSET ?";
    const data = db.prepare(query).all(...params, limit, offset);
    const { total } = db.prepare(countQuery).get(...params) as any;
    
    return { data, total };
  }

  static getById(id: number | string) {
    return db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  }

  static create(data: any, businessId: number) {
    const { name, phone, email } = data;
    const stmt = db.prepare(
      "INSERT INTO customers (name, phone, email, business_id) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(name, phone, email, businessId);
    return info.lastInsertRowid;
  }

  static update(id: number | string, data: any) {
    const { name, phone, email } = data;
    const stmt = db.prepare(
      "UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?"
    );
    const info = stmt.run(name, phone, email, id);
    return info.changes > 0;
  }
}
