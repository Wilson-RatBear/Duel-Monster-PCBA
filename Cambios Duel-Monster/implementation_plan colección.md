# Sistema de Colección de Cartas

Implementar una sección dedicada a la "Colección" en la pantalla de inicio (antes de entrar a un duelo), donde el jugador pueda ver su progreso, las cartas que posee y las cartas bloqueadas que aún debe conseguir mediante victorias.

## Proposed Changes

---

### Backend (Socket y Eventos)

Se añadirán eventos para solicitar y recibir el perfil del jugador sin necesidad de estar dentro de un duelo o sala activa.

#### [MODIFY] `packages/game-types/src/index.ts`
- Agregar el evento `getProfile: (playerId: string) => void` a `ClientToServerEvents`.
- Agregar el evento `profileUpdate: (profile: UserProfile) => void` a `ServerToClientEvents`.

#### [MODIFY] `apps/server/src/features/duel/duel.socket.ts`
- Escuchar el evento `getProfile` del cliente y responder con `getUserProfile(playerId)` emitiendo `profileUpdate`.

---

### Frontend (Pantalla Principal UI)

Se creará una nueva vista integrada en la pantalla de inicio para navegar por las cartas, separando lógicamente las vistas de "Jugar" y "Colección".

#### [MODIFY] `apps/web/app/page.tsx`
- Añadir el estado `userProfile` para guardar la respuesta del servidor con el inventario actual.
- Al conectar el socket, si no estamos en un juego (`!gameState`), solicitar el perfil (`getProfile`).
- Añadir un estado de navegación para la pantalla principal (por ejemplo, `mainMenuTab: 'PLAY' | 'COLLECTION'`).
- En la pestaña "Colección":
  - Iterar sobre `allCards`.
  - Si el usuario tiene la carta (`userProfile.cardInventory[card.id] > 0`): Mostrar la carta usando el componente `<GameCardContent />` en todo su esplendor y con la lupa habilitada.
  - Si no la tiene: Mostrar una silueta o recuadro sombreado con un candado (🔒) y su rareza, indicando que es una carta bloqueada por descubrir.

## Open Questions

> [!WARNING]
> ¿Te gustaría que las cartas bloqueadas muestren solo su nombre o que el recuadro sea totalmente anónimo (como "Carta Misteriosa") hasta que la desbloquees? Por defecto, haré que el recuadro sea anónimo con un ícono de candado para mantener la sorpresa.

## Verification Plan

### Automated Tests
- Ejecutar y compilar Typescript en backend y frontend para asegurar que los nuevos tipos en `game-types` estén sincronizados.

### Manual Verification
- Iniciar el juego, ver la pantalla principal.
- Entrar en "Colección" y verificar que las cartas por defecto (básicas) aparecen desbloqueadas y las avanzadas aparecen como siluetas con candado.
- Ganar una aventura para asegurar que, al desbloquear una carta, la colección se actualice automáticamente.
