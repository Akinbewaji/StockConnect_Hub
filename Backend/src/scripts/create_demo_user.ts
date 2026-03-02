import db from "../db/init.js";
import bcrypt from "bcryptjs";
import { formatPhoneNumber } from "../services/africastalking.js";

async function createDemoUser() {
  const demoData = {
    name: "Demo Customer",
    phone: "08012345678",
    email: "demo@stockconnect.com",
    password: "demo-password-123",
    address: {
      street: "123 Innovation Drive",
      city: "Lagos",
      state: "Lagos"
    }
  };

  const formattedPhone = formatPhoneNumber(demoData.phone);

  try {
    console.log("🚀 Creating demo customer...");

    // 1. Create a user entry
    const hashedPassword = await bcrypt.hash(demoData.password, 10);
    const userResult = db.prepare(`
      INSERT INTO users (username, email, phone, password, name, business_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(demoData.email, demoData.email, formattedPhone, hashedPassword, demoData.name, 'Customer', 'customer');

    const userId = userResult.lastInsertRowid;

    // 2. Create customer entry
    const customerResult = db.prepare(`
      INSERT INTO customers (name, phone, email, user_id)
      VALUES (?, ?, ?, ?)
    `).run(demoData.name, formattedPhone, demoData.email, userId);

    const customerId = customerResult.lastInsertRowid;

    // 3. Add address
    db.prepare(`
      INSERT INTO addresses (customer_id, label, address_line1, city, state, is_default)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(customerId, 'Home', demoData.address.street, demoData.address.city, demoData.address.state, 1);

    console.log("✅ Demo customer created successfully!");
    console.log(`📧 Email: ${demoData.email}`);
    console.log(`📱 Phone: ${formattedPhone}`);
    console.log(`🔑 Password: ${demoData.password}`);
    
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.log("ℹ️ Demo user already exists.");
    } else {
      console.error("❌ Failed to create demo user:", error);
    }
  }
}

createDemoUser();
