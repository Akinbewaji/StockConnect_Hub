<div align="center">
  <img width="1200" height="475" alt="StockConnect Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StockConnect

A comprehensive inventory management and point-of-sale (POS) system built with React, Express, and SQLite. Designed for small to medium businesses to manage products, customers, orders, and campaigns efficiently.

## Features

### 🏪 Inventory Management

- **Product Management**: Add, edit, and delete products with categories, prices, and stock levels
- **Bulk Import**: Import products from CSV or JSON files with smart parsing
- **Stock Alerts**: Automatic reorder threshold alerts for low stock items
- **Supplier Tracking**: Track product suppliers and contact information

### 💰 Point of Sale (POS)

- **Quick Sales**: Fast product selection and checkout process
- **Real-time Inventory**: Automatic stock deduction on sale
- **Receipt Generation**: Clear transaction records

### 👥 Customer Management

- **Customer Database**: Store customer contact and purchase history
- **Loyalty Program**: Track customer loyalty points and rewards
- **Purchase History**: View customer transaction history

### 📊 Analytics & Reporting

- **Sales Analytics**: Track revenue, top products, and sales trends
- **Dashboard**: Visual overview of business performance with charts

### 📢 Marketing Campaigns

- **SMS Campaigns**: Integrate with Africa's Talking for bulk SMS
- **Campaign Management**: Create and track marketing campaigns
- **Customer Segmentation**: Target specific customer groups

### 🔐 Authentication & Security

- **JWT Authentication**: Secure API access
- **Role-based Access**: Admin and user roles
- **Password Hashing**: Secure credential storage with bcrypt

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
├── server.ts                 # Express server entry point
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component
│   ├── index.css            # Global styles
│   ├── components/          # Reusable UI components
│   │   └── ChatBot.tsx      # AI chatbot component
│   ├── context/             # React context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── db/                  # Database initialization
│   │   ├── init.ts          # Database setup
│   │   └── seed.ts          # Seed data
│   ├── layouts/             # Page layouts
│   │   ├── AdminLayout.tsx  # Admin dashboard layout
│   │   └── ShopLayout.tsx   # Shop layout
│   ├── middleware/          # Express middleware
│   │   └── auth.ts          # JWT authentication
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── POS.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Campaigns.tsx
│   │   │   ├── Loyalty.tsx
│   │   │   └── Settings.tsx
│   │   ├── auth/            # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   └── shop/            # Customer-facing pages
│   │       ├── Home.tsx
│   │       └── ProductDetail.tsx
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── orders.ts
│   │   ├── campaigns.ts
│   │   ├── analytics.ts
│   │   └── settings.ts
│   └── utils/               # Utility functions
│       └── api.ts           # API helper functions
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
# StockConnect_Hub
