# Plan de Expansión GBL: Arquitectura (Semestre I)

El primer semestre de Arquitectura se fundamenta en la concepción del espacio, la estética y la representación técnica. Llevaremos estos principios al tablero mediante "Ordenamiento de Tablero", vistas de sección y sinergia grupal.

## User Review Required

> [!IMPORTANT]
> **Limitación del Tablero (Liderazgo):** Actualmente, nuestro `GameState` solo permite un (1) monstruo activo en el campo por jugador. Para la mecánica de *"Liderazgo"* (ataque grupal), propongo que la carta permita descartar monstruos de la **mano** para sumar su ATK al monstruo en el campo, emulando la sinergia de equipo sin romper la estructura de la base de datos. ¿Estás de acuerdo con este enfoque?

## Open Questions

> [!WARNING]
> 1. **Mecánica de Proyecciones:** Para no repetir el "revelar cartas ocultas del campo" que hicimos en Civil, propongo que el *Dibujo Arquitectónico* revele temporalmente la **mano** del oponente, mostrando sus planos secretos. ¿Te parece bien esta diferenciación?

## Proposed Changes

---

### packages/game-types

Añadiremos el espacio paramétrico de Arquitectura, introduciendo ordenamientos espaciales.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
```typescript
export type CareerArea = 'INFORMATICA' | /* ... */ | 'CIVIL' | 'ARQUITECTURA';

export type SpatialOrder = 'CENTRAL' | 'LINEAR' | 'RADIAL' | 'GRID';

export interface AcademicCard {
  // ...
  // Semestre I Arquitectura
  architecturalStyle?: string;
  spatialOrder?: SpatialOrder;
}
```

---

### apps/server (Lógica de Sockets)

El servidor interpretará las coordenadas y las formas estéticas:

1. **Ordenamiento de Tablero (Diseño I):**
   - Modificación en `summonMonster`. Si hay un campo de *"Ordenamiento Radial"* activo y el jugador invoca a un monstruo exactamente en el centro `(0,0)`, el monstruo ganará estatus extra (DEF o ATK) gracias a la "Armonía Espacial".
2. **Proyecciones y Vistas (Dibujo Arquitectónico):**
   - El hechizo *"Vista de Sección"* aplicará un flag global que, durante un turno, emitirá los datos de la mano del oponente al jugador (revelando el interior de la estructura enemiga).
3. **Proporción Áurea (Matemática I):**
   - La matemática abstracta multiplicará el ataque base o HP del monstruo por el número áureo (`1.618`) redondeado, ilustrando el canon de belleza y eficiencia.
4. **Liderazgo (Recreación):**
   - Un efecto activo que escuche la fase de batalla. Si está activo, el atacante puede consumir un monstruo de su mano en el backend, sumando esa fuerza "grupál" al ataque final.

---

## Diseño Detallado de 5 Cartas (Semestre I Arquitectura)

| Subproyecto | Nombre de la Carta | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- | :--- |
| **Proyecto de Diseño I** | Ordenamiento Radial | Hechizo (Campo) | **Efecto:** Cualquier monstruo invocado en la coordenada `(0,0)` obtiene +1000 DEF permanente.<br>**Justificación:** Enseña la importancia de la centralidad y el foco en las composiciones arquitectónicas. |
| **Historia de la Arquitectura I** | Bóveda Gótica | Trampa | **Efecto:** Redirige el daño recibido de tu HP a tu Energía (gastas energía para no perder vida).<br>**Justificación:** Emula cómo la arquitectura Gótica revolucionó la distribución de cargas y la transmisión del peso estructural. |
| **Dibujo Arquitectónico** | Corte de Sección | Hechizo | **Efecto:** Revela la mano del oponente en los logs/UI. Puedes obligarle a descartar 1 Trampa.<br>**Justificación:** Un corte arquitectónico permite ver "dentro" de la estructura, revelando los detalles internos y vulnerabilidades. |
| **Matemática I** | Proporción Áurea (Phi) | Hechizo | **Efecto:** Multiplica el ATK de tu monstruo por $1.618$ (redondeado hacia abajo) este turno.<br>**Justificación:** Muestra la aplicación de los números irracionales y el pensamiento abstracto en el canon estético y funcional. |
| **Act. Física y Recreación** | Sinergia de Liderazgo | Equipar | **Efecto:** En tu ataque, descarta el monstruo de mayor ATK de tu mano y suma su poder al monstruo en el campo.<br>**Justificación:** Refuerza los conceptos de trabajo en equipo y liderazgo canalizando los recursos del grupo hacia un objetivo común. |

---

## Plan de Ejecución
1. Actualizar Tipos (Añadir `ARQUITECTURA` y `SpatialOrder`).
2. Programar `Corte de Sección` y `Sinergia de Liderazgo` en `duel.socket.ts`.
3. Configurar el validador espacial para el `Ordenamiento Radial` en `summonMonster`.
