import { createServer } from "node:http";
import path from "node:path";
import { SETTINGS } from "@oer/configuration";
import compression from "compression";
import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { newLogger } from "./logger.js";
import { GameManager } from "./manager/GameManager.js";

const logger = newLogger("server");
GameManager.getInstance();

const PORT = process.env.PORT || SETTINGS.PORT || 8000;
const isDev = process.env.NODE_ENV !== "production";

const app = express();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

const httpServer = createServer(app);

// Create WebSocket server attached to our HTTP server
const wss = new WebSocketServer({ server: httpServer });
wss.on("connection", (socket: WebSocket) => {
  logger.debug("User connected");
  GameManager.messageServer.register(socket);
});

if (isDev) {
  logger.info("Running in development mode - proxying to Vite dev server");

  // In development, proxy requests to the Vite dev server for the client
  app.use(
    "/",
    createProxyMiddleware({
      target: "http://localhost:3000", // Vite dev server
      changeOrigin: true,
      ws: true, // Important for WebSocket connections (HMR)
    })
  );
} else {
  logger.info("Running in production mode - serving static files");

  // In production, serve static files from the client build
  const clientBuildPath = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientBuildPath));

  // Serve index.html for any non-API routes (SPA client-side routing)
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
}

httpServer.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
