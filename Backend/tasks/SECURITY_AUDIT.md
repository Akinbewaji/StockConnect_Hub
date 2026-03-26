# StockConnect Backend - Security Audit Report

**Date**: March 26, 2026  
**Status**: ⚠️ **POC Phase** - Critical vulnerabilities identified before production
**Risk Level**: **HIGH** (Multiple high-severity issues present)

---

## Executive Summary

The StockConnect Backend has a **solid foundation** with good practices in some areas, but **critical security gaps** must be addressed before production deployment. The application is currently suitable for POC/development only.

### Critical Issues That Must Be Fixed Before Production:
1. ❌ **Exposed API Keys** (Africa's Talking credentials)
2. ❌ **No Rate Limiting** (Brute force vulnerability)
3. ❌ **No Token Revocation/Logout** (Sessions can't be terminated)
4. ❌ **Missing Security Headers** (Helmet.js not implemented)
5. ❌ **SQLite in Production** (Not suitable for multi-user production)
6. ❌ **No Input Validation on Protected Routes** (SQL injection risk)

---

## Detailed Security Findings

### 🔴 CRITICAL SEVERITY

#### 1. **Exposed API Credentials**

**File**: [Backend/.env](Backend/.env)

**Issue**: 
- Africa's Talking API key is visible in plain text: `atsk_9ccafba...`
- Default JWT secret `"stockconnect-secret-key"` used as fallback
- If .env.example is checked in, it signals what secrets are needed

**Risk**: 
- Anyone with access to the codebase can make SMS/WhatsApp calls on your account
- Could result in unauthorized charges and message spam
- Tokens can be forged if JWT_SECRET is compromised

**Recommendations**:
```bash
# 1. IMMEDIATELY rotate Africa's Talking API key
# 2. Use a secrets management service:
#    - AWS Secrets Manager
#    - HashiCorp Vault
#    - Azure Key Vault
#    - Vercel Secrets (if using Vercel)
# 3. Never commit .env to git
# 4. Use .gitignore to exclude:
#    .env
#    .env.local
#    .env.*.local
```

**Implementation Priority**: 🔥 **DO THIS FIRST**

---

#### 2. **No Rate Limiting - Brute Force Vulnerability**

**Files**: 
- [Backend/src/routes/auth.ts](Backend/src/routes/auth.ts) - POST `/register` and POST `/login`
- [Backend/src/server.ts](Backend/src/server.ts)

**Issue**:
- No rate limiting on authentication endpoints
- Attackers can make unlimited login attempts
- Can exploit weak password validation to find valid accounts
- No protection against credential stuffing attacks

**Attack Scenario**:
```
Attacker tries 1000 login attempts/second
- No backoff delay
- No account lockout
- No CAPTCHA
- Resource exhaustion possible
```

**Fix**:
```typescript
// Install express-rate-limit
npm install express-rate-limit

// In server.ts
import rateLimit from "express-rate-limit";

// Strict rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// General API rate limiting (less strict)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
app.use("/api/", apiLimiter);
```

**Implementation Priority**: 🔴 **HIGH - Before Production**

---

#### 3. **No Token Revocation/Logout Mechanism**

**File**: [Backend/src/routes/auth.ts](Backend/src/routes/auth.ts)

**Issue**:
- No logout endpoint
- Tokens are valid until they expire (24 hours)
- Users cannot immediately end their session
- Stolen tokens remain valid for 24 hours
- No way to revoke admin access immediately

**Risk**:
- Account compromise undetected for up to 24 hours
- Session hijacking through token theft
- No emergency access revocation

**Fix - Implement Token Blacklist**:
```typescript
// Create middleware/tokenBlacklist.ts
let tokenBlacklist = new Set<string>();

// For Redis (production):
import redis from 'redis';
const redisClient = redis.createClient();

export async function revokeToken(token: string) {
  // In-memory (POC):
  tokenBlacklist.add(token);
  
  // Redis (production):
  await redisClient.setex(token, 86400, 'revoked'); // 24h expiry
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  // In-memory:
  return tokenBlacklist.has(token);
  
  // Redis:
  const result = await redisClient.get(token);
  return result === 'revoked';
}

// In middleware/auth.ts - add blacklist check:
export const authenticateToken = async (req, res, next) => {
  const token = authHeader?.split(" ")[1];
  if (await isTokenRevoked(token)) {
    return res.status(401).json({ error: "Token has been revoked" });
  }
  // ... rest of verification
};

// Add logout endpoint in routes/auth.ts:
router.post("/logout", authenticateToken, (req: any, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  revokeToken(token);
  res.json({ message: "Logged out successfully" });
});
```

**Implementation Priority**: 🔴 **HIGH - Before Production**

---

#### 4. **Missing Security Headers**

**File**: [Backend/src/server.ts](Backend/src/server.ts)

**Issue**:
- No Helmet.js implemented
- Missing critical HTTP security headers:
  - `X-Frame-Options` (Clickjacking protection)
  - `X-Content-Type-Options` (MIME sniffing protection)
  - `Strict-Transport-Security` (HTTPS enforcement)
  - `Content-Security-Policy` (XSS protection)

**Risk**:
- Vulnerable to clickjacking attacks
- Browser may misinterpret content types
- Information disclosure through headers

**Fix**:
```bash
npm install helmet
```

```typescript
// In server.ts
import helmet from "helmet";

app.use(helmet());

// Additional CSP headers:
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
);

// HSTS for HTTPS enforcement (only in production)
if (process.env.NODE_ENV === "production") {
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
}
```

**Implementation Priority**: 🔴 **HIGH - Before Production**

---

#### 5. **Input Validation Missing on Protected Routes**

**Files**:
- [Backend/src/routes/products.ts](Backend/src/routes/products.ts)
- `Backend/src/routes/customers.ts` (not shown)
- `Backend/src/routes/orders.ts` (not shown)
- `Backend/src/routes/campaigns.ts` (not shown)

**Issue**:
- Products route has NO input validation using `validateRequest` middleware
- Other protected routes lack input validation
- Risk of SQL injection (though using prepared statements helps)
- No business logic validation
- Missing required field checks

**Example from products.ts**:
```typescript
// ❌ BAD - No validation
router.post("/", (req: any, res) => {
  const { name, category, description, price, quantity } = req.body;
  // No checks that name exists, price is positive, etc.
  const stmt = db.prepare(`INSERT INTO products ...`);
});
```

**Fix**:
```typescript
// ✅ GOOD
import { validateRequest } from "../middleware/validate.js";
import { z } from "zod";

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    category: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    price: z.number().positive("Price must be positive"),
    quantity: z.number().int().min(0),
    reorderThreshold: z.number().int().min(0).optional(),
    supplier: z.string().max(255).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

router.post("/", validateRequest(createProductSchema), (req: any, res) => {
  // Safe - data is validated
  const { name, category, description, price, quantity } = req.body;
  // ...
});
```

**Implementation Priority**: 🔴 **HIGH - Before Production**

---

### 🟠 HIGH SEVERITY

#### 6. **SQLite Not Suitable for Production**

**File**: [Backend/src/db/init.ts](Backend/src/db/init.ts)

**Issue**:
- SQLite is file-based, not client-server
- Cannot handle concurrent requests well
- No built-in authentication/authorization
- No built-in backup/replication
- Limited to single machine
- Not suitable for multi-user production systems

**For POC**: ✅ Fine as-is  
**For Production**: ❌ Must migrate

**Migration Path**:
```typescript
// Install PostgreSQL driver
npm install pg

// Or use MongoDB
npm install mongodb

// Create wrapper that uses PostgreSQL in production:
let db;

if (process.env.NODE_ENV === 'production') {
  // Use PostgreSQL
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  // Use SQLite for development
  db = new Database('./stockconnect.db');
}
```

**Implementation Priority**: 🟠 **HIGH - Before Production**

---

#### 7. **Tokens Stored in localStorage (XSS Vulnerability)**

**File**: [Frontend/src/context/AuthContext.tsx](Frontend/src/context/AuthContext.tsx)

**Issue**:
```typescript
localStorage.setItem("token", newToken);  // ❌ Vulnerable to XSS
localStorage.setItem("user", JSON.stringify(newUser));
```

- Tokens stored in localStorage are accessible to JavaScript
- If XSS vulnerability exists elsewhere, attacker can steal tokens
- No `httpOnly` flag (can't use with localStorage)

**Risk**:
- Session hijacking via XSS
- Permanent token exposure if malicious JS injected

**Fix - Use HttpOnly Cookies**:
```typescript
// Backend - set secure cookie instead of relying on client storage
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  // ... existing login logic ...
  
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
    expiresIn: "24h",
  });

  // Set secure, httpOnly cookie
  res.cookie("authToken", token, {
    httpOnly: true,        // Prevents JavaScript access
    secure: true,          // HTTPS only
    sameSite: "strict",    // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.json({
    user: { id, name, businessName, phone, email, username }
    // Don't send token to client
  });
});

// Frontend - read from cookies automatically (no code needed)
// Cookies are sent automatically with requests
```

**Frontend Auth Context Update**:
```typescript
// Don't store token in localStorage
const [user, setUser] = useState<User | null>(() => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
});

// Remove: localStorage.setItem("token", newToken);
// The token is now in a secure httpOnly cookie

const login = (newUser: User) => {
  setUser(newUser);
  localStorage.setItem("user", JSON.stringify(newUser)); // Keep non-sensitive data
};

const logout = () => {
  setUser(null);
  localStorage.removeItem("user");
  // Make request to logout endpoint which clears cookie
  fetch("/api/auth/logout", { method: "POST" });
};
```

**Implementation Priority**: 🟠 **HIGH - Before Production**

---

#### 8. **Weak Token Expiration & No Refresh Token**

**File**: [Backend/src/routes/auth.ts](Backend/src/routes/auth.ts)

**Issue**:
```typescript
{ expiresIn: "24h" }  // Very long expiration
```

- 24-hour tokens are too long in production
- No refresh token mechanism
- User forced to re-login after 24 hours
- No way to have short-lived access tokens

**Best Practice**:
- Access tokens: 15-30 minutes
- Refresh tokens: 7-30 days
- Refresh token stored in httpOnly cookie

**Fix**:
```typescript
// In routes/auth.ts
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  // ... existing validation ...

  // Short-lived access token (15 minutes)
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  // Long-lived refresh token (7 days)
  const refreshToken = jwt.sign(
    { id: user.id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken }); // Client uses this for API calls
});

// Add refresh token endpoint
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    
    const accessToken = jwt.sign(
      { id: decoded.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
```

**Implementation Priority**: 🟠 **HIGH - Before Production**

---

#### 9. **Overly Permissive CORS Configuration**

**File**: [Backend/src/server.ts](Backend/src/server.ts)

**Issue**:
```typescript
// Allows requests with no origin!
if (!origin) return callback(null, true);
```

- Accepts requests with no `Origin` header (could include requests from Postman, cURL)
- Should be explicit about allowed origins
- Could allow unauthorized requests from unexpected sources

**Fix**:
```typescript
// Better CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("ALLOWED_ORIGINS must be set in production");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow no origin (for mobile apps, Postman)
      if (!origin && process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      // In production, require valid origin
      if (!origin) {
        return callback(
          new Error("Request without Origin header not allowed in production")
        );
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
```

**Implementation Priority**: 🟠 **MEDIUM - Before Production**

---

### 🟡 MEDIUM SEVERITY

#### 10. **No HTTPS Enforcement**

**Issue**:
- Development allows HTTP
- Production should require HTTPS
- Cookies without `secure` flag can be intercepted

**Fix**:
```typescript
// Add HTTP to HTTPS redirect in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

**Implementation Priority**: 🟡 **MEDIUM - Before Production**

---

#### 11. **Password Reset Not Implemented**

**Issue**:
- No password reset/recovery mechanism
- Users locked out if they forget password
- No account recovery option

**Fix**: Implement password reset with:
- Email verification token
- Token expiration (15 minutes)
- Rate limiting on requests
- Strong password reset link (long, random, unique)

**Implementation Priority**: 🟡 **MEDIUM - For General Availability**

---

#### 12. **No Audit Logging**

**Issue**:
- No logs of authentication events
- No logs of failed login attempts
- No logs of data modifications
- Cannot investigate security incidents

**Fix**:
```typescript
// Add structured logging
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "audit.log" }),
  ],
});

// Log auth events
router.post("/login", async (req, res) => {
  // ... validation ...
  
  if (!user) {
    logger.warn("Failed login attempt", { identifier, ip: req.ip });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  logger.info("User logged in", { userId: user.id, ip: req.ip });
  // ... rest of login logic ...
});
```

**Implementation Priority**: 🟡 **MEDIUM - For Production Ready**

---

#### 13. **No Input Size Limits**

**Current**: `"10mb"` limit is set (good)  
**Issue**: No granular limits per endpoint

**Fix**:
```typescript
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Different limits for bulk import
app.post("/api/products/import", 
  express.json({ limit: "10mb" }), 
  importHandler
);
```

**Implementation Priority**: 🟡 **MEDIUM**

---

#### 14. **Weak Session Management**

**Issue**:
- No session ID tracking
- No device tracking
- No concurrent session limits
- No "logout all devices" option

**Fix**: Implement session tracking
- Store active sessions in database/Redis
- Track device fingerprint
- Allow multiple concurrent sessions (configurable)
- Provide "logout all devices" option

**Implementation Priority**: 🟡 **MEDIUM - Nice to have**

---

### 🟢 LOW SEVERITY / BEST PRACTICES

#### 15. **Missing Environment Variable Validation**

**Fix**:
```typescript
// At server startup, validate required env vars
const requiredEnvVars = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "AFRICASTALKING_USERNAME",
  "AFRICASTALKING_API_KEY",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

**Implementation Priority**: 🟢 **LOW - Good Practice**

---

#### 16. **No Request ID Tracing**

**Issue**: Hard to trace requests through logs

**Fix**:
```typescript
import { v4 as uuidv4 } from "uuid";

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader("X-Request-ID", req.id);
  next();
});
```

**Implementation Priority**: 🟢 **LOW - Good Practice**

---

## Implementation Roadmap

### Phase 1: Critical (Must do ASAP)
- [ ] Rotate Africa's Talking API key
- [ ] Implement rate limiting on auth endpoints
- [ ] Add token revocation/logout
- [ ] Implement Helmet.js security headers
- [ ] Add input validation to all protected routes

### Phase 2: Important (Before Production)
- [ ] Migrate from SQLite to PostgreSQL/MongoDB
- [ ] Implement secure cookie-based authentication
- [ ] Add refresh token mechanism
- [ ] Improve CORS configuration
- [ ] Enforce HTTPS in production

### Phase 3: Production Ready
- [ ] Add audit logging
- [ ] Implement password reset flow
- [ ] Add session management
- [ ] Setup monitoring/alerting
- [ ] Penetration testing

### Phase 4: Nice to Have
- [ ] Request ID tracing
- [ ] Device tracking
- [ ] Rate limiting per user
- [ ] IP whitelisting for admin endpoints
- [ ] 2FA implementation

---

## Security Checklist for Go-Live

- [ ] .env file excluded from git (.gitignore)
- [ ] JWT_SECRET is strong (random 32+ chars)
- [ ] API keys rotated and in secure vault
- [ ] Rate limiting enabled on auth endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers (Helmet) implemented
- [ ] Input validation on all endpoints
- [ ] Token revocation implemented
- [ ] Database is production-grade (PostgreSQL/MongoDB)
- [ ] Error messages don't leak sensitive info
- [ ] Logging enabled for audit trail
- [ ] CORS properly configured for production
- [ ] Password reset flow implemented
- [ ] Backup/disaster recovery plan
- [ ] Security update plan for dependencies

---

## Positive Security Practices Found ✅

1. **Good Password Requirements**
   - 10+ chars, uppercase, lowercase, number, special char
   - Properly validated with Zod

2. **Input Sanitization**
   - HTML escaping implemented
   - Email normalization
   - Trim and validation utilities

3. **Prepared Statements**
   - Using parameterized queries (prevents SQL injection)
   - Good database security practice

4. **Bcrypt Password Hashing**
   - Using 10 salt rounds (industry standard)
   - Never storing plain text passwords

5. **Token-Based Auth**
   - JWT implementation
   - Stateless authentication

---

## Quick Start: Fix Order

```bash
# 1. Install dependencies
npm install helmet express-rate-limit cookie-parser

# 2. Create middleware files (provided in next section)
# 3. Update server.ts with security headers
# 4. Add rate limiting to auth routes
# 5. Implement token revocation
# 6. Add input validation to all routes
# 7. Test thoroughly before deployment
```

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Next Step**: Review the [SECURITY_FIX_IMPLEMENTATION.md](SECURITY_FIX_IMPLEMENTATION.md) file for code examples and step-by-step fixes.
