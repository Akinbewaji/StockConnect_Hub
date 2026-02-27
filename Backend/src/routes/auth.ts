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

export default router;
