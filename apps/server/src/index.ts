import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import { SETTINGS } from "./config.js";
import { newLogger } from "./logger.js";
import { setupSocketHandlers } from "./socketHandlers.js";
import { initTRPC } from "@trpc/server";

const logger = newLogger("server");

const tRPC = initTRPC.create();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: "*",
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setupSocketHandlers(io);

// Configure static file serving with proper MIME types
app.use(express.static(path.join(__dirname, "../public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Always serve index.html for any route (SPA support)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

httpServer.listen(SETTINGS.PORT, () => {
  logger.info(`Server running on port ${SETTINGS.PORT}`);
});
