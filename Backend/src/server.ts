import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/init.js";
import { authenticateToken } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import orderRoutes from "./routes/orders.js";
import campaignRoutes from "./routes/campaigns.js";
import analyticsRoutes from "./routes/analytics.js";
import settingsRoutes from "./routes/settings.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
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
  app.use("/api/settings", authenticateToken, settingsRoutes);

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
      res.status(500).json({ error: err.message || "Internal server error" });
    },
  );

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `✅ StockConnect Backend API running on http://localhost:${PORT}`,
    );
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
}

startServer();
