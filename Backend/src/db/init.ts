import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve("stockconnect.db");
const db = new Database(dbPath);

export function initializeDatabase() {
  // Users (Business Owners)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      business_name TEXT NOT NULL,
      role TEXT DEFAULT 'owner',
      onboarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      reorder_threshold INTEGER DEFAULT 5,
      cost_price REAL DEFAULT 0,
      supplier TEXT,
      supplier_phone TEXT,
      barcode TEXT UNIQUE,
      image_url TEXT,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Customers (Extended for Self-Service)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      user_id INTEGER, -- Linking to users table for login
      loyalty_points INTEGER DEFAULT 0,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Addresses
  db.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      label TEXT, -- e.g., Home, Office
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  // Carts
  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Cart Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Orders (Extended for Customer Info)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
      payment_status TEXT DEFAULT 'unpaid',
      payment_method TEXT DEFAULT 'cash', -- cash, card, transfer
      delivery_method TEXT DEFAULT 'pickup', -- pickup, delivery
      delivery_address_id INTEGER,
      tracking_info TEXT, -- JSON string for history/updates
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (delivery_address_id) REFERENCES addresses(id)
    )
  `);

  // Order Items
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      unit_cost REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Campaigns
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL, -- SMS, WHATSAPP
      status TEXT DEFAULT 'draft', -- draft, sent
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Stock Movements
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      change_amount INTEGER NOT NULL,
      reason TEXT, -- adjustment, sale, restock
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER,
      currency TEXT DEFAULT '₦',
      loyalty_points_per_unit INTEGER DEFAULT 1,
      currency_unit_for_points REAL DEFAULT 100,
      point_redemption_value REAL DEFAULT 10, -- 1 point = 10 currency units
      low_stock_notifications INTEGER DEFAULT 1, -- 1 for true, 0 for false
      phone TEXT,
      address TEXT,
      tax_rate REAL DEFAULT 0,
      receipt_footer TEXT,
      default_sender_id TEXT,
      auto_receipt_sms INTEGER DEFAULT 0,
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Chats
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      business_id INTEGER NOT NULL,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL, -- user_id of either customer or business owner
      sender_type TEXT NOT NULL, -- 'customer' or 'business'
      text TEXT,
      image_url TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL, -- customer user_id or business user_id
      type TEXT NOT NULL, -- order, promo, chat
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT, -- JSON string
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // OTPs
  db.exec(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);



  // Safely add new columns to existing tables
  try {
    db.exec(`
      ALTER TABLE customers ADD COLUMN user_id INTEGER;
      ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash';
      ALTER TABLE orders ADD COLUMN delivery_method TEXT DEFAULT 'pickup';
      ALTER TABLE orders ADD COLUMN delivery_address_id INTEGER;
      ALTER TABLE orders ADD COLUMN tracking_info TEXT;
    `);
    console.log("Applied new customer/order schema columns.");
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Skipping alter table: ', e.message);
    }
  }

  try {
    db.exec(`
      ALTER TABLE settings ADD COLUMN phone TEXT;
      ALTER TABLE settings ADD COLUMN address TEXT;
      ALTER TABLE settings ADD COLUMN tax_rate REAL DEFAULT 0;
      ALTER TABLE settings ADD COLUMN receipt_footer TEXT;
      ALTER TABLE settings ADD COLUMN default_sender_id TEXT;
      ALTER TABLE settings ADD COLUMN auto_receipt_sms INTEGER DEFAULT 0;
    `);
    console.log("Applied new schema columns to settings.");
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Skipping alter table (settings): ', e.message);
    }
  }

  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN onboarded INTEGER DEFAULT 0;
    `);
    console.log("Applied onboarded column to users.");
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Skipping alter table (users): ', e.message);
    }
  }

  try {
    db.exec(`
      ALTER TABLE products ADD COLUMN reorder_threshold INTEGER DEFAULT 5;
      ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0;
      ALTER TABLE products ADD COLUMN supplier TEXT;
      ALTER TABLE products ADD COLUMN supplier_phone TEXT;
      ALTER TABLE products ADD COLUMN barcode TEXT;
    `);
    console.log("Applied new schema columns to products.");
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Skipping alter table (products): ', e.message);
    }
  }

  try {
    db.exec(`
      ALTER TABLE order_items ADD COLUMN unit_cost REAL DEFAULT 0;
    `);
    console.log("Applied unit_cost column to order_items.");
  } catch (e: any) {
    if (!e.message.includes('duplicate column name')) {
      console.log('Skipping alter table (order_items): ', e.message);
    }
  }

  console.log("Database initialized successfully");
}

/**
 * Seed a demo customer account for testing purposes.
 * Credentials: demo@stockconnect.com / demo1234
 * Safe to call on every startup – skips if already exists.
 */
export async function seedDemoData() {
  // Use dynamic import for bcryptjs to avoid top-level await issues
  const bcrypt = await import("bcryptjs");

  const DEMO_EMAIL = "demo@stockconnect.com";
  const DEMO_PHONE = "+2340000000001";
  const DEMO_PASSWORD = "demo1234";
  const DEMO_NAME = "Demo Customer";

  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_EMAIL);
    if (existing) {
      console.log("ℹ️  Demo account already exists — skipping seed.");
      return;
    }

    const hashedPassword = await bcrypt.default.hash(DEMO_PASSWORD, 10);

    const userResult = db.prepare(`
      INSERT INTO users (username, email, phone, password, name, business_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(DEMO_EMAIL, DEMO_EMAIL, DEMO_PHONE, hashedPassword, DEMO_NAME, "Customer", "customer");

    const userId = userResult.lastInsertRowid;

    db.prepare(`
      INSERT INTO customers (name, phone, email, user_id)
      VALUES (?, ?, ?, ?)
    `).run(DEMO_NAME, DEMO_PHONE, DEMO_EMAIL, userId);

    console.log("✅ Demo account created:");
    console.log("   Email   : demo@stockconnect.com");
    console.log("   Password: demo1234");
  } catch (err: any) {
    console.error("⚠️  Demo seed failed:", err.message);
  }
}

export default db;
