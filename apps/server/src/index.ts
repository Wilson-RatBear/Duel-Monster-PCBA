import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  ClientToServerEvents, 
  ServerToClientEvents
} from '@repo/game-types';
import { setupDuelSocket } from './features/duel/duel.socket.ts';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Setup Socket Features
setupDuelSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with ESM and tsx`);
});
