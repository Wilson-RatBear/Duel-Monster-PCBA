# Plan de Implementación: Modo Aventura y Sistema de Desbloqueo

Para construir una experiencia motivadora (GBL), limitaremos el mazo inicial y forzaremos al aspirante a enfrentarse a la máquina (CPU) en un "Modo Aventura" para ganarse el derecho de usar conceptos académicos avanzados.

## User Review Required

> [!IMPORTANT]
> **Simulación de Base de Datos:** Actualmente no existe un ORM estricto (como Prisma) en el monorepo para los perfiles de usuario (el `DbSyncService` es un mock). Para esta implementación, construiré un `UserProfileService` en memoria (simulando PostgreSQL) que rastreará el `pveWins` y el arreglo de `unlockedCards` por cada socket/jugador conectado. ¿Estás de acuerdo con este enfoque o prefieres que implemente Prisma/PostgreSQL real primero?

## Open Questions

> [!WARNING]
> 1. **Inteligencia de la CPU:** Para el Modo Aventura, la CPU será reactiva: al ser su turno, intentará invocar el primer monstruo de su mano y atacar automáticamente. ¿Te parece bien este nivel de IA básica para la iteración inicial, o necesitas que la CPU pueda jugar heurísticamente (ej. guardar hechizos)?
> 2. **Pool de Cartas:** ¿Quieres que divida las cartas actuales (incluyendo las de Ingeniería y Arquitectura) arbitrariamente al 50%, dejando las mecánicas más complejas (ej. Matrices, Teorema Fundamental) como desbloqueables?

## Proposed Changes

---

### 1. Tipos y Modelos de Datos (`packages/game-types`)

Extenderemos la interfaz base de `Card` para marcar cuáles son desbloqueables, y crearemos tipos para el Perfil.

```typescript
export interface Card {
  id: string;
  // ...
  isUnlockable?: boolean; // Si es true, no está en el mazo base.
}

export interface UserProfile {
  id: string;
  pveWins: number;
  unlockedCardIds: string[]; // IDs de las cartas desbloqueadas
}
```

---

### 2. Servicio de Simulación de Usuario (`apps/server/src/features/duel/user.service.ts`)

Crearé un nuevo archivo para gestionar los perfiles simulados:
- **`getUserProfile(id)`**: Devuelve o crea el perfil.
- **`addWin(id)`**: Incrementa `pveWins`. Si el módulo de victorias `% 5 === 0`, selecciona una carta aleatoria con `isUnlockable = true` que el usuario no tenga en su `unlockedCardIds`, la añade y devuelve un evento.

---

### 3. Servicio de Duelo y Mazo Dinámico (`apps/server/src/features/duel/duel.service.ts`)

- **Cartas Bloqueadas:** Actualizaré el catálogo de `MONSTERS` y `SPELLS` para marcar la mitad con `isUnlockable: true`.
- **Mazo Personalizado:** La función `createInitialPlayerState` ahora recibirá el `UserProfile` y solo le inyectará en su mazo las cartas base + las cartas que tenga en su `unlockedCardIds`.

---

### 4. Controlador de Modo Aventura (Sockets) (`apps/server/src/features/duel/duel.socket.ts`)

- **Cola PvE:** Nuevo evento `socket.on('joinAdventure')`. Creará un duelo donde el oponente será una entidad predefinida (ID: `'cpu'`).
- **Bot Automatizado:** Si la variable `game.turn` cambia a `'cpu'`, un temporizador asíncrono (`setTimeout`) ejecutará una secuencia básica:
  1. `summonMonster` (el primero que tenga en la mano).
  2. `attackBasic` contra el campo del jugador (o directo).
  3. `endTurn`.
- **Recompensas al Ganar:** Al detectar el `GAME_OVER` en `checkGameOver`, si el perdedor es la CPU, llamaremos a `user.service.ts` para sumar la victoria y emitir un evento `socket.emit('cardUnlocked', cardData)` si el jugador alcanzó el múltiplo de 5 victorias.

## Plan de Ejecución
1. Actualizar `packages/game-types/src/index.ts`.
2. Crear la lógica de usuarios en `user.service.ts` y dividir las cartas en `duel.service.ts`.
3. Escribir la inteligencia artificial básica del bot y la cola de emparejamiento PvE en `duel.socket.ts`.
