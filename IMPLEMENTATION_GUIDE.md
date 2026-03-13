# StockConnect - Implementation Guide

## 🎯 Features Implemented

This guide documents all the features that have been implemented in StockConnect, including the recent additions for SMS and WhatsApp campaigns.

---

## ✅ Completed Features

### 1. **Environment Configuration** ✨ NEW

**Files Modified:**

- [`server.ts`](server.ts:1) - Added `dotenv` configuration
- [`.env`](.env:1) - Created with all required variables
- [`.env.example`](.env.example:1) - Updated with proper format

**What was added:**

- Environment variable loading using `dotenv`
- Configuration for JWT_SECRET, GEMINI_API_KEY, AFRICASTALKING credentials
- PORT and NODE_ENV configuration

**Usage:**

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your actual credentials
GEMINI_API_KEY=your_actual_key
JWT_SECRET=your_secure_secret
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
```

---

### 2. **Authentication - `/api/auth/me` Endpoint** ✨ NEW

**Files Modified:**

- [`src/routes/auth.ts`](src/routes/auth.ts:1)

**Endpoint Details:**

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": 1,
  "name": "John Doe",
  "businessName": "My Store",
  "phone": "+234XXXXXXXXX",
  "role": "owner",
  "createdAt": "2026-02-25T10:00:00.000Z"
}
```

**Usage in Frontend:**

```typescript
const response = await fetch("/api/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const user = await response.json();
```

---

### 3. **Africa's Talking SMS Integration** ✨ NEW

**Files Created:**

- [`src/services/africastalking.ts`](src/services/africastalking.ts:1) - Complete SMS/WhatsApp service

**Features:**

- ✅ Send SMS to multiple recipients
- ✅ Phone number validation
- ✅ Phone number formatting (international format)
- ✅ Error handling and logging
- ✅ Support for custom sender ID

**API Functions:**

```typescript
// Send SMS
await sendSMS({
  to: ["+234XXXXXXXXX", "+254XXXXXXXXX"],
  message: "Your message here",
  from: "YourBrand", // Optional
});

// Format phone number
const formatted = formatPhoneNumber("0801234567", "+234");
// Returns: +2348012345678

// Validate phone number
const isValid = validatePhoneNumber("+2348012345678");
// Returns: true
```

---

### 4. **WhatsApp Integration** ✨ NEW

**Files Modified:**

- [`src/services/africastalking.ts`](src/services/africastalking.ts:1)

**Features:**

- ✅ WhatsApp message sending structure
- ✅ Multiple recipient support
- ⚠️ Requires Africa's Talking WhatsApp Business API setup

**Note:** WhatsApp integration is implemented but requires additional setup with Africa's Talking WhatsApp Business API. The current implementation provides the structure and will queue messages for sending.

**API Function:**

```typescript
await sendWhatsApp({
  to: ["+234XXXXXXXXX"],
  message: "Your WhatsApp message",
});
```

---

### 5. **Campaign Sending Endpoint** ✨ NEW

**Files Modified:**

- [`src/routes/campaigns.ts`](src/routes/campaigns.ts:1)

**New Endpoints:**

#### Send Campaign

```http
POST /api/campaigns/:id/send
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "customerIds": [1, 2, 3], // Optional: specific customers
  "segment": "loyal" // Optional: 'loyal', 'new', 'all'
}
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign sent to 25 customers",
  "details": {
    "SMSMessageData": {
      "Recipients": [...]
    }
  }
}
```

#### Get Campaign Statistics

```http
GET /api/campaigns/:id/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "campaign": {
    "id": 1,
    "name": "Summer Sale",
    "message": "Get 20% off!",
    "channel": "SMS",
    "status": "sent"
  },
  "totalCustomers": 150,
  "status": "sent"
}
```

---

### 6. **Customer Segmentation** ✨ NEW

**Files Modified:**

- [`src/routes/campaigns.ts`](src/routes/campaigns.ts:1)

**Segments Available:**

- **`all`** - All customers in the database
- **`loyal`** - Customers with > 100 loyalty points
- **`new`** - Customers created in the last 30 days
- **Custom** - Specific customer IDs

**Usage:**

```typescript
// Send to loyal customers
await fetch("/api/campaigns/1/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    segment: "loyal",
  }),
});

// Send to specific customers
await fetch("/api/campaigns/1/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    customerIds: [1, 5, 10, 15],
  }),
});
```

---

## 📋 Existing Features (Already Implemented)

### Point of Sale (POS)

- ✅ Quick product selection
- ✅ Real-time inventory deduction
- ✅ Order creation with items
- ✅ Automatic loyalty points calculation

### Inventory Management

- ✅ Product CRUD operations
- ✅ Bulk import (CSV/JSON)
- ✅ Stock movement tracking
- ✅ Low stock alerts

### Customer Management

- ✅ Customer database
- ✅ Purchase history
- ✅ Loyalty points tracking
- ✅ Customer search

### Campaign Management

- ✅ Create campaigns
- ✅ List campaigns
- ✅ SMS channel support
- ✅ WhatsApp channel support
- ✨ **NEW:** Send campaigns
- ✨ **NEW:** Customer segmentation

### Authentication & Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access
- ✨ **NEW:** `/api/auth/me` endpoint

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## 🔧 Configuration

### Africa's Talking Setup

1. **Sign up** at [africastalking.com](https://africastalking.com/)
2. **Get API Key** from your dashboard
3. **For Testing:** Use `sandbox` as username
4. **For Production:** Use your actual username

### Environment Variables

| Variable                  | Description                             | Required |
| ------------------------- | --------------------------------------- | -------- |
| `GEMINI_API_KEY`          | Google Gemini AI API key                | Yes      |
| `JWT_SECRET`              | Secret key for JWT tokens               | Yes      |
| `AFRICASTALKING_USERNAME` | AT username (use 'sandbox' for testing) | Yes      |
| `AFRICASTALKING_API_KEY`  | AT API key                              | Yes      |
| `PORT`                    | Server port (default: 3000)             | No       |
| `NODE_ENV`                | Environment (development/production)    | No       |

---

## 📱 SMS/WhatsApp Best Practices

### Phone Number Format

- Always use international format: `+234XXXXXXXXX`
- The system auto-formats Nigerian numbers (0801234567 → +2348012345678)
- Validate numbers before sending

### Message Guidelines

- **SMS:** Max 160 characters per message
- **WhatsApp:** Max 4096 characters
- Include opt-out instructions for marketing messages
- Personalize messages when possible

### Testing

1. Use Africa's Talking sandbox for testing
2. Sandbox only sends to registered test numbers
3. Test with small customer segments first
4. Monitor delivery reports in AT dashboard

---

## 🐛 Troubleshooting

### SMS Not Sending

1. Check `.env` file has correct credentials
2. Verify phone numbers are in international format
3. Check Africa's Talking dashboard for errors
4. Ensure you have sufficient credits

### WhatsApp Not Working

- WhatsApp requires additional setup with Africa's Talking
- Contact AT support to enable WhatsApp Business API
- Current implementation provides the structure

### Environment Variables Not Loading

- Ensure `.env` file exists in project root
- Restart the server after changing `.env`
- Check for syntax errors in `.env` file

---

## 📊 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user ✨ NEW

### Campaigns

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/send` - Send campaign ✨ NEW
- `GET /api/campaigns/:id/stats` - Campaign statistics ✨ NEW

### Products

- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-import` - Bulk import

### Customers

- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Customer details

### Orders

- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

### Analytics

- `GET /api/analytics/dashboard` - Dashboard stats

### Settings

- `GET /api/settings` - Get settings
- `PATCH /api/settings` - Update settings

---

### 7. **Business AI Advisor (Gemini 1.5)** ✨ ENHANCED

**Files Modified:**

- [`Backend/src/services/ai.service.ts`](Backend/src/services/ai.service.ts) - Enhanced prompts and data integration.
- [`Frontend/src/pages/admin/Insights.tsx`](Frontend/src/pages/admin/Insights.tsx) - Added Copy and PDF Export.

**Features:**

- ✅ Context-aware business consulting using Gemini 1.5.
- ✅ Bulk data analysis (sales, stock, orders).
- ✅ Real-time insight generation.
- ✅ **New:** Export insight reports to PDF using `jspdf`.
- ✅ **New:** Copy insights to clipboard for quick sharing.

---

### 8. **Root CLI Utilities** ✨ NEW

**Files Modified:**

- [`package.json`](package.json) - Added workspace scripts.

**Convenience Scripts:**

- `npm run dev:backend` - Start Express API.
- `npm run dev:frontend` - Start Admin Dashboard.
- `npm run dev:customer` - Start Shop interface.

---

## 🎉 What's Next?

### Potential Enhancements

- [ ] Email campaign support
- [ ] Advanced customer segmentation (by purchase amount, frequency)
- [ ] Campaign scheduling
- [ ] A/B testing for campaigns
- [ ] Delivery reports and analytics
- [ ] Template management for messages
- [ ] Multi-language support

---

## 📝 Notes

- All endpoints (except auth) require JWT authentication
- Phone numbers are automatically formatted to international format
- Campaign status updates to 'sent' after successful sending
- Loyalty points are calculated automatically on orders
- Stock is deducted automatically on order creation

---

## 🤝 Support

For issues or questions:

1. Check this implementation guide
2. Review the code comments in source files
3. Check Africa's Talking documentation
4. Review server logs for error messages

---

**Last Updated:** 2026-03-11
**Version:** 1.1.0
