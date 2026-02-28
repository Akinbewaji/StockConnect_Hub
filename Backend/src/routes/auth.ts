import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";
import { registerSchema, loginSchema, onboardingSchema } from "../types/schemas.js";

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || "stockconnect-secret-key";

// Register
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: result.error.flatten().fieldErrors 
    });
  }

  const { phone, email, username, password, name, businessName } = result.data;

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
        onboarded: 0,
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
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: result.error.flatten().fieldErrors 
    });
  }

  const { identifier, password } = result.data;

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
        onboarded: user.onboarded,
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
      onboarded: user.onboarded,
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
        "INSERT INTO products (business_id, name, category, price, quantity) VALUES (?, ?, ?, ?, ?)"
      );
      const cementId = productStmt.run(businessId, 'Dangote Cement 50kg', 'Building Materials', 8500, 150).lastInsertRowid;
      const pipeId = productStmt.run(businessId, 'PVC Pipe 4 inch', 'Plumbing', 3500, 20).lastInsertRowid; // Low stock
      const wireId = productStmt.run(businessId, 'Copper Wire 2.5mm', 'Electrical', 12000, 80).lastInsertRowid;
      const paintId = productStmt.run(businessId, 'Emulsion Paint 20L', 'Paint', 15000, 45).lastInsertRowid;

      // 4. Create Demo Customers
      const customerStmt = db.prepare(
        "INSERT INTO customers (business_id, name, phone, email) VALUES (?, ?, ?, ?)"
      );
      const cust1Id = customerStmt.run(businessId, 'John Contractor', '08011111111', 'john@example.com').lastInsertRowid;
      const cust2Id = customerStmt.run(businessId, 'ABC Builders Ltd', '08022222222', 'contact@abc.com').lastInsertRowid;

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

  } catch (error: any) {
    console.error("Demo creation error", error.message, error.stack);
    res.status(500).json({ error: "Failed to create demo environment: " + error.message });
  }
});

// Update Onboarding Status
router.post("/onboarding", authenticateToken, async (req: any, res) => {
  const result = onboardingSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      error: "Validation failed", 
      details: result.error.flatten().fieldErrors 
    });
  }

  const businessId = req.user.id;
  const { currency, phone, address, taxRate } = result.data;

  try {
    // 1. Update user onboarded status
    db.prepare("UPDATE users SET onboarded = 1 WHERE id = ?").run(businessId);

    // 2. Update settings with business info
    const stmt = db.prepare(`
      UPDATE settings 
      SET currency = ?, 
          phone = ?, 
          address = ?, 
          tax_rate = ?
      WHERE business_id = ?
    `);
    
    stmt.run(currency || '₦', phone || null, address || null, taxRate || 0, businessId);

    res.json({ success: true, message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// Verify Password for Sensitive Actions
router.post("/verify-password", authenticateToken, async (req: any, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Password verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
