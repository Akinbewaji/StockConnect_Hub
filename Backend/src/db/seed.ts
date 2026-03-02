import db from "./init.js";
import bcrypt from "bcryptjs";

async function runSeed() {
  console.log("🌱 Starting Database Seed...");

  const defaultPassword = await bcrypt.hash("password123", 10);

  // --- 1. SEED SELLERS (ADMINS) ---
  const sellers = [
    { username: "techhaven", email: "admin@techhaven.com", phone: "+2348000000010", name: "John Doe", business_name: "TechHaven Electronics", role: "owner", onboarded: 1 },
    { username: "buildcorp", email: "admin@buildcorp.com", phone: "+2348000000011", name: "Jane Smith", business_name: "BuildCorp Hardware", role: "owner", onboarded: 1 },
    { username: "globalsupply", email: "admin@globalsupply.com", phone: "+2348000000012", name: "Sam Wilson", business_name: "Global Supply Co.", role: "owner", onboarded: 1 }
  ];

  const sellerIds: Record<string, number> = {};

  for (const s of sellers) {
    try {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(s.email) as { id: number } | undefined;
      if (existing) {
        sellerIds[s.business_name] = existing.id;
        continue;
      }
      const result = db.prepare(`
        INSERT INTO users (username, email, phone, password, name, business_name, role, onboarded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(s.username, s.email, s.phone, defaultPassword, s.name, s.business_name, s.role, s.onboarded);
      sellerIds[s.business_name] = result.lastInsertRowid as number;
      console.log(`✅ Created Seller: ${s.business_name}`);
      
      // Seed seller settings
      db.prepare(`INSERT INTO settings (business_id, currency, phone) VALUES (?, '₦', ?)`).run(result.lastInsertRowid, s.phone);
    } catch (e: any) {
      console.log(`⚠️ Skiped Seller ${s.business_name}: ${e.message}`);
    }
  }

  // --- 2. SEED BUYERS (CUSTOMERS) ---
  const buyers = [
    { username: "aliceproc", email: "alice@procurement.com", phone: "+2347000000020", name: "Alice Procurement", business_name: "Alice Builds" },
    { username: "bobbuilder", email: "bob@builder.com", phone: "+2347000000021", name: "Bob Hardware", business_name: "Bob's Repairs" }
  ];

  const buyerIds: Record<string, number> = {};
  const customerProfileIds: Record<string, number> = {};

  for (const b of buyers) {
    try {
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(b.email) as { id: number } | undefined;
      let userId;
      if (existing) {
        userId = existing.id;
      } else {
        const result = db.prepare(`
          INSERT INTO users (username, email, phone, password, name, business_name, role, onboarded)
          VALUES (?, ?, ?, ?, ?, ?, 'customer', 1)
        `).run(b.username, b.email, b.phone, defaultPassword, b.name, b.business_name);
        userId = result.lastInsertRowid as number;
        console.log(`✅ Created Buyer User: ${b.name}`);
      }
      buyerIds[b.name] = userId;

      // Ensure customer profile exists
      const existingCust = db.prepare("SELECT id FROM customers WHERE user_id = ?").get(userId) as { id: number } | undefined;
      if (!existingCust) {
        const custResult = db.prepare(`
          INSERT INTO customers (name, phone, email, user_id) VALUES (?, ?, ?, ?)
        `).run(b.name, b.phone, b.email, userId);
        customerProfileIds[b.name] = custResult.lastInsertRowid as number;
      } else {
        customerProfileIds[b.name] = existingCust.id;
      }
    } catch (e: any) {
      console.log(`⚠️ Skiped Buyer ${b.name}: ${e.message}`);
    }
  }

  // --- 3. SEED PRODUCTS ---
  const techHavenId = sellerIds["TechHaven Electronics"];
  const buildCorpId = sellerIds["BuildCorp Hardware"];
  const globalSupplyId = sellerIds["Global Supply Co."];

  const products = [
    { name: "MacBook Pro M3 Max", category: "Electronics", price: 3500000, qty: 5, supplier: "Apple", bid: techHavenId },
    { name: "Dell XPS 15", category: "Electronics", price: 2100000, qty: 12, supplier: "Dell", bid: techHavenId },
    { name: "Sony A7 IV Camera", category: "Electronics", price: 1800000, qty: 3, supplier: "Sony", bid: techHavenId },
    { name: "Logitech MX Master 3S", category: "Accessories", price: 150000, qty: 45, supplier: "Logitech", bid: techHavenId },
    { name: "Samsung 49-inch Odyssey G9", category: "Electronics", price: 1200000, qty: 0, supplier: "Samsung", bid: techHavenId }, // Out of stock

    { name: "DeWalt 20V Max Drill", category: "Tools", price: 125000, qty: 30, supplier: "DeWalt", bid: buildCorpId },
    { name: "Makita Circular Saw", category: "Tools", price: 85000, qty: 15, supplier: "Makita", bid: buildCorpId },
    { name: "Bosch Laser Level", category: "Hardware", price: 150000, qty: 8, supplier: "Bosch", bid: buildCorpId },
    { name: "Heavy Duty Work Bench", category: "Hardware", price: 200000, qty: 4, supplier: "Global Supply", bid: buildCorpId },
    { name: "Milwaukee Packout Toolbox", category: "Tools", price: 250000, qty: 12, supplier: "Milwaukee", bid: buildCorpId },

    { name: "Industrial Air Compressor", category: "Machinery", price: 850000, qty: 2, supplier: "CAT", bid: globalSupplyId },
    { name: "Steel Safety Boots (Size 10)", category: "Safety", price: 45000, qty: 100, supplier: "Caterpillar", bid: globalSupplyId },
    { name: "High-Vis Reflective Vest", category: "Safety", price: 5000, qty: 500, supplier: "Generic", bid: globalSupplyId },
    { name: "50m Heavy Duty Extension Cord", category: "Hardware", price: 35000, qty: 25, supplier: "Global Supply", bid: globalSupplyId },
    { name: "Generator 5KVA", category: "Machinery", price: 650000, qty: 5, supplier: "Honda", bid: globalSupplyId }
  ];

  if (techHavenId && buildCorpId && globalSupplyId) {
    const existingProducts = db.prepare("SELECT count(*) as count FROM products").get() as any;
    // Forcing seed to insert new complete product records to fix display issues
    if (true) {
      const insertProduct = db.prepare(`
        INSERT INTO products (name, category, price, quantity, supplier, business_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      let pCount = 0;
      for (const p of products) {
        // Prevent duplicate by name
        const exists = db.prepare("SELECT id FROM products WHERE name = ? AND business_id = ?").get(p.name, p.bid);
        if (!exists) {
          insertProduct.run(p.name, p.category, p.price, p.qty, p.supplier, p.bid);
          pCount++;
        }
      }
      console.log(`✅ Seeded ${pCount} Products.`);
    } else {
      console.log(`ℹ️ Products already exist. Skipping product generation.`);
    }
  }

  // --- 4. SEED QUOTES (FOR BLUEPRINT FEATURE) ---
  const aliceId = customerProfileIds["Alice Procurement"];
  
  if (aliceId && techHavenId) {
    const existingQuotes = db.prepare("SELECT count(*) as count FROM quotes WHERE customer_id = ?").get(aliceId) as any;
    if (existingQuotes.count === 0) {
      // Find a product ID for Alice to request quote
      const macbook = db.prepare("SELECT id FROM products WHERE name = 'MacBook Pro M3 Max'").get() as any;
      if (macbook) {
        db.prepare(`
          INSERT INTO quotes (customer_id, business_id, product_id, requested_quantity, customer_message, attachment_url, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `).run(aliceId, techHavenId, macbook.id, 50, "We need 50 units for our new engineering team. Please review the attached specs.", "https://example.com/specs.pdf");
        console.log(`✅ Seeded 1 Pending Quote from Alice to TechHaven.`);
      }
    }
  }

  if (aliceId && buildCorpId) {
     const existingQuotes = db.prepare("SELECT count(*) as count FROM quotes WHERE customer_id = ? AND status = 'responded'").get(aliceId) as any;
     if (existingQuotes.count === 0) {
       const drill = db.prepare("SELECT id FROM products WHERE name = 'DeWalt 20V Max Drill'").get() as any;
       if (drill) {
         db.prepare(`
           INSERT INTO quotes (customer_id, business_id, product_id, requested_quantity, price, customer_message, seller_response, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'responded')
         `).run(aliceId, buildCorpId, drill.id, 100, 110000, "Interested in wholesale pricing for 100 drills.", "We can offer a discount to 110k per unit for this volume.");
         console.log(`✅ Seeded 1 Responded Quote from BuildCorp to Alice.`);
       }
     }
  }

  console.log("🚀 Database Seeding Complete!");
}

runSeed().catch(err => {
  console.error("Failed to execute seed:", err);
  process.exit(1);
});
