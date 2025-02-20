import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { SETTINGS } from "@oer/configuration";
import { newLogger } from "./logger.js";
import { GameManager } from "./manager/GameManager.js";

const logger = newLogger("server");

const app = express();
const httpServer = createServer(app);

// Create WebSocket server attached to our HTTP server
const wss = new WebSocketServer({ server: httpServer });
wss.on("connection", (socket: WebSocket) => {
  logger.info("User connected");
  GameManager.messageServer.register(socket);
});
GameManager.getInstance();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure static file serving with proper MIME types
app.use(
  express.static(path.join(__dirname, "../public"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Always serve index.html for any route (SPA support)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

httpServer.listen(SETTINGS.PORT, () => {
  logger.info(`Server running on port ${SETTINGS.PORT}`);
});
