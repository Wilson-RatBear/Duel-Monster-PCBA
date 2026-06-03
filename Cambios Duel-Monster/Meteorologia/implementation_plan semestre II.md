# Plan de Expansión GBL: Meteorología (Semestre I)

Este plan de arquitectura detalla cómo introduciremos los conceptos del Segundo Semestre de Meteorología, llevando el motor a soportar dinámica de fluidos, capas topográficas múltiples y electromagnetismo.

## User Review Required

> [!IMPORTANT]
> **Superposición de Capas (SIG):** Implementar "Sistemas de Información Geográfica" requiere que el tablero abandone la idea de un solo "Hechizo de Campo" y adopte un arreglo de capas (`fieldLayers: SpellCard[]`) que interactúen simultáneamente. ¿Estás de acuerdo con permitir múltiples campos activos superpuestos?

## Open Questions

> [!WARNING]
> 1. **Tormenta Eléctrica (Física II):** Cuando el potencial eléctrico acumulado en el tablero estalle y detone una tormenta, ¿debería destruir todas las cartas o solo causar daño masivo a los puntos de vida de ambos jugadores?
> 2. **Base de Datos:** Para registrar las *Series Homólogas* orgánicas, he propuesto una tabla anexa en PostgreSQL. ¿Te parece bien este esquema relacional o prefieres usar una estructura JSON en una sola tabla de progreso?

## Proposed Changes

---

### packages/game-types

Se extenderá la interfaz `AcademicCard` y el `GameState` para albergar electromagnetismo, mapas SIG y suelos.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Adición de `electricPotential` y `fieldLayers` en `GameState`.
- Adición de `soilInteraction` y `cartographicSymbol` en `AcademicCard`.

```typescript
export type CartographicSymbol = 'ISOHIETA' | 'ISOBARA' | 'CURVA_NIVEL' | 'RIO' | 'SUELO_ARCILLOSO';

export interface AcademicCard {
  // ... (propiedades anteriores)
  soilInteraction?: string;
  cartographicSymbol?: CartographicSymbol;
}

export interface GameState {
  // ...
  electricPotential: number; // Física II - Ley de Gauss y Potencial
  fieldLayers: SpellCard[];  // Vivencial II - Mapa de Capas SIG
}
```

---

### apps/server (Controladores y Electromagnetismo)

El servidor evolucionará para calcular acumulaciones en el tiempo (Integrales) y flujo (Fluidos).

1. **Cargas Eléctricas Atmosféricas (Física II):**
   - El estado iniciará con `electricPotential = 0`.
   - Ciertas acciones (invocar, robar cartas o activar efectos) añadirán carga al ambiente (+1 o +2).
   - Si en el `endTurn` el `electricPotential` alcanza un límite crítico (ej. 10), el servidor emite una descarga eléctrica global, limpiando el campo o reduciendo HP bruscamente por la "Diferencia de Potencial", luego se resetea a 0.
2. **Presión Hidrodinámica (Mecánica de Fluidos):**
   - El daño o fuerza de monstruos con este rasgo se calculará dinámicamente en el controlador `attackBasic` basándose en el "flujo de cartas". Si el jugador tiene pocas cartas en el campo (área transversal estrecha), la presión o fuerza del fluido (ataque) aumenta (Principio de Continuidad / Bernoulli).
3. **Acumulación Integral (Matemática II):**
   - Un efecto que evalúe el número de turnos que la carta lleva activa en `fieldLayers`, multiplicando o integrando una función base (ej. HP base * $t^2 / 2$).
4. **Capas SIG (Vivencial II):**
   - Modificación del evento `castSpell` para que hechizos de tipo "Capa Cartográfica" no se sobrescriban entre sí, sino que se apilen en `game.fieldLayers`. 

---

### Extensión de Base de Datos PostgreSQL

Para guardar el progreso de identificación química (Serie Homóloga), propondremos una tabla analítica:

```sql
CREATE TABLE student_chemistry_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id),
    homologous_series_identified VARCHAR(100), -- ej. 'Alcanos', 'Alquenos'
    success_count INTEGER DEFAULT 0,
    electric_storms_survived INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Diseño Detallado de 5 Cartas 'Avanzadas' (Semestre II)

| Subproyecto | Nombre de la Carta | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- | :--- |
| **Física II** | Gradiente de Potencial | Trampa (Continua) | **Efecto:** Genera +2 de `electricPotential` cada vez que cualquier jugador roba una carta extra. Si detona la tormenta, tú eres inmune al daño.<br>**Justificación:** Muestra cómo el frotamiento y movimiento de partículas (cartas) acumulan carga electrostática hasta superar la rigidez dieléctrica (Tormenta). |
| **Física II** | Tubo de Venturi | Monstruo | **Efecto:** Gana +1000 ATK por cada espacio vacío en tu campo de monstruos. Si el campo está lleno, su ATK es base.<br>**Justificación:** Enseña Hidrodinámica. A menor área de sección transversal (menos espacio), mayor es la velocidad del fluido (daño). |
| **Matemática II** | Sólido de Revolución | Hechizo (Equipar) | **Efecto:** Cada turno que permanece activa, la DEF del monstruo aumenta geométricamente integrando el área ($V = \pi \int [f(x)]^2 dx$). Un turno = +100, dos = +400, tres = +900.<br>**Justificación:** Visualiza cómo rotar una curva sobre un eje acumula volumen con el tiempo exponencialmente. |
| **Vivencial II** | Capa SIG: Curvas de Nivel | Hechizo (Campo/SIG) | **Efecto:** Se apila en el sistema SIG. Añade +2 al eje `Z` (Elevación) de todos tus monstruos, volviéndolos inalcanzables para ataques terrestres enemigos.<br>**Justificación:** Demuestra la superposición de datos vectoriales en Sistemas de Información Geográfica para leer la altimetría de un terreno. |
| **Química Orgánica** | Serie Homóloga ($CH_2$) | Hechizo | **Efecto:** Permite sacrificar un monstruo de cadena corta (ej. Etano) para buscar en el mazo e invocar gratis el siguiente en la serie (ej. Propano).<br>**Justificación:** Refuerza la nomenclatura IUPAC enseñando que una serie homóloga solo difiere por un grupo metileno ($-CH_2-$). |

---

## Plan de Ejecución
1. Alterar `game-types/src/index.ts` con el stack completo SIG y Eléctrico.
2. Inyectar cronómetros de "Turnos Activos" y "Potencial Eléctrico" en el motor de Node.js.
3. Modificar `attackBasic` para calcular Integrales y Fluidos dinámicamente antes de despachar el GameUpdate.
