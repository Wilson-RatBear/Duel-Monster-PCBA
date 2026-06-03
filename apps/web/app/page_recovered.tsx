'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  ClientToServerEvents, 
  ServerToClientEvents,
  MonsterCard
} from '@repo/game-types';

const SOCKET_URL = 'http://localhost:3001';

export default function GamePage() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Player ID and Socket
  useEffect(() => {
    let pid = localStorage.getItem('duel_monster_player_id');
    if (!pid) {
      pid = uuidv4();
      localStorage.setItem('duel_monster_player_id', pid);
    }
    setPlayerId(pid);

    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('gameUpdate', (state) => {
      setGameState(state);
      localStorage.setItem('duel_monster_room_id', state.roomId);
      setError(null);
    });

    newSocket.on('roomCreated', (id) => {
      localStorage.setItem('duel_monster_room_id', id);
    });

    newSocket.on('error', (msg) => {
      setError(msg);
    });

    // Auto reconnect if room exists
    const savedRoom = localStorage.getItem('duel_monster_room_id');
    if (savedRoom && pid) {
      newSocket.emit('reconnect', savedRoom, pid);
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  const createRoom = () => {
    if (playerId) socket?.emit('createRoom', playerId);
  };
  
  const joinRoom = () => {
    if (playerId) socket?.emit('joinRoom', roomIdInput, playerId);
  };

  const setReady = (ready: boolean) => socket?.emit('setReady', ready);
  const setName = () => socket?.emit('setName', nameInput);
  const endTurn = () => socket?.emit('endTurn');
  const summonMonster = (cardId: string) => socket?.emit('summonMonster', cardId);
  const attackBasic = () => socket?.emit('attackBasic');
  const castSpell = (cardId: string) => socket?.emit('castSpell', cardId);

  const clearSession = () => {
    localStorage.removeItem('duel_monster_room_id');
    setGameState(null);
    window.location.reload();
  };

  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Duel Monsters</h1>
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
          <button 
            onClick={createRoom}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all mb-4"
          >
            Crear Nueva Sala
          </button>
          <div className="relative flex items-center mb-4">
            <div className="flex-grow border-t border-slate-600"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm italic">o ├║nete a una</span>
            <div className="flex-grow border-t border-slate-600"></div>
          </div>
          <input 
            type="text" 
            placeholder="ID de la Sala"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            className="w-full bg-slate-700 border border-slate-600 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
          <button 
            onClick={joinRoom}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold transition-all"
          >
            Entrar a la Sala
          </button>
          {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  const me = gameState.players[playerId || ''];
  const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
  const opponent = opponentId ? gameState.players[opponentId] : null;
  const isMyTurn = gameState.turn === playerId;

  if (gameState.phase === 'LOBBY') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
          <h2 className="text-2xl font-bold mb-2 text-center">Sala: <span className="text-blue-400">{gameState.roomId}</span></h2>
          <p className="text-slate-400 text-center mb-8 text-sm">Comparte el ID con tu oponente</p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
              <input 
                type="text" 
                placeholder="Tu nombre de duelista"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={setName}
                className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-4 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span>{me?.name} (T├║)</span>
                <span className={me?.ready ? "text-emerald-400" : "text-amber-400"}>
                  {me?.ready ? "Γ£ô Listo" : "Esperando..."}
                </span>
              </div>
            </div>

            {opponent ? (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 flex items-center justify-between">
                <span>{opponent.name}</span>
                <span className={opponent.ready ? "text-emerald-400" : "text-amber-400"}>
                  {opponent.ready ? "Γ£ô Listo" : "Esperando..."}
                </span>
              </div>
            ) : (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 border-dashed animate-pulse text-center text-slate-500">
                Esperando oponente...
              </div>
            )}
          </div>

          <button 
            onClick={() => setReady(!me?.ready)}
            className={`w-full py-4 rounded-lg font-bold transition-all ${
              me?.ready 
                ? "bg-slate-600 hover:bg-slate-500" 
                : "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
            }`}
          >
            {me?.ready ? "Cancelar" : "┬íESTOY LISTO!"}
          </button>
          
          <button onClick={clearSession} className="w-full mt-4 text-xs text-slate-500 hover:text-slate-400 underline">
            Abandonar Sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Game Board */}
      <div className="flex-grow relative flex flex-col p-4">
        
        {/* Opponent Area */}
        <div className="h-1/3 flex flex-col items-center justify-start space-y-4 pt-4">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Oponente</p>
              <p className="text-xl font-bold text-red-400">{opponent?.name}</p>
              <div className="flex space-x-1 mt-1 justify-center">
                {[...Array(opponent?.energy || 0)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 px-6 py-2 rounded-full border border-red-900/50 shadow-inner">
              <p className="text-2xl font-mono font-bold text-red-500 tracking-tighter">{opponent?.hp} LP</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {[...Array(opponent?.hand.length || 0)].map((_, i) => (
              <div key={i} className="w-16 h-24 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-xl bg-[repeating-linear-gradient(45deg,#1e293b,#1e293b_10px,#0f172a_10px,#0f172a_20px)]"></div>
            ))}
          </div>
        </div>

        {/* Battlefield */}
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-4xl grid grid-cols-2 gap-12 px-8">
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-red-900/20 bg-red-900/5 h-64 relative">
              {opponent?.field ? (
                <MonsterCardDisplay monster={opponent.field} isOpponent />
              ) : (
                <span className="text-slate-700 text-sm uppercase tracking-widest font-bold">Zona de Monstruo</span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-blue-900/20 bg-blue-900/5 h-64 relative">
              {me?.field ? (
                <MonsterCardDisplay monster={me.field} />
              ) : (
                <span className="text-slate-700 text-sm uppercase tracking-widest font-bold">Zona de Monstruo</span>
              )}
            </div>
          </div>
        </div>

        {/* My Area */}
        <div className="h-1/3 flex flex-col items-center justify-end space-y-6 pb-8">
          <div className="flex space-x-4">
            {me?.hand.map((card) => (
              <button 
                key={card.id}
                onClick={() => {
                  if (card.type === 'MONSTER' && isMyTurn) summonMonster(card.id);
                  if (card.type === 'SPELL' && isMyTurn) castSpell(card.id);
                }}
                disabled={!isMyTurn || (card.type === 'MONSTER' && !!me.field)}
                className="group relative transition-transform hover:-translate-y-4 disabled:hover:translate-y-0"
              >
                <div className={`w-32 h-48 rounded-xl border-2 p-3 flex flex-col shadow-2xl ${
                  card.type === 'MONSTER' ? "bg-amber-900/90 border-amber-700" : "bg-emerald-900/90 border-emerald-700"
                }`}>
                  <p className="text-xs font-bold truncate mb-1">{card.name}</p>
                  <div className="flex-grow bg-black/40 rounded flex items-center justify-center overflow-hidden">
                    <span className="text-4xl opacity-20">{card.type === 'MONSTER' ? 'ΓÜö∩╕Å' : 'Γ£¿'}</span>
                  </div>
                  <div className="mt-2 text-[10px] leading-tight opacity-80">{card.description}</div>
                  <div className="mt-2 flex justify-between text-[10px] font-mono font-bold">
                    {card.type === 'MONSTER' ? (
                      <>
                        <span className="text-blue-300">ATK: {card.attack}</span>
                        <span className="text-red-300">DEF: {card.defense}</span>
                      </>
                    ) : (
                      <span className="text-emerald-400">COSTE: {card.energyCost}ΓÜí</span>
                    )}
                  </div>
                </div>
                {isMyTurn && (
                  <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none border-2 ${
                    card.type === 'MONSTER' ? "bg-blue-500/20 border-blue-400" : "bg-emerald-500/20 border-emerald-400"
                  }`}>
                    <span className={`${card.type === 'MONSTER' ? "bg-blue-600" : "bg-emerald-600"} text-[10px] px-2 py-1 rounded font-bold`}>
                      {card.type === 'MONSTER' ? "INVOCAR" : "ACTIVAR"}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-12">
            <div className="bg-slate-800 px-6 py-2 rounded-full border border-blue-900/50 shadow-inner flex items-center space-x-4">
              <p className="text-2xl font-mono font-bold text-blue-500 tracking-tighter">{me?.hp} LP</p>
              <div className="w-px h-4 bg-slate-700"></div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < (me?.energy || 0) ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "bg-slate-700"}`}></div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={attackBasic}
                disabled={!isMyTurn || !me?.field}
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 px-8 py-2 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 uppercase text-sm tracking-widest"
              >
                Atacar
              </button>
              <button 
                onClick={endTurn}
                disabled={!isMyTurn}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-8 py-2 rounded-lg font-bold transition-all border border-slate-600 uppercase text-sm tracking-widest"
              >
                Terminar Turno
              </button>
            </div>
          </div>
        </div>

        <div className={`absolute top-4 right-4 px-6 py-2 rounded-full border transition-all ${
          isMyTurn ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-red-600/20 border-red-500 text-red-400"
        }`}>
          <span className="font-bold uppercase tracking-widest text-sm animate-pulse">
            {isMyTurn ? "Tu Turno" : "Turno Oponente"}
          </span>
        </div>
      </div>

      {/* Battle Log Sidebar */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Registro de Duelo</h3>
          <button onClick={clearSession} className="text-[10px] text-red-500 hover:text-red-400 uppercase">Salir</button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {gameState.logs.map((log, i) => (
            <div key={i} className="text-slate-400 border-l-2 border-slate-700 pl-2 py-1 bg-slate-800/20 rounded-r">
              <span className="text-slate-600 mr-2">[{i+1}]</span>
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <div className="p-4 bg-slate-950 text-[10px] text-slate-600 italic">
          Duel Monsters Engine v0.1.0
        </div>
      </div>

      {/* Game Over Modal */}
      {gameState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-12 rounded-3xl border-4 border-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.2)] text-center max-w-sm w-full">
            <h2 className="text-6xl mb-6">{gameState.winner === playerId ? "≡ƒÅå" : "≡ƒÆÇ"}</h2>
            <h3 className="text-4xl font-bold mb-2 uppercase tracking-tighter">
              {gameState.winner === playerId ? "┬íVictoria!" : "Derrota"}
            </h3>
            <p className="text-slate-400 mb-8">
              {gameState.winner === playerId 
                ? "Has dominado el campo de batalla." 
                : "Tus monstruos han ca├¡do en combate."}
            </p>
            <button 
              onClick={clearSession}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-xl font-black transition-all shadow-xl shadow-amber-900/40 uppercase tracking-widest"
            >
              Nuevo Duelo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonsterCardDisplay({ monster, isOpponent = false }: { monster: MonsterCard, isOpponent?: boolean }) {
  return (
    <div className={`w-40 h-60 rounded-xl border-4 shadow-2xl p-4 flex flex-col transition-all animate-in fade-in zoom-in duration-500 ${
      isOpponent ? "bg-red-900/80 border-red-700" : "bg-blue-900/80 border-blue-700"
    }`}>
      <p className="text-sm font-black truncate mb-2">{monster.name}</p>
      <div className="flex-grow bg-black/60 rounded-lg flex items-center justify-center relative overflow-hidden group">
        <span className="text-6xl animate-pulse">≡ƒÉë</span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <p className="text-[10px] italic leading-tight">{monster.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400">ATK</span>
          <span className="text-sm font-mono font-bold text-white">{monster.attack}</span>
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 w-full"></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400">DEF</span>
          <span className="text-sm font-mono font-bold text-white">{monster.defense}</span>
        </div>
      </div>
    </div>
  );
}
