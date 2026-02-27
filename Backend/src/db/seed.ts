import db, { initializeDatabase } from "./init.js";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Initializing database...");
  initializeDatabase();

  console.log("Seeding WareHub data...");

  // 1. Create WareHub User
  const phone = "08000000000";
  const email = "admin@warehub.com";
  const username = "warehub_admin";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user exists
  const userStmt = db.prepare("SELECT * FROM users WHERE phone = ?");
  let user = userStmt.get(phone) as any;

  if (!user) {
    const insertUser = db.prepare(
      "INSERT INTO users (phone, email, username, password, name, business_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const info = insertUser.run(
      phone,
      email,
      username,
      hashedPassword,
      "WareHub Admin",
      "WareHub",
      "owner",
    );
    user = { id: info.lastInsertRowid };
    console.log("Created WareHub user.");
  } else {
    console.log("WareHub user already exists.");
  }

  const businessId = user.id;

  // 2. Products
  const products = [
    {
      name: "Cement (50kg)",
      category: "Construction",
      price: 4500,
      quantity: 500,
      reorderThreshold: 50,
      supplier: "Dangote",
    },
    {
      name: "Granite (30 tons)",
      category: "Construction",
      price: 350000,
      quantity: 20,
      reorderThreshold: 5,
      supplier: "Quarry Direct",
    },
    {
      name: "Sharp Sand (20 tons)",
      category: "Construction",
      price: 120000,
      quantity: 30,
      reorderThreshold: 5,
      supplier: "Dredgers Co",
    },
    {
      name: "2.5mm Electrical Wire (Coil)",
      category: "Electrical",
      price: 18000,
      quantity: 200,
      reorderThreshold: 20,
      supplier: "Coleman",
    },
    {
      name: "1.5mm Electrical Wire (Coil)",
      category: "Electrical",
      price: 12000,
      quantity: 250,
      reorderThreshold: 20,
      supplier: "Coleman",
    },
    {
      name: "Circuit Breaker 60A",
      category: "Electrical",
      price: 5000,
      quantity: 100,
      reorderThreshold: 10,
      supplier: "Schneider",
    },
    {
      name: "PVC Pipe 4 inch",
      category: "Plumbing",
      price: 3500,
      quantity: 300,
      reorderThreshold: 30,
      supplier: "Plastica",
    },
    {
      name: "PVC Pipe 2 inch",
      category: "Plumbing",
      price: 1500,
      quantity: 400,
      reorderThreshold: 40,
      supplier: "Plastica",
    },
    {
      name: "Water Tank (2000L)",
      category: "Plumbing",
      price: 85000,
      quantity: 15,
      reorderThreshold: 3,
      supplier: "GeePee",
    },
    {
      name: "Hammer Drill",
      category: "Tools",
      price: 45000,
      quantity: 25,
      reorderThreshold: 5,
      supplier: "Bosch",
    },
    {
      name: "Angle Grinder",
      category: "Tools",
      price: 28000,
      quantity: 30,
      reorderThreshold: 5,
      supplier: "Makita",
    },
    {
      name: "Safety Helmet",
      category: "Safety",
      price: 4500,
      quantity: 100,
      reorderThreshold: 10,
      supplier: "SafeWork",
    },
    {
      name: "Reflective Jacket",
      category: "Safety",
      price: 2500,
      quantity: 150,
      reorderThreshold: 20,
      supplier: "SafeWork",
    },
    {
      name: "Steel Door (4ft)",
      category: "Fixtures",
      price: 120000,
      quantity: 10,
      reorderThreshold: 2,
      supplier: "Turkish Imports",
    },
    {
      name: "Ceramic Tiles (40x40)",
      category: "Finishing",
      price: 3500,
      quantity: 1000,
      reorderThreshold: 100,
      supplier: "Royal",
    },
    {
      name: "Emulsion Paint (20L)",
      category: "Paint",
      price: 25000,
      quantity: 80,
      reorderThreshold: 10,
      supplier: "Dulux",
    },
    {
      name: "Gloss Paint (4L)",
      category: "Paint",
      price: 12000,
      quantity: 120,
      reorderThreshold: 15,
      supplier: "Dulux",
    },
    {
      name: "Shovel",
      category: "Tools",
      price: 3000,
      quantity: 80,
      reorderThreshold: 10,
      supplier: "Local",
    },
    {
      name: "Head Pan",
      category: "Tools",
      price: 1500,
      quantity: 100,
      reorderThreshold: 20,
      supplier: "Local",
    },
    {
      name: "Wheelbarrow",
      category: "Tools",
      price: 25000,
      quantity: 40,
      reorderThreshold: 5,
      supplier: "Crocodile",
    },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, price, quantity, reorder_threshold, supplier, business_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of products) {
    // Check if product exists to avoid duplicates on re-run
    const exists = db
      .prepare("SELECT id FROM products WHERE name = ? AND business_id = ?")
      .get(p.name, businessId);
    if (!exists) {
      insertProduct.run(
        p.name,
        p.category,
        p.price,
        p.quantity,
        p.reorderThreshold,
        p.supplier,
        businessId,
      );
    }
  }
  console.log("Seeded products.");

  // 3. Customers
  const customers = [
    {
      name: "John Doe Construction",
      phone: "08011111111",
      email: "john@construction.com",
    },
    {
      name: "Alice Interior",
      phone: "08022222222",
      email: "alice@interiors.com",
    },
    { name: "Bob Plumber", phone: "08033333333", email: "bob@plumbing.com" },
    {
      name: "Lagos State Works",
      phone: "08044444444",
      email: "procurement@lagos.gov.ng",
    },
    {
      name: "BuildRight Ltd",
      phone: "08055555555",
      email: "info@buildright.com",
    },
    { name: "Mama Nkechi Store", phone: "08066666666", email: "" },
    { name: "Engr. Tunde", phone: "08077777777", email: "tunde@engr.com" },
    {
      name: "Green Field Estate",
      phone: "08088888888",
      email: "facility@greenfield.com",
    },
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, business_id, loyalty_points)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of customers) {
    const exists = db
      .prepare("SELECT id FROM customers WHERE phone = ? AND business_id = ?")
      .get(c.phone, businessId);
    if (!exists) {
      insertCustomer.run(
        c.name,
        c.phone,
        c.email,
        businessId,
        Math.floor(Math.random() * 500),
      );
    }
  }
  console.log("Seeded customers.");

  // 4. Campaigns
  const campaigns = [
    {
      name: "End of Year Promo",
      message:
        "Get 10% off all cement purchases this December! Visit WareHub today.",
      channel: "SMS",
      status: "sent",
    },
    {
      name: "New Stock Alert",
      message:
        "New arrival of high-quality Turkish steel doors. Limited stock available.",
      channel: "WHATSAPP",
      status: "draft",
    },
    {
      name: "Loyalty Reward",
      message:
        "You have earned 500 points! Redeem them for a discount on your next purchase.",
      channel: "SMS",
      status: "sent",
    },
  ];

  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (name, message, channel, status, business_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of campaigns) {
    const exists = db
      .prepare("SELECT id FROM campaigns WHERE name = ? AND business_id = ?")
      .get(c.name, businessId);
    if (!exists) {
      insertCampaign.run(c.name, c.message, c.channel, c.status, businessId);
    }
  }
  console.log("Seeded campaigns.");

  console.log("Seeding complete!");
}

seed();
