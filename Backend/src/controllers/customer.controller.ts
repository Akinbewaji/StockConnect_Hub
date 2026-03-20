import { Request, Response } from "express";
import db from "../db/init.js";
// OTP-related imports (commented out - using password auth instead)
// import { formatPhoneNumber, sendSMS } from "../services/africastalking.js";
// import { sendEmail } from "../services/email.service.js";
// import crypto from "crypto";
import { formatPhoneNumber } from "../services/africastalking.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Register a new customer
 */
export async function register(req: Request, res: Response) {
  const { name, phone, email, password, address } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: "Name, phone, and email are required" });
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // 1. Create a user entry for login
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await (await db.prepare(`
      INSERT INTO users (username, email, phone, password, name, business_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
    `)).run(email, email, formattedPhone, hashedPassword, name, 'Customer', 'customer');

    const userId = userResult.lastInsertRowid;
    // (Default business assignment handled later or via invitations)
    const defaultBusinessId = 1; 

    // 2. Create customer entry linked to user
    const customerId = (await (await db.prepare(
      "INSERT INTO customers (business_id, name, phone, email, user_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
    )).run(
      defaultBusinessId,
      name,
      formattedPhone,
      email || null,
      userId
    )).lastInsertRowid;

    // 3. Add address if provided
    if (address) {
      await (await db.prepare(
        "INSERT INTO addresses (customer_id, label, address_line1, city, state) VALUES (?, ?, ?, ?, ?) RETURNING id",
      )).run(
        customerId,
        "Default",
        address.street || '',
        address.city || null,
        address.state || null,
      );
    }

    res.status(201).json({
      message: "Customer registered successfully",
      customer: {
        id: customerId,
        name,
        phone: formattedPhone,
        email
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Phone number or email already registered" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Password-based login (email, phone, or username + password)
 */
export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body; // identifier = email, phone, or username

  if (!identifier || !password) {
    return res.status(400).json({ error: "Identifier and password are required" });
  }

  try {
    // Find user by email, phone, or username
    const user = (await db.prepare(
      "SELECT * FROM users WHERE email = ? OR phone = ? OR username = ?"
    ).get(identifier, identifier, identifier)) as any;

    if (!user || user.role !== 'customer') {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* ---- OTP LOGIN (commented out - kept for future reference) ----
export async function requestOTP(...) { ... }
export async function verifyOTP(...) { ... }
---- END OTP LOGIN ---- */

/**
 * Get profile
 */
export async function getProfile(req: any, res: Response) {
  try {
    const customer = (await db.prepare("SELECT * FROM customers WHERE user_id = ?").get(req.user.id));
    if (!customer) {
      return res.status(404).json({ error: "Customer profile not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update profile
 */
export async function updateProfile(req: any, res: Response) {
  const { name, email } = req.body;
  try {
    await db.prepare(`
      UPDATE customers 
      SET name = COALESCE(?, name), 
          email = COALESCE(?, email)
      WHERE user_id = ?
    `).run(name, email, req.user.id);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Address management
 */
export async function addAddress(req: any, res: Response) {
  const { label, address_line1, address_line2, city, state, postal_code, is_default } = req.body;
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    
    if (is_default) {
      await db.prepare("UPDATE addresses SET is_default = 0 WHERE customer_id = ?").run(customer.id);
    }

    await db.prepare(`
      INSERT INTO addresses (customer_id, label, address_line1, address_line2, city, state, postal_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `).run(customer.id, label, address_line1, address_line2, city, state, postal_code, is_default ? 1 : 0);

    res.status(201).json({ message: "Address added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req: any, res: Response) {
  try {
    const customer = (await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id)) as any;
    const addresses = await db.prepare("SELECT * FROM addresses WHERE customer_id = ?").all(customer.id);
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
