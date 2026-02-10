import express from 'express';
import { matchesRouter } from './routes/matches.js';
import http from 'http';
import dotenv from 'dotenv';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Apply security middleware arcjet
app.use(securityMiddleware())

app.use('/matches', matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket server is available at ${baseUrl.replace('http', 'ws')}/ws`);
});