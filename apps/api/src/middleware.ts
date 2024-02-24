import path from "node:path";
import type { Express } from "express";
import { static as expressStatic } from "express";
import { info } from "@oers/utils";
import restApiRouter from "./rest-api-router";
import websocketRouter from "./websocket-handler";

/**
 * Sets up the middleware for the Express app.
 *
 * @param app - The Express app instance.
 */
export default function setupMiddleware(app: Express): void {
  // Setup additional logging
  app.use((req, res, next) => {
    info(`${req.method} ${req.url}`);
    next();
  });

  // // Setup File Serving
  // app.use(
  //   // Serve frontend assets
  //   expressStatic(
  //     path.join(__dirname, "..", "node_modules", "@oers/frontend", "dist")
  //   )
  // );

  // // Use a wildcard route to serve the frontend app
  // app.get("*", (_req, res) => {
  //   res.sendFile(
  //     path.join(__dirname, "..", "node_modules", "@oers/frontend", "index.html")
  //   );
  // });

  // Setup REST API and Websocket Routes
  app.use("/api", restApiRouter);
  app.use("/ws", websocketRouter);
}
