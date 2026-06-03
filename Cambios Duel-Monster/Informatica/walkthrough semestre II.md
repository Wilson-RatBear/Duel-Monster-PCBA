# Walkthrough: Arquitectura Semestre II (Mecánicas Probabilísticas)

He completado con éxito la refactorización para implementar la arquitectura requerida para el Segundo Semestre. Al aceptar incluir estados persistentes, el motor ahora es capaz de simular fenómenos del mundo real como estadísticas y ciclos ecológicos directamente en el flujo del duelo.

## Cambios Realizados

1. **Tipos Ampliados (`packages/game-types/src/index.ts`)**
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

export type Semester = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';

export type CareerArea = 'INFORMATICA' | 'GENERAL' | 'MATEMATICAS' | 'CIENCIAS_SOCIALES' | 'LENGUAJES' | 'ECOLOGIA';

export interface AcademicMetadata {
  semester: Semester;
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
  activeEffects: string[]; // <--- Para almacenar "Desviacion Estandar", etc.
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
   - Añadí el enum estructurado `Semester` para permitir que el frontend filtre cartas por nivel académico de la malla curricular.
   - Expandí `CareerArea` para incluir a `ECOLOGIA`, `MATEMATICAS`, `CIENCIAS_SOCIALES` y `LENGUAJES`.
   - Modifiqué la base `PlayerState` agregándole `activeEffects: string[]` que será la memoria del estado de las cartas persistentes.

2. **Iniciación del Estado del Jugador (`apps/server/src/features/duel/duel.service.ts`)**
   - ```diff:duel.service.ts
import { 
  GameState, 
  PlayerState, 
  Card, 
  MonsterCard, 
  SpellCard
} from '@repo/game-types';

export const MONSTERS: MonsterCard[] = [
  {
    id: 'm1',
    name: 'Dragón de Fuego',
    type: 'MONSTER',
    description: 'Un dragón poderoso que escupe fuego.',
    attack: 2000,
    defense: 1500,
    basicAttackName: 'Llamarada',
    specialAttackName: 'Explosión Ígnea',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm2',
    name: 'Guerrero de Hielo',
    type: 'MONSTER',
    description: 'Un guerrero forjado en las montañas heladas.',
    attack: 1800,
    defense: 2000,
    basicAttackName: 'Corte Gélido',
    specialAttackName: 'Prisión de Hielo',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm3',
    name: 'Golem de Piedra',
    type: 'MONSTER',
    description: 'Una criatura lenta pero extremadamente resistente.',
    attack: 1500,
    defense: 3000,
    basicAttackName: 'Golpe de Roca',
    specialAttackName: 'Terremoto',
    specialAttackCost: 1,
    hasAttacked: false
  }
];

export const SPELLS: SpellCard[] = [
  {
    id: 's1',
    name: 'Poción de Vida',
    type: 'SPELL',
    description: 'Recupera 1000 LP.',
    energyCost: 1
  },
  {
    id: 's2',
    name: 'Rayo Eléctrico',
    type: 'SPELL',
    description: 'Inflige 1500 de daño al monstruo enemigo.',
    energyCost: 2
  },
  {
    id: 's3',
    name: 'Escudo de Luz',
    type: 'SPELL',
    description: 'Aumenta la defensa de tu monstruo en 1000.',
    energyCost: 3
  }
];

export function createInitialPlayerState(id: string, name: string): PlayerState {
  const deck: Card[] = [...MONSTERS, ...SPELLS].sort(() => Math.random() - 0.5);
  const hand = deck.splice(0, 3);
  
  return {
    id,
    name,
    ready: false,
    hp: 8000,
    energy: 1,
    hand,
    deck,
    field: null,
    defeatedMonsters: []
  };
}

export function checkGameOver(game: GameState, attackerId: string, opponentId: string): boolean {
  const opponent = game.players[opponentId];
  if (!opponent) return false;

  const monstersLeft = 
    opponent.hand.filter(c => c.type === 'MONSTER').length + 
    opponent.deck.filter(c => c.type === 'MONSTER').length + 
    (opponent.field ? 1 : 0);

  if (monstersLeft === 0) {
    game.phase = 'GAME_OVER';
    game.winner = attackerId;
    game.logs.push(`¡${game.players[attackerId]?.name} ha ganado el duelo!`);
    return true;
  }
  return false;
}
===
import { 
  GameState, 
  PlayerState, 
  Card, 
  MonsterCard, 
  SpellCard
} from '@repo/game-types';

export const MONSTERS: MonsterCard[] = [
  {
    id: 'm1',
    name: 'Dragón de Fuego',
    type: 'MONSTER',
    description: 'Un dragón poderoso que escupe fuego.',
    attack: 2000,
    defense: 1500,
    basicAttackName: 'Llamarada',
    specialAttackName: 'Explosión Ígnea',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm2',
    name: 'Guerrero de Hielo',
    type: 'MONSTER',
    description: 'Un guerrero forjado en las montañas heladas.',
    attack: 1800,
    defense: 2000,
    basicAttackName: 'Corte Gélido',
    specialAttackName: 'Prisión de Hielo',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm3',
    name: 'Golem de Piedra',
    type: 'MONSTER',
    description: 'Una criatura lenta pero extremadamente resistente.',
    attack: 1500,
    defense: 3000,
    basicAttackName: 'Golpe de Roca',
    specialAttackName: 'Terremoto',
    specialAttackCost: 1,
    hasAttacked: false
  }
];

export const SPELLS: SpellCard[] = [
  {
    id: 's1',
    name: 'Poción de Vida',
    type: 'SPELL',
    description: 'Recupera 1000 LP.',
    energyCost: 1
  },
  {
    id: 's2',
    name: 'Rayo Eléctrico',
    type: 'SPELL',
    description: 'Inflige 1500 de daño al monstruo enemigo.',
    energyCost: 2
  },
  {
    id: 's3',
    name: 'Escudo de Luz',
    type: 'SPELL',
    description: 'Aumenta la defensa de tu monstruo en 1000.',
    energyCost: 3
  }
];

export function createInitialPlayerState(id: string, name: string): PlayerState {
  const deck: Card[] = [...MONSTERS, ...SPELLS].sort(() => Math.random() - 0.5);
  const hand = deck.splice(0, 3);
  
  return {
    id,
    name,
    ready: false,
    hp: 8000,
    energy: 1,
    hand,
    deck,
    field: null,
    defeatedMonsters: [],
    activeEffects: []
  };
}

export function checkGameOver(game: GameState, attackerId: string, opponentId: string): boolean {
  const opponent = game.players[opponentId];
  if (!opponent) return false;

  const monstersLeft = 
    opponent.hand.filter(c => c.type === 'MONSTER').length + 
    opponent.deck.filter(c => c.type === 'MONSTER').length + 
    (opponent.field ? 1 : 0);

  if (monstersLeft === 0) {
    game.phase = 'GAME_OVER';
    game.winner = attackerId;
    game.logs.push(`¡${game.players[attackerId]?.name} ha ganado el duelo!`);
    return true;
  }
  return false;
}
```
   - Inicialicé `activeEffects` como un arreglo vacío al momento en que un jugador se une a la sala (Lobby).

3. **Motor de Probabilidad Estadística (`apps/server/src/features/duel/duel.socket.ts`)**
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
      } else if (spell.academicMetadata?.academicConcept === 'Desviación Estándar') {
        player.activeEffects.push('DesviacionEstandar');
        game.logs.push(`${player.name} alteró la probabilidad de ataque enemigo con Desviación Estándar.`);
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
        // Motor de Probabilidad (Estadística Descriptiva)
        if (opponent.activeEffects && opponent.activeEffects.includes('DesviacionEstandar')) {
          const rand = Math.random();
          // Consumir efecto
          opponent.activeEffects = opponent.activeEffects.filter(e => e !== 'DesviacionEstandar');
          
          if (rand < 0.5) {
            game.logs.push(`¡El ataque de ${player.field.name} falló debido a la Desviación Estándar! (Dispersión probabilística)`);
            io.to(roomId).emit('gameUpdate', game);
            return;
          } else {
            game.logs.push(`El ataque superó la varianza estadística.`);
          }
        }

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
   - **Activación:** Cuando un jugador activa un hechizo cuyo *Academic Concept* es exactamente `'Desviación Estándar'`, el servidor lo intercepta y le añade el modificador persistente `'DesviacionEstandar'` a su lista de efectos activos.
   - **Resolución Matemática:** Intercepté el evento de `attackBasic`. Si un atacante intenta golpear a un defensor que tiene la varianza matemática encendida (`DesviacionEstandar`), se genera un cálculo aleatorio de dispersión (`Math.random() < 0.5`). 
   - Si la dispersión triunfa, el ataque falla, se envían los logs explicativos (para reforzar el concepto pedagógico) al frontend, y el efecto se consume retirándose de `activeEffects`.

## Verificación

El juego ahora soporta la creación de cartas mucho más dinámicas que simples matemáticas deterministas (ATK vs DEF). Esto nos sienta las bases para añadir el "Bioma Sostenible" de Ecología en el futuro (usando la fase de robo/End Turn para chequear `activeEffects` e inyectar Life Points).
