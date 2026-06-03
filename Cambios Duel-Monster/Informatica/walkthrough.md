# Walkthrough: Arquitectura GBL de Duel Monsters

He completado la implementación técnica inicial basada en nuestro plan. La arquitectura ya cuenta con la inyección de atributos académicos en todo el monorepo y la estructura de validación en tiempo real.

## Cambios Realizados

1. **Modelos Refactorizados (`packages/game-types/src/index.ts`)**
   - ```diff:index.ts
export type CardType = 'MONSTER' | 'SPELL' | 'TRAP';

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
}

export interface MonsterCard extends BaseCard {
  type: 'MONSTER';
  attack: number;
  defense: number;
  basicAttackName: string;
  specialAttackName: string;
  specialAttackCost: number;
  hasAttacked?: boolean;
}

export interface SpellCard extends BaseCard {
  type: 'SPELL';
  energyCost: number;
}

export type Card = MonsterCard | SpellCard;

export interface PlayerState {
  id: string;
  name: string;
  ready: boolean;
  hp: number; // For now, maybe we use it or just the 3 monsters rule
  energy: number;
  hand: Card[];
  deck: Card[];
  field: MonsterCard | null;
  defeatedMonsters: MonsterCard[];
}

export type GamePhase = 'LOBBY' | 'STARTING' | 'BATTLE' | 'GAME_OVER';

export interface GameState {
  roomId: string;
  players: Record<string, PlayerState>;
  turn: string; // Player ID
  phase: GamePhase;
  winner: string | null;
  logs: string[];
  isFirstTurn: boolean;
}

export interface ServerToClientEvents {
  gameUpdate: (state: GameState) => void;
  roomCreated: (roomId: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerId: string) => void;
  joinRoom: (roomId: string, playerId: string) => void;
  reconnect: (roomId: string, playerId: string) => void;
  setName: (name: string) => void;
  setReady: (ready: boolean) => void;
  summonMonster: (cardId: string) => void;
  castSpell: (cardId: string) => void;
  attackBasic: () => void;
  attackSpecial: () => void;
  endTurn: () => void;
}

===
export type CardType = 'MONSTER' | 'SPELL' | 'TRAP';

export type CareerArea = 'INFORMATICA' | 'GENERAL';

export interface AcademicMetadata {
  careerArea: CareerArea;
  academicConcept: string; // e.g. "Derivadas", "Lógica Proposicional"
  learningModule: string; // e.g. "Cálculo I", "Lógica"
}

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
  academicMetadata: AcademicMetadata;
}

export interface MonsterCard extends BaseCard {
  type: 'MONSTER';
  attack: number;
  defense: number;
  basicAttackName: string;
  specialAttackName: string;
  specialAttackCost: number;
  hasAttacked?: boolean;
}

export interface SpellCard extends BaseCard {
  type: 'SPELL';
  energyCost: number;
}

export type Card = MonsterCard | SpellCard;

export interface PlayerState {
  id: string;
  name: string;
  ready: boolean;
  hp: number; // For now, maybe we use it or just the 3 monsters rule
  energy: number;
  hand: Card[];
  deck: Card[];
  field: MonsterCard | null;
  defeatedMonsters: MonsterCard[];
}

export type GamePhase = 'LOBBY' | 'STARTING' | 'BATTLE' | 'GAME_OVER';

export interface GameState {
  roomId: string;
  players: Record<string, PlayerState>;
  turn: string; // Player ID
  phase: GamePhase;
  winner: string | null;
  logs: string[];
  isFirstTurn: boolean;
}

export interface ServerToClientEvents {
  gameUpdate: (state: GameState) => void;
  roomCreated: (roomId: string) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerId: string) => void;
  joinRoom: (roomId: string, playerId: string) => void;
  reconnect: (roomId: string, playerId: string) => void;
  setName: (name: string) => void;
  setReady: (ready: boolean) => void;
  summonMonster: (cardId: string) => void;
  castSpell: (cardId: string) => void;
  attackBasic: () => void;
  attackSpecial: () => void;
  endTurn: () => void;
}

```
   - Añadida la interfaz `AcademicMetadata` con campos clave como `careerArea` y `academicConcept`. Esto garantiza que tanto el frontend en Next.js como el servidor mantengan coherencia de datos sobre la información académica de cada carta.

2. **Validador Académico (`apps/server/src/features/duel/academic-validator.ts`)**
   - He creado un sistema interceptor abstracto que aisla la lógica de negocio académica del motor puro de combate de Socket.io.
   - El código base incluye una función genérica `validateAcademicAction` que pre-procesa el concepto académico (`Regla de la Cadena`, `Modus Ponens`, etc.) antes de validar su efecto en la partida.

3. **Motor en Tiempo Real (`apps/server/src/features/duel/duel.socket.ts`)**
   - ```diff:duel.socket.ts
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  ClientToServerEvents, 
  ServerToClientEvents,
  MonsterCard,
  SpellCard
} from '@repo/game-types';
import { createInitialPlayerState, checkGameOver } from './duel.service.ts';

const games: Record<string, GameState> = {};
const socketToPlayerId: Record<string, string> = {};
const playerIdToRoom: Record<string, string> = {};

export function setupDuelSocket(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createRoom', (playerId) => {
      const roomId = uuidv4().substring(0, 6).toUpperCase();
      games[roomId] = {
        roomId,
        players: {},
        turn: '',
        phase: 'LOBBY',
        winner: null,
        logs: [`Sala ${roomId} creada.`],
        isFirstTurn: true
      };
      
      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      games[roomId].players[playerId] = createInitialPlayerState(playerId, 'Jugador 1');
      
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('gameUpdate', games[roomId]);
    });

    socket.on('joinRoom', (roomId, playerId) => {
      const game = games[roomId];
      if (!game) {
        socket.emit('error', 'La sala no existe.');
        return;
      }

      if (Object.keys(game.players).length >= 2 && !game.players[playerId]) {
        socket.emit('error', 'La sala está llena.');
        return;
      }

      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      if (!game.players[playerId]) {
        game.players[playerId] = createInitialPlayerState(playerId, 'Jugador 2');
        game.logs.push(`Jugador unido a la sala ${roomId}.`);
      }
      
      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('reconnect', (roomId, playerId) => {
      const game = games[roomId];
      if (game && game.players[playerId]) {
        socket.join(roomId);
        socketToPlayerId[socket.id] = playerId;
        playerIdToRoom[playerId] = roomId;
        io.to(roomId).emit('gameUpdate', game);
      }
    });

    socket.on('setName', (name) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const player = games[roomId].players[playerId!];
      if (player) {
        player.name = name;
        io.to(roomId).emit('gameUpdate', games[roomId]);
      }
    });

    socket.on('setReady', (ready) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      const player = game.players[playerId!];
      if (player) {
        player.ready = ready;
        
        const players = Object.values(game.players);
        const allReady = players.length === 2 && players.every(p => p.ready);
        
        if (allReady) {
          game.phase = 'BATTLE';
          game.turn = Object.keys(game.players)[0]!;
          game.logs.push('¡El duelo comienza!');
        }
        
        io.to(roomId).emit('gameUpdate', game);
      }
    });

    socket.on('summonMonster', (cardId) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      
      const player = game.players[playerId!];
      if (!player) return;

      if (player.field) {
        socket.emit('error', 'Ya tienes un monstruo en el campo.');
        return;
      }

      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'MONSTER');
      if (cardIndex === -1) return;

      const monster = player.hand.splice(cardIndex, 1)[0] as MonsterCard;
      monster.hasAttacked = false;
      player.field = monster;
      game.logs.push(`${player.name} invoca a ${monster.name}.`);

      if (player.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(player.deck.shift()!);
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('castSpell', (cardId) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;

      const player = game.players[playerId!];
      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'SPELL');
      if (cardIndex === -1) return;

      const spell = player.hand[cardIndex] as SpellCard;
      if (player.energy < spell.energyCost) {
        socket.emit('error', 'No tienes suficiente energía.');
        return;
      }

      player.energy -= spell.energyCost;
      player.hand.splice(cardIndex, 1);
      game.logs.push(`${player.name} activa el hechizo: ${spell.name}.`);

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      if (spell.id === 's1') {
        player.hp += 1000;
        game.logs.push(`${player.name} recupera 1000 LP.`);
      } else if (spell.id === 's2') {
        if (opponent.field) {
          game.logs.push(`El rayo impacta en ${opponent.field.name}.`);
          opponent.defeatedMonsters.push(opponent.field);
          opponent.field = null;
          checkGameOver(game, playerId!, opponentId);
        } else {
          opponent.hp -= 1500;
          game.logs.push(`${opponent.name} recibe 1500 de daño directo.`);
        }
      }

      if (player.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(player.deck.shift()!);
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('attackBasic', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      if (game.isFirstTurn) {
        socket.emit('error', 'No puedes atacar en el primer turno.');
        return;
      }

      const player = game.players[playerId!];
      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      if (!player.field) {
        socket.emit('error', 'No tienes un monstruo para atacar.');
        return;
      }

      if (player.field.hasAttacked) {
        socket.emit('error', 'Este monstruo ya ha atacado este turno.');
        return;
      }

      player.field.hasAttacked = true;

      if (!opponent.field) {
        game.logs.push(`${player.name} ataca directamente.`);
        opponent.hp -= player.field.attack;
      } else {
        game.logs.push(`${player.name} ataca con ${player.field.name} a ${opponent.field.name}.`);
        const damage = player.field.attack - opponent.field.defense;
        if (damage > 0) {
          game.logs.push(`${opponent.field.name} ha sido destruido.`);
          opponent.defeatedMonsters.push(opponent.field);
          opponent.field = null;
          checkGameOver(game, playerId!, opponentId);
        } else {
          game.logs.push(`El ataque ha sido bloqueado.`);
        }
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('endTurn', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;

      if (game.isFirstTurn) game.isFirstTurn = false;

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      game.turn = opponentId;
      
      const nextPlayer = game.players[opponentId]!;
      if (nextPlayer.field) nextPlayer.field.hasAttacked = false;
      if (nextPlayer.energy < 3) nextPlayer.energy += 1;

      while (nextPlayer.hand.length < 3 && nextPlayer.deck.length > 0) {
        nextPlayer.hand.push(nextPlayer.deck.shift()!);
      }
      
      game.logs.push(`Turno de ${nextPlayer.name}.`);
      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      delete socketToPlayerId[socket.id];
    });
  });
}
===
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  ClientToServerEvents, 
  ServerToClientEvents,
  MonsterCard,
  SpellCard
} from '@repo/game-types';
import { createInitialPlayerState, checkGameOver } from './duel.service.ts';
import { validateAcademicAction } from './academic-validator.ts';

// Mock/Pseudo-código para sincronización con PostgreSQL
const DbSyncService = {
  syncProgress: async (playerId: string, concept: string, masteryPoints: number) => {
    // Aquí iría la lógica usando ORM o pg.
    // Ej: await db.query('UPDATE progress SET xp = xp + $1 WHERE student_id = $2 AND concept = $3', [...])
    console.log(`[DB SYNC] Progreso de ${playerId} en ${concept} guardado (+${masteryPoints} XP).`);
  }
};

const games: Record<string, GameState> = {};
const socketToPlayerId: Record<string, string> = {};
const playerIdToRoom: Record<string, string> = {};

export function setupDuelSocket(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createRoom', (playerId) => {
      const roomId = uuidv4().substring(0, 6).toUpperCase();
      games[roomId] = {
        roomId,
        players: {},
        turn: '',
        phase: 'LOBBY',
        winner: null,
        logs: [`Sala ${roomId} creada.`],
        isFirstTurn: true
      };
      
      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      games[roomId].players[playerId] = createInitialPlayerState(playerId, 'Jugador 1');
      
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('gameUpdate', games[roomId]);
    });

    socket.on('joinRoom', (roomId, playerId) => {
      const game = games[roomId];
      if (!game) {
        socket.emit('error', 'La sala no existe.');
        return;
      }

      if (Object.keys(game.players).length >= 2 && !game.players[playerId]) {
        socket.emit('error', 'La sala está llena.');
        return;
      }

      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      if (!game.players[playerId]) {
        game.players[playerId] = createInitialPlayerState(playerId, 'Jugador 2');
        game.logs.push(`Jugador unido a la sala ${roomId}.`);
      }
      
      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('reconnect', (roomId, playerId) => {
      const game = games[roomId];
      if (game && game.players[playerId]) {
        socket.join(roomId);
        socketToPlayerId[socket.id] = playerId;
        playerIdToRoom[playerId] = roomId;
        io.to(roomId).emit('gameUpdate', game);
      }
    });

    socket.on('setName', (name) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const player = games[roomId].players[playerId!];
      if (player) {
        player.name = name;
        io.to(roomId).emit('gameUpdate', games[roomId]);
      }
    });

    socket.on('setReady', (ready) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      const player = game.players[playerId!];
      if (player) {
        player.ready = ready;
        
        const players = Object.values(game.players);
        const allReady = players.length === 2 && players.every(p => p.ready);
        
        if (allReady) {
          game.phase = 'BATTLE';
          game.turn = Object.keys(game.players)[0]!;
          game.logs.push('¡El duelo comienza!');
        }
        
        io.to(roomId).emit('gameUpdate', game);
      }
    });

    socket.on('summonMonster', (cardId) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      
      const player = game.players[playerId!];
      if (!player) return;

      if (player.field) {
        socket.emit('error', 'Ya tienes un monstruo en el campo.');
        return;
      }

      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'MONSTER');
      if (cardIndex === -1) return;

      const monster = player.hand.splice(cardIndex, 1)[0] as MonsterCard;
      monster.hasAttacked = false;
      player.field = monster;
      game.logs.push(`${player.name} invoca a ${monster.name}.`);

      if (player.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(player.deck.shift()!);
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('castSpell', (cardId) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;

      const player = game.players[playerId!];
      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'SPELL');
      if (cardIndex === -1) return;

      const spell = player.hand[cardIndex] as SpellCard;
      
      // Validación Académica (GBL)
      const validationResult = validateAcademicAction(spell, game);
      if (!validationResult.success) {
        socket.emit('error', `Validación fallida: ${validationResult.message}`);
        return;
      }

      if (player.energy < spell.energyCost) {
        socket.emit('error', 'No tienes suficiente energía.');
        return;
      }

      player.energy -= spell.energyCost;
      player.hand.splice(cardIndex, 1);
      game.logs.push(`${player.name} activa el hechizo: ${spell.name}.`);

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      if (spell.id === 's1') {
        player.hp += 1000;
        game.logs.push(`${player.name} recupera 1000 LP.`);
      } else if (spell.id === 's2') {
        if (opponent.field) {
          game.logs.push(`El rayo impacta en ${opponent.field.name}.`);
          opponent.defeatedMonsters.push(opponent.field);
          opponent.field = null;
          checkGameOver(game, playerId!, opponentId);
        } else {
          opponent.hp -= 1500;
          game.logs.push(`${opponent.name} recibe 1500 de daño directo.`);
        }
      }

      // Sincronización asíncrona hacia PostgreSQL (GBL)
      if (spell.academicMetadata?.academicConcept) {
        DbSyncService.syncProgress(
          playerId!, 
          spell.academicMetadata.academicConcept, 
          10
        ).catch(e => console.error('Error sincronizando en PostgreSQL', e));
      }

      if (player.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(player.deck.shift()!);
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('attackBasic', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      if (game.isFirstTurn) {
        socket.emit('error', 'No puedes atacar en el primer turno.');
        return;
      }

      const player = game.players[playerId!];
      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      if (!player.field) {
        socket.emit('error', 'No tienes un monstruo para atacar.');
        return;
      }

      if (player.field.hasAttacked) {
        socket.emit('error', 'Este monstruo ya ha atacado este turno.');
        return;
      }

      player.field.hasAttacked = true;

      if (!opponent.field) {
        game.logs.push(`${player.name} ataca directamente.`);
        opponent.hp -= player.field.attack;
      } else {
        game.logs.push(`${player.name} ataca con ${player.field.name} a ${opponent.field.name}.`);
        const damage = player.field.attack - opponent.field.defense;
        if (damage > 0) {
          game.logs.push(`${opponent.field.name} ha sido destruido.`);
          opponent.defeatedMonsters.push(opponent.field);
          opponent.field = null;
          checkGameOver(game, playerId!, opponentId);
        } else {
          game.logs.push(`El ataque ha sido bloqueado.`);
        }
      }

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('endTurn', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;

      if (game.isFirstTurn) game.isFirstTurn = false;

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      game.turn = opponentId;
      
      const nextPlayer = game.players[opponentId]!;
      if (nextPlayer.field) nextPlayer.field.hasAttacked = false;
      if (nextPlayer.energy < 3) nextPlayer.energy += 1;

      while (nextPlayer.hand.length < 3 && nextPlayer.deck.length > 0) {
        nextPlayer.hand.push(nextPlayer.deck.shift()!);
      }
      
      game.logs.push(`Turno de ${nextPlayer.name}.`);
      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      delete socketToPlayerId[socket.id];
    });
  });
}
```
   - **Interceptado:** El evento `castSpell` ahora pasa por el Validador Académico. Si el jugador intenta usar la carta pero las reglas lógicas/matemáticas del estado del tablero no lo permiten, el servidor lo bloquea emitiendo un evento `error` hacia el cliente.
   - **Persistencia (Sincronización):** Añadí la infraestructura de código asíncrono para PostgreSQL. Una vez que el validador aprueba la carta y el motor aplica el daño/curación, invocamos a un servicio mockeado `DbSyncService` de manera que el hilo principal del combate jamás sea bloqueado por una escritura de base de datos.

## Consideraciones Próximas

> [!NOTE]
> Dado que estamos en un entorno monorepo con `pnpm`, para arrancar exitosamente y ver estos cambios reflejados, necesitarás asegurarte de que el entorno local tiene `pnpm` en el Path global o instalar dependencias usando tu gestor habitual (`npm i`).

Para añadir físicamente las 25 cartas a tu base de datos y al frontend, el siguiente paso sería popular tu *seed* de base de datos o definir un repositorio constante con estas cartas utilizando el nuevo contrato `AcademicMetadata`.
