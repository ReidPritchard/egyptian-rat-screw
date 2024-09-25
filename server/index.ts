import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { SETTINGS } from './config';
import { setupSocketHandlers } from './socketHandlers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: '*',
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

setupSocketHandlers(io);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

httpServer.listen(SETTINGS.PORT, () => {
  console.log(`Server running on port ${SETTINGS.PORT}`);
});
