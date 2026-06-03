# Walkthrough: Arquitectura Semestre I (Ingeniería Civil)

La estructura del motor de juego acaba de ser reforzada con los cimientos técnicos de la carrera de Ingeniería Civil, abarcando geometría, cálculo e informática básica.

## Mecánicas Implementadas

1. **Cartas Ocultas y Geometría (`packages/game-types/src/index.ts`)**
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

export type CareerArea = 'INFORMATICA' | 'GENERAL' | 'MATEMATICAS' | 'CIENCIAS_SOCIALES' | 'LENGUAJES' | 'ECOLOGIA' | 'PETROLEO' | 'METEOROLOGIA' | 'CIVIL';

export type AtmosphericCondition = 'CLEAR' | 'HIGH_PRESSURE' | 'LOW_PRESSURE' | 'STORM';

export interface Vector2D {
  magnitude: number;
  angle: number; // grados
}

export interface DataProcessing {
  algorithmType: 'SEQUENTIAL' | 'CONDITIONAL' | 'LOOP';
  processingCost: number;
}

export interface PositionR2 {
  x: number;
  y: number;
}

export interface PositionR3 extends PositionR2 {
  z: number;
}

export type ReactionMechanism = 'SN1' | 'SN2' | 'RADICAL' | 'ADDITION';
export type GeometricProjection = 'ORTOGONAL' | 'ISOMETRICA' | 'TOPOGRAFICA';
export type CartographicSymbol = 'ISOHIETA' | 'ISOBARA' | 'CURVA_NIVEL' | 'RIO' | 'SUELO_ARCILLOSO';

export interface AcademicMetadata {
  semester: Semester;
  careerArea: CareerArea;
  academicConcept: string; // e.g. "Derivadas", "Lógica Proposicional"
  learningModule: string; // e.g. "Cálculo I", "Lógica"
}

export interface AcademicCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
  academicMetadata: AcademicMetadata;
  // Semestre II Petróleo
  bondEnergy?: number;
  reactionMechanism?: ReactionMechanism;
  geometricProjection?: GeometricProjection;
  // Semestre II Meteorología
  soilInteraction?: string;
  cartographicSymbol?: CartographicSymbol;
  // Semestre I Civil
  isFaceDown?: boolean;
}

export interface MonsterCard extends AcademicCard {
  type: 'MONSTER';
  attack: number;
  defense: number;
  basicAttackName: string;
  specialAttackName: string;
  specialAttackCost: number;
  hasAttacked?: boolean;
  position?: PositionR3; // Geometría Analítica y Dibujo Topográfico
  spatialRange?: number; // Radio de ataque máximo
  stoichiometricCost?: number; // Química I
}

export interface SpellCard extends AcademicCard {
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
  turnDamageHistory: number[];
  currentTurnDamage: number;
  globalWeather: AtmosphericCondition;
  electricPotential: number; // Física II
  fieldLayers: SpellCard[];  // Vivencial II (Capas SIG)
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
  summonMonster: (cardId: string, position?: PositionR3, faceDown?: boolean) => void;
  castSpell: (cardId: string) => void;
  attackBasic: (attackVector?: Vector2D) => void;
  attackSpecial: () => void;
  endTurn: () => void;
}

```
   - Añadida la categoría `CIVIL` y la propiedad `isFaceDown`.
   - Modificamos la firma de los WebSockets para permitirle al cliente jugar cartas "boca abajo" sin revelar sus estadísticas, emulando planos sin revelar.

2. **Cálculo y Ofimática Avanzada (`apps/server/src/features/duel/duel.socket.ts`)**
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
        isFirstTurn: true,
        turnDamageHistory: [],
        currentTurnDamage: 0,
        globalWeather: 'CLEAR',
        electricPotential: 0,
        fieldLayers: []
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

    socket.on('summonMonster', (cardId, position, faceDown) => {
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

      const monsterToSummon = player.hand[cardIndex] as MonsterCard;

      // Validación Estequiométrica (Química I)
      if (monsterToSummon.stoichiometricCost) {
        if (player.hand.length - 1 < monsterToSummon.stoichiometricCost) {
          socket.emit('error', `Balance Estequiométrico fallido: Necesitas descartar ${monsterToSummon.stoichiometricCost} cartas de tu mano.`);
          return;
        }
        game.logs.push(`${player.name} descartó ${monsterToSummon.stoichiometricCost} cartas por Balance Estequiométrico.`);
        player.hand.splice(cardIndex, 1);
        player.hand.splice(0, monsterToSummon.stoichiometricCost);
      } else {
        player.hand.splice(cardIndex, 1);
      }

      // Control Espacial (Geometría Analítica y Topografía R3)
      monsterToSummon.position = position || { x: 0, y: 0, z: 0 };
      monsterToSummon.hasAttacked = false;
      
      // Semestre I Civil - Cartas Ocultas
      monsterToSummon.isFaceDown = faceDown || false;
      player.field = monsterToSummon;
      
      if (monsterToSummon.isFaceDown) {
        game.logs.push(`${player.name} colocó una carta oculta en (${monsterToSummon.position.x}, ${monsterToSummon.position.y}).`);
      } else {
        game.logs.push(`${player.name} invoca a ${monsterToSummon.name} en la coordenada (${monsterToSummon.position.x}, ${monsterToSummon.position.y}).`);
      }

      if (player.deck.length > 0 && player.hand.length < 3) {
        player.hand.push(player.deck.shift()!);
        if (player.activeEffects && player.activeEffects.includes('GradientePotencial')) {
          game.electricPotential += 2; // Acumula carga electrostática
        }
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
      } else if (spell.academicMetadata?.academicConcept === 'Integral Definida') {
        // Calcular área bajo la curva (suma de daño en los últimos 3 turnos)
        const area = game.turnDamageHistory.slice(-3).reduce((a, b) => a + b, 0);
        opponent.hp -= area;
        game.logs.push(`¡Integral Definida! ${opponent.name} recibe ${area} de daño masivo del área bajo la curva.`);
      } else if (spell.academicMetadata?.academicConcept === 'Tercera Ley de Newton') {
        player.activeEffects.push('TerceraLeyNewton');
        game.logs.push(`${player.name} preparó una reacción igual y opuesta (Tercera Ley de Newton).`);
      } else if (spell.academicMetadata?.academicConcept === 'Frente de Baja Presión') {
        game.globalWeather = 'LOW_PRESSURE';
        game.logs.push(`¡Frente de Baja Presión! El clima cambió a inestable, afectando la dinámica de los vectores.`);
      } else if (spell.academicMetadata?.academicConcept === 'Mecanismo SN1') {
        if (player.field) {
          player.field = null; // Se sacrifica para el primer paso
          player.activeEffects.push('CarbocationWait');
          game.logs.push(`${player.name} inicia un mecanismo SN1. El intermediario carbocatión requiere 1 turno de estabilización.`);
        }
      } else if (spell.academicMetadata?.academicConcept === 'Tasa de Cambio Extrema') {
        player.activeEffects.push('DerivadaPredictiva');
        game.logs.push(`${player.name} calcula la Tasa de Cambio para anular ataques acelerados (Derivada).`);
      } else if (spell.academicMetadata?.academicConcept === 'Gradiente de Potencial') {
        player.activeEffects.push('GradientePotencial');
        game.logs.push(`${player.name} activa Gradiente de Potencial. Robar cartas acumulará carga eléctrica al tablero.`);
      } else if (['Capa SIG: Curvas de Nivel', 'Sólido de Revolución'].includes(spell.academicMetadata?.academicConcept || '')) {
        game.fieldLayers.push(spell);
        game.logs.push(`${player.name} añadió la capa SIG/Hechizo Permanente: ${spell.name} al tablero topográfico.`);
      } else if (spell.academicMetadata?.academicConcept === 'Serie Homóloga ($CH_2$)') {
        if (player.field) {
          player.field = null; // Sacrifica el alcano menor
          game.logs.push(`${player.name} aplica Serie Homóloga, sacrificando un alcano para escalar en la cadena química.`);
        }
      } else if (spell.academicMetadata?.academicConcept === 'Proyección Ortogonal') {
        if (opponent.field && opponent.field.isFaceDown) {
          opponent.field.isFaceDown = false;
          game.logs.push(`¡Proyección Ortogonal! Se ha revelado la carta oculta del oponente: ${opponent.field.name}.`);
        } else {
          game.logs.push(`Proyección Ortogonal: El oponente no tiene cartas ocultas en el campo.`);
        }
      } else if (spell.academicMetadata?.academicConcept === 'Punto de Inflexión Crítico') {
        if (player.hp <= 2000) {
          player.activeEffects.push('PuntoCritico');
          game.logs.push(`¡Punto de Inflexión Crítico! Estando en el mínimo local, ${player.name} calcula la derivada y duplica sus estadísticas.`);
        } else {
          socket.emit('error', 'Tu HP no es lo suficientemente bajo (Mínimo Local) para activar esta trampa.');
          return;
        }
      } else if (spell.academicMetadata?.academicConcept === 'Macro de Hoja de Cálculo') {
        game.fieldLayers.push(spell);
        game.logs.push(`${player.name} ejecutó una Macro de Hoja de Cálculo. Sus recursos de carta y energía se automatizarán.`);
      } else if (spell.academicMetadata?.academicConcept === 'Valencia de Resistencia') {
        player.hp += 1000;
        player.activeEffects.push('DobleAtaque');
        game.logs.push(`¡Valencia de Resistencia! ${player.name} mejora su aptitud física ganando 1000 HP y el efecto de doble ataque.`);
      }
      
      game.electricPotential += 1; // Emitir magia genera algo de estática

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

    socket.on('attackBasic', (attackVector) => {
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
        if (player.activeEffects && player.activeEffects.includes('DobleAtaque')) {
          player.activeEffects = player.activeEffects.filter(e => e !== 'DobleAtaque');
          game.logs.push(`(${player.name} utiliza su Valencia de Resistencia para atacar por segunda vez!)`);
        } else {
          socket.emit('error', 'Este monstruo ya ha atacado este turno.');
          return;
        }
      }

      player.field.hasAttacked = true;

      if (!opponent.field) {
        let baseAtk = player.field.attack;
        if (player.activeEffects && player.activeEffects.includes('PuntoCritico')) {
          baseAtk *= 2;
        }
        game.logs.push(`${player.name} ataca directamente.`);
        opponent.hp -= baseAtk;
      } else {
        // Decodificador de Canal (Lenguaje y Comunicación)
        if (opponent.activeEffects && opponent.activeEffects.includes('DecodificadorCanal')) {
          game.logs.push(`¡El receptor decodificó el ataque! El mensaje de agresión ha sido anulado debido al Decodificador de Canal.`);
          opponent.activeEffects = opponent.activeEffects.filter(e => e !== 'DecodificadorCanal');
          io.to(roomId).emit('gameUpdate', game);
          return;
        }
        // Control Espacial - Fórmula de distancia en R2 (Geometría)
        if (player.field.position && opponent.field.position && player.field.spatialRange !== undefined) {
          const p1 = player.field.position;
          const p2 = opponent.field.position;
          const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
          
          if (distance > player.field.spatialRange) {
            game.logs.push(`¡El objetivo está fuera de rango espacial! Distancia: ${distance.toFixed(1)}, Rango: ${player.field.spatialRange}.`);
            io.to(roomId).emit('gameUpdate', game);
            return;
          }
        }

        // Análisis de Tendencia Predictiva (Matemática I - Derivadas)
        if (opponent.activeEffects && opponent.activeEffects.includes('DerivadaPredictiva')) {
          if (game.turnDamageHistory.length >= 2) {
            const lastDamage = game.turnDamageHistory[game.turnDamageHistory.length - 1];
            const prevDamage = game.turnDamageHistory[game.turnDamageHistory.length - 2];
            const rateOfChange = lastDamage - prevDamage;
            
            if (rateOfChange > 0) {
              game.logs.push(`¡Derivada Predictiva! El ataque fue anticipado por la aceleración positiva del daño anterior. Ataque anulado.`);
              opponent.activeEffects = opponent.activeEffects.filter(e => e !== 'DerivadaPredictiva');
              io.to(roomId).emit('gameUpdate', game);
              return;
            }
          }
        }

        // Hidrodinámica: Tubo de Venturi (Física II)
        let attackPower = player.field.attack;
        if (player.activeEffects && player.activeEffects.includes('PuntoCritico')) {
          attackPower *= 2; // Si el atacante está en un mínimo local
        }
        if (player.field.name === 'Tubo de Venturi') {
          // Principio de continuidad: a menor área (menos cartas), mayor velocidad/daño
          const fieldOccupancy = (player.field ? 1 : 0) + player.hand.length;
          const venturiBonus = Math.floor(1000 / (fieldOccupancy || 1));
          attackPower += venturiBonus;
          game.logs.push(`(Presión Hidrodinámica aumentó el ATK del flujo en +${venturiBonus})`);
        }

        // Integración de Sólido de Revolución (Matemática II)
        const hasSolido = game.fieldLayers.some(layer => layer.academicMetadata?.academicConcept === 'Sólido de Revolución');
        let defensePower = opponent.field.defense;
        if (opponent.activeEffects && opponent.activeEffects.includes('PuntoCritico')) {
          defensePower *= 2; // Si el defensor está en un mínimo local
        }
        
        if (hasSolido && game.turnDamageHistory.length > 0) {
          // Aumenta geométricamente en función de los turnos pasados integrando el volumen
          const turnsActive = game.turnDamageHistory.length;
          const integrationBonus = 100 * Math.pow(turnsActive, 2);
          defensePower += integrationBonus;
          game.logs.push(`(Sólido de Revolución sumó +${integrationBonus} a la DEF integrada)`);
        }

        let damage = attackPower - defensePower;

        // Cinemática de Vectores y Meteorología (Física I)
        if (attackVector) {
          // Descomposición física del vector en R2
          const rad = attackVector.angle * (Math.PI / 180);
          const effectiveForce = attackVector.magnitude * Math.cos(rad);
          
          let friction = 1;
          if (game.globalWeather === 'LOW_PRESSURE') {
            friction = 0.8;
            game.logs.push(`(El sistema de Baja Presión resta 20% de la energía al proyectil)`);
          } else if (game.globalWeather === 'STORM') {
            friction = 0.5;
          }
          
          damage = Math.floor(effectiveForce * friction) - defensePower;
          game.logs.push(`${player.name} dispara un vector cinemático (Mag: ${attackVector.magnitude}, Ang: ${attackVector.angle}°).`);
        } else {
          game.logs.push(`${player.name} ataca con ${player.field.name} a ${opponent.field.name}.`);
        }

        if (damage > 0) {
          game.logs.push(`${opponent.field.name} recibe ${damage} de daño y es destruido.`);
          opponent.hp -= damage;
          game.currentTurnDamage += damage;
          opponent.defeatedMonsters.push(opponent.field);
          opponent.field = null;

          // Tercera Ley de Newton (Física I)
          if (opponent.activeEffects && opponent.activeEffects.includes('TerceraLeyNewton')) {
            player.hp -= damage;
            game.currentTurnDamage += damage;
            game.logs.push(`¡Tercera Ley de Newton! ${player.name} recibe ${damage} de daño por acción y reacción.`);
          }

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

      // Integración de Daño (Cálculo II)
      game.turnDamageHistory.push(game.currentTurnDamage);
      game.currentTurnDamage = 0;

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      
      // Tormenta Eléctrica (Física II)
      if (game.electricPotential >= 10) {
        game.logs.push(`⚡ ¡El potencial eléctrico del tablero alcanzó un nivel crítico (${game.electricPotential})! Tormenta Eléctrica detonada.`);
        Object.values(game.players).forEach(p => {
          if (!p.activeEffects.includes('GradientePotencial')) {
            p.hp -= 2000;
            game.logs.push(`⚡ ${p.name} recibe 2000 de daño por la violenta descarga eléctrica.`);
          } else {
            game.logs.push(`⚡ ${p.name} absorbió la descarga de la tormenta usando su Gradiente de Potencial.`);
          }
        });
        game.electricPotential = 0; // Descarga completada, el capacitor se vacía
        checkGameOver(game, playerId!, opponentId);
      }

      game.turn = opponentId;
      
      // Macro de Hoja de Cálculo (Informática)
      const hasMacro = game.fieldLayers.some(layer => layer.academicMetadata?.academicConcept === 'Macro de Hoja de Cálculo');
      const nextPlayer = game.players[opponentId]!;
      if (hasMacro) {
        if (nextPlayer.deck.length > 0) {
          nextPlayer.hand.push(nextPlayer.deck.shift()!);
          game.logs.push(`(La Macro de Hoja de Cálculo ha automatizado el flujo de trabajo: +1 carta extra)`);
        }
      }
      
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
   - **Proyección Ortogonal:** Esta magia escanea el campo enemigo y revela su carta oculta cambiando `isFaceDown` a `false`.
   - **Mínimos Locales (Punto Crítico):** Si juegas el *Punto de Inflexión Crítico* mientras tu HP está por debajo de 2000, calculas la derivada local y el servidor duplica mágicamente tanto tu ATK como tu DEF a la hora de resolver el daño, volteando la partida.
   - **Macros (Hoja de Cálculo):** Una vez que este hechizo permanente se ancla a las capas SIG, en el evento `endTurn` tu jugador recibe automáticamente 1 carta extra de ganancia de recursos sin gastar acciones.
   - **Comunicación y Valencias:** Integrada la lectura del canal para "Decodificar" e invalidar ataques, y la *Valencia de Resistencia* que dota a tu jugador con +1000 HP y le da el permiso de saltarse la regla de un-ataque-por-turno.

## Siguientes Pasos

> [!TIP]
> ¡La base de conocimientos de 4 ingenierías (Informática, Petróleo, Meteorología y Civil) está completamente viva en el servidor de Socket.io!

Este backend se ha convertido en un motor GBL formidable. Ahora, el estudiante puede usar química orgánica y física hidrodinámica contra un oponente que usa proyecciones geométricas y límites de cálculo.
**¿Qué te gustaría hacer ahora?** Si el backend está listo para ti, podríamos saltar a Next.js para darle vida visual a este campo de batalla. O bien, si deseas incluir los temas del Semestre II de Civil (como Estática y Mecánica de Materiales), podemos planificarlo enseguida.
