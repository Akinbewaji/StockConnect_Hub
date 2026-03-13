import { Router } from "express";
import * as customerController from "../controllers/customer.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/register", customerController.register);
router.post("/login", customerController.login);
// OTP routes (commented out - using password auth instead)
// router.post("/login", customerController.requestOTP);
// router.post("/verify", customerController.verifyOTP);

import * as orderController from "../controllers/order.customer.controller.js";

import * as feedbackController from "../controllers/feedback.controller.js";

// ... Protected routes ...
router.get("/orders", authenticateToken, orderController.getMyOrders);
router.get("/orders/:id", authenticateToken, orderController.getOrderDetails);
router.post("/orders", authenticateToken, orderController.placeOrder);

// Feedback routes
router.post("/orders/:id/feedback", authenticateToken, feedbackController.submitFeedback);
router.get("/orders/:id/feedback", authenticateToken, feedbackController.getOrderFeedback);

export default router;
