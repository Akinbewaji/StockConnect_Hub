# StockConnect_Hub

A comprehensive inventory management, point-of-sale (POS), and two-way business communication system built with React, Express, and SQLite.

## ✨ New & Advanced Features

### 💬 Two-Way Business Messaging
- **Customer Chat**: Customers can message businesses directly from the User site.
- **Admin Inbox**: Dedicated "Messages" tab for business owners to view and reply to customer inquiries.
- **Real-time Notifications**: Instant message delivery powered by Socket.io.

### 🔐 Enhanced Authentication (Premium Flow)
- **Mandatory Email**: All customer accounts now require a verified email address.
- **Dual-Channel OTP**: Users can choose to receive verification codes via **SMS** (Africa's Talking) or **Email**.
- **Resend OTP**: Built-in countdown timer and retry logic for verification codes.
- **Extended Profiles**: Capture customer delivery addresses (Street, City, State) during registration.

### 🌍 Global Product Visibility
- **Cross-Business Browsing**: Customers can browse products from all registered businesses on a single platform.
- **Intelligent Routing**: Automatic filtering of inventory based on the selected business or global search.

## 🏪 Core Functionality

- **Inventory Management**: Bulk import (CSV/JSON), low stock alerts, and supplier tracking.
- **Point of Sale (POS)**: Fast checkout, real-time stock deduction, and receipt generation.
- **Loyalty Program**: Reward repeat customers with automated point tracking.
- **Marketing Campaigns**: Bulk SMS and WhatsApp integration for customer outreach.
- **AI Assistant**: Built-in Gemini-powered chatbot for business insights.

## Tech Stack

### Frontend

- **React 19** - UI framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Vite** - Build tool

### Backend

- **Express.js** - Web framework
- **better-sqlite3** - SQLite database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Africa's Talking** - SMS integration
- **Google Gemini** - AI features

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation

1. Clone the repository:

```
bash
git clone <repository-url>
cd StockConnect
```

2. Install dependencies:

```
bash
npm install
```

3. Create environment file:

```
bash
# Create .env.local file with the following variables:
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
```

4. Start the development server:

```
bash
npm run dev
```

5. Open your browser:

```
http://localhost:3000
```

### Default Admin Credentials

- **Email**: admin@stockconnect.com
- **Password**: admin123

## Project Structure

```
├── Backend/                 # Express API (SQLite, Gemini, Africa's Talking)
│   ├── src/
│   │   ├── services/       # Business logic (AI, SMS, Orders)
│   │   └── server.ts       # Backend entry point
├── Frontend/                # Business Admin Dashboard (React + Vite)
│   ├── src/
│   │   └── pages/admin/    # POS, Inventory, Insights (AI)
├── CustomerWeb/             # Customer-facing shopping site (React)
├── package.json             # Root workspace-like scripts
└── README.md                # This guide
```

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**
- **Gemini API Key** (for Business Insights)

### Installation & Setup

1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the **root** folder (and `Backend/.env`):
   ```env
   GEMINI_API_KEY=your_key_here
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_API_KEY=your_at_key
   PORT=5000
   ```

3. **Running the Platform**:
   Use the root scripts for convenience:
   ```bash
   npm run dev:backend   # Start API
   npm run dev:frontend  # Start Dashboard
   npm run dev:customer  # Start Shop
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-import` - Bulk import products

### Customers

- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders

- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order

### Campaigns

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/send` - Send campaign SMS

### Analytics

- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products` - Product performance

### Settings

- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Bulk Import Feature

StockConnect supports bulk importing products via CSV or JSON files. See [IMPORT_INVENTORY_GUIDE.md](IMPORT_INVENTORY_GUIDE.md) for detailed instructions.

### Sample Import Files

- `sample_inventory_import.csv` - CSV format example
- `sample_inventory_import.json` - JSON format example

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking

## License

MIT License
