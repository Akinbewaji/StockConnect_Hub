import webPush from 'web-push';
import dotenv from 'dotenv';
import db from '../db/init.js';

dotenv.config();

// Ensure VAPID keys exist. If not, generate them once and log them.
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webPush.setVapidDetails(
    'mailto:support@stockconnect.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
  console.warn("⚠️ VAPID keys not found in .env! Offline Web Push notifications will not work until you run `npx web-push generate-vapid-keys` and save them to .env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
}

export const webPushService = {
  /**
   * Save a new push subscription for a user
   */
  saveSubscription: (userId: number, role: 'owner' | 'customer', subscription: any) => {
    try {
      const { endpoint, keys } = subscription;
      db.prepare(`
        INSERT OR REPLACE INTO web_push_subscriptions (user_id, role, endpoint, keys_p256dh, keys_auth)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, role, endpoint, keys.p256dh, keys.auth);
      return true;
    } catch (err) {
      console.error("Failed to save push subscription:", err);
      return false;
    }
  },

  /**
   * Send a Web Push notification to a specific user (offline delivery)
   */
  sendNotification: async (userId: number, role: 'owner' | 'customer', payload: { title: string; body: string; data?: any }) => {
    if (!publicVapidKey || !privateVapidKey) return;

    try {
      const subscriptions = db.prepare(`
        SELECT * FROM web_push_subscriptions 
        WHERE user_id = ? AND role = ?
      `).all(userId, role) as any[];

      const notifications = subscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth
          }
        };

        return webPush.sendNotification(pushSubscription as any, JSON.stringify(payload)).catch((err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription has expired or is no longer valid
            db.prepare('DELETE FROM web_push_subscriptions WHERE id = ?').run(sub.id);
          } else {
            console.error("Web Push Error:", err);
          }
        });
      });

      await Promise.all(notifications);
    } catch (err) {
      console.error("Failed to push notification:", err);
    }
  }
};
