import { Request, Response } from "express";
import db from "../db/init.js";
import { io } from "../server.js";

/**
 * Get all chats for customer/business
 */
export async function getMyChats(req: any, res: Response) {
  try {
    if (req.user.role === 'customer') {
      const customer = await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id) as any;
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      
      const chats = await db.prepare(`
        SELECT c.*, u.business_name, u.name as business_owner_name
        FROM chats c
        JOIN users u ON c.business_id = u.id
        WHERE c.customer_id = ?
        ORDER BY c.last_message_at DESC
      `).all(customer.id);
      
      res.json(chats);
    } else {
      // Owner/Business side
      const chats = await db.prepare(`
        SELECT c.*, cust.name as customer_name, cust.phone as customer_phone
        FROM chats c
        JOIN customers cust ON c.customer_id = cust.id
        WHERE c.business_id = ?
        ORDER BY c.last_message_at DESC
      `).all(req.user.id);
      
      res.json(chats);
    }
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get messages for a chat
 */
export async function getMessages(req: any, res: Response) {
  const { chatId } = req.params;
  try {
    let chat;
    if (req.user.role === 'customer') {
      const customer = await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id) as any;
      chat = await db.prepare("SELECT id FROM chats WHERE id = ? AND customer_id = ?").get(chatId, customer.id);
      
      // Mark as read (messages from business)
      await db.prepare("UPDATE messages SET read = 1 WHERE chat_id = ? AND sender_type = 'business'").run(chatId);
    } else {
      // Business side
      chat = await db.prepare("SELECT id FROM chats WHERE id = ? AND business_id = ?").get(chatId, req.user.id);
      
      // Mark as read (messages from customer)
      await db.prepare("UPDATE messages SET read = 1 WHERE chat_id = ? AND sender_type = 'customer'").run(chatId);
    }
    
    if (!chat) return res.status(403).json({ error: "Unauthorized" });

    const messages = await db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).all(chatId);

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send a message
 */
export async function sendMessage(req: any, res: Response) {
  const { chatId, text, businessId: bodyBusinessId, customerId: bodyCustomerId } = req.body;
  try {
    let activeChatId = chatId;
    let businessIdValue: any;
    let senderType: 'customer' | 'business';

    if (req.user.role === 'customer') {
      senderType = 'customer';
      const customer = await db.prepare("SELECT id FROM customers WHERE user_id = ?").get(req.user.id) as any;
      if (!customer) return res.status(404).json({ error: "Customer not found" });

      if (!activeChatId) {
        businessIdValue = bodyBusinessId;
        // Create new chat if not exists
        let chat = await db.prepare("SELECT id FROM chats WHERE customer_id = ? AND business_id = ?")
          .get(customer.id, businessIdValue) as any;
        
        if (!chat) {
          const newChatId = (await (await db.prepare(
      "INSERT INTO chats (customer_id, business_id) VALUES (?, ?)",
    )).run(customer.id, businessIdValue)).lastInsertRowid;
          activeChatId = newChatId;
        } else {
          activeChatId = chat.id;
        }
      } else {
        const chat = await db.prepare("SELECT business_id FROM chats WHERE id = ?").get(activeChatId) as any;
        businessIdValue = chat?.business_id;
      }
    } else {
      // Business side
      senderType = 'business';
      businessIdValue = req.user.id;
      
      if (!activeChatId) {
        if (!bodyCustomerId) return res.status(400).json({ error: "Customer ID required to start chat" });
        
        let chat = (await (await db.prepare("SELECT id FROM chats WHERE customer_id = ? AND business_id = ?")).get(bodyCustomerId, businessIdValue)) as any;
          
        if (!chat) {
          const result = await (await db.prepare("INSERT INTO chats (customer_id, business_id) VALUES (?, ?)")).run(bodyCustomerId, businessIdValue);
          activeChatId = result.lastInsertRowid;
        } else {
          activeChatId = chat.id;
        }
      } else {
        // Verify chat belongs to business
        const chat = (await (await db.prepare("SELECT business_id, customer_id FROM chats WHERE id = ?")).get(activeChatId)) as any;
        if (!chat || chat.business_id !== businessIdValue) return res.status(403).json({ error: "Unauthorized" });
      }
    }

    const messageResult = await (await db.prepare(
      "INSERT INTO messages (chat_id, sender_id, sender_type, text) VALUES (?, ?, ?, ?)",
    )).run(activeChatId, req.user.id, senderType, text);
    const messageId = messageResult.lastInsertRowid;

    await (await db.prepare("UPDATE chats SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?")).run(activeChatId);

    const message = {
      id: messageId,
      chat_id: activeChatId,
      sender_id: req.user.id,
      sender_type: senderType,
      text,
      created_at: new Date().toISOString()
    };

    // Emit via Socket.io
    if (io) {
      io.to(`chat_${activeChatId}`).emit("new_message", message);
      
      if (senderType === 'customer') {
        io.to(`user_${businessIdValue}`).emit("new_chat_message", message);
      } else {
        // Get customer's user_id for socket notification
        const chatInfo = await db.prepare(`
          SELECT cust.user_id 
          FROM chats c
          JOIN customers cust ON c.customer_id = cust.id
          WHERE c.id = ?
        `).get(activeChatId) as any;
        
        if (chatInfo) {
          io.to(`user_${chatInfo.user_id}`).emit("new_chat_message", message);
        }
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
