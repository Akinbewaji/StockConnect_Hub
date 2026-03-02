import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", chatController.getMyChats);
router.get("/:chatId/messages", chatController.getMessages);
router.post("/messages", chatController.sendMessage);

export default router;
