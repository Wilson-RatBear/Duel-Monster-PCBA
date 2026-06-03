# Implementación de Sistema de Inventario de Cartas

Se cambiará el sistema actual de desbloqueo binario (tienes la carta o no) por un **sistema de inventario por cantidades**, permitiendo que los jugadores obtengan múltiples copias de una misma carta mediante el progreso en el modo aventura y se limite cuántas pueden poner en su mazo en base a las copias que poseen.

## Reglas Acordadas
- **Inventario Máximo:** Un jugador puede tener como máximo 10 copias de una misma carta en su inventario.
- **Inventario Inicial:** Al comenzar a jugar, el usuario tiene exactamente 1 copia de cada carta base.
- **Modo Aventura:** Las recompensas al ganar (cada 5 duelos) otorgan al azar +1 copia a una carta. Puede ser una carta base, una carta especial ya desbloqueada, o una carta especial nueva (desbloqueándola).
- **Límites de Mazo:** 
  - Tamaño máximo del mazo expandido de 15 a **25 cartas**.
  - Límite máximo de monstruos en un mazo: **9 monstruos**.
  - Límite de hechizos: Sin límite específico, puedes poner tantos como quieras siempre que tengas copias en el inventario y no excedas el límite total de 25.

## Proposed Changes

---

### packages/game-types

Se actualizarán las interfaces principales para reflejar el cambio de un arreglo de IDs a un objeto diccionario (inventario).

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/desktop/duel-monsters/packages/game-types/src/index.ts)
- Cambiar `unlockedCardIds: string[]` a `cardInventory: Record<string, number>` en `UserProfile` y `PlayerState`.

---

### apps/server

#### [MODIFY] [user.service.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/user.service.ts)
- En `getUserProfile`: Inicializar `cardInventory` asignando `1` a todas las cartas donde `!isUnlockable`.
- En `addWin`: Al desbloquear una carta, elegir al azar cualquier carta del juego (siempre y cuando el usuario tenga menos de 10 copias) e incrementar `profile.cardInventory[unlockedCard.id]` en `1`.

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
- Actualizar la validación de `selectDeck`. En lugar de revisar si la carta no es base o está desbloqueada, contar la cantidad de cada carta en el arreglo recibido y asegurar que sea `<= userProfile.cardInventory[cid]`. 
- Validar el límite estricto de máximo 9 monstruos y máximo 25 cartas.

#### [MODIFY] [duel.service.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/duel.service.ts)
- Al crear el `PlayerState` inicial, usar el `cardInventory`. Para el bot CPU, generar un `cardInventory` simulado que asuma 3 o más copias para que pueda armar un mazo de 25.

---

### apps/web

#### [MODIFY] [page.tsx](file:///c:/Users/Mapache/desktop/duel-monsters/apps/web/app/page.tsx)
- Cambiar las referencias de `unlockedCardIds` a `cardInventory`.
- El filtro de `availablePool` buscará las cartas donde `me.cardInventory?.[c.id] > 0`.
- En `addCard`: Verificar que la cantidad actual en `selectedCards` de esa carta sea menor a `me.cardInventory[cardId]`. Verificar que no haya más de 9 monstruos, y que no exceda las 25 cartas.
- Modificar el renderizado para mostrar `x{countInDeck} / {inventory}`.
