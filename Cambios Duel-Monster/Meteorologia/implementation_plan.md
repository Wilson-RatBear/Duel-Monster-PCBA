# Plan de Expansión GBL: Meteorología (Semestre I)

Este plan establece la arquitectura para integrar el programa académico de Meteorología en la infraestructura del juego, enfocándose fuertemente en sistemas dinámicos (Clima, Vectores y Derivadas Predictivas).

## User Review Required

> [!IMPORTANT]
> **Cálculos Vectoriales en Backend:** Calcular vectores de ataque (magnitud y dirección) junto con mapas de isolíneas puede volver el cálculo de la resolución del daño un poco más intensivo. ¿Quieres que las posiciones se resuelvan en una grilla discreta pequeña (ej. 5x5) para simplificar la enseñanza de las isolíneas a los alumnos?

## Open Questions

> [!WARNING]
> 1. **Mecánica SN1 (2 Pasos):** Un mecanismo SN1 real ocurre en dos pasos (formación del carbocatión, luego ataque). ¿Estás de acuerdo con crear un estado de "Espera" (`WaitPhase`) para el jugador que use esta carta, pausando su monstruo por 1 turno?

## Proposed Changes

---

### packages/game-types

Expandiremos el ecosistema introduciendo la rama formativa de Meteorología y tipando estrictamente los sistemas de datos atmosféricos e informáticos.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Adición de `METEOROLOGIA` al `CareerArea`.
- Inyección de enums y objetos para manejar Clima global y Vectores Físicos.

```typescript
export type CareerArea = 'INFORMATICA' | /* ... */ | 'PETROLEO' | 'METEOROLOGIA';

export type AtmosphericCondition = 'CLEAR' | 'HIGH_PRESSURE' | 'LOW_PRESSURE' | 'STORM';

export interface Vector2D {
  magnitude: number;
  angle: number; // en grados o radianes
}

export interface DataProcessing {
  algorithmType: 'SEQUENTIAL' | 'CONDITIONAL' | 'LOOP';
  processingCost: number;
}

export interface GameState {
  // ...
  globalWeather: AtmosphericCondition; // Estado meteorológico del tablero
  weatherMap?: Record<string, AtmosphericCondition>; // Mapa de isolíneas (opcional)
}
```

---

### apps/server (Lógica de Sockets y Física)

Para poder integrar **Geografía Física** y **Física I**, los controladores de Express/Socket.io deben mutar de ser calculadoras aritméticas simples a simuladores ambientales:

1. **Sincronización de Isolíneas y Clima:**
   - El `GameState` ganará un `globalWeather`.
   - Socket.io emitirá periódicamente (o a través de cartas trampa) un evento para "mover" zonas de alta/baja presión por el tablero.
   - Las **Isolíneas** (líneas de igual presión) dividirán el tablero R3 en áreas. Si un monstruo ataca atravesando una zona de *Baja Presión*, el servidor restará un % al vector del ataque basándose en fricción fluida.
2. **Cálculo de Vectores (Física I):**
   - El evento `attackBasic` soportará ataques vectoriales pasándole un `Vector2D`. El daño ya no será $ATK - DEF$. El daño resultante será la magnitud del vector tras aplicar el ángulo de colisión y la resistencia aerodinámica de la presión atmosférica actual.
3. **Análisis de Tendencia (Matemática I):**
   - El servidor usará el `turnDamageHistory` (ya existente) y el historial de uso de energía para computar la **tasa de cambio** (derivada discreta $\Delta E / \Delta t$). Cartas defensivas usarán esta tasa para auto-ajustar sus escudos.
4. **Reacción de Sustitución SN1/SN2 (Química Orgánica):**
   - **SN2** (1 paso): Intercambia forzosamente la posición `PositionR3` de un monstruo en campo por otro, instantáneamente.
   - **SN1** (2 pasos): Destruye un monstruo propio creando un "Carbocatión" en la celda (bloqueándola temporalmente) y en el siguiente turno invoca un monstruo de alto coste gratuitamente allí.

---

## Diseño Detallado de 5 Cartas 'Atmosféricas'

| Subproyecto | Nombre de la Carta | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- | :--- |
| **Geografía Física** | Frente de Baja Presión | Hechizo (Campo) | **Efecto:** Cambia el `globalWeather` a `LOW_PRESSURE`. Todos los ataques vectoriales pierden un 20% de magnitud al atravesar el centro del tablero.<br>**Justificación:** Muestra cómo un sistema de baja presión causa inestabilidad atmosférica, afectando el desplazamiento físico (viento/vectores) en el planeta Tierra. |
| **Matemática I** | Tasa de Cambio Extrema | Trampa | **Efecto:** Si el daño recibido en el turno actual creció más rápido que en el turno anterior (Derivada Segunda Positiva), anula todo el daño entrante.<br>**Justificación:** Fuerza al estudiante a comprender la **aceleración** o el análisis marginal de una función (límites y derivadas continuas). |
| **Física I** | Disparo Parabólico | Monstruo | **Efecto:** No usa ATK estático. Requiere que el jugador asigne un Ángulo. El daño al objetivo se calcula usando la fórmula de tiro parabólico en R2, multiplicándose si el clima está despejado.<br>**Justificación:** Aplica la cinemática de vectores y proyectiles. Para maximizar el daño, el jugador debe apuntar con el ángulo físico correcto (ej. 45°). |
| **Química Orgánica** | Mecanismo SN1 | Hechizo | **Efecto:** Sacrifica un monstruo. Deja su coordenada "Inestable" por 1 turno completo. Al próximo turno, invoca un monstruo con +1000 ATK allí.<br>**Justificación:** Enseña la lentitud y el paso intermedio del mecanismo Sustitución Nucleofílica Unimolecular (formación y espera del intermediario carbocatión). |
| **Técnicas Comput.** | Diagrama Condicional | Hechizo | **Efecto:** Tiene un requerimiento `DataProcessing`. Verifica el estado del oponente con un IF lógico. Si `oponente.hp > tu.hp`, roba 2 cartas. Sino, descarta 1.<br>**Justificación:** Pone en práctica el desarrollo y evaluación de algoritmos estructurados y la lectura de flujogramas condicionales. |

---

## Verificación

- La verificación principal será comprobar matemáticamente en los logs de Node.js que la descomposición de los vectores (Seno y Coseno) se compute de manera exacta y que los debuffs de zona meteorológica (Isolíneas) afecten las resultantes dinámicas sin tumbar el WebSocket.
