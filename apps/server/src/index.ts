import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  ClientToServerEvents, 
  ServerToClientEvents
} from '@repo/game-types';
import { setupDuelSocket } from './features/duel/duel.socket.js';

const app = express();
const origin = process.env.VERCEL_FRONTEND_URL || '*';
app.use(cors({ origin }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: origin,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Setup Socket Features
setupDuelSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with ESM and tsx`);
});
