import path from "path";
import { fileURLToPath } from "url";

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./utils/log";

import fs from "fs";

import { seedData } from "./seed";
import { storage } from "./storage";
import { connectToMongoDB } from "./db/connection";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  // @ts-ignore
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    // @ts-ignore
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 2000) logLine = logLine.slice(0, 1999) + "…";
      log(logLine);
    }
  });

  next();
});

// Daily submission reset scheduler
function scheduleDailyReset() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  setTimeout(async () => {
    log("🔄 Performing daily submission reset...");
    await storage.resetDailySubmissions();
    log("✅ Daily submission reset completed");
    scheduleDailyReset();
  }, msUntilMidnight);
}

(async () => {
  let dbConnected = false;
  try {
    await connectToMongoDB();
    dbConnected = true;
    await seedData();
  } catch (err) {
    console.error("⚠️ Failed to connect to DB or seed data, but starting server anyway:", err);
  }

  if (dbConnected) {
    try {
      log("🔄 Checking for montly submission reset...");
      await storage.resetDailySubmissions();
      log("✅ montly submission reset check completed");
    } catch (err) {
      console.error("⚠️ Failed to reset daily submissions:", err);
    }
  }

  scheduleDailyReset();


  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // In a microservice-like setup, we don't serve the frontend from the same process in dev.
  // The frontend runs its own Vite server and proxies requests here.
  if (app.get("env") === "production") {
    // In production, we can still serve the static files if desired,
    // but typically a microservice setup might have a separate CDN/web server.
    // For now, let's keep the option to serve static files from dist/public.
    const distPath = path.resolve(__dirname, "..", "dist", "public");
    if (fs.existsSync(distPath)) {

      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }


  const port = parseInt(process.env.PORT || "5002", 10);


  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Sales Leaderboard server running on port ${port}`);
    log(`📊 Dashboard: http://localhost:${port}`);
    log(`🔐 Admin: admin@example.com / admin123`);
    log(`👥 TL: tl@example.com / tl123`);
  });
})();
