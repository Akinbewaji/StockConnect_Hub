import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { initializeDatabase, seedDemoData } from "./db/init.js";
import { authenticateToken } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import orderRoutes from "./routes/orders.js";
import campaignRoutes from "./routes/campaigns.js";
import analyticsRoutes from "./routes/analytics.js";
import settingsRoutes from "./routes/settings.js";
import { checkRole } from "./middleware/role.js";
import customerSelfRoutes from "./routes/customer.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import insightRoutes from "./routes/insights.js";
import { scheduleDailyReports } from "./services/report.service.js";

// Load environment variables
dotenv.config();

let io: Server;

async function startServer() {
  const app = express();
  
  // Trust proxy for Render/Vercel (needed for express-rate-limit)
  app.set('trust proxy', 1);

  const httpServer = createServer(app);
  
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

  // 1. Security Headers
  app.use(helmet());

  // 2. Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for OPTIONS preflight requests to avoid CORS issues in dev
      return req.method === 'OPTIONS' || process.env.NODE_ENV !== 'production';
    },
    message: { error: "Too many requests, please try again later." },
  });

  // Apply the rate limiting middleware to all requests
  app.use("/api/", limiter);

  // 3. CORS Configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://stock-connect-hub.vercel.app"
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" })); // Increase limit for bulk imports
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Initialize Database
  await initializeDatabase();
  await seedDemoData(); // Create demo account if it doesn't exist

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "StockConnect API is running" });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes); // Granular auth inside
  app.use("/api/customers/self", customerSelfRoutes);
  app.use("/api/cart/self", cartRoutes);
  app.use("/api/chat/self", chatRoutes);
  app.use("/api/notifications/self", notificationRoutes);
  app.use("/api/customers", authenticateToken, customerRoutes);
  app.use("/api/orders", authenticateToken, orderRoutes);
  app.use("/api/campaigns", authenticateToken, campaignRoutes);
  app.use("/api/analytics", authenticateToken, analyticsRoutes);
  app.use("/api/subscriptions", authenticateToken, subscriptionRoutes);
  app.use("/api/settings", authenticateToken, checkRole(['owner']), settingsRoutes);
  app.use("/api/maintenance", authenticateToken, checkRole(['owner']), maintenanceRoutes);
  app.use("/api/insights", authenticateToken, checkRole(['owner']), insightRoutes);

  // Socket.io Connection
  io.on("connection", (socket: any) => {
    console.log("🔌 New client connected:", socket.id);
    
    socket.on("join", (room: string) => {
      console.log(`📡 Client joined room: ${room}`);
      socket.join(room);
    });

    socket.on("join_chat", (chatId: string | number) => {
      console.log(`💬 Client joined chat room: chat_${chatId}`);
      socket.join(`chat_${chatId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected");
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  // Error handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err);
      
      // Handle Zod validation errors globally (optional but cleaner)
      if (err.name === "ZodError") {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: err.flatten().fieldErrors 
        });
      }

      const status = err.status || 500;
      const message = err.message || "Internal server error";
      
      res.status(status).json({ error: message });
    },
  );

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(
      `✅ StockConnect Backend API running on http://localhost:${PORT}`,
    );
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    // Start automated daily reports scheduler
    scheduleDailyReports();
  });
}

export { io };

startServer();
