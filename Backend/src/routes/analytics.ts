import { Router } from 'express';
import db from '../db/init';

const router = Router();

router.get('/sales', (req, res) => {
  // Mock data for the graph since we might not have enough real data immediately
  const data = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];
  res.json(data);
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
