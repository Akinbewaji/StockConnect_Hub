import { Router } from "express";
import db from "../db/init.js";
import {
  sendSMS,
  sendWhatsApp,
  formatPhoneNumber,
} from "../services/africastalking.js";

const router = Router();

// Interface for message send result
interface MessageResult {
  success: boolean;
  data?: any;
  error?: any;
  warning?: string;
}

router.get("/", (req: any, res) => {
  const businessId = req.user.id;
  const stmt = db.prepare(
    "SELECT * FROM campaigns WHERE business_id = ? ORDER BY created_at DESC",
  );
  const campaigns = stmt.all(businessId);
  res.json(campaigns);
});

router.post("/", (req: any, res) => {
  const { name, message, channel } = req.body;
  const businessId = req.user.id;
  try {
    const stmt = db.prepare(
      "INSERT INTO campaigns (name, message, channel, business_id) VALUES (?, ?, ?, ?)",
    );
    const info = stmt.run(name, message, channel, businessId);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Send campaign to customers
router.post("/:id/send", async (req: any, res) => {
  const { id } = req.params;
  const { customerIds, segment } = req.body; // Can send to specific customers or segment
  const businessId = req.user.id;

  try {
    // Get campaign details
    const campaignStmt = db.prepare(
      "SELECT * FROM campaigns WHERE id = ? AND business_id = ?",
    );
    const campaign = campaignStmt.get(id, businessId) as any;

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Get customer phone numbers
    let customers: any[] = [];

    if (customerIds && customerIds.length > 0) {
      // Send to specific customers
      const placeholders = customerIds.map(() => "?").join(",");
      const stmt = db.prepare(
        `SELECT phone FROM customers WHERE id IN (${placeholders}) AND business_id = ?`,
      );
      customers = stmt.all(...customerIds, businessId) as any[];
    } else if (segment) {
      // Send to segmented customers
      let query = "SELECT phone FROM customers WHERE business_id = ?";
      const params: any[] = [businessId];

      if (segment === "loyal") {
        query += " AND loyalty_points > 100";
      } else if (segment === "new") {
        query += ' AND created_at > datetime("now", "-30 days")';
      } else if (segment === "all") {
        // Send to all customers
      }

      const stmt = db.prepare(query);
      customers = stmt.all(...params) as any[];
    } else {
      // Send to all customers by default
      const stmt = db.prepare(
        "SELECT phone FROM customers WHERE business_id = ?",
      );
      customers = stmt.all(businessId) as any[];
    }

    if (customers.length === 0) {
      return res
        .status(400)
        .json({ error: "No customers found to send campaign" });
    }

    // Format phone numbers
    const phoneNumbers = customers.map((c) => formatPhoneNumber(c.phone));

    // Send based on channel
    let result: MessageResult;
    if (campaign.channel === "SMS") {
      result = (await sendSMS({
        to: phoneNumbers,
        message: campaign.message,
      })) as MessageResult;
    } else if (campaign.channel === "WHATSAPP") {
      result = (await sendWhatsApp({
        to: phoneNumbers,
        message: campaign.message,
      })) as MessageResult;
    } else {
      return res.status(400).json({ error: "Invalid campaign channel" });
    }

    if (result.success) {
      // Update campaign status to sent
      const updateStmt = db.prepare(
        "UPDATE campaigns SET status = ? WHERE id = ?",
      );
      updateStmt.run("sent", id);

      res.json({
        success: true,
        message: `Campaign sent to ${customers.length} customers`,
        details: result.data,
        warning: result.warning,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error("Campaign sending error:", error);
    res.status(500).json({ error: "Failed to send campaign" });
  }
});

// Get campaign statistics
router.get("/:id/stats", (req: any, res) => {
  const { id } = req.params;
  const businessId = req.user.id;

  try {
    const stmt = db.prepare(
      "SELECT * FROM campaigns WHERE id = ? AND business_id = ?",
    );
    const campaign = stmt.get(id, businessId) as any;

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Get total customers
    const customerStmt = db.prepare(
      "SELECT COUNT(*) as total FROM customers WHERE business_id = ?",
    );
    const customerCount = customerStmt.get(businessId) as any;

    res.json({
      campaign,
      totalCustomers: customerCount.total,
      status: campaign.status,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaign stats" });
  }
});

export default router;
