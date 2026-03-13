import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Initialize PostgreSQL Pool
const connectionString = process.env.DATABASE_URL;

// Strip `sslmode` and `channel_binding` from the connection string to avoid conflicts with the `ssl` object
const cleanedConnectionString = connectionString?.replace(/(\?|&)(sslmode|channel_binding)=[^&]*/g, (match, p1) => p1 === '?' ? '?' : '');
// Fix potential trailing '?' or '&'
const finalConnectionString = cleanedConnectionString?.replace(/[?&]$/, '');

const pool = new Pool({
  connectionString: finalConnectionString,
  ssl: (process.env.NODE_ENV === 'production' || connectionString?.includes('neon'))
    ? { rejectUnauthorized: false }
    : false
});

/**
 * SQLite compatibility wrapper.
 * Because all controllers are heavily tightly-coupled to better-sqlite3
 * syntax (`db.prepare("..").get()`), this helper translates SQLite '?' parameters
 * to PostgreSQL '$1, $2' parameters and executes them!
 */
export const db = {
  prepare: (sql: string) => {
    // Convert all `?` markers into `$1`, `$2`, `$3` automatically
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    return {
      get: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return result.rows[0];
      },
      all: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return result.rows;
      },
      run: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return {
          lastInsertRowid: result.rows.length ? result.rows[0].id : null,
          changes: result.rowCount
        };
      }
    };
  },
  exec: async (sql: string) => {
    return await pool.query(sql);
  }
};

export async function initializeDatabase() {
  console.log("Connecting to PostgreSQL...");
  
  try {
    // Users (Business Owners)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'owner',
        plan VARCHAR(50) DEFAULT 'free',
        sms_credits INTEGER DEFAULT 0,
        onboarded INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Ensure 'plan' and 'sms_credits' columns exist for older databases
    await db.exec(`DO $$ BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan') THEN
        ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sms_credits') THEN
        ALTER TABLE users ADD COLUMN sms_credits INTEGER DEFAULT 0;
      END IF;
    END $$;`);

    // Products
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_threshold INTEGER DEFAULT 5,
        cost_price NUMERIC DEFAULT 0,
        supplier VARCHAR(255),
        supplier_phone VARCHAR(255),
        barcode VARCHAR(255) UNIQUE,
        image_url TEXT,
        business_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Customers (Extended for Self-Service)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        user_id INTEGER,
        loyalty_points INTEGER DEFAULT 0,
        loyalty_points_claimed INTEGER DEFAULT 0,
        business_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Addresses
    await db.exec(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        label VARCHAR(255),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(255),
        state VARCHAR(255),
        postal_code VARCHAR(255),
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // Carts
    await db.exec(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        business_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Cart Items
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Orders (Extended for Customer Info)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        total_amount NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        payment_method VARCHAR(50) DEFAULT 'cash',
        delivery_method VARCHAR(50) DEFAULT 'pickup',
        delivery_address_id INTEGER,
        tracking_info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) ON DELETE SET NULL
      )
    `);

    // Order Items
    await db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        unit_cost NUMERIC DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // Order Feedback
    await db.exec(`
      CREATE TABLE IF NOT EXISTS order_feedback (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // Quotes (Custom Order Negotiations)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        business_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        requested_quantity INTEGER NOT NULL,
        price NUMERIC,
        customer_message TEXT,
        seller_response TEXT,
        attachment_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Campaigns
    await db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        channel VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        business_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Stock Movements
    await db.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER,
        change_amount INTEGER NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Settings
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        business_id INTEGER,
        currency VARCHAR(10) DEFAULT '₦',
        loyalty_points_per_unit INTEGER DEFAULT 1,
        currency_unit_for_points NUMERIC DEFAULT 100,
        point_redemption_value NUMERIC DEFAULT 10,
        low_stock_notifications INTEGER DEFAULT 1,
        phone VARCHAR(255),
        address TEXT,
        tax_rate NUMERIC DEFAULT 0,
        receipt_footer TEXT,
        default_sender_id VARCHAR(255),
        auto_receipt_sms INTEGER DEFAULT 0,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Chats
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        business_id INTEGER NOT NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages
    await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_type VARCHAR(50) NOT NULL,
        text TEXT,
        image_url TEXT,
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);

    // Notifications
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data TEXT,
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Subscriptions
    await db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        plan VARCHAR(50) NOT NULL,
        amount NUMERIC NOT NULL,
        reference VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // OTPs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Expenses
    await db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL,
        amount NUMERIC NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("PostgreSQL Database initialized successfully!");
  } catch (err: any) {
    console.error("Failed to initialize database schemas: ", err);
  }
}

/**
 * Seed a demo customer account for testing purposes safely.
 */
export async function seedDemoData() {
  const bcrypt = await import("bcryptjs");

  const DEMO_EMAIL = "demo@stockconnect.com";
  const DEMO_PHONE = "+2340000000001";
  const DEMO_PASSWORD = "demo1234";
  const DEMO_NAME = "Demo Customer";

  try {
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL);
    if (existing) {
      console.log("ℹ️  Demo account already exists — skipping seed.");
      return;
    }

    const hashedPassword = await bcrypt.default.hash(DEMO_PASSWORD, 10);

    // Using returning id to mimic lastInsertRowid
    const userResult = await pool.query(`
      INSERT INTO users (username, email, phone, password, name, business_name, role, plan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [DEMO_EMAIL, DEMO_EMAIL, DEMO_PHONE, hashedPassword, DEMO_NAME, "Customer", "customer", "pro"]);

    const userId = userResult.rows[0].id;

    await pool.query(`
      INSERT INTO customers (name, phone, email, user_id)
      VALUES ($1, $2, $3, $4)
    `, [DEMO_NAME, DEMO_PHONE, DEMO_EMAIL, userId]);

    console.log("✅ Demo account created:");
    console.log("   Email   : demo@stockconnect.com");
    console.log("   Password: demo1234");
  } catch (err: any) {
    console.error("⚠️  Demo seed failed:", err);
  }
}

export default db;
