import { Request, Response } from "express";
import db from "../db/init.js";

export async function getMyNotifications(req: any, res: Response) {
  try {
    const notifications = await db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function markAsRead(req: any, res: Response) {
  const { id } = req.params;
  try {
    await db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUnreadCount(req: any, res: Response) {
  try {
    const result = await db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0").get(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
