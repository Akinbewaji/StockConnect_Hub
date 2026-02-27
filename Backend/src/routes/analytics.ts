import { Router } from 'express';
import db from '../db/init';

const router = Router();

router.get('/sales', (req: any, res) => {
  const businessId = req.user.id;

  // We want to return the last 7 days including today.
  // SQLite date('now', '-6 days') gives us the start date.
  const stmt = db.prepare(`
    SELECT 
      date(o.created_at) as sale_date,
      SUM(o.total_amount) as total_sales
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.business_id = ? 
      AND o.created_at >= date('now', '-6 days')
      AND o.status != 'cancelled'
    GROUP BY date(o.created_at)
    ORDER BY date(o.created_at) ASC
  `);
  
  const rawData = stmt.all(businessId) as { sale_date: string, total_sales: number }[];

  // Generate the last 7 days array to ensure days with 0 sales are included
  const last7Days: { dateStr: string; name: string; sales: number }[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Format day name, e.g., 'Mon', 'Tue'
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    last7Days.push({
      dateStr,
      name: dayName,
      sales: 0 // Default to 0
    });
  }

  // Merge database results into the 7-days array
  rawData.forEach(row => {
    const dayObj = last7Days.find(d => d.dateStr === row.sale_date);
    if (dayObj) {
      dayObj.sales = row.total_sales;
    }
  });

  // Return formatted data for Recharts
  const formattedData = last7Days.map(d => ({
    name: d.name,
    sales: d.sales
  }));

  res.json(formattedData);
});

router.get('/summary', (req: any, res) => {
  const businessId = req.user.id;
  
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE business_id = ?').get(businessId) as any;
  const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE business_id = ? AND quantity <= reorder_threshold').get(businessId) as any;
  
  const orderCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.business_id = ?
  `).get(businessId) as any;
  
  res.json({
    totalProducts: productCount.count,
    lowStock: lowStockCount.count,
    activeCampaigns: 2, // Mock
    recentOrders: orderCount.count
  });
});

export default router;
