import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || "stockconnect-secret-key";

// Register
router.post("/register", async (req, res) => {
  const { phone, email, username, password, name, businessName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      "INSERT INTO users (phone, email, username, password, name, business_name) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const info = stmt.run(
      phone,
      email,
      username,
      hashedPassword,
      name,
      businessName,
    );

    const token = jwt.sign(
      { id: info.lastInsertRowid, role: "owner" },
      SECRET_KEY,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: info.lastInsertRowid,
        name,
        businessName,
        phone,
        email,
        username,
      },
    });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res
        .status(400)
        .json({ error: "Phone number, email, or username already registered" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Try to find user by phone, email, or username
    const stmt = db.prepare(
      "SELECT * FROM users WHERE phone = ? OR email = ? OR username = ?",
    );
    const user = stmt.get(identifier, identifier, identifier) as any;

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        businessName: user.business_name,
        phone: user.phone,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
router.get("/me", authenticateToken, (req: any, res) => {
  try {
    const stmt = db.prepare(
      "SELECT id, name, business_name, phone, role, created_at FROM users WHERE id = ?",
    );
    const user = stmt.get(req.user.id) as any;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      businessName: user.business_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Create Demo Account
router.post("/demo", async (req, res) => {
  try {
    const timestamp = Date.now();
    const demoUserStr = `demo_${timestamp}`;
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 1. Create Demo User
    const userStmt = db.prepare(
      "INSERT INTO users (phone, email, username, password, name, business_name) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const userInfo = userStmt.run(
      `080${Math.floor(Math.random() * 100000000)}`,
      `${demoUserStr}@example.com`,
      demoUserStr,
      hashedPassword,
      "Demo User",
      "Demo Hardware Store"
    );
    const businessId = userInfo.lastInsertRowid;

    // 2. Insert Settings
    db.prepare('INSERT INTO settings (business_id) VALUES (?)').run(businessId);

    const seedData = db.transaction(() => {
      // 3. Create Demo Products
      const productStmt = db.prepare(
        "INSERT INTO products (business_id, name, sku, category, price, cost_price, quantity, min_stock_level, unit_measurement) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const cementId = productStmt.run(businessId, 'Dangote Cement 50kg', 'CEM-001', 'Building Materials', 8500, 7800, 150, 50, 'bag').lastInsertRowid;
      const pipeId = productStmt.run(businessId, 'PVC Pipe 4 inch', 'PIP-002', 'Plumbing', 3500, 2500, 20, 30, 'piece').lastInsertRowid; // Low stock
      const wireId = productStmt.run(businessId, 'Copper Wire 2.5mm', 'WIR-003', 'Electrical', 12000, 9500, 80, 20, 'roll').lastInsertRowid;
      const paintId = productStmt.run(businessId, 'Emulsion Paint 20L', 'PNT-004', 'Paint', 15000, 11000, 45, 15, 'bucket').lastInsertRowid;

      // 4. Create Demo Customers
      const customerStmt = db.prepare(
        "INSERT INTO customers (business_id, name, phone, email, type) VALUES (?, ?, ?, ?, ?)"
      );
      const cust1Id = customerStmt.run(businessId, 'John Contractor', '08011111111', 'john@example.com', 'retail').lastInsertRowid;
      const cust2Id = customerStmt.run(businessId, 'ABC Builders Ltd', '08022222222', 'contact@abc.com', 'wholesale').lastInsertRowid;

      // 5. Create past orders for graph data
      const orderStmt = db.prepare("INSERT INTO orders (customer_id, total_amount, status, created_at) VALUES (?, ?, ?, ?)");
      const itemStmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
      
      const today = new Date();
      
      // Order 4 days ago
      const day4 = new Date(today);
      day4.setDate(day4.getDate() - 4);
      const o1Id = orderStmt.run(cust1Id, 85000, 'confirmed', day4.toISOString()).lastInsertRowid;
      itemStmt.run(o1Id, cementId, 10, 8500);

      // Order 2 days ago
      const day2 = new Date(today);
      day2.setDate(day2.getDate() - 2);
      const o2Id = orderStmt.run(cust2Id, 150000, 'confirmed', day2.toISOString()).lastInsertRowid;
      itemStmt.run(o2Id, paintId, 10, 15000);

      // Order today
      const o3Id = orderStmt.run(cust1Id, 42000, 'confirmed', today.toISOString()).lastInsertRowid;
      itemStmt.run(o3Id, pipeId, 12, 3500);
    });

    seedData();

    // 6. Generate Token & Login
    const token = jwt.sign({ id: businessId, role: "owner" }, SECRET_KEY, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: businessId,
        name: "Demo User",
        businessName: "Demo Hardware Store",
        username: demoUserStr,
      },
    });

  } catch (error) {
    console.error("Demo creation error", error);
    res.status(500).json({ error: "Failed to create demo environment" });
  }
});

export default router;
