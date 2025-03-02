import { existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SETTINGS } from "@oer/configuration";
import express from "express";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { newLogger } from "./logger.js";
import { GameManager } from "./manager/GameManager.js";

const logger = newLogger("server");

GameManager.getInstance();

const app = express();
const httpServer = createServer(app);

// Create WebSocket server attached to our HTTP server
const wss = new WebSocketServer({ server: httpServer });
wss.on("connection", (socket: WebSocket) => {
  logger.debug("User connected");
  GameManager.messageServer.register(socket);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the path to the client package's dist directory
const clientDistPath = path.resolve(__dirname, "../../../client/dist");
const publicPath = path.join(__dirname, "../public");

// Configure static file serving for client assets
app.use(
  express.static(clientDistPath, {
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

// Serve public assets (if any)
app.use(
  express.static(publicPath, {
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
  // Try client index.html first, fall back to public if needed
  const clientIndexPath = path.join(clientDistPath, "index.html");
  const publicIndexPath = path.join(publicPath, "index.html");

  if (existsSync(clientIndexPath)) {
    res.sendFile(clientIndexPath);
  } else {
    res.sendFile(publicIndexPath);
  }
});

httpServer.listen(SETTINGS.PORT, () => {
  logger.info(`Server running on port ${SETTINGS.PORT}`);
});
