import { createServer } from "node:http";
import path from "node:path";
import { SETTINGS } from "@oer/configuration";
import compression from "compression";
import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import { newLogger } from "./logger.js";
import { GameManager } from "./manager/GameManager.js";

const logger = newLogger("server");
GameManager.getInstance();

const PORT = process.env.PORT || SETTINGS.SERVER_PORT || 8000;
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

	// Setup the ability for cypress to test concurrent connections
	const testSockets: Map<string, WebSocket> = new Map();
	app.get("/connect", (req, res) => {
		const url = req.query.url;
		const id = req.query.id || "default"; // Allow multiple connections with different IDs

		logger.info(`TESTING: Connecting to: ${url} with ID: ${id}`);

		if (!url) {
			res.sendStatus(400);
			return;
		}

		// Close existing socket with this ID if it exists
		if (testSockets.has(id as string)) {
			testSockets.get(id as string)?.close();
			testSockets.delete(id as string);
		}

		const testSocket = new WebSocket(url as string);
		testSockets.set(id as string, testSocket);
		GameManager.messageServer.register(testSocket);

		testSocket.on("open", () => {
			logger.info(`TESTING: Connected to: ${url} with ID: ${id}`);

			// Join the lobby
			const joinLobbyEvent = {
				event: "joinLobby",
				data: {},
			};
			testSocket.send(JSON.stringify(joinLobbyEvent));

			res.sendStatus(200);
		});
	});

	app.get("/message", (req, res) => {
		const msg = req.query.m;
		const id = req.query.id || "default";

		logger.info(`TESTING: Received message for socket ${id}: ${msg}`);

		const testSocket = testSockets.get(id as string);
		if (!testSocket) {
			res.status(400).send(`No test socket found with ID: ${id}`);
			return;
		}

		testSocket.send(msg as string, () => {
			res.sendStatus(200);
		});
	});

	app.get("/disconnect", (req, res) => {
		const id = req.query.id || "default";
		const testSocket = testSockets.get(id as string);

		if (!testSocket) {
			res.status(400).send(`No test socket found with ID: ${id}`);
			return;
		}

		testSocket.on("close", () => {
			logger.info(`TESTING: Disconnected socket with ID: ${id}`);
			testSockets.delete(id as string);
			res.sendStatus(200);
		});

		testSocket.close();
	});

	app.get("/disconnect-all", (_req, res) => {
		const promises = Array.from(testSockets.entries()).map(([id, socket]) => {
			return new Promise<void>((resolve) => {
				logger.info(`TESTING: Disconnecting socket with ID: ${id}`);
				socket.on("close", () => {
					resolve();
				});
				socket.close();
			});
		});

		Promise.all(promises).then(() => {
			testSockets.clear();
			res.sendStatus(200);
		});
	});

	// In development, proxy requests to the Vite dev server for the client
	app.use(
		"/",
		createProxyMiddleware({
			target: "http://localhost:3000", // Vite dev server
			changeOrigin: true,
			ws: true, // Important for WebSocket connections (HMR)
		}),
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
