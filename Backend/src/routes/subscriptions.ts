import { Router } from "express";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";
import fetch from "node-fetch";

const router = Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

router.post("/verify", authenticateToken, async (req: any, res) => {
  const { reference, plan } = req.body;
  const businessId = req.user.id;

  if (!reference || !plan) {
    return res.status(400).json({ error: "Reference and plan required" });
  }

  try {
    // 1. Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data: any = await response.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ error: "Transaction verification failed" });
    }

    // 2. Determine credits and amount based on plan
    let smsCreditsToAdd = 0;
    let expectedAmount = 0;

    if (plan.toLowerCase() === "pro") {
      smsCreditsToAdd = 500;
      expectedAmount = 5000 * 100; // Paystack amount is in kobo
    } else if (plan.toLowerCase() === "business") {
      smsCreditsToAdd = 2000;
      expectedAmount = 15000 * 100;
    } else {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Optional: Verify amount matches
    if (data.data.amount < expectedAmount) {
       return res.status(400).json({ error: "Amount mismatch" });
    }

    // 3. Update Database
    // Start transaction if we had one, but we use an async wrapper
    
    // a. Update User Plan and Credits
    await db.prepare("UPDATE users SET plan = ?, sms_credits = sms_credits + ? WHERE id = ?")
      .run(plan.toLowerCase(), smsCreditsToAdd, businessId);

    // b. Record Subscription
    await db.prepare("INSERT INTO subscriptions (business_id, plan, amount, reference, status) VALUES (?, ?, ?, ?, ?)")
      .run(businessId, plan.toLowerCase(), data.data.amount / 100, reference, "success");

    // c. Get updated user info
    const updatedUser = await db.prepare("SELECT id, name, business_name, phone, role, plan, sms_credits, onboarded FROM users WHERE id = ?")
      .get(businessId) as any;

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        businessName: updatedUser.business_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        plan: updatedUser.plan,
        smsCredits: updatedUser.sms_credits,
        onboarded: updatedUser.onboarded,
      }
    });

  } catch (error: any) {
    console.error("Subscription verification error:", error);
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

export default router;
