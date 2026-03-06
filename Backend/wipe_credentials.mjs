import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve("stockconnect.db");
const db = new Database(dbPath);

console.log(`Opened database at ${dbPath}`);

try {
  // Disable foreign keys temporarily to allow deletion
  db.exec("PRAGMA foreign_keys = OFF;");

  console.log("Wiping users, customers, and OTPs...");
  
  const usersInfo = db.prepare("DELETE FROM users").run();
  const customersInfo = db.prepare("DELETE FROM customers").run();
  const otpsInfo = db.prepare("DELETE FROM otps").run();

  // Re-enable foreign keys
  db.exec("PRAGMA foreign_keys = ON;");

  console.log("Successfully wiped the following credentials:");
  console.log(`- ${usersInfo.changes} users deleted.`);
  console.log(`- ${customersInfo.changes} customers deleted.`);
  console.log(`- ${otpsInfo.changes} OTPs deleted.`);
  
} catch (error) {
  console.error("An error occurred while wiping credentials:", error);
}

db.close();
