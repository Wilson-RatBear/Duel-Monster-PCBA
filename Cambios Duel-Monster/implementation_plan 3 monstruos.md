# Modificación de Arquitectura: Tablero de 3 Monstruos

Este documento detalla el plan técnico para refactorizar la arquitectura actual de `duel-monsters` para soportar hasta tres monstruos simultáneos en el campo por jugador.

## User Review Required

> [!WARNING]
> **Ataques Básicos y Especiales:** Al haber 3 monstruos, las acciones de `attackBasic` (y `attackSpecial`) también necesitarán saber *qué* monstruo aliado ataca y *qué* monstruo enemigo es el objetivo. Actualmente el plan asume que actualizaremos `ClientToServerEvents` para que estos eventos reciban `attackerIndex` y `targetIndex`. Por favor confirma si estás de acuerdo con este enfoque.

> [!IMPORTANT]
> **Flujo de Interacción en la UI:** Para invocar un monstruo, el usuario primero seleccionará la carta de su mano y luego hará clic en la zona vacía deseada del tablero (o se puede simplificar a que si solo hay una zona vacía, se asigne automáticamente). El plan propone un estado intermedio en React (`selectedCardFromHand`) para permitir al jugador hacer clic en una zona (0, 1 o 2) y enviar el `positionIndex`. ¿Te parece bien este flujo?

## Proposed Changes

---

### packages/game-types

Actualización de interfaces para soportar las nuevas reglas.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/desktop/duel-monsters/packages/game-types/src/index.ts)
- En `PlayerState`, se eliminará la propiedad `field: MonsterCard | null` y se reemplazará por `monsterZone: (MonsterCard | null)[]`.
- En `SpellCard`, se añadirá la propiedad opcional `targetType?: 'SINGLE' | 'AOE'`.
- Actualizar los hechizos existentes en la constante `SPELLS` para definir explícitamente su `targetType`.
- En `ClientToServerEvents`, se actualizará la firma de eventos:
  - `summonMonster: (cardId: string, positionIndex: number) => void`
  - `castSpell: (cardId: string, targetIndex?: number) => void`
  - `attackBasic: (attackerIndex: number, targetIndex?: number) => void`

---

### apps/server

Actualización de la lógica del servidor de Express y Socket.io para manejar el arreglo de monstruos.

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
- `createInitialPlayerState`: Inicializar `monsterZone: [null, null, null]`.
- `summonMonster`: Validar que `positionIndex` esté entre 0 y 2 y que el espacio correspondiente en `monsterZone` sea `null`. Asignar el monstruo en dicha posición.
- `castSpell`: Modificar la lógica según el `targetType` del hechizo:
  - Si es `SINGLE` y se provee un `targetIndex`, aplicar daño o efecto a `opponent.monsterZone[targetIndex]`.
  - Si es `AOE`, usar `.map()` para aplicar el efecto de forma simultánea a todos los monstruos no nulos de `opponent.monsterZone` y limpiar las referencias si mueren. Emitir los eventos `playAnimation` para las animaciones simultáneas.
- `attackBasic`: Buscar el monstruo atacante en `player.monsterZone[attackerIndex]`. Si hay defensores, validar `opponent.monsterZone[targetIndex]` y procesar el combate. Reemplazar todas las referencias a `.field`.

---

### apps/web

Actualización de la UI, maquetación y reactividad de animaciones en Next.js.

#### [MODIFY] [page.tsx](file:///c:/Users/Mapache/desktop/duel-monsters/apps/web/app/page.tsx)
- Reemplazar las variables `me.field` y `opponent.field` en todo el componente por el nuevo arreglo `monsterZone`.
- Refactorizar el renderizado del tablero: usar `grid grid-cols-3 gap-4` de Tailwind CSS para crear tres contenedores diferenciados por jugador.
- Implementar estado en React para seleccionar la carta de la mano (`selectedCardForAction`). Si es un monstruo, hacer que los contenedores vacíos del tablero se iluminen y sean clickeables para invocarlo en ese índice. Si es un hechizo `SINGLE`, permitir seleccionar al monstruo objetivo enemigo.
- Ajustar `playAnimation` y los componentes visuales para que, en caso de un hechizo `AOE`, la animación (ej. Lluvia Ácida) se renderice simultáneamente en todos los contenedores con un monstruo enemigo, aprovechando transiciones nativas de Tailwind o Framer Motion.

## Verification Plan

### Automated Tests
- Validar mediante el compilador de TypeScript (`tsc`) que no existan errores de tipado residuales tras el cambio de `field` a `monsterZone`.

### Manual Verification
1. Lanzar el proyecto localmente y jugar una partida entre dos pestañas del navegador.
2. Comprobar que un jugador puede invocar hasta 3 monstruos en posiciones distintas.
3. Verificar que invocar en una zona ocupada sea rechazado.
4. Lanzar un hechizo `AOE` (ej. Lluvia Ácida) y verificar que afecta a todos los monstruos enemigos y que las animaciones ocurren simultáneamente sin bloquear el hilo de React.
5. Lanzar un hechizo `SINGLE` validando que se aplique correctamente mediante la selección de un `targetIndex`.
