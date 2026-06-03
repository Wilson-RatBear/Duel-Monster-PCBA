# Refactorización de la Mecánica Multi-Tablero

Este documento detalla el plan técnico para refactorizar la mecánica del tablero dinámico ("Multi-Tablero") en el juego, implementando el cálculo de mayorías de campo y las animaciones modulares en capas.

## User Review Required

> [!IMPORTANT]
> El rediseño del tablero implicará refactorizar cómo se renderizan el fondo y los slots en `page.tsx`. Al tratarse de animaciones en capas (Framer Motion), se añadirán componentes adicionales en el DOM. Se utilizará `mode="wait"` u otras estrategias de `AnimatePresence` para evitar caída de frames. Por favor, confirma si estás de acuerdo con la estrategia de diseño detallada abajo.

## Open Questions

Ninguna de momento.

## Proposed Changes

### `apps/server` (Cálculo Global de Mayorías)

---

#### [MODIFY] `apps/server/src/features/duel/duel.socket.ts`
- **Lógica de Mayoría Absoluta**: Se añadirá una función `updateDominantTheme(game: GameState)` que recorrerá los `monsterZone` de todos los jugadores en la sala (las 6 posiciones).
- Contará las áreas (razas) de cada monstruo presente.
- Determinará cuál área tiene la mayor cantidad de monstruos. Si hay un empate en el primer lugar (ej. 2 de INFORMATICA, 2 de CIVIL) o no hay monstruos, el estado regresará a `NEUTRAL`.
- Se llamará a esta función justo después de resolver acciones que modifiquen el campo:
  - `summonMonster`
  - Destrucción por combate en `attackBasic`
  - Destrucción/Devolución por hechizos en `castSpell`
- Una vez reevaluado el tema, se enviará el estado actualizado vía `gameUpdate`.

### `apps/web` (Descomposición Estructural del Tablero)

---

#### [MODIFY] `apps/web/app/page.tsx`
- **Componentización del Tablero en 3 Capas**:
  - **Capa 1 (Fondo General)**: Manejará el ambiente, texturas de fondo e iluminación base, utilizando `<motion.div>` con variantes de opacidad y escalas de color basadas en la carrera.
  - **Capa 2 (Retícula y Conectores)**: Capa sobre el fondo encargada de las líneas de unión y partículas. Utilizará `staggerChildren` para dibujar cada tramo secuencialmente.
  - **Capa 3 (Slots de Invocación)**: En lugar de un cambio instantáneo de clases, cada `Slot` (las cajas donde van las cartas) estará envuelto en componentes de animación. El marco físico del slot animará sus bordes y fondos de manera independiente.
- **Definición de Variantes de Framer Motion**:
  - Se creará un diccionario de variantes (`variants`) para cada tema, permitiendo el ensamblado:
    - **INFORMATICA**: Variantes tipo `terminal` (fondo negro de desvanecimiento, lluvia de texto binario, slots parpadeantes).
    - **ARQUITECTURA**: Fondo tipo "blueprint", expansión desde centro hacia afuera con `scale` y líneas de medición.
    - **CIVIL**: Impacto en `y` y texturas pesadas.
    - **METEOROLOGIA**: Animaciones fluidas, ondas con `scale` repetido y cambio de color cálido/frío.
    - **PETROLEO**: Construcción de tuberías simuladas con animaciones de `pathLength` (svg) o barras con `staggerChildren`.
- **Uso del estado reactivo**: Utilizaremos `gameState.dominantTheme` como el `key` de `<AnimatePresence>` para forzar el re-render y activación de la secuencia de ensamblado al cambiar el dominio del tablero, cuidando que los monstruos ya invocados no desaparezcan.

## Verification Plan

### Manual Verification
1. **Prueba de Lógica (Servidor)**:
   - Invocar 1 monstruo de CIVIL -> Tablero cambia a CIVIL.
   - Invocar 1 monstruo de INFORMATICA -> Empate (1 a 1), Tablero cambia a NEUTRAL.
   - Invocar un 2do monstruo de CIVIL -> Mayoría de CIVIL (2 a 1), Tablero cambia a CIVIL.
   - Destruir un monstruo CIVIL -> Empate (1 a 1), Tablero a NEUTRAL.
2. **Prueba Visual (Cliente)**:
   - Observar la transición entre temas. Verificar que ocurre por partes (1. Fondo, 2. Retícula, 3. Slots), creando el efecto de "ensamblaje".
   - Confirmar que las 5 razas (INFORMATICA, CIVIL, ARQUITECTURA, METEOROLOGIA, PETROLEO) presenten el efecto exacto descrito en los requerimientos.
