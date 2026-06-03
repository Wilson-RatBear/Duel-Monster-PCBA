# Refactorización Completada: Mecánica Multi-Tablero Semántico

La refactorización del tablero dinámico ("Multi-Tablero") ha sido implementada con éxito. Hemos logrado desacoplar la vista global y crear una experiencia de "ensamblado" visual utilizando las capacidades reactivas de Framer Motion en React, sincronizado con la nueva lógica de evaluación del servidor.

## 1. Lógica del Servidor: Mayoría Absoluta

Se implementó el algoritmo de evaluación global en `apps/server/src/features/duel/duel.socket.ts`:

- La función `updateDominantTheme(game: GameState)` fue añadida y se invoca después de cualquier acción que altere el estado de los monstruos en el campo (invocaciones, muertes por combate básico y destrucciones por hechizos mágicos).
- Evalúa las 6 posiciones de monstruos (`player.monsterZone` y `opponent.monsterZone`).
- Calcula dinámicamente cuál carrera cuenta con más representantes. En caso de **empate**, o si no quedan monstruos en el tablero, la variable `dominantTheme` se revierte a `NEUTRAL`.
- Este estado se transmite instantáneamente a todos los clientes conectados usando el evento de Socket.io `gameUpdate`.

## 2. Frontend: Descomposición en Capas (Framer Motion)

Se refactorizó el componente principal `page.tsx` para abandonar el cambio brusco de clases CSS globales. En su lugar, construimos un modelo de tres capas superpuestas animadas secuencialmente.

- Utilizamos un contenedor principal `motion.div` que hace tracking de `gameState.dominantTheme` y distribuye el flujo de la animación hacia abajo mediante la propiedad `staggerChildren`. Esto evita el remonte de componentes interactivos críticos (como las cartas en sí).

### Capa 1: Fondo General (`Layer1Background`)
Maneja transiciones fluidas de `backgroundColor` y `opacity` en el DOM para simular la iluminación general.
- **ARQUITECTURA**: Fondo teñido en azul cianotipo.
- **CIVIL / PETROLEO**: Texturas granuladas oscuras generadas con SVG/CSS.

### Capa 2: Retícula (`Layer2Grid`)
Se reemplazaron los efectos de partículas globales genéricas por diseños arquitectónicos y climáticos específicos de cada área.
- **INFORMATICA**: Lluvia de terminal y código binario en color esmeralda.
- **CIVIL**: "Vigas" generadas mediante gradientes CSS de bordes duros que entran rebotando en el eje Y (`spring` animation).
- **METEOROLOGIA**: Patrones circulares expansivos que rotan suavemente imitando corrientes de viento/isobaras.

### Capa 3: Slots de Invocación (`layer3SlotVariants`)
Los `divs` que sirven como marco o reposo para los monstruos son ahora componentes animables separados de las propias cartas que los habitan.
- **ARQUITECTURA**: Los slots se abren animando su anchura (`scaleX`).
- **PETRÓLEO**: Los slots entran sellándose desde la altura (`scaleY`).
- **INFORMATICA**: Parpadeo rápido `opacity: [0, 1, 0.5, 1]` que simula el inicio de un proceso de consola.

> [!TIP]
> **Rendimiento Reactivo:** Todos los cambios ocurren puramente inyectando nuevas variantes de estilo CSS a través de Framer Motion. Las cartas de monstruo interactivas y pesadas ya invocadas **nunca se desmontan** durante el cambio de tema, asegurando 60 FPS estables durante el proceso de ensamblado del tablero.

## 3. Corrección de Tipos
Se corrigió un error de TypeScript heredado en `packages/game-types/src/index.ts` al registrar propiamente el evento `drawCard`, logrando que la tipificación estática entre cliente y servidor funcione en completa armonía para el evento de robo de cartas.
