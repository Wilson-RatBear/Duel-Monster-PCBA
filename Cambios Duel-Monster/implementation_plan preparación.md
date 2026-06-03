# Plan de Implementación: Apartado de "Preparación" y Construcción de Mazo

Este plan describe la incorporación de una fase de **Preparación** antes de iniciar cualquier duelo (tanto en el Modo Aventura contra la CPU como en el modo Multijugador). En esta fase, el jugador podrá elegir libremente su mazo a partir de las cartas base disponibles y aquellas que haya desbloqueado progresivamente, fomentando la jugabilidad estratégica de construcción de mazos (deck-building).

## User Review Required

> [!IMPORTANT]
> **Cambios en el Flujo de Inicio del Duelo:**
> 1. Tanto en PvE como en PvP, la partida ya no iniciará el combate (`BATTLE`) directamente. En su lugar, transicionará a la nueva fase de `PREPARATION`.
> 2. Se ha establecido un límite para la construcción de mazos:
>    - **Tamaño del Mazo:** Entre 5 y 15 cartas.
>    - **Seguridad:** El mazo debe incluir al menos una carta de tipo **MONSTER** para evitar un fin de juego inmediato (ya que la derrota ocurre cuando el jugador se queda sin monstruos).

## Proposed Changes

---

### packages/game-types

Moveremos las colecciones estáticas de cartas (`MONSTERS` y `SPELLS`) a este paquete compartido para que tanto el Servidor (validación de mazos) como el Cliente (pantalla de construcción de mazo) utilicen exactamente la misma base de datos de cartas con tipado estricto. También añadiremos el evento de socket `selectDeck` y la nueva fase `PREPARATION`.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/desktop/duel-monsters/packages/game-types/src/index.ts)
- Actualizar `GamePhase` para incluir la fase `'PREPARATION'`:
  `export type GamePhase = 'LOBBY' | 'PREPARATION' | 'BATTLE' | 'GAME_OVER';`
- Agregar la definición del nuevo evento en `ClientToServerEvents`:
  `selectDeck: (cardIds: string[]) => void;`
- Exportar las constantes `MONSTERS` y `SPELLS` que estaban originalmente en el servidor, haciendo las cartas universales en todo el monorepo.

---

### apps/server

Actualizaremos el servidor para gestionar la fase de preparación, validar la composición de mazo enviada por el cliente y sincronizar el estado.

#### [MODIFY] [duel.service.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/duel.service.ts)
- Eliminar las constantes duplicadas `MONSTERS` y `SPELLS` (ahora importadas desde `@repo/game-types`).
- Modificar `createInitialPlayerState` para inicializar el mazo de forma predeterminada con todas las cartas disponibles del perfil del usuario, pero marcar el estado como `ready: false` y vacío para ser llenado tras la preparación.

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
- Importar `MONSTERS` y `SPELLS` desde `@repo/game-types`.
- En `joinAdventure` (PvE):
  - Iniciar el juego en `PREPARATION` en vez de `MAIN_PHASE`.
  - Configurar al jugador humano con `ready = false` y a la CPU con `ready = true` (la CPU usará su mazo automático completo).
- En el flujo PvP (`setReady`):
  - Cuando ambos jugadores estén listos en el `LOBBY`, transicionar la partida a la fase `PREPARATION` y restablecer el estado `ready` de ambos jugadores a `false`.
- Añadir el listener para el evento `selectDeck`:
  - Recibe la lista de `cardIds`.
  - Valida que el mazo tenga entre 5 y 15 cartas, que al menos una sea de tipo `MONSTER`, y que el jugador posea (o sean base) todas las cartas enviadas.
  - Si la validación es exitosa:
    - Actualiza el mazo del jugador con las cartas seleccionadas.
    - Clona y baraja el mazo.
    - Extrae las primeras 3 cartas para conformar la mano inicial (`player.hand`).
    - Establece `player.ready = true`.
    - Si ambos jugadores (o el jugador humano en PvE) están listos, cambia la fase a `BATTLE`, define el turno del primer jugador y registra el inicio del combate en los logs.
    - Emite `gameUpdate` a la sala.

---

### apps/web

Diseñaremos una impresionante interfaz de preparación de mazo con estética Glassmorphism, paneles interactivos, filtros y efectos animados para el constructor de mazos.

#### [MODIFY] [page.tsx](file:///c:/Users/Mapache/desktop/duel-monsters/apps/web/app/page.tsx)
- Importar `MONSTERS` y `SPELLS` desde `@repo/game-types` para disponer de toda la base de datos de cartas en la interfaz.
- Implementar la vista del estado `'PREPARATION'`:
  - Mostrar la lista de cartas del pool del jugador (filtrando aquellas desbloqueadas según el `unlockedCardIds` de su perfil).
  - Permitir añadir y quitar cartas de forma interactiva con micro-animaciones (escala en hover, transiciones suaves).
  - Incluir estadísticas visuales del mazo (cantidad total de cartas, desglose de Monstruos vs. Hechizos).
  - Indicar con estados dinámicos e intuitivos las advertencias de validación (mazo muy corto, falta de monstruos).
  - Botón de "Confirmar Mazo y Listarse" que invoca el método `socket?.emit('selectDeck', selectedIds)`.
  - Indicador de estado de preparación del oponente.

## Verification Plan

### Automated Tests
- Validar la integridad de los tipos y la compilación mediante:
  `pnpm check-types`
- Validar el build completo del proyecto:
  `pnpm build`

### Manual Verification
1. **Modo Aventura (PvE)**:
   - Iniciar una partida contra la CPU.
   - Verificar que se muestra la interfaz de **Preparación** (Deck Builder).
   - Intentar guardar un mazo inválido (ej: sin monstruos, o con menos de 5 cartas) y verificar que el botón esté deshabilitado o muestre la advertencia correspondiente.
   - Configurar un mazo válido de 6 cartas, dar click a "Listo" y verificar que el duelo inicie en la fase de combate con las cartas del mazo seleccionado en tu mano/deck.
2. **Modo Multijugador (PvP)**:
   - Crear una sala y unirse con otra pestaña/navegador.
   - En el Lobby, dar click a listo con ambos jugadores.
   - Verificar que ambos jugadores entran en la pantalla de **Preparación**.
   - Confirmar el mazo de un jugador y verificar que el oponente ve el estatus "Oponente Listo (Esperándote...)".
   - Confirmar el mazo del segundo jugador y verificar que la partida se inicia en la fase de combate para ambos al instante.
