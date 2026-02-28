import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { initializeDatabase } from "./db/init.js";
import { authenticateToken } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import orderRoutes from "./routes/orders.js";
import campaignRoutes from "./routes/campaigns.js";
import analyticsRoutes from "./routes/analytics.js";
import settingsRoutes from "./routes/settings.js";
import { checkRole } from "./middleware/role.js";

// Load environment variables
dotenv.config();

let io: Server;

async function startServer() {
  const app = express();
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
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests, please try again later." },
  });

  // Apply the rate limiting middleware to all requests
  app.use("/api/", limiter);

  // 3. CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "10mb" })); // Increase limit for bulk imports
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Initialize Database
  initializeDatabase();

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "StockConnect API is running" });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", authenticateToken, productRoutes);
  app.use("/api/customers", authenticateToken, customerRoutes);
  app.use("/api/orders", authenticateToken, orderRoutes);
  app.use("/api/campaigns", authenticateToken, campaignRoutes);
  app.use("/api/analytics", authenticateToken, analyticsRoutes);
  app.use("/api/settings", authenticateToken, checkRole(['owner']), settingsRoutes);

  // Socket.io Connection
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);
    
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
  });
}

export { io };

startServer();
