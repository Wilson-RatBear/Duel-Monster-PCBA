# Cambio al Sistema de Robado Manual

Este plan detalla los cambios requeridos para desactivar el robado automático de cartas y darle al jugador la libertad de robar su carta de turno presionando su mazo.

## User Review Required

> [!IMPORTANT]
> Al volver el robo "manual" y "opcional", el jugador podría olvidar robar su carta en su turno. ¿Deseas que el robo sea *obligatorio* para poder realizar otras acciones (o finalizar el turno), o dejamos que sea 100% libre y si el jugador olvida robar, pierde su oportunidad ese turno?
> Por ahora, el plan asume que será una **acción libre y opcional (hasta 1 vez por turno)**, pero si el mazo se acaba y decide robar, perderá la partida.

## Open Questions

> [!WARNING]
> Dado que la CPU debe jugar automáticamente, se ha propuesto que la CPU robe su carta al inicio de su rutina siempre que pueda. ¿Estás de acuerdo con esto?

## Proposed Changes

---

### Shared Game Types (`packages/game-types/src/index.ts`)

Se agregarán las siguientes propiedades a la interfaz de estado de juego para soportar la lógica de robado manual:

#### [MODIFY] `packages/game-types/src/index.ts`
- Agregar `hasDrawnThisTurn?: boolean;` a la interfaz `PlayerState`.
- Agregar `drawCard: () => void;` a la interfaz `ClientToServerEvents`.

---

### Backend Logic (`apps/server/src/features/duel`)

Eliminaremos el robado automático y añadiremos un nuevo evento de red para permitir a los jugadores robar cuando lo deseen.

#### [MODIFY] `apps/server/src/features/duel/duel.service.ts`
- En `createInitialPlayerState()`, inicializar `hasDrawnThisTurn: false`.

#### [MODIFY] `apps/server/src/features/duel/duel.socket.ts`
- **Eliminar robado automático**:
  - Quitar el ciclo `while (nextPlayer.hand.length < 3)` en `socket.on('endTurn')`.
  - Quitar el código de `player.hand.push(player.deck.shift()!)` en `socket.on('summonMonster')`.
- **Restablecimiento de Turno**: 
  - Al recibir `endTurn` y en `nextAdventureEncounter`, restablecer `nextPlayer.hasDrawnThisTurn = false`.
- **Nuevo Evento `drawCard`**:
  - Escuchar `socket.on('drawCard')`.
  - Validar que sea el turno del jugador y que `!player.hasDrawnThisTurn`.
  - Si el mazo tiene cartas, robar 1 carta y marcar `player.hasDrawnThisTurn = true`.
  - Si el mazo está vacío, activar `checkGameOver`.
- **Actualizar Hechizo `s5` (Recolección de Datos)**:
  - Hacer que robe 1 carta ignorando (y sin consumir) la restricción de `hasDrawnThisTurn`.
- **Actualizar CPU**:
  - En `processCpuTurn()`, hacer que la CPU simule la acción de robar al inicio de su ejecución, de forma manual.

---

### Frontend UI (`apps/web/app/page.tsx`)

Añadir el mazo visual en el modo batalla.

#### [MODIFY] `apps/web/app/page.tsx`
- En la vista `BATTLE`, agregar un recuadro apilado (representando un mazo físico de cartas) en la parte inferior izquierda de la pantalla.
- Agregar un indicador de `Mazo: X cartas restantes`.
- Hacer que el recuadro sea clickeable.
  - Activado solo si `game.turn === me.id && !me.hasDrawnThisTurn`.
  - Efecto visual de rebote y destello al estar disponible.
- Invocar `socket?.emit('drawCard')` al hacer clic.

## Verification Plan

### Automated Tests
N/A - Validaciones manuales y lógicas a través del frontend.

### Manual Verification
- Iniciar un duelo y confirmar que el jugador solo inicia con 3 cartas (las cartas iniciales que se daban) y no roba más de forma automática.
- Presionar el nuevo mazo en la esquina inferior izquierda.
- Verificar que el jugador recibe 1 carta y el mazo se deshabilita por el resto de ese turno.
- Usar "Recolección de Datos" y confirmar que otorga una carta extra y no bloquea el robo normal.
- Pasar turno y confirmar que el botón de mazo vuelve a habilitarse en el próximo turno del jugador.
- Confirmar que la CPU realiza su robo manual de forma exitosa durante su turno.
