# Walkthrough de la Implementación: API de Animaciones de Ataque (Framer Motion)

Hemos completado la integración exitosa de la librería **Framer Motion** para dotar al juego de un sistema de animaciones fluido y reactivo, centrado específicamente en el impacto visual de los ataques durante los duelos.

## 🛠️ Cambios Realizados

### 1. Sistema de Tipos (API de Sockets en `game-types`)
- **`AnimationPayload`**: Creamos una nueva interfaz estricta para definir eventos visuales:
  ```typescript
  export interface AnimationPayload {
    type: 'ATTACK_IMPACT' | 'SPELL_CAST';
    attackerId?: string;
    targetId?: string;
    damage?: number;
  }
  ```
- **Evento de Servidor**: Añadimos la firma `playAnimation: (data: AnimationPayload) => void` a `ServerToClientEvents` para forzar la sincronización entre backend y frontend.

### 2. Disparador en el Servidor (`apps/server`)
- Modificamos el controlador `attackBasic` en `duel.socket.ts`.
- Justo en el punto álgido del ataque (tras procesar reducciones de defensa, bonos climáticos y escudos matemáticos, pero *antes* de emitir el nuevo `GameState`), el servidor emite el evento `playAnimation`. 
- Esto asegura que ambos clientes (el atacante y el que recibe el golpe) detonen el efecto visual de forma rigurosamente sincronizada y orquestada por el servidor central.

### 3. Físicas de Resorte y Rendering (`apps/web`)
- **Framer Motion**: Instalamos `framer-motion` (v12) de forma limpia en el workspace del frontend.
- **Estado Global Efímero**: Implementamos un estado React de vida corta `animatingCard` que se alimenta del socket listener `playAnimation` y se autodestruye tras 800ms.
- **Refactorización de `<MonsterCardDisplay>`**:
  - Reemplazamos los divs estáticos por **`<motion.div>`**.
  - **Física de Embestida (Attacker)**: Al atacar, la carta se impulsa dramáticamente en el eje Y (hacia adelante o atrás, dependiendo si es enemigo) aplicando un multiplicador de escala con una física de resorte (`type: "spring", stiffness: 400`).
  - **Efecto de Impacto (Defender)**: Al recibir daño, la carta tiembla violentamente en el eje X (keyframes `[0, -8, 8, -8, 8, 0]`) mientras parpadea en rojo intenso usando un filtro CSS `drop-shadow(0 0 15px red)`.
  - Desactivamos las clases previas que generaban conflicto con el motor de resortes para mantener una animación Premium de máximo rendimiento (60fps).

---

## 🧪 Validación
- ✅ Las dependencias se instalaron correctamente a través de `pnpm --filter web add framer-motion`.
- ✅ El monorepo reconoce los nuevos tipos de Payload, respetando la estructura de tipado a lo largo del stack TypeScript.
- ✅ El servidor de desarrollo en caliente (`pnpm dev`) sirvió los cambios satisfactoriamente. Al iniciar combate y atacar, los monstruos se abalanzan físicamente hacia la zona opuesta.

¡La base para animaciones complejas (como hechizos masivos y cambios de clima) ahora está firmemente establecida!
