# StockConnect Backend API

Express.js backend API server for StockConnect inventory management system.

## Features

- RESTful API endpoints
- JWT authentication
- SQLite database
- Africa's Talking SMS/WhatsApp integration
- CORS enabled for frontend communication

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your values:
   - `PORT`: Server port (default: 5000)
   - `JWT_SECRET`: Secret key for JWT tokens
   - `AFRICASTALKING_API_KEY`: Your Africa's Talking API key
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs

3. **Seed the database** (optional, for demo data):
   ```bash
   npm run seed
   ```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Production

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Products

- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/import` - Bulk import products

### Customers

- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Campaigns

- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/send` - Send campaign

### Analytics

- `GET /api/analytics/dashboard` - Get dashboard analytics

### Settings

- `GET /api/settings` - Get business settings
- `PUT /api/settings` - Update settings

## Project Structure

```
Backend/
├── src/
│   ├── db/
│   │   ├── init.ts          # Database initialization
│   │   └── seed.ts          # Database seeding
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication middleware
│   ├── routes/
│   │   ├── analytics.ts     # Analytics endpoints
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── campaigns.ts     # Campaign endpoints
│   │   ├── customers.ts     # Customer endpoints
│   │   ├── orders.ts        # Order endpoints
│   │   ├── products.ts      # Product endpoints
│   │   └── settings.ts      # Settings endpoints
│   ├── services/
│   │   └── africastalking.ts # SMS/WhatsApp service
│   └── server.ts            # Main server file
├── stockconnect.db          # SQLite database
├── package.json
├── tsconfig.json
└── .env
```

## Environment Variables

| Variable                  | Description                          | Default               |
| ------------------------- | ------------------------------------ | --------------------- |
| `PORT`                    | Server port                          | 5000                  |
| `NODE_ENV`                | Environment (development/production) | development           |
| `DB_PATH`                 | Database file path                   | ./stockconnect.db     |
| `JWT_SECRET`              | JWT secret key                       | (required)            |
| `AFRICASTALKING_USERNAME` | Africa's Talking username            | sandbox               |
| `AFRICASTALKING_API_KEY`  | Africa's Talking API key             | (required)            |
| `ALLOWED_ORIGINS`         | CORS allowed origins                 | http://localhost:3000 |

## Database

The application uses SQLite for data storage. The database file (`stockconnect.db`) is created automatically on first run.

### Tables

- `users` - Business owners/users
- `products` - Product inventory
- `customers` - Customer information
- `orders` - Sales orders
- `order_items` - Order line items
- `campaigns` - Marketing campaigns
- `stock_movements` - Inventory movements
- `settings` - Business settings

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field:

```json
{
  "error": "Error message here"
}
```

## CORS

CORS is configured to allow requests from specified origins. Update `ALLOWED_ORIGINS` in `.env` to add your frontend URL.

## License

MIT
