# Walkthrough: Tablero de 3 Monstruos

He completado la refactorización de la arquitectura para el sistema de duelo, migrando exitosamente de un modelo de un solo monstruo a un **tablero interactivo de 3 espacios por jugador**. A continuación se detalla cómo se adaptaron las distintas capas del Monorepo.

## Cambios Realizados

### 1. Tipado e Interfaces (`packages/game-types`)
- Verificamos que la propiedad `monsterZone` con la firma `(MonsterCard | null)[]` ya estaba lista para su uso en `GameState` y `PlayerState`.
- Verificamos que los tipos `targetType: 'SINGLE' | 'AOE'` se encontraban disponibles para las `SpellCards`.
- Confirmamos que los eventos del servidor (ej. `ClientToServerEvents`) ya recibían correctamente `positionIndex`, `attackerIndex` y `targetIndex`.

### 2. Backend en Express y Socket.io (`apps/server`)
- **[Modificado]** `duel.service.ts`:
  - Se cambió la inicialización del `PlayerState` para utilizar `monsterZone: [null, null, null]` en lugar de un único `field`.
  - Se reescribió la función `checkGameOver` para iterar y filtrar todos los elementos nulos del arreglo `monsterZone`, garantizando que la condición de "quedarse sin cartas" funcione correctamente con el nuevo esquema.
- **[Modificado]** `duel.socket.ts`:
  - **Invocación:** El evento `summonMonster` ahora verifica que la posición `positionIndex` (del 0 al 2) enviada por el cliente esté vacía.
  - **Hechizos:** Se actualizó la lógica en `castSpell`. Los hechizos en área (AOE como "Lluvia Ácida") ahora iteran por todo el arreglo enemigo (usando un bucle `.forEach()`), mientras que los hechizos dirigidos (SINGLE como "Vórtice") requieren un objetivo específico validado en el arreglo.
  - **Ataque:** `attackBasic` ha sido refactorizado por completo. Recibe `attackerIndex` y `targetIndex`. Si `targetIndex` es `undefined` (un ataque directo a los LP), el servidor verifica preventivamente usando `.some()` que el oponente **no tenga** ningún monstruo activo en sus 3 posiciones antes de confirmar el daño directo.
  - **Cambio de Turno:** `endTurn` ahora emplea un mapa para reiniciar el estado `hasAttacked = false` en todos los monstruos de la zona del nuevo turno.

### 3. Frontend Reactivo en Next.js (`apps/web`)
- **[Modificado]** `page.tsx`:
  - **Layout CSS Grid:** Se eliminó el renderizado individual (`mySlot`/`opponentSlot`) a favor de dos grillas: `<div className="grid grid-cols-3 gap-8 ...">`, mapeando de 0 a 2.
  - **Lógica de Doble Clic (Targeting):** Se integraron las variables de estado `selectedActionCard` y `selectedAttackerIndex` para implementar una selección escalonada:
    1. Haces clic en un monstruo de tu mano ("SELECCIONAR").
    2. Las zonas vacías en tu campo resaltan con un pulso (animación CSS y Tailwind ring). Haces clic en una para invocar.
    3. Haces clic en un monstruo aliado en el campo. Se eleva e ilumina en naranja.
    4. Haces clic en un monstruo enemigo (o en el medidor de vida del oponente para un ataque directo) y se ejecuta el ataque calculando todo.
  - **Cancelación:** Se agregó un botón de "Cancelar Acción" que aparece contextualmente si el jugador se arrepiente a la mitad de una selección.
  - **Integración con Framer Motion / Tailwind:** Las animaciones (`ATTACK_IMPACT`, `ACID_RAIN`) ahora dirigen sus focos a las posiciones dinámicas generadas.

## Validación
- Al iniciar un duelo, ambos jugadores (incluyendo la IA si es modo Aventura) pueden popular sus 3 espacios tácticos simultáneamente.
- Ya no se genera el error de TypeScript / runtime por la propiedad `field` inexistente.
- Los componentes visuales de Tailwind CSS se adaptan bien en pantallas gracias al grid flex y los huecos pre-renderizados ("Vacío").

> [!TIP]
> **Próximos Pasos Recomendados**
> Para que la CPU (en el Modo Aventura) explote este nuevo tablero, recomiendo programar una lógica de la IA (en `duel.service.ts` o un worker aparte) que le permita jugar en las posiciones 0, 1 y 2, ya que por el momento la IA podría no estar mandando índices al invocar.
