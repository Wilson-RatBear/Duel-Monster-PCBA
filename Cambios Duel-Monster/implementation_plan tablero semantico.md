# Implementation Plan - Semantic Multi-Board

This plan details the full-stack architecture and UX/UI styling design to implement the **Multi-Tablero Semántico** mechanic in the `duel-monsters` monorepo.

---

## Technical Overview

The objective is to scan the active cards (monsters in fields, and permanent spell cards in layers) after every game action, count the career area category count, determine the dominant career, and update the theme in real-time. The client will react to the `dominantTheme` property inside `GameState` and seamlessly transition its design with gorgeous Tailwind CSS themes and animations.

### Career Categories
1. **PETROLEO**: Industrial pipeline frames, dark porous rock texture, gold/black particles.
2. **ARQUITECTURA**: Blueprint blueprint grid, metric lines, technical borders.
3. **CIVIL**: Polished concrete texture, metallic tension beams, structural grids.
4. **METEOROLOGIA**: Isobar isobar lines, climate radar gradients, wind dynamic overlays.
5. **INFORMATICA**: Terminal monokai terminal grid, matrix cascades, code glow borders.
6. **NEUTRAL**: Clean dark-slate metallic fantasy theme (Default).

---

## Proposed Changes

We will implement this seamlessly across the monorepo layers:

### 1. Game Types Definition (`packages/game-types`)

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
* Add `dominantTheme: CareerArea | 'NEUTRAL'` to `GameState` interface.

---

### 2. State & Evaluation Logic (`apps/server`)

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
* Initialize `dominantTheme: 'NEUTRAL'` in `createRoom` and `joinAdventure`.
* Implement the helper function `updateDominantTheme(game)` to count active monster cards (`player.field`) and SIG spells (`game.fieldLayers`).
* Centralize WebSocket emits so that `updateDominantTheme(game)` is called immediately before sending `gameUpdate` state to clients.

---

### 3. Next.js UX/UI Dynamic Themes (`apps/web`)

#### [MODIFY] [page.tsx](file:///c:/Users/Mapache/Desktop/duel-monsters/apps/web/app/page.tsx)
* Listen to the updated `gameUpdate` payload.
* Create a Tailwind theme mapping based on the `dominantTheme`:
  * Map `dominantTheme` to specific container backgrounds, board slot borders, particle styles, and typography highlights.
  * Inject custom grid backgrounds, acotations, binary columns, pipelines, or weather isolines using Tailwind and modern CSS patterns.
* Add CSS transitions (`transition-all duration-500`) to guarantee smooth morphing animations as the board morphs between subjects.

---

## Verification Plan

### Automated/Manual Verification
1. Start the backend server and frontend web app.
2. Enter **Modo Aventura (VS. CPU)**.
3. Invocate a monster of **ARQUITECTURA** (e.g. *Masa Pendular*). The board should immediately transition to the Blueprint theme (blue grid, cyan highlights, technical borders).
4. CPU invokes a monster or activates a spell of another career (e.g. *Tubo de Venturi* - **CIVIL**). The board should update and display the ties (NEUTRAL theme) or transition to CIVIL (polished concrete and metal beams) if the count shifts.
5. Play several spells and monsters to observe smooth theme transitions in real-time.
