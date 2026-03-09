import { Router } from "express";
import { generateBusinessInsights } from "../services/ai.service.js";
import { getBusinessSummaryData, sendDailyReport } from "../services/report.service.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const router = Router();

/**
 * Get AI insights for a business
 * POST /api/insights/query
 */
router.post("/query", authenticateToken, checkRole(['owner']), async (req: any, res) => {
  const { query } = req.body;
  const businessId = req.user.id;

  try {
    const data = await getBusinessSummaryData(businessId);
    const insights = await generateBusinessInsights(data, query);
    res.json({ insights });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get business summary data for the Insights page
 * GET /api/insights/summary
 */
router.get("/summary", authenticateToken, checkRole(['owner']), async (req: any, res) => {
  const businessId = req.user.id;

  try {
    const data = await getBusinessSummaryData(businessId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manually trigger a daily report (for testing/immediate needs)
 * POST /api/insights/trigger-report
 */
router.post("/trigger-report", authenticateToken, checkRole(['owner']), async (req: any, res) => {
  const businessId = req.user.id;
  const phone = req.user.phone;

  if (!phone) {
    return res.status(400).json({ error: "No phone number associated with this account." });
  }

  try {
    await sendDailyReport(businessId, phone);
    res.json({ message: "Daily report triggered successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
