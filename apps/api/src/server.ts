import { json, urlencoded } from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { getGameManager } from '@oers/game-core';

export const MODE = (process.env.NODE_ENV || 'development') as
  | 'development'
  | 'production';

export const gameManager = getGameManager<WebSocket>(MODE);

const app = express();
app
  .disable('x-powered-by')
  .use(morgan('dev'))
  .use(urlencoded({ extended: true }))
  .use(json())
  .use(cors());

export default app;
