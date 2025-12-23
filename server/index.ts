import path from "path";
import { fileURLToPath } from "url";

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
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
  await connectToMongoDB();
  await seedData();

  log("🔄 Checking for montly submission reset...");
  await storage.resetDailySubmissions();
  log("✅ montly submission reset check completed");

  scheduleDailyReset();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // pass safe base dir for prod static
    serveStatic(app, __dirname);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`🚀 Sales Leaderboard server running on port ${port}`);
    log(`📊 Dashboard: http://localhost:${port}`);
    log(`🔐 Admin: admin@example.com / admin123`);
    log(`👥 TL: tl@example.com / tl123`);
  });
})();
