import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameState, PlayerState, MonsterCard, SpellCard, ClientToServerEvents, ServerToClientEvents, MONSTERS, SPELLS, Card, getCardCareers } from '@repo/game-types';
import { getUserProfile, addStudentProgress } from './user.service.js';
import { createInitialPlayerState as createCpuPlayerState } from './duel.service.js';
import { validateAcademicAction } from './academic-validator.js';

const games: Record<string, GameState> = {};
const socketToPlayerId: Record<string, string> = {};
const playerIdToRoom: Record<string, string> = {};

function createInitialPlayerState(id: string, name: string): PlayerState {
  return {
    id,
    name,
    ready: false,
    hp: 4000,
    energy: 1,
    hand: [],
    deck: [],
    monsterZone: [null, null, null],
    defeatedMonsters: [],
    hasDrawnThisTurn: false,
    unlockedCardIds: []
  };
}

function checkGameOver(game: GameState, p1: string, p2: string, io?: Server<ClientToServerEvents, ServerToClientEvents>, roomId?: string): boolean {
  if (game.players[p1].hp <= 0) {
    game.phase = 'GAME_OVER';
    game.winner = p2;
    if (io && roomId) io.to(roomId).emit('gameUpdate', game);
    return true;
  } else if (game.players[p2].hp <= 0) {
    game.phase = 'GAME_OVER';
    game.winner = p1;
    if (io && roomId) io.to(roomId).emit('gameUpdate', game);
    return true;
  }
  return false;
}

function updateDominantTheme(game: GameState) {
  const counts: Record<string, number> = {};
  let totalMonsters = 0;

  for (const player of Object.values(game.players)) {
    for (const monster of player.monsterZone) {
      if (monster && monster.area) {
        const careers = getCardCareers(monster.area);
        for (const career of careers) {
          if (career !== 'NEUTRAL') {
            counts[career] = (counts[career] || 0) + 1;
            totalMonsters++;
          }
        }
      }
    }
  }

  if (totalMonsters === 0 || Object.keys(counts).length === 0) {
    game.dominantTheme = 'NEUTRAL';
    return;
  }

  let maxCount = 0;
  let dominantArea = 'NEUTRAL';
  let isTie = false;

  for (const [area, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantArea = area;
      isTie = false;
    } else if (count === maxCount) {
      isTie = true;
    }
  }

  game.dominantTheme = isTie ? 'NEUTRAL' : dominantArea;
}

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
        dominantTheme: 'NEUTRAL'
      };
      
      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      games[roomId].players[playerId] = createInitialPlayerState(playerId, 'Jugador 1');
      
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('gameUpdate', games[roomId]);
    });

    socket.on('getProfile', (playerId) => {
      const profile = getUserProfile(playerId);
      socket.emit('profileUpdate', profile);
    });

    socket.on('joinAdventure', (playerId) => {
      const roomId = `PVE-${uuidv4().substring(0, 6)}`;
      games[roomId] = {
        roomId,
        players: {},
        turn: '',
        phase: 'PREPARATION',
        winner: null,
        logs: [`Modo Aventura iniciado.`],
        isFirstTurn: true,
        dominantTheme: 'NEUTRAL'
      };
      
      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      const profile = getUserProfile(playerId);
      games[roomId].players[playerId] = createInitialPlayerState(playerId, profile.name || 'Jugador');
      games[roomId].players['cpu'] = createCpuPlayerState('cpu', 'CPU (Bot)', profile);
      games[roomId].players['cpu'].ready = true;
      
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('gameUpdate', games[roomId]);
      
      // If CPU goes first
      if (games[roomId].turn === 'cpu') {
        handleCpuTurn(roomId);
      }
    });

    socket.on('nextAdventureEncounter', (playerId) => {
      const oldRoomId = playerIdToRoom[playerId];
      if (oldRoomId) {
        socket.leave(oldRoomId);
        delete games[oldRoomId];
      }
      
      const roomId = `PVE-${uuidv4().substring(0, 6)}`;
      games[roomId] = {
        roomId,
        players: {},
        turn: '',
        phase: 'PREPARATION',
        winner: null,
        logs: [`Siguiente batalla de aventura.`],
        isFirstTurn: true,
        dominantTheme: 'NEUTRAL'
      };
      
      socket.join(roomId);
      socketToPlayerId[socket.id] = playerId;
      playerIdToRoom[playerId] = roomId;
      
      const profile = getUserProfile(playerId);
      games[roomId].players[playerId] = createInitialPlayerState(playerId, profile.name || 'Jugador');
      games[roomId].players['cpu'] = createCpuPlayerState('cpu', 'CPU (Bot)', profile);
      games[roomId].players['cpu'].ready = true;
      
      socket.emit('roomCreated', roomId);
      io.to(roomId).emit('gameUpdate', games[roomId]);
      
      if (games[roomId].turn === 'cpu') {
        handleCpuTurn(roomId);
      }
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
          game.phase = 'PREPARATION';
          game.logs.push('¡Fase de preparación iniciada!');
        }
        
        io.to(roomId).emit('gameUpdate', game);
      }
    });

    socket.on('selectDeck', (cardIds: string[]) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      const player = game.players[playerId!];
      if (!player) return;

      if (game.phase !== 'PREPARATION') {
        socket.emit('error', 'No estás en fase de preparación.');
        return;
      }

      if (cardIds.length < 5 || cardIds.length > 25) {
        socket.emit('error', 'El mazo debe tener entre 5 y 25 cartas.');
        return;
      }

      const allAvailableCards = [...MONSTERS, ...SPELLS];
      const selectedCards: Card[] = [];
      let monsterCount = 0;

      for (const id of cardIds) {
        const card = allAvailableCards.find(c => c.id === id);
        if (card) {
          const cardInstance = { ...card, instanceId: uuidv4() };
          selectedCards.push(cardInstance);
          if (card.type === 'MONSTER') monsterCount++;
        }
      }

      if (monsterCount === 0) {
        socket.emit('error', 'El mazo debe incluir al menos una carta de tipo MONSTER.');
        return;
      }

      player.deck = selectedCards.sort(() => Math.random() - 0.5);
      player.hand = player.deck.splice(0, 3);
      player.ready = true;

      const players = Object.values(game.players);
      const allReady = players.every(p => p.ready);
      
      if (allReady) {
        game.phase = 'BATTLE';
        game.turn = Object.keys(game.players)[0];
        game.isFirstTurn = true;
        game.logs.push('¡La batalla ha comenzado!');
      }

      io.to(roomId).emit('gameUpdate', game);
      
      if (game.phase === 'BATTLE' && game.turn === 'cpu') {
        handleCpuTurn(roomId);
      }
    });

    socket.on('summonMonster', (cardId, positionIndex) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      
      const player = game.players[playerId!];
      if (!player) return;

      if (positionIndex < 0 || positionIndex > 2 || player.monsterZone[positionIndex] !== null) {
        socket.emit('error', 'Posición inválida u ocupada.');
        return;
      }

      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'MONSTER');
      if (cardIndex === -1) return;

      const monster = player.hand.splice(cardIndex, 1)[0] as MonsterCard;

      const validation = validateAcademicAction(monster, game, playerId!);
      if (!validation.success) {
        // Devolver a la mano si falla validación
        player.hand.push(monster);
        socket.emit('error', validation.message || 'Invocación no permitida por regla académica.');
        return;
      }

      monster.hasAttacked = false;
      monster.instanceId = monster.instanceId || uuidv4();
      player.monsterZone[positionIndex] = monster;
      game.logs.push(`${player.name} invoca a ${monster.name} en la zona ${positionIndex + 1}.`);

      // Sincronización de Conocimiento
      addStudentProgress({
        studentId: playerId!,
        concept: monster.academicMetadata?.academicConcept || 'General',
        masteryPoints: 5
      });

      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('drawCard', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      const player = game.players[playerId!];

      if (player.hasDrawnThisTurn) {
        socket.emit('error', 'Ya robaste una carta este turno.');
        return;
      }
      if (player.deck.length === 0) {
        socket.emit('error', 'No tienes más cartas en el mazo.');
        return;
      }
      player.hand.push(player.deck.shift()!);
      player.hasDrawnThisTurn = true;
      io.to(roomId).emit('gameUpdate', game);
    });

    socket.on('castSpell', (cardId, targetIndex, isAllyTarget) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;

      const player = game.players[playerId!];
      const cardIndex = player.hand.findIndex(c => c.id === cardId && c.type === 'SPELL');
      if (cardIndex === -1) return;

      const spell = player.hand[cardIndex] as SpellCard;

      if (player.statusEffects && player.statusEffects.includes('SILENCE')) {
        socket.emit('error', 'Tus hechizos han sido anulados por Continuidad Rota este turno.');
        return;
      }

      const validation = validateAcademicAction(spell, game, playerId!);
      if (!validation.success) {
        socket.emit('error', validation.message || 'Hechizo no permitido por regla académica.');
        return;
      }

      if (player.energy < spell.energyCost) {
        socket.emit('error', 'No tienes suficiente energía.');
        return;
      }

      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      let targetOwnerId = isAllyTarget ? playerId! : opponentId;
      let targetMonster: any = null;

      if (spell.targetType === 'SINGLE') {
        if (targetIndex === undefined || !game.players[targetOwnerId].monsterZone[targetIndex]) {
          socket.emit('error', 'Debes seleccionar un objetivo válido.');
          return;
        }
        targetMonster = game.players[targetOwnerId].monsterZone[targetIndex];
      }

      const allySpells = ['s2', 's3', 's9', 's11', 's18', 's23', 's24'];
      const enemySpells = ['s5', 's6', 's10', 's16', 's20', 's22'];
      
      if (allySpells.includes(spell.id) && !isAllyTarget) {
        socket.emit('error', 'Debes apuntar a un aliado.');
        return;
      }
      if (enemySpells.includes(spell.id) && isAllyTarget) {
        socket.emit('error', 'Debes apuntar a un enemigo.');
        return;
      }

      player.energy -= spell.energyCost;
      player.hand.splice(cardIndex, 1);
      game.logs.push(`${player.name} activa el hechizo: ${spell.name}.`);

      addStudentProgress({
        studentId: playerId!,
        concept: spell.academicMetadata?.academicConcept || 'General',
        masteryPoints: 10
      });

      io.to(roomId).emit('playAnimation', { type: 'SPELL_EFFECT', spellId: spell.id, targetId: targetMonster?.instanceId });

      switch(spell.id) {
        case 's1': 
          player.energy += 2;
          game.logs.push(`${player.name} recupera 2 puntos de energía.`);
          break;
        case 's2': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          targetMonster.defense += 500;
          game.logs.push(`${targetMonster.name} gana 500 DEF.`);
          break;
        case 's3': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          if (!targetMonster.activeEffects) targetMonster.activeEffects = [];
          targetMonster.activeEffects.push('INDESTRUCTIBLE');
          game.logs.push(`${targetMonster.name} es indestructible este turno.`);
          break;
        case 's4': 
          const hasTargets = opponent.monsterZone.some(m => m !== null);
          if (hasTargets) {
            opponent.monsterZone.forEach(m => { if (m) { if (!m.activeEffects) m.activeEffects = []; m.activeEffects.push('ACID_MELTING'); } });
            io.to(roomId).emit('gameUpdate', game);
            io.to(roomId).emit('playAnimation', { type: 'ACID_RAIN' });
            setTimeout(() => {
              if (games[roomId]) {
                games[roomId].players[opponentId].monsterZone.forEach((m, idx) => {
                  if (m && !m.activeEffects?.includes('INDESTRUCTIBLE')) {
                    games[roomId].players[opponentId].defeatedMonsters.push(m);
                    games[roomId].players[opponentId].monsterZone[idx] = null;
                  }
                });
                io.to(roomId).emit('gameUpdate', games[roomId]);
                checkGameOver(games[roomId], playerId!, opponentId, io, roomId);
              }
            }, 1500);
            return;
          }
          break;
        case 's5': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          if (!targetMonster.activeEffects) targetMonster.activeEffects = [];
          targetMonster.activeEffects.push('VORTEX_ELIMINATION');
          io.to(roomId).emit('gameUpdate', game);
          io.to(roomId).emit('playAnimation', { type: 'VORTEX_ELIMINATION', targetId: targetMonster.instanceId });
          setTimeout(() => {
            if (games[roomId]) {
              const m = games[roomId].players[opponentId].monsterZone[targetIndex!];
              if (m) {
                games[roomId].players[opponentId].deck.push(m);
                games[roomId].players[opponentId].monsterZone[targetIndex!] = null;
              }
              io.to(roomId).emit('gameUpdate', games[roomId]);
            }
          }, 1500);
          return;
        case 's6': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          const dmg = Math.floor(targetMonster.defense / 2);
          if (!targetMonster.activeEffects) targetMonster.activeEffects = [];
          targetMonster.activeEffects.push('VORTEX_ELIMINATION');
          opponent.hp -= dmg;
          game.logs.push(`${targetMonster.name} es demolido, causando ${dmg} de daño a ${opponent.name}.`);
          io.to(roomId).emit('gameUpdate', game);
          setTimeout(() => {
            if (games[roomId]) {
              const m = games[roomId].players[opponentId].monsterZone[targetIndex!];
              if (m && !m.activeEffects?.includes('INDESTRUCTIBLE')) {
                games[roomId].players[opponentId].defeatedMonsters.push(m);
                games[roomId].players[opponentId].monsterZone[targetIndex!] = null;
              }
              io.to(roomId).emit('gameUpdate', games[roomId]);
              checkGameOver(games[roomId], playerId!, opponentId, io, roomId);
            }
          }, 1500);
          return;
        case 's7': 
          opponent.statusEffects = opponent.statusEffects || [];
          opponent.statusEffects.push('FOG');
          game.logs.push(`Niebla espesa: Los ataques de ${opponent.name} fallarán este turno.`);
          break;
        case 's8': 
          opponent.energy = Math.max(0, opponent.energy - 1);
          game.logs.push(`${opponent.name} pierde 1 de energía por el derrame.`);
          break;
        case 's9': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          if (!targetMonster.activeEffects) targetMonster.activeEffects = [];
          targetMonster.activeEffects.push('DOUBLE_ATTACK');
          game.logs.push(`${targetMonster.name} puede atacar dos veces este turno.`);
          break;
        case 's10': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          targetMonster.attack = 0;
          game.logs.push(`El ATK de ${targetMonster.name} se vuelve 0.`);
          break;
        case 's11': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          targetMonster.defense = 9999;
          game.logs.push(`${targetMonster.name} recibe una defensa casi infinita.`);
          break;
        case 's12': 
          const randomMonster = player.hand.find(c => c.type === 'MONSTER');
          if (randomMonster) {
            const emptySlot = player.monsterZone.findIndex(s => s === null);
            if (emptySlot !== -1) {
               player.monsterZone[emptySlot] = { ...randomMonster, instanceId: Math.random().toString(36).substring(7) } as any;
               player.hand = player.hand.filter(c => c.id !== randomMonster.id);
               game.logs.push(`${player.name} invoca a ${randomMonster.name} gratis mediante Modus Ponens.`);
            }
          } else {
            game.logs.push(`Modus Ponens falla porque no hay conclusiones en la mano.`);
          }
          break;
        case 's13': 
          if (player.deck.length > 0) {
            player.hand.push({ ...player.deck[0], instanceId: Math.random().toString(36).substring(7) });
            player.deck.shift();
            game.logs.push(`${player.name} roba 1 carta mediante Contradicción.`);
          } else {
            game.logs.push(`Contradicción Kaelisk no puede robar carta porque el mazo está vacío.`);
          }
          break;
        case 's14': 
          [...player.monsterZone, ...opponent.monsterZone].forEach(m => {
             if (m) {
               const temp = m.attack;
               m.attack = m.defense;
               m.defense = temp;
             }
          });
          game.logs.push(`Ley de De Morgan: ATK y DEF intercambiados para todos los monstruos.`);
          break;
        case 's15': 
          if (player.hand.length === 2) { 
             const card1 = player.deck.shift();
             if (card1) player.hand.push(card1);
             const card2 = player.deck.shift();
             if (card2) player.hand.push(card2);
             game.logs.push(`${player.name} roba hasta 2 cartas por Sintaxis Perfecta.`);
          }
          break;
        case 's16': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          opponent.hp -= targetMonster.attack;
          game.logs.push(`${targetMonster.name} ataca directamente a su propio jugador por ${targetMonster.attack} daño.`);
          checkGameOver(game, playerId!, opponentId, io, roomId);
          break;
        case 's17': 
          const counts: any = {};
          player.monsterZone.forEach(m => { if(m) counts[m.academicMetadata?.academicConcept || ''] = (counts[m.academicMetadata?.academicConcept || ''] || 0) + 1; });
          player.monsterZone.forEach(m => {
             if(m && counts[m.academicMetadata?.academicConcept || ''] > 1) {
                m.attack += 500;
             }
          });
          game.logs.push(`Coherencia Textual: Monstruos con conceptos compartidos ganan 500 ATK.`);
          break;
        case 's18': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          const boost = player.defeatedMonsters.length * 300;
          targetMonster.attack += boost;
          game.logs.push(`${targetMonster.name} gana ${boost} ATK por los aliados caídos.`);
          break;
        case 's19': 
          player.statusEffects = player.statusEffects || [];
          player.statusEffects.push('RESILIENCE');
          game.logs.push(`${player.name} tiene Resiliencia: Sobrevivirá un golpe letal con 1 HP.`);
          break;
        case 's20': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          targetMonster.attack = Math.floor(targetMonster.attack / 2);
          targetMonster.defense *= 2;
          game.logs.push(`FODA aplicado: ATK de ${targetMonster.name} reducido a la mitad, DEF duplicada.`);
          break;
        case 's21': 
          player.monsterZone.forEach(m => {
             if(m) {
                if(!m.activeEffects) m.activeEffects = [];
                m.activeEffects.push('IMMUNE');
             }
          });
          game.logs.push(`Todos los monstruos de ${player.name} son inmunes a debuffs este turno.`);
          break;
        case 's22': 
          if (isAllyTarget) { socket.emit('error', 'Debes apuntar a un enemigo.'); return; }
          targetMonster.attack = Math.max(0, targetMonster.attack - 500);
          game.logs.push(`${targetMonster.name} pierde 500 ATK permanentemente.`);
          break;
        case 's23': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          player.hand.push(targetMonster);
          player.monsterZone[targetIndex!] = null;
          const drawnCard = player.deck.shift();
          if (drawnCard) player.hand.push(drawnCard);
          game.logs.push(`${player.name} devuelve un monstruo a la mano y roba una carta.`);
          break;
        case 's24': 
          if (!isAllyTarget) { socket.emit('error', 'Debes apuntar a un aliado.'); return; }
          const infiniteBoost = player.defeatedMonsters.length * 500;
          targetMonster.attack += infiniteBoost;
          game.logs.push(`${targetMonster.name} sufre un acercamiento asintótico al infinito, ganando ${infiniteBoost} ATK por los monstruos en el cementerio.`);
          break;
        case 's25': 
          opponent.statusEffects = opponent.statusEffects || [];
          opponent.statusEffects.push('SILENCE');
          game.logs.push(`Continuidad Rota: ${opponent.name} no puede activar hechizos en su próximo turno.`);
          break;
      }

      setTimeout(() => {
        if (games[roomId]) {
          io.to(roomId).emit('gameUpdate', games[roomId]);
          checkGameOver(games[roomId], playerId!, opponentId, io, roomId);
        }
      }, 1000);
    });

    socket.on('executeAttacks', () => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      if (game.isFirstTurn) {
        socket.emit('error', 'No puedes atacar en el primer turno del juego.');
        return;
      }

      const player = game.players[playerId!];
      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      const readyAttackers = player.monsterZone.map((m, i) => m && !m.hasAttacked ? { m, i } : null).filter(x => x !== null) as {m: any, i: number}[];

      if (readyAttackers.length === 0) {
        socket.emit('error', 'No hay monstruos listos para atacar.');
        return;
      }

      const executeNextAttack = (attackersIndex: number) => {
        if (attackersIndex >= readyAttackers.length || !games[roomId]) {
          if (games[roomId]) {
            io.to(roomId).emit('gameUpdate', games[roomId]);
          }
          return;
        }

        const attacker = readyAttackers[attackersIndex];
        const targetIndex = attacker.i;
        const targetMonster = opponent.monsterZone[targetIndex];

        if (!targetMonster) {
          attacker.m.hasAttacked = true;
          game.logs.push(`${player.name} ataca directamente con ${attacker.m.name} causando ${attacker.m.attack} daño.`);
          
          io.to(roomId).emit('playAnimation', { 
            type: 'ATTACK_IMPACT', 
            attackerId: attacker.m.instanceId, 
            targetId: opponentId, 
            damage: attacker.m.attack 
          });

          setTimeout(() => {
            if (games[roomId]) {
              games[roomId].players[opponentId].hp -= attacker.m.attack;
              io.to(roomId).emit('gameUpdate', games[roomId]);
              if (checkGameOver(games[roomId], playerId!, opponentId, io, roomId)) return;
              executeNextAttack(attackersIndex + 1);
            }
          }, 800);
        } else {
          attacker.m.hasAttacked = true;
          const damage = attacker.m.attack - targetMonster.defense;
          game.logs.push(`${player.name}: ${attacker.m.name} ataca a ${targetMonster.name}.`);

          io.to(roomId).emit('playAnimation', { 
            type: 'ATTACK_IMPACT', 
            attackerId: attacker.m.instanceId, 
            targetId: targetMonster.instanceId, 
            damage: damage > 0 ? damage : 0,
            targetDamage: attacker.m.attack,
            isDestroyed: damage >= 0,
            secondaryTargetId: damage > 0 ? opponentId : undefined,
            secondaryDamage: damage > 0 ? damage : undefined
          });

          setTimeout(() => {
            if (games[roomId]) {
              if (damage >= 0) {
                games[roomId].logs.push(`${targetMonster.name} ha sido destruido.`);
                games[roomId].players[opponentId].defeatedMonsters.push(targetMonster);
                games[roomId].players[opponentId].monsterZone[targetIndex] = null;
                
                if (damage > 0) {
                  games[roomId].players[opponentId].hp -= damage;
                  games[roomId].logs.push(`${opponent.name} recibe ${damage} de daño residual.`);
                }
              } else {
                targetMonster.defense -= attacker.m.attack;
                games[roomId].logs.push(`${targetMonster.name} pierde ${attacker.m.attack} de defensa.`);
              }
              
              io.to(roomId).emit('gameUpdate', games[roomId]);
              if (checkGameOver(games[roomId], playerId!, opponentId, io, roomId)) return;
              executeNextAttack(attackersIndex + 1);
            }
          }, 800);
        }
      };

      executeNextAttack(0);
    });

    socket.on('attackBasic', (attackerIndex) => {
      const playerId = socketToPlayerId[socket.id];
      const roomId = playerIdToRoom[playerId || ''];
      if (!roomId || !games[roomId]) return;
      
      const game = games[roomId];
      if (game.turn !== playerId) return;
      if (game.isFirstTurn) {
        socket.emit('error', 'No puedes atacar en el primer turno del juego.');
        return;
      }

      const player = game.players[playerId!];
      const opponentId = Object.keys(game.players).find(id => id !== playerId)!;
      const opponent = game.players[opponentId]!;

      const attacker = player.monsterZone[attackerIndex];
      if (!attacker) {
        socket.emit('error', 'No hay monstruo en esta zona.');
        return;
      }

      if (attacker.hasAttacked) {
        socket.emit('error', 'Este monstruo ya ha atacado este turno.');
        return;
      }

      // Column-based combat: target is strictly the slot in front
      const targetIndex = attackerIndex;
      const targetMonster = opponent.monsterZone[targetIndex];

      if (!targetMonster) {
        // Direct attack if the lane is empty
        attacker.hasAttacked = true;
        game.logs.push(`${player.name} ataca directamente con ${attacker.name}.`);
        io.to(roomId).emit('playAnimation', { 
          type: 'ATTACK_IMPACT', 
          attackerId: attacker.instanceId, 
          targetId: opponentId, 
          damage: attacker.attack 
        });

        setTimeout(() => {
          if (games[roomId]) {
            games[roomId].players[opponentId].hp -= attacker.attack;
            io.to(roomId).emit('gameUpdate', games[roomId]);
            checkGameOver(games[roomId], playerId!, opponentId, io, roomId);
          }
        }, 800);
        return;
      } else {
        // targetMonster is already defined above


        attacker.hasAttacked = true;
        game.logs.push(`${player.name} ataca con ${attacker.name} a ${targetMonster.name}.`);
        const damage = attacker.attack - targetMonster.defense;
        
        io.to(roomId).emit('playAnimation', { 
          type: 'ATTACK_IMPACT', 
          attackerId: attacker.instanceId, 
          targetId: targetMonster.instanceId, 
          damage: damage > 0 ? damage : 0,
          targetDamage: attacker.attack,
          isDestroyed: damage >= 0,
          secondaryTargetId: damage > 0 ? opponentId : undefined,
          secondaryDamage: damage > 0 ? damage : undefined
        });

        setTimeout(() => {
          if (games[roomId]) {
            if (damage >= 0) {
              games[roomId].logs.push(`${targetMonster.name} ha sido destruido.`);
              games[roomId].players[opponentId].defeatedMonsters.push(targetMonster);
              games[roomId].players[opponentId].monsterZone[targetIndex] = null;
              
              if (damage > 0) {
                games[roomId].players[opponentId].hp -= damage;
                games[roomId].logs.push(`${opponent.name} recibe ${damage} de daño residual.`);
              }
              checkGameOver(games[roomId], playerId!, opponentId, io, roomId);
            } else {
              targetMonster.defense -= attacker.attack;
              games[roomId].logs.push(`${targetMonster.name} pierde ${attacker.attack} de defensa.`);
            }
            io.to(roomId).emit('gameUpdate', games[roomId]);
          }
        }, 800);
        return;
      }
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
      nextPlayer.monsterZone.forEach(m => {
        if (m) m.hasAttacked = false;
      });
      if (nextPlayer.energy < 3) nextPlayer.energy += 1;
      nextPlayer.hasDrawnThisTurn = false;
      
      const currentPlayer = game.players[playerId!];
      if (currentPlayer.statusEffects) {
        currentPlayer.statusEffects = currentPlayer.statusEffects.filter((e: string) => e !== 'SILENCE' && e !== 'FOG');
      }

      game.logs.push(`Turno de ${nextPlayer.name}.`);
      updateDominantTheme(game);
      io.to(roomId).emit('gameUpdate', game);
      
      if (opponentId === 'cpu') {
        handleCpuTurn(roomId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      delete socketToPlayerId[socket.id];
    });
  });

  const handleCpuTurn = (roomId: string) => {
    const game = games[roomId];
    if (!game || game.turn !== 'cpu' || game.phase !== 'BATTLE') return;
    const cpu = game.players['cpu'];
    const humanId = Object.keys(game.players).find(id => id !== 'cpu');
    if (!cpu || !humanId) return;

    setTimeout(() => {
      if (!cpu.hasDrawnThisTurn && cpu.deck.length > 0) {
        const drawn = cpu.deck.shift()!;
        cpu.hand.push(drawn);
        cpu.hasDrawnThisTurn = true;
        game.logs.push(`CPU roba una carta.`);
        io.to(roomId).emit('gameUpdate', game);
      }

      setTimeout(() => {
        const playableMonsters = cpu.hand.filter(c => c.type === 'MONSTER');
        const emptyZones = cpu.monsterZone.map((m, i) => m === null ? i : -1).filter(i => i !== -1);
        
        if (playableMonsters.length > 0 && emptyZones.length > 0) {
          const m = playableMonsters[Math.floor(Math.random() * playableMonsters.length)];
          const z = emptyZones[0];
          cpu.hand = cpu.hand.filter(c => c.instanceId !== m.instanceId);
          cpu.monsterZone[z] = { ...m, hasAttacked: true, modifiers: [] } as any;
          game.logs.push(`CPU invoca a ${m.name}.`);
          io.to(roomId).emit('gameUpdate', game);
        }

        setTimeout(() => {
          const opponent = game.players[humanId]!;
          const readyAttackers = cpu.monsterZone.map((m, i) => m && !m.hasAttacked ? { m, i } : null).filter(x => x !== null) as {m: MonsterCard, i: number}[];
          readyAttackers.forEach(attacker => {
            const tIdx = attacker.i;
            const targetM = opponent.monsterZone[tIdx];
            
            if (targetM) {
              const damage = attacker.m.attack - targetM.defense;
              attacker.m.hasAttacked = true;
              game.logs.push(`CPU: ${attacker.m.name} ataca a ${targetM.name}.`);
              
              if (damage >= 0) {
                 opponent.monsterZone[tIdx] = null;
                 game.logs.push(`${targetM.name} fue destruido.`);
                 opponent.defeatedMonsters.push(targetM.id as any);
                 if (damage > 0) {
                   opponent.hp -= damage;
                   game.logs.push(`${opponent.name} recibe ${damage} de daño residual.`);
                 }
              } else {
                 targetM.defense -= attacker.m.attack;
                 game.logs.push(`${targetM.name} pierde ${attacker.m.attack} de defensa.`);
              }
              
              io.to(roomId).emit('playAnimation', { 
                type: 'ATTACK_IMPACT', 
                attackerId: attacker.m.instanceId, 
                targetId: targetM.instanceId, 
                damage: damage > 0 ? damage : 0,
                targetDamage: attacker.m.attack,
                isDestroyed: damage >= 0,
                secondaryTargetId: damage > 0 ? humanId : undefined,
                secondaryDamage: damage > 0 ? damage : undefined
              });
            } else {
              opponent.hp -= attacker.m.attack;
              attacker.m.hasAttacked = true;
              game.logs.push(`CPU: ${attacker.m.name} ataca directamente y causa ${attacker.m.attack} de daño.`);
            }
          });
          
          if (checkGameOver(game, 'cpu', humanId, io, roomId)) {
            io.to(roomId).emit('gameUpdate', game);
            return;
          }

          io.to(roomId).emit('gameUpdate', game);

          setTimeout(() => {
            game.turn = humanId;
            const nextPlayer = opponent;
            nextPlayer.monsterZone.forEach(m => { if (m) m.hasAttacked = false; });
            if (nextPlayer.energy < 3) nextPlayer.energy += 1;
            nextPlayer.hasDrawnThisTurn = false;
            game.logs.push(`Turno de ${nextPlayer.name}.`);
            updateDominantTheme(game);
            io.to(roomId).emit('gameUpdate', game);
          }, 1500);

        }, 1500);
      }, 1500);
    }, 1500);
  };
}
