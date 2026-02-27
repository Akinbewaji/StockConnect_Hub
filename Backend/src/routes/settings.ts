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
  const { 
    currency, 
    loyalty_points_per_unit, 
    currency_unit_for_points, 
    point_redemption_value, 
    low_stock_notifications,
    phone,
    address,
    tax_rate,
    receipt_footer,
    default_sender_id,
    auto_receipt_sms 
  } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE settings 
      SET currency = ?, 
          loyalty_points_per_unit = ?, 
          currency_unit_for_points = ?, 
          point_redemption_value = ?,
          low_stock_notifications = ?,
          phone = ?,
          address = ?,
          tax_rate = ?,
          receipt_footer = ?,
          default_sender_id = ?,
          auto_receipt_sms = ?
      WHERE business_id = ?
    `);
    
    stmt.run(
      currency, 
      loyalty_points_per_unit, 
      currency_unit_for_points, 
      point_redemption_value,
      low_stock_notifications ? 1 : 0, 
      phone || null,
      address || null,
      tax_rate || 0,
      receipt_footer || null,
      default_sender_id || null,
      auto_receipt_sms ? 1 : 0,
      businessId
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Export Data (Products, Customers, Orders) to CSV
router.get('/export/:type', (req: any, res) => {
  const businessId = req.user.id;
  const { type } = req.params;

  try {
    let data: any[] = [];
    let filename = '';

    if (type === 'products') {
      data = db.prepare('SELECT id, name, category, price, quantity FROM products WHERE business_id = ?').all(businessId);
      filename = 'products.csv';
    } else if (type === 'customers') {
      data = db.prepare('SELECT id, name, phone, email, loyalty_points FROM customers WHERE business_id = ?').all(businessId);
      filename = 'customers.csv';
    } else if (type === 'orders') {
      data = db.prepare('SELECT id, total_amount, status, payment_status, created_at FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE business_id = ?)').all(businessId);
      filename = 'orders.csv';
    } else {
      return res.status(400).json({ error: 'Invalid export type. Must be products, customers, or orders.' });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: `No ${type} data found to export.` });
    }

    // Convert JSON to CSV string
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        // Escape quotes and wrap in quotes if string contains comma
        if (typeof val === 'string') {
          const escaped = val.replace(/"/g, '""');
          if (escaped.includes(',')) return `"${escaped}"`;
          return escaped;
        }
        return val == null ? '' : val;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error(`Export ${type} error:`, error);
    res.status(500).json({ error: `Failed to export ${type} data` });
  }
});

// Danger Zone: Wipe POS Data
router.post('/wipe', (req: any, res) => {
  const businessId = req.user.id;
  // Extra layer of protection checking body word
  if (req.body.confirmText !== 'WIPE DATA') {
    return res.status(400).json({ error: 'Confirmation text is invalid' });
  }

  try {
    db.transaction(() => {
      // Find all customer IDs for the business to restrict order deletion safely
      const customerStmt = db.prepare('SELECT id FROM customers WHERE business_id = ?');
      const customerIds = customerStmt.all(businessId).map((c: any) => c.id);

      if (customerIds.length > 0) {
        const placeholders = customerIds.map(() => '?').join(',');
        
        // Delete order items for those orders
        db.prepare(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id IN (${placeholders}))`).run(...customerIds);
        
        // Delete orders
        db.prepare(`DELETE FROM orders WHERE customer_id IN (${placeholders})`).run(...customerIds);
      }
      
      // Delete stock movements for products belonging to the business
      db.prepare(`DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE business_id = ?)`).run(businessId);
    })();
    
    res.json({ success: true, message: 'All POS transaction data wiped successfully.' });
  } catch (error) {
    console.error('Wipe data error:', error);
    res.status(500).json({ error: 'Failed to wipe POS data' });
  }
});

export default router;
