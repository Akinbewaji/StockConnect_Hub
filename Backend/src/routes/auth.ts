/**
 * Authentication Routes
 * 
 * Handles user registration, login, and profile retrieval
 * Implements JWT-based authentication with bcrypt password hashing
 * Validates all inputs and enforces strong security constraints
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import {
  trimString,
  normalizeEmail,
  sanitizeInput,
} from "../utils/sanitize.js";

const router = Router();
const SECRET_KEY = process.env.JWT_SECRET || "stockconnect-secret-key";

/**
 * POST /register
 * Create a new user account
 * 
 * Request Validation:
 * - Phone: 7-15 digits in E.164 format (e.g., +254712345678 or 712345678)
 * - Email: Valid email format, max 255 characters
 * - Username: 3-30 characters, lowercase letters/numbers/underscore/hyphen only
 * - Password: 10+ characters with uppercase, lowercase, digit, and special char (!@#$%^&*)
 * - Name: 1-100 characters
 * - Business Name: 1-100 characters
 * 
 * Response: JWT token + user profile on success (201 Created)
 */
router.post("/register", validateRequest(registerSchema), async (req, res) => {
  let { phone, email, username, password, name, businessName } = req.body;

  try {
    // === SANITIZATION LAYER ===
    // Clean and normalize all inputs for safety (defense in depth)
    // Removes whitespace, escapes special characters, converts email to lowercase
    phone = sanitizeInput(trimString(phone));
    email = normalizeEmail(email);
    username = trimString(username).toLowerCase();
    name = sanitizeInput(trimString(name));
    businessName = sanitizeInput(trimString(businessName));

    // === PASSWORD HASHING ===
    // Hash password with bcrypt (10 salt rounds = industry standard)
    // Never store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 10);

    // === DATABASE INSERT ===
    // Create new user record with all validated and sanitized data
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

    // === JWT TOKEN GENERATION ===
    // Create a 24-hour authentication token with user ID and role
    const token = jwt.sign(
      { id: info.lastInsertRowid, role: "owner" },
      SECRET_KEY,
      { expiresIn: "24h" },
    );

    // === SUCCESS RESPONSE ===
    // Return 201 Created status with token and user details
    res.status(201).json({
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
    // === ERROR HANDLING ===

    // Handle duplicate email/username/phone
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      // Provide specific error message to help user fix the issue
      if (error.message.includes("email")) {
        return res.status(400).json({ error: "Email is already registered" });
      } else if (error.message.includes("username")) {
        return res.status(400).json({ error: "Username is already taken" });
      } else if (error.message.includes("phone")) {
        return res
          .status(400)
          .json({ error: "Phone number is already registered" });
      }
      return res.status(400).json({ error: "This account already exists" });
    }

    // Handle database constraint violations (length limits, format checks)
    if (error.code === "SQLITE_CONSTRAINT_CHECK") {
      return res
        .status(400)
        .json({ error: "Invalid input: values exceed length limits" });
    }

    // Log unexpected errors for debugging
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

/**
 * POST /login
 * Authenticate a user and generate a session token
 * 
 * Accepts any of:
 * - Phone number (e.g., +254712345678 or 712345678)
 * - Email address
 * - Username
 * 
 * Response: JWT token + user profile on success or 401 Unauthorized on failure
 */
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  let { identifier, password } = req.body;

  try {
    // === PREPARE IDENTIFIER ===
    // Normalize the login identifier (phone, email, or username)
    identifier = trimString(identifier);
    // If it looks like an email, convert to lowercase for case-insensitive matching
    if (identifier.includes("@")) {
      identifier = normalizeEmail(identifier);
    }

    // === FIND USER ===
    // Query database for user by any identifier type
    // Users can login with phone, email, OR username (flexible login)
    const stmt = db.prepare(
      "SELECT * FROM users WHERE phone = ? OR email = ? OR username = ?",
    );
    const user = stmt.get(identifier, identifier, identifier) as any;

    // === VALIDATE USER EXISTS ===
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // === VERIFY PASSWORD ===
    // Compare provided password with stored bcrypt hash
    // Uses bcrypt's constant-time comparison to prevent timing attacks
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // === GENERATE TOKEN ===
    // Create a 24-hour JWT token for authenticated requests
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "24h",
    });

    // === SUCCESS RESPONSE ===
    // Return token and user profile (without password)
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
    // Log server errors for debugging
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * GET /me
 * Retrieve the authenticated user's profile
 * 
 * Requires: Valid JWT token in Authorization header
 * Response: User profile details or 404 if user not found
 * 
 * Security: The authenticateToken middleware verifies the JWT token
 * and extracts the user ID before this handler is called
 */
router.get("/me", authenticateToken, (req: any, res) => {
  try {
    // === RETRIEVE USER DATA ===
    // Fetch user profile using ID from authenticated JWT token
    const stmt = db.prepare(
      "SELECT id, name, business_name, phone, role, created_at FROM users WHERE id = ?",
    );
    const user = stmt.get(req.user.id) as any;

    // === HANDLE USER NOT FOUND ===
    // Should rarely happen if token is valid, but check anyway
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // === SUCCESS RESPONSE ===
    // Return user profile in consistent format
    res.json({
      id: user.id,
      name: user.name,
      businessName: user.business_name,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (error) {
    // Log errors for debugging
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Export the router
 * These routes are mounted at /api/auth in the main server
 */
export default router;
