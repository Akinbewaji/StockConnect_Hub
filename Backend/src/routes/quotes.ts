import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";
import { requestQuote, respondToQuote, getSellerQuotes, getCustomerQuotes } from "../controllers/quote.controller.js";

const router = Router();

// Used by both buyers and sellers, relying on JWT auth
router.use(authenticateToken);

// Customer endpoints
router.post("/customer", checkRole(['customer']), requestQuote);
router.get("/customer", checkRole(['customer']), getCustomerQuotes);

// Seller endpoints
router.get("/seller", checkRole(['owner', 'staff']), getSellerQuotes);
router.patch("/seller/:quoteId/respond", checkRole(['owner', 'staff']), respondToQuote);

export default router;
