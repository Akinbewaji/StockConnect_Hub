import { Router } from "express";
import db from "../db/init.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Get all expenses for a business
router.get("/", authenticateToken, async (req: any, res) => {
  const businessId = req.user.id;
  try {
    const expenses = await db.prepare(
      "SELECT * FROM expenses WHERE business_id = ? ORDER BY date DESC"
    ).all(businessId);
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new expense
router.post("/", authenticateToken, async (req: any, res) => {
  const businessId = req.user.id;
  const { amount, category, description, date } = req.body;

  if (!amount || !category) {
    return res.status(400).json({ error: "Amount and category are required." });
  }

  try {
    const result = await db.prepare(
      "INSERT INTO expenses (business_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?) RETURNING id"
    ).run(businessId, amount, category, description, date || new Date().toISOString());
    
    res.status(201).json({ id: result.lastInsertRowid, message: "Expense added successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an expense
router.delete("/:id", authenticateToken, async (req: any, res) => {
  const businessId = req.user.id;
  const { id } = req.params;

  try {
    const result = await db.prepare(
      "DELETE FROM expenses WHERE id = ? AND business_id = ?"
    ).run(id, businessId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Expense not found or unauthorized." });
    }

    res.json({ message: "Expense deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
