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

  // Customers
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      loyalty_points INTEGER DEFAULT 0,
      business_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES users(id)
    )
  `);

  // Orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
      payment_status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
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

  // Safely add new columns to existing tables
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

export default db;
