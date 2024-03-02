import type { Express } from 'express';
import restApiRouter from './rest-api-router';
import websocketRouter from './websocket-handler';

/**
 * Sets up the middleware for the Express app.
 *
 * @param app - The Express app instance.
 */
export default function setupMiddleware(app: Express): void {
  // Setup additional logging
  // app.use((req, res, next) => {
  //   info(`${req.method} ${req.url}`);
  //   next();
  // });

  // Setup REST API and Websocket Routes
  app.use('/api', restApiRouter);
  app.use('/ws', websocketRouter);
}
