# Security Fixes Checklist

## Quick Reference for Implementing Security Fixes

### 🔴 CRITICAL (Do First)

#### 1. API Key & Secrets
- [ ] Rotate Africa's Talking API key immediately
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Never commit .env to git
- [ ] Add to .gitignore:
  ```
  .env
  .env.local
  .env.*.local
  ```

#### 2. Rate Limiting
- [ ] `npm install express-rate-limit`
- [ ] Create `src/middleware/rateLimit.ts`
- [ ] Apply authLimiter to `/api/auth/login` and `/api/auth/register`
- [ ] Apply apiLimiter to `/api/*`

#### 3. Token Revocation
- [ ] Create `src/middleware/tokenBlacklist.ts`
- [ ] Update `src/middleware/auth.ts` to check blacklist
- [ ] Add `POST /api/auth/logout` endpoint
- [ ] Add `POST /api/auth/logout-all` endpoint (optional)

#### 4. Security Headers
- [ ] `npm install helmet`
- [ ] Add helmet middleware to server.ts
- [ ] Configure CSP headers
- [ ] Add HSTS for production

#### 5. Input Validation
- [ ] Create validation schemas for all routes that accept input
- [ ] Update all routes to use `validateRequest` middleware
- [ ] Validate:
  - Product routes (create, update, search)
  - Customer routes
  - Order routes
  - Campaign routes
  - Settings routes

---

### 🟠 HIGH PRIORITY (Before Production)

#### 6. Secure Cookies
- [ ] `npm install cookie-parser`
- [ ] Update `/api/auth/login` to set httpOnly cookies
- [ ] Create `/api/auth/refresh` endpoint with refresh token
- [ ] Update auth middleware to read from cookies
- [ ] Update Frontend AuthContext to use cookies
- [ ] Remove token from localStorage

#### 7. Database Migration Plan
- [ ] Choose database: PostgreSQL or MongoDB
- [ ] Create migration scripts from SQLite
- [ ] Test data migration
- [ ] Setup connection pooling
- [ ] Plan rollback strategy

#### 8. CORS Configuration
- [ ] Review allowed origins
- [ ] Ensure production origins are whitelisted
- [ ] Disable requests with no origin in production
- [ ] Add environment-specific CORS rules

#### 9. HTTPS Enforcement
- [ ] Add HTTP to HTTPS redirect middleware
- [ ] Configure secure cookie flag
- [ ] Setup SSL/TLS certificates
- [ ] Test HTTPS endpoints

---

### 🟡 MEDIUM PRIORITY (Before General Availability)

#### 10. Audit Logging
- [ ] `npm install winston` (or similar)
- [ ] Create structured logging middleware
- [ ] Log all authentication events
- [ ] Log failed login attempts
- [ ] Log data modifications
- [ ] Setup log storage/rotation

#### 11. Password Reset
- [ ] Create password reset endpoint
- [ ] Implement email verification
- [ ] Set token expiration (15 minutes)
- [ ] Rate limit password reset requests
- [ ] Send reset link via email

#### 12. Environment Variable Validation
- [ ] Create `src/utils/env.ts`
- [ ] Call `validateEnv()` at startup
- [ ] Fail if required variables missing
- [ ] Log environment status

#### 13. Error Handling
- [ ] Review error messages (don't leak info)
- [ ] Implement global error handler
- [ ] Log all server errors
- [ ] Return generic errors to client

#### 14. Input Size Limits
- [ ] Set JSON limit to 1MB
- [ ] Set URL-encoded limit to 1MB
- [ ] Higher limits for bulk import endpoints
- [ ] Rate limit large requests

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 15. Request ID Tracing
- [ ] `npm install uuid`
- [ ] Add request ID middleware
- [ ] Include in logs
- [ ] Return in response headers

#### 16. Monitoring & Alerting
- [ ] Setup error tracking (Sentry)
- [ ] Setup performance monitoring
- [ ] Setup uptime monitoring
- [ ] Setup security event alerts

#### 17. API Documentation
- [ ] Document all endpoints
- [ ] Include authentication requirements
- [ ] Document rate limits
- [ ] Document error codes

#### 18. Testing
- [ ] Unit tests for auth logic
- [ ] Integration tests for API endpoints
- [ ] Security tests (SQL injection, XSS, etc.)
- [ ] Load testing
- [ ] Penetration testing

---

## File-by-File Changes Summary

### Backend Files to Create
```
Backend/src/middleware/rateLimit.ts          [NEW]
Backend/src/middleware/tokenBlacklist.ts     [NEW]
Backend/src/schemas/products.ts              [NEW]
Backend/src/schemas/customers.ts             [NEW]
Backend/src/schemas/orders.ts                [NEW]
Backend/src/schemas/campaigns.ts             [NEW]
Backend/src/utils/env.ts                     [NEW]
Backend/SECURITY_AUDIT.md                    [NEW]
Backend/SECURITY_FIX_IMPLEMENTATION.md       [NEW]
```

### Backend Files to Modify
```
Backend/src/server.ts                        [MODIFY]
Backend/src/middleware/auth.ts               [MODIFY]
Backend/src/middleware/validate.ts           [NO CHANGE]
Backend/src/routes/auth.ts                   [MODIFY]
Backend/src/routes/products.ts               [MODIFY]
Backend/src/routes/customers.ts              [MODIFY]
Backend/src/routes/orders.ts                 [MODIFY]
Backend/src/routes/campaigns.ts              [MODIFY]
Backend/src/routes/settings.ts               [MODIFY]
Backend/package.json                         [MODIFY - add deps]
Backend/.env                                 [PROTECT - never commit]
Backend/.env.example                         [REVIEW]
```

### Frontend Files to Modify
```
Frontend/src/context/AuthContext.tsx         [MODIFY]
Frontend/src/utils/api.ts                    [MODIFY - if using Bearer tokens]
Frontend/src/pages/auth/Login.tsx            [MODIFY - remove token handling]
Frontend/src/pages/auth/Register.tsx         [MODIFY - remove token handling]
```

---

## Dependencies to Add

```bash
# Security
npm install helmet
npm install express-rate-limit
npm install cookie-parser

# Type definitions
npm install --save-dev @types/express-rate-limit
npm install --save-dev @types/cookie-parser

# Optional but recommended
npm install redis          # For production token blacklist
npm install uuid          # For request tracking
npm install winston       # For structured logging
npm install validator     # For additional validation
```

---

## Environment Variables Setup

### Required Variables
```env
NODE_ENV=development

# JWT
JWT_SECRET=generate-a-random-32-char-string-here
JWT_REFRESH_SECRET=generate-another-random-32-char-string

# API Keys (rotate immediately)
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-new-api-key

# Server
PORT=5000
DB_PATH=./stockconnect.db

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis (production only)
# REDIS_URL=redis://localhost:6379
```

### How to Generate Strong Secrets
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using pwgen
pwgen -sy 32
```

---

## Testing Checklist

### Before Production
- [ ] All endpoints return proper status codes
- [ ] Rate limiting blocks after threshold
- [ ] Logout invalidates token
- [ ] Token refresh works
- [ ] Security headers present (curl -I)
- [ ] HTTPS redirects work
- [ ] Cookies have httpOnly flag
- [ ] Invalid input is rejected
- [ ] SQL injection attempts fail
- [ ] XSS attempts fail
- [ ] CSRF tokens validated

### Load Testing
- [ ] 100+ concurrent users
- [ ] 1000+ requests/second
- [ ] Database handles load
- [ ] No memory leaks
- [ ] Response times acceptable

---

## Go-Live Checklist

### 3 Days Before
- [ ] Code review complete
- [ ] Security testing done
- [ ] Load testing passed
- [ ] Backups configured
- [ ] Rollback plan documented

### 1 Day Before
- [ ] All secrets rotated
- [ ] SSL certificate ready
- [ ] DNS configured
- [ ] CDN configured (if applicable)
- [ ] Monitoring setup

### Day Of
- [ ] Team on standby
- [ ] Communication channels open
- [ ] Deployment window set
- [ ] Final security scan
- [ ] Go/no-go decision

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Monitor security logs
- [ ] User feedback channel active
- [ ] Rollback plan ready

---

## Links to Documentation

- **OWASP Top 10**: https://owasp.org/Top10/
- **Express Best Practices**: https://expressjs.com/en/advanced/best-practice-security.html
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## Getting Help

If you get stuck implementing any fixes:

1. **Check the detailed guide**: `SECURITY_FIX_IMPLEMENTATION.md`
2. **Check the audit report**: `SECURITY_AUDIT.md`
3. **Review the specific section** in the implementation guide
4. **Test changes incrementally** before moving to next fix
5. **Keep git history** to revert if needed

---

## Progress Tracking

Mark off items as you complete them:

### Phase 1: Critical (Week 1)
- [ ] Rate limiting implemented
- [ ] Token revocation implemented
- [ ] Security headers added
- [ ] Input validation added
- [ ] API keys rotated

### Phase 2: Important (Week 2)
- [ ] Secure cookies implemented
- [ ] Database migration planned
- [ ] CORS refined
- [ ] HTTPS enforced

### Phase 3: Polish (Week 3)
- [ ] Audit logging added
- [ ] Password reset implemented
- [ ] Error handling reviewed
- [ ] Testing complete

### Phase 4: Launch (Week 4)
- [ ] Final security review
- [ ] Load testing passed
- [ ] All team trained
- [ ] Go-live executed

---

## Questions?

Review the two detailed documents:
1. `SECURITY_AUDIT.md` - Explains all vulnerabilities
2. `SECURITY_FIX_IMPLEMENTATION.md` - Shows how to fix them
