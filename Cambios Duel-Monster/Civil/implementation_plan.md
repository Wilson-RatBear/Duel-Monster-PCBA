# Plan de Expansión GBL: Ingeniería Civil (Semestre I)

Este documento arquitectónico detalla la integración del Primer Semestre de Ingeniería Civil. Nos centraremos en la mecánica estructural: análisis de puntos críticos (Cálculo), automatización computacional (Informática) y revelado geométrico de proyecciones.

## User Review Required

> [!IMPORTANT]
> **Mecánica de Cartas Ocultas (Face-down):** Para que la "Proyección Ortogonal" tenga sentido, necesitamos permitir que los monstruos o hechizos se jueguen "boca abajo" (ocultos). Actualmente el juego invoca todo boca arriba. ¿Estás de acuerdo con añadir la propiedad `isFaceDown` al modelo de cartas en el campo y ocultar la información al oponente hasta que se revelen o ataquen?

## Open Questions

> [!WARNING]
> 1. **Automatización (Hoja de Cálculo):** ¿Deseas que el bucle de "Hoja de Cálculo" recupere Energía, robe cartas extra del mazo, o ambas cosas automáticamente al final de cada turno?
> 2. **Valencias Físicas (Deporte):** ¿Deberían las cartas de Educación Física afectar la vitalidad (HP) del jugador, o potenciar la resistencia (Defensa) de los monstruos de Civil?

## Proposed Changes

---

### packages/game-types

Introduciremos la carrera de `CIVIL` y la mecánica de cartas ocultas.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Adición de `CIVIL` al `CareerArea`.
- Inyección de la propiedad `isFaceDown?: boolean` en la interfaz base `AcademicCard`.

```typescript
export type CareerArea = 'INFORMATICA' | /* ... */ | 'METEOROLOGIA' | 'CIVIL';

export interface AcademicCard {
  // ...
  isFaceDown?: boolean; // Mecánica estructural y de geometría
}
```

---

### apps/server (Lógica de Sockets)

El servidor recibirá nuevos controladores de estado y automatización temporal:

1. **Invocaciones Ocultas:**
   - Modificaremos `summonMonster` para que acepte un flag `faceDown`. Si es `true`, la carta se envía al cliente oponente sin revelar su `attack` o `defense` reales (o simplemente marcada como oculta).
2. **Proyección Ortogonal (Geometría):**
   - Cuando se active, el servidor iterará sobre el campo del oponente buscando entidades con `isFaceDown === true` y las cambiará a `false`, disparando una actualización global y revelando las cartas (y posibles trampas) para simular la visualización geométrica del espacio.
3. **Punto Crítico y Derivadas (Cálculo I):**
   - El controlador de ataque verificará la variable `player.hp`. Si el jugador está en un "Mínimo Local" (HP crítico, ej. < 20%), el servidor alterará la derivada de la fuerza, duplicando el ataque de los monstruos para emular el repunte de la pendiente.
4. **Macro de Hoja de Cálculo (Informática):**
   - Al usar esta carta, se inyecta el efecto pasivo `MacroSpreadsheet`. En la función `endTurn`, el servidor detectará el efecto e inyectará recursos automáticamente (cartas/energía) en la mano del jugador, simulando cómo el software ofimático reduce el trabajo manual.

---

## Diseño Detallado de 5 Cartas 'Core' (Semestre I)

| Subproyecto | Nombre de la Carta | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- | :--- |
| **Geometría Analítica** | Proyección Ortogonal | Hechizo | **Efecto:** Cambia todas las cartas enemigas de `isFaceDown = true` a `false`. Revela la mano del oponente por 1 turno.<br>**Justificación:** Enseña cómo las proyecciones en geometría descriptiva permiten deducir la forma y posición de objetos 3D ocultos o en perspectiva. |
| **Cálculo I** | Punto de Inflexión Crítico | Trampa | **Efecto:** Solo se puede activar si tu HP es < 20% (Mínimo local). Duplica permanentemente el ATK y DEF de tus monstruos.<br>**Justificación:** Demuestra la aplicación de la primera y segunda derivada para hallar máximos y mínimos, marcando el punto exacto donde la curva de la batalla cambia su concavidad. |
| **Informática** | Macro de Hoja de Cálculo | Hechizo (Campo) | **Efecto:** En cada fase de fin de turno (`endTurn`), robas automáticamente 1 carta extra sin costo de acción.<br>**Justificación:** Ilustra la función real del software y las macros: automatizar procesos repetitivos y optimizar el manejo de datos/recursos. |
| **Lenguaje y Comunicación** | Decodificador de Canal | Trampa | **Efecto:** Cuando el oponente declara un ataque, nombras un tipo de carta. Si el oponente tiene esa carta en la mano, el ataque se anula.<br>**Justificación:** Representa el proceso de comunicación; si el receptor decodifica correctamente el mensaje oculto del emisor, neutraliza el "ruido". |
| **Ed. Física y Deporte** | Valencia de Resistencia | Hechizo (Equipar) | **Efecto:** Aumenta tu HP máximo en 1000 y permite que el monstruo equipado ataque dos veces (Resistencia Aeróbica).<br>**Justificación:** Fomenta los principios del entrenamiento físico, mostrando cómo mejorar las valencias (resistencia, fuerza) potencia el rendimiento general del sistema. |

---

## Ejecución Propuesta
1. Modificar tipos en `game-types`.
2. Actualizar el evento `summonMonster` para permitir estados "boca abajo".
3. Incluir el lazo de automatización ofimática (`MacroSpreadsheet`) en el `endTurn`.
