import { Router } from 'express';
import db from '../db/init';

const router = Router();

// Get settings
router.get('/', (req: any, res) => {
  const businessId = req.user.id;
  try {
    let settings = db.prepare('SELECT * FROM settings WHERE business_id = ?').get(businessId);
    
    if (!settings) {
      // Initialize default settings if not exists
      const stmt = db.prepare('INSERT INTO settings (business_id) VALUES (?)');
      stmt.run(businessId);
      settings = db.prepare('SELECT * FROM settings WHERE business_id = ?').get(businessId);
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.patch('/', (req: any, res) => {
  const businessId = req.user.id;
  const { currency, loyalty_points_per_unit, currency_unit_for_points, point_redemption_value, low_stock_notifications } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE settings 
      SET currency = ?, 
          loyalty_points_per_unit = ?, 
          currency_unit_for_points = ?, 
          point_redemption_value = ?,
          low_stock_notifications = ?
      WHERE business_id = ?
    `);
    
    stmt.run(
      currency, 
      loyalty_points_per_unit, 
      currency_unit_for_points, 
      point_redemption_value,
      low_stock_notifications ? 1 : 0, 
      businessId
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
