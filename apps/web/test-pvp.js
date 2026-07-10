const { io } = require('socket.io-client');

console.log("=== INICIANDO PRUEBA DE MULTIJUGADOR ONLINE ===");
console.log("Conectando Jugador 1 (wilson)...");
const socket1 = io('http://localhost:3001');

console.log("Conectando Jugador 2 (jaspe)...");
const socket2 = io('http://localhost:3001');

let player1Profile = null;
let player2Profile = null;
let roomIdCreated = '';

socket1.on('connect', () => {
  console.log("[J1] Conectado al servidor de sockets. Iniciando sesión...");
  socket1.emit('login', 'wilson', 'yolmer75');
});

socket2.on('connect', () => {
  console.log("[J2] Conectado al servidor de sockets. Iniciando sesión...");
  socket2.emit('login', 'jaspe', 'jaspe1');
});

socket1.on('authSuccess', (profile) => {
  console.log("[J1] Sesión iniciada con éxito. Nombre:", profile.name);
  player1Profile = profile;
  
  // Una vez iniciada la sesión, crea una sala de duelo
  console.log("[J1] Creando sala multijugador...");
  socket1.emit('createRoom', 'wilson');
});

socket2.on('authSuccess', (profile) => {
  console.log("[J2] Sesión iniciada con éxito. Nombre:", profile.name);
  player2Profile = profile;
});

socket1.on('roomCreated', (roomId) => {
  console.log("[J1] Sala creada exitosamente con código:", roomId);
  roomIdCreated = roomId;
  
  // El Jugador 2 se une a la sala creada
  console.log(`[J2] Intentando unirse a la sala ${roomId}...`);
  socket2.emit('joinRoom', roomId, 'jaspe');
});

socket1.on('gameUpdate', (state) => {
  const players = Object.keys(state.players);
  console.log("[J1] Actualización del juego recibida. Jugadores en sala:", players);
  
  if (players.length === 2 && state.players['wilson'] && state.players['jaspe']) {
    console.log("\n=============================================");
    console.log("¡ÉXITO! Ambos jugadores se unieron correctamente.");
    console.log("La modalidad de juego online funciona sin problemas.");
    console.log("=============================================\n");
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }
});

socket2.on('gameUpdate', (state) => {
  const players = Object.keys(state.players);
  console.log("[J2] Actualización del juego recibida. Jugadores en sala:", players);
});

socket1.on('error', (msg) => {
  console.error("[J1] Error recibido:", msg);
});

socket2.on('error', (msg) => {
  console.error("[J2] Error recibido:", msg);
});

// Registrar fallo si el proceso tarda más de 10 segundos
setTimeout(() => {
  console.error("\n=============================================");
  console.error("ERROR: Tiempo de espera agotado. Los jugadores no lograron emparejarse.");
  console.error("=============================================\n");
  socket1.disconnect();
  socket2.disconnect();
  process.exit(1);
}, 10000);
