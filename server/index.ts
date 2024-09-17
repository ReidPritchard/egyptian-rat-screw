import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socketHandlers';
import { PORT } from './config';

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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
