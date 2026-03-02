import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", cartController.getCart);
router.post("/items", cartController.addToCart);
router.put("/items/:id", cartController.updateCartItem);
router.delete("/items/:id", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

export default router;
