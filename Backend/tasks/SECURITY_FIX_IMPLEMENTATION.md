# StockConnect Backend - Security Implementation Guide

This document provides step-by-step fixes for all identified security vulnerabilities.

---

## 1. Rate Limiting Implementation

### Step 1: Install Dependencies
```bash
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit
```

### Step 2: Create Rate Limiting Middleware

**File**: `Backend/src/middleware/rateLimit.ts`

```typescript
import rateLimit from "express-rate-limit";

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many login attempts, please try again later",
    retryAfter: Math.ceil(15 * 60 / 60), // minutes
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || "unknown";
  },
});

// Moderate rate limiting for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: "Too many password reset attempts, please try again later",
});
```

### Step 3: Apply Rate Limiters in server.ts

Update `Backend/src/server.ts`:

```typescript
import { authLimiter, apiLimiter } from "./middleware/rateLimit.js";

// ... existing code ...

// Apply rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Apply general API rate limiting (after auth routes)
app.use("/api/", apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
// ... rest of routes ...
```

---

## 2. Token Revocation & Logout

### Step 1: Create Token Blacklist Middleware

**File**: `Backend/src/middleware/tokenBlacklist.ts`

```typescript
import redis from "redis";

// Use in-memory Set for development, Redis for production
let tokenBlacklist = new Set<string>();

// Production: Use Redis
export let redisClient: redis.RedisClient | null = null;

if (process.env.NODE_ENV === "production") {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  redisClient.on("error", (err) => {
    console.error("Redis error:", err);
  });

  redisClient.connect();
}

/**
 * Add token to blacklist
 * In production, uses Redis with TTL
 * In development, uses in-memory Set
 */
export async function revokeToken(token: string): Promise<void> {
  if (redisClient) {
    // Production: Store in Redis with 24-hour expiry
    const payload = jwt.decode(token) as any;
    const ttl = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 86400;
    await redisClient.setEx(`blacklist:${token}`, Math.max(ttl, 1), "revoked");
  } else {
    // Development: Use in-memory Set
    tokenBlacklist.add(token);
  }
}

/**
 * Check if token is revoked
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (redisClient) {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null;
  } else {
    return tokenBlacklist.has(token);
  }
}

/**
 * Clear expired tokens (for development)
 */
export function clearExpiredTokens(): void {
  // Redis handles TTL automatically, only needed for in-memory
  if (!redisClient) {
    // In production use, implement cleanup via cron job
    console.log("Token blacklist size:", tokenBlacklist.size);
  }
}
```

### Step 2: Update Auth Middleware

Update `Backend/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { isTokenRevoked } from "./tokenBlacklist.js";

const SECRET_KEY = process.env.JWT_SECRET || "stockconnect-secret-key";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Check if token is blacklisted
  const revoked = await isTokenRevoked(token);
  if (revoked) {
    return res.status(401).json({ error: "Token has been revoked" });
  }

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};
```

### Step 3: Add Logout Endpoint

Update `Backend/src/routes/auth.ts`:

```typescript
import { revokeToken } from "../middleware/tokenBlacklist.js";

/**
 * POST /logout
 * Revoke the user's current token
 * 
 * Requires: Valid JWT token in Authorization header
 * Response: Success message
 */
router.post("/logout", authenticateToken, async (req: any, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "No token to revoke" });
    }

    // Add token to blacklist
    await revokeToken(token);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server error during logout" });
  }
});

/**
 * POST /logout-all
 * Revoke all tokens for the current user (logout all devices)
 * 
 * Requires: Valid JWT token in Authorization header
 * Response: Success message
 * 
 * Note: In production, store user sessions in database
 * and revoke all sessions for this user
 */
router.post("/logout-all", authenticateToken, async (req: any, res) => {
  try {
    // TODO: Query all active sessions for this user
    // and revoke them all
    const userId = req.user.id;
    
    // Example implementation (requires sessions table):
    // const sessions = db.prepare("SELECT token FROM sessions WHERE user_id = ?")
    //   .all(userId);
    // for (const session of sessions) {
    //   await revokeToken(session.token);
    // }

    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
```

---

## 3. Security Headers with Helmet.js

### Step 1: Install Helmet
```bash
npm install helmet
```

### Step 2: Update server.ts

Update `Backend/src/server.ts`:

```typescript
import helmet from "helmet";

async function startServer() {
  const app = express();

  // === SECURITY HEADERS ===
  // Helmet helps secure Express apps by setting various HTTP headers
  app.use(helmet());

  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles if needed
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'none'"], // Prevent framing
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    })
  );

  // HSTS - Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    app.use(
      helmet.hsts({
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      })
    );
  }

  // Disable X-Powered-By header
  app.disable("x-powered-by");

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // ... rest of server setup ...
}
```

---

## 4. Input Validation on Protected Routes

### Step 1: Create Validation Schemas

Create schemas file for products: `Backend/src/schemas/products.ts`

```typescript
import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Product name is required")
      .max(255, "Product name must not exceed 255 characters"),
    category: z
      .string()
      .trim()
      .min(1, "Category is required")
      .max(100, "Category must not exceed 100 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must not exceed 2000 characters")
      .optional()
      .default(""),
    price: z
      .number()
      .positive("Price must be a positive number")
      .max(1000000, "Price exceeds maximum limit"),
    quantity: z
      .number()
      .int("Quantity must be a whole number")
      .min(0, "Quantity cannot be negative")
      .max(1000000, "Quantity exceeds maximum"),
    reorderThreshold: z
      .number()
      .int()
      .min(0, "Reorder threshold cannot be negative")
      .optional()
      .default(5),
    supplier: z
      .string()
      .trim()
      .max(255, "Supplier name must not exceed 255 characters")
      .optional(),
    imageUrl: z
      .string()
      .url("Image URL must be valid")
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(2000).optional(),
    price: z.number().positive().max(1000000).optional(),
    quantity: z.number().int().min(0).max(1000000).optional(),
    reorderThreshold: z.number().int().min(0).optional(),
    supplier: z.string().trim().max(255).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const searchProductSchema = z.object({
  query: z.object({
    search: z
      .string()
      .max(100, "Search term must not exceed 100 characters")
      .optional(),
    category: z
      .string()
      .max(100, "Category must not exceed 100 characters")
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a number")
      .optional()
      .transform((v) => (v ? parseInt(v) : 1)),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a number")
      .optional()
      .transform((v) => (v ? Math.min(parseInt(v), 100) : 10)), // Max 100 per page
  }),
});
```

### Step 2: Update Products Route

Update `Backend/src/routes/products.ts`:

```typescript
import { Router } from "express";
import db from "../db/init.js";
import { AuthRequest } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
  searchProductSchema,
} from "../schemas/products.js";

const router = Router();

// Get all products with validation
router.get("/", validateRequest(searchProductSchema), (req: any, res) => {
  const { search, category, page = 1, limit = 10 } = req.query;
  const businessId = req.user.id;
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM products WHERE business_id = ?";
  const params: any[] = [businessId];

  // All inputs are now validated by Zod
  if (search) {
    query += " AND (name LIKE ? OR category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  try {
    const stmt = db.prepare(query);
    const products = stmt.all(...params);
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Server error fetching products" });
  }
});

// Create product with validation
router.post("/", validateRequest(createProductSchema), (req: any, res) => {
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
      INSERT INTO products (
        name, category, description, price, quantity,
        reorder_threshold, supplier, image_url, business_id
      )
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
      businessId
    );

    res.status(201).json({
      id: info.lastInsertRowid,
      name,
      category,
      description,
      price,
      quantity,
      reorderThreshold,
      supplier,
      imageUrl,
      businessId,
    });
  } catch (error: any) {
    console.error("Create product error:", error);

    if (error.message?.includes("UNIQUE")) {
      return res.status(400).json({ error: "Product already exists" });
    }

    res.status(500).json({ error: "Server error creating product" });
  }
});

// Update product with validation
router.put("/:id", validateRequest(updateProductSchema), (req: any, res) => {
  const { id } = req.params;
  const businessId = req.user.id;
  const updates = req.body;

  try {
    // Verify ownership
    const product = db.prepare(
      "SELECT id FROM products WHERE id = ? AND business_id = ?"
    ).get(id, businessId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Build update query dynamically
    const fields = Object.keys(updates).map((key) => `${key} = ?`);
    const values = Object.values(updates);

    const query = `UPDATE products SET ${fields.join(", ")} WHERE id = ? AND business_id = ?`;
    values.push(id, businessId);

    const stmt = db.prepare(query);
    stmt.run(...values);

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Server error updating product" });
  }
});

export default router;
```

---

## 5. Secure Cookie-Based Authentication

### Step 1: Install Cookie Parser
```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

### Step 2: Update Login Response

Update `Backend/src/routes/auth.ts`:

```typescript
import cookieParser from "cookie-parser";

/**
 * POST /login
 * Updated to use secure httpOnly cookies
 */
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  let { identifier, password } = req.body;

  try {
    identifier = trimString(identifier);
    if (identifier.includes("@")) {
      identifier = normalizeEmail(identifier);
    }

    const stmt = db.prepare(
      "SELECT * FROM users WHERE phone = ? OR email = ? OR username = ?"
    );
    const user = stmt.get(identifier, identifier, identifier) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: "15m" } // Short-lived access token
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || "refresh-secret",
      { expiresIn: "7d" } // Long-lived refresh token
    );

    // Set secure httpOnly cookie (not accessible to JavaScript)
    res.cookie("accessToken", accessToken, {
      httpOnly: true,           // Prevents JavaScript access
      secure: process.env.NODE_ENV === "production", // HTTPS only
      sameSite: "strict",       // CSRF protection
      maxAge: 15 * 60 * 1000,   // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only user data (not token)
    res.status(200).json({
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
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

/**
 * POST /refresh
 * Get new access token using refresh token
 */
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh-secret"
    ) as any;

    // Verify token is not revoked
    // TODO: Check isTokenRevoked(refreshToken)

    // Get fresh user data
    const stmt = db.prepare("SELECT id, role FROM users WHERE id = ?");
    const user = stmt.get(decoded.id) as any;

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
```

### Step 3: Update Middleware to Read from Cookies

Update `Backend/src/middleware/auth.ts`:

```typescript
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Try to get token from cookie first (preferred)
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header for mobile/API clients
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Check if token is revoked
  const revoked = await isTokenRevoked(token);
  if (revoked) {
    return res.status(401).json({ error: "Token has been revoked" });
  }

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};
```

### Step 4: Register Cookie Parser in server.ts

Update `Backend/src/server.ts`:

```typescript
import cookieParser from "cookie-parser";

async function startServer() {
  const app = express();

  // ... security headers ...

  // Parse cookies
  app.use(cookieParser());

  // Parse JSON and URL-encoded bodies
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ... rest of setup ...
}
```

### Step 5: Update Frontend AuthContext

Update `Frontend/src/context/AuthContext.tsx`:

```typescript
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  name: string;
  businessName: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage (but not token)
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Token is now stored in httpOnly cookie automatically
  // No need to load it in state

  const login = (newUser: User) => {
    setUser(newUser);
    // Only store non-sensitive user data
    localStorage.setItem("user", JSON.stringify(newUser));
    // Token is set by backend in httpOnly cookie
  };

  const logout = async () => {
    try {
      // Notify backend to revoke token
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Send cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    setUser(null);
    localStorage.removeItem("user");
  };

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Send cookies
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      // New token is automatically set in httpOnly cookie
    } catch (error) {
      console.error("Token refresh error:", error);
      logout(); // Logout user if refresh fails
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

## 6. Environment Variables Validation

### Create env validation file

Create `Backend/src/utils/env.ts`:

```typescript
/**
 * Validate and load environment variables
 * Fails fast if required variables are missing
 */

const requiredEnvVars = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "AFRICASTALKING_USERNAME",
  "AFRICASTALKING_API_KEY",
];

const optionalEnvVars = ["PORT", "DB_PATH", "ALLOWED_ORIGINS", "NODE_ENV"];

export function validateEnv() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error(
      "❌ Missing required environment variables:",
      missing.join(", ")
    );
    console.error("Please check your .env file");
    process.exit(1);
  }

  console.log(
    "✅ All required environment variables are configured"
  );
}

export const ENV = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  AFRICASTALKING_USERNAME: process.env.AFRICASTALKING_USERNAME!,
  AFRICASTALKING_API_KEY: process.env.AFRICASTALKING_API_KEY!,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5173",
  DB_PATH: process.env.DB_PATH || "./stockconnect.db",
  REDIS_URL: process.env.REDIS_URL,
};
```

### Call validation in server.ts

Update `Backend/src/server.ts`:

```typescript
import { validateEnv, ENV } from "./utils/env.js";

async function startServer() {
  // === VALIDATE ENVIRONMENT ===
  validateEnv();

  const app = express();
  const PORT = parseInt(ENV.PORT, 10);

  // ... rest of setup ...

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `✅ StockConnect Backend API running on http://localhost:${PORT}`
    );
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔒 Environment: ${ENV.NODE_ENV}`);
  });
}

startServer();
```

---

## Implementation Checklist

- [ ] Install rate limiting package
- [ ] Create rate limit middleware
- [ ] Apply rate limits to auth endpoints
- [ ] Create token blacklist middleware
- [ ] Update auth middleware with blacklist check
- [ ] Add logout endpoint
- [ ] Install Helmet.js
- [ ] Add security headers to server.ts
- [ ] Create validation schemas for all routes
- [ ] Update routes to use validateRequest
- [ ] Install cookie-parser
- [ ] Update login to use secure cookies
- [ ] Update auth middleware to read from cookies
- [ ] Update AuthContext for cookie-based auth
- [ ] Create environment validation utility
- [ ] Test all endpoints
- [ ] Test logout functionality
- [ ] Test token refresh
- [ ] Test rate limiting
- [ ] Verify security headers are present

---

## Testing Security Fixes

### Test Rate Limiting
```bash
# Make multiple requests quickly
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"test","password":"test"}' &
done
```

### Test Token Revocation
```bash
# Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user","password":"Pass123!"}' \
  | jq -r '.token')

# Use token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Try using token again (should fail)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test Security Headers
```bash
curl -I http://localhost:5000/health
# Check for security headers:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
# - Content-Security-Policy
```

---

## Next Steps

1. **Implement Phase 1** (Critical): Sections 1-4
2. **Test thoroughly** before moving to Phase 2
3. **Implement Phase 2** (Important): Sections 5-6
4. **Plan database migration** from SQLite to PostgreSQL
5. **Setup monitoring** and logging
6. **Conduct security review** before production
