# Plan de Expansión GBL: Ingeniería de Petróleo (Semestre II)

Este documento detalla la arquitectura técnica para integrar el contenido programático del Segundo Semestre de Ingeniería de Petróleo. Esta expansión introduce conceptos avanzados como cálculo de volúmenes de daño, topografía de campo y mecanismos de reacción orgánica.

## User Review Required

> [!IMPORTANT]
> **Refactorización de `BaseCard` a `AcademicCard`:** Para cumplir con el requerimiento estricto de herencia, vamos a transformar/aliar `BaseCard` hacia `AcademicCard`, sirviendo como la clase o interfaz raíz absoluta del monorepo. Verifica que este renombramiento no choque con tu frontend actual.

## Open Questions

> [!WARNING]
> 1. **Modo Topográfico (Elevación Z):** ¿Deseas que la "Línea de visión" (Topografía) impida ataques cuerpo a cuerpo (ej. un monstruo en un valle Z=0 no puede atacar a uno en una colina Z=2), o solo que aplique modificadores de daño?
> 2. **Historial de Daño (Integración):** Para calcular el "Área bajo la curva", necesitamos persistir un array con el historial de daño por turno en el estado. ¿Está bien aumentar el peso del `GameState` de esta forma?

## Proposed Changes

---

### packages/game-types

Se crearán las jerarquías de herencia y se extenderán los tipos espaciales y químicos.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Renombrar/Extender `BaseCard` a `AcademicCard`.
- Inyectar la interfaz `PetroleumS2Metadata` que contendrá las nuevas propiedades mecánicas.

```typescript
export type ReactionMechanism = 'SN1' | 'SN2' | 'RADICAL' | 'ADDITION';
export type GeometricProjection = 'ORTOGONAL' | 'ISOMETRICA' | 'TOPOGRAFICA';

// Nueva base estricta
export interface AcademicCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
  academicMetadata: AcademicMetadata;
  // Expansiones Semestre II Petróleo
  bondEnergy?: number; // Para Química Orgánica
  reactionMechanism?: ReactionMechanism;
  geometricProjection?: GeometricProjection;
}

export interface PositionR3 extends PositionR2 {
  z: number; // Elevación Topográfica (Dibujo)
}

// Actualización del monstruo
export interface MonsterCard extends AcademicCard {
  // ...
  position?: PositionR3; 
}
```

---

### Extensión del Esquema PostgreSQL

Para persistir las nuevas mecánicas de Petróleo S2, propondremos la siguiente estructura relacional / columnas adicionales:

```sql
-- Extensión de la tabla Cards
ALTER TABLE cards ADD COLUMN bond_energy INTEGER NULL;
ALTER TABLE cards ADD COLUMN reaction_mechanism VARCHAR(50) NULL;
ALTER TABLE cards ADD COLUMN geometric_projection VARCHAR(50) NULL;

-- Para el Modo Topográfico, quizás necesites una tabla de "Terrenos"
CREATE TABLE terrains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    base_elevation INTEGER,
    effect_description TEXT
);
```

---

### apps/server (Lógica de Sockets)

El backend de Express/Socket.io requerirá nuevos interceptores y utilidades matemáticas:

1. **Integración de Daño (Cálculo II):**
   - El `GameState` guardará un histórico de turnos `turnDamageHistory: number[]`.
   - Cuando se activa el hechizo de integración, el servidor realizará una sumatoria $\sum f(x)\Delta x$ de esos valores (área bajo la curva) para desatar un daño acumulado masivo.
2. **Acción y Reacción Automática (Física I):**
   - Se modificará el ciclo de `attackBasic`. Si el defensor tiene activa la "Tercera Ley de Newton", el evento no solo computa la resta de HP del defensor, sino que *automáticamente* dispara un sub-evento de contraataque idéntico hacia el atacante (fuerza opuesta).
3. **Mecánicas SN1 / SN2 (Química Orgánica):**
   - Un mecanismo `SN2` (Ataque por detrás) requerirá validación espacial en la grilla. Si el atacante no está posicionado geométricamente a espaldas (en el eje de coordenadas opuesto) del grupo saliente del defensor, la reacción falla.

---

## Diseño Detallado de 5 Cartas 'Core' (Semestre II)

A continuación, la lista detallada de las cartas que anclan los subproyectos con la jugabilidad:

### 1. Integral Definida (Cálculo II)
- **Tipo:** Hechizo
- **Efecto Técnico:** Inflige daño directo al oponente equivalente al "Área bajo la curva" (la suma del daño total infligido en los últimos 3 turnos).
- **Validación del Servidor:** El socket lee `game.turnDamageHistory.slice(-3).reduce((a,b)=>a+b, 0)`. Evalúa la suma y deduce el HP. Enseña el concepto de integral como acumulación de valores discretos.

### 2. Sustitución Nucleofílica Bifásica - SN2 (Química Orgánica)
- **Tipo:** Monstruo
- **Efecto Técnico:** Solo puede atacar si está posicionado en una coordenada exactamente opuesta (`x: -defensor.x, y: -defensor.y`) respecto al centro. Si se cumple, el ataque es inbloqueable (ignora DEF).
- **Validación del Servidor:** El `academic-validator.ts` verifica las coordenadas. Matemáticamente exige que la aproximación sea "por detrás" del átomo objetivo, simulando el mecanismo de reacción SN2 que invierte la estereoquímica.

### 3. Tercera Ley de Newton (Física I)
- **Tipo:** Trampa (Modificador Persistente)
- **Efecto Técnico:** Cuando tu monstruo recibe daño de ataque básico, el monstruo atacante recibe exactamente la misma cantidad de daño (Acción y Reacción).
- **Validación del Servidor:** Durante la resolución de `attackBasic`, si el defensor tiene este efecto activo en `activeEffects`, el servidor añade una línea adicional: `attacker.hp -= damageRecibido` simultáneamente, ilustrando fuerzas de igual magnitud y dirección opuesta.

### 4. Vistas Isométricas (Dibujo Topográfico)
- **Tipo:** Hechizo de Campo
- **Efecto Técnico:** Elimina la propiedad de "Línea de visión oculta" por elevación topográfica en el campo. Todos los monstruos se vuelven atacables independientemente de su coordenada `z`.
- **Validación del Servidor:** Modifica globalmente la regla de rango espacial de `attackBasic`, puenteando el cálculo diferencial del eje `z`, ilustrando cómo una proyección isométrica colapsa la profundidad en un plano visible.

### 5. Rechazo de Formato APA (Metodología de la Investigación)
- **Tipo:** Trampa (Counter)
- **Efecto Técnico:** Niega la invocación de un monstruo enemigo si la mano del oponente no está correctamente estructurada (ej. si no tienen un balance exacto de tipos de cartas: 1 Hechizo, 1 Monstruo).
- **Validación del Servidor:** En el evento `summonMonster`, el servidor audita el "formato" (la composición del array de la mano enemiga). Enseña sobre los rigurosos estándares metodológicos requeridos para presentar y publicar un trabajo.
