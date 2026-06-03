# Plan de Implementación: Animaciones de Ataque con Framer Motion

Este plan describe la integración de **Framer Motion** para dotar al juego de un sistema de animaciones fluido y reactivo. Nos centraremos en animar los ataques cuando un monstruo embiste al oponente.

## User Review Required

> [!IMPORTANT]
> **Cambios en la Arquitectura de Eventos:**
> Se añadirá un nuevo evento Socket (`playAnimation`) que viajará del Servidor al Cliente. Esto es vital para asegurar que la animación se reproduzca en *ambos* clientes (atacante y defensor) de forma sincronizada, justo antes o durante la actualización del estado de vida (HP/DEF).

## Proposed Changes

---

### apps/web (Frontend)

Instalaremos la librería y modificaremos la pantalla de combate para incorporar las físicas de Framer Motion.

#### [MODIFY] package.json
- Añadir `framer-motion` a las dependencias.

#### [MODIFY] app/page.tsx
- **Componentes Animados**: Importar `motion` y `AnimatePresence` de `framer-motion`.
- **Estado de Animación**: Añadir un nuevo estado (ej. `const [animatingCard, setAnimatingCard] = useState<string | null>(null)`) para rastrear qué tarjeta se está animando.
- **Listener del Socket**: Escuchar `socket.on('playAnimation', ...)` para activar el estado temporal de animación y limpiarlo después de unos milisegundos.
- **Renderizado del Tablero**: Envolver los `MonsterCardDisplay` (o el contenedor del slot) en `<motion.div>`.
  - Cuando se activa el estado de ataque, aplicar un `animate` que mueva la carta hacia adelante (eje Y) simulando una embestida y luego vuelva a su posición original usando físicas de resorte (`spring`).
  - Añadir un efecto visual al defensor (sacudida o parpadeo en rojo) cuando recibe el impacto.

---

### packages/game-types (Tipos Compartidos)

Definiremos el contrato estricto de nuestra nueva API de animaciones.

#### [MODIFY] src/index.ts
- Añadir la interfaz `AnimationPayload`:
  ```typescript
  export interface AnimationPayload {
    type: 'ATTACK_IMPACT' | 'SPELL_CAST';
    attackerId?: string;
    targetId?: string;
    damage?: number;
  }
  ```
- Añadir el evento a `ServerToClientEvents`:
  `playAnimation: (data: AnimationPayload) => void;`

---

### apps/server (Backend)

Modificaremos el servidor para que detone estas animaciones durante el ciclo de daño.

#### [MODIFY] src/features/duel/duel.socket.ts
- En el evento `attackBasic`:
  - Justo antes o después de calcular el daño neto (`finalDamageToMonster` / HP), emitir `io.to(roomId).emit('playAnimation', { ... })`.
  - Asegurar que la animación se envía para que tanto el cliente local como el remoto procesen el efecto visual sincronizado.

## Verification Plan

### Automated Tests
- Ejecutar `pnpm install` tras modificar el package.json de la web.
- Validar `pnpm check-types` para asegurar que el nuevo evento viaja con seguridad de tipos estricta en todo el monorepo.

### Manual Verification
1. Abrir dos clientes (o iniciar Modo Aventura).
2. Entrar a fase de BATTLE, invocar un monstruo.
3. Hacer clic en "Atacar".
4. Validar que la carta atacante se abalanza visualmente con Framer Motion (resorte suave).
5. Validar que el evento visual se procesa antes/junto a la reducción matemática de los puntos de daño.
