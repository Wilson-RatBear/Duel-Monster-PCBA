# Plan de Expansión GBL: Ingeniería de Petróleo (Semestre I)

Este documento detalla la integración del contenido programático de Ingeniería de Petróleo (Semestre I) en la arquitectura del juego, desarrollando mecánicas como "Control Espacial" (Geometría) y "Balance Estequiométrico" (Química).

## User Review Required

> [!IMPORTANT]
> **Aprobación de Sistemas Mecánicos:** La integración de Geometría requiere modificar el tablero virtual (`MonsterCard`) para incluir un sistema de coordenadas espaciales `(x, y)`. ¿Estás de acuerdo con añadir posicionamiento bidimensional al campo de batalla?

## Open Questions

> [!WARNING]
> 1. **Coordenadas R2:** ¿El tablero será una grilla discreta (ej. 3x3) o un sistema continuo basado en valores enteros (ej. x: 0-100, y: 0-100)?
> 2. **Esquema de Base de Datos:** ¿Qué ORM estás planeando usar para el esquema de PostgreSQL, o prefieres una estructura SQL pura en el plan?

## Proposed Changes

---

### packages/game-types

Extensión del dominio de la aplicación para albergar la rama de Petróleo y el soporte para Geometría Analítica.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Añadir `'PETROLEO'` al tipo `CareerArea`.
- Añadir un sistema opcional de coordenadas a `MonsterCard` para habilitar el "Control Espacial".

```typescript
export type CareerArea = 
  | 'INFORMATICA' 
  | 'GENERAL' 
  | 'MATEMATICAS' 
  | 'CIENCIAS_SOCIALES' 
  | 'LENGUAJES'
  | 'ECOLOGIA'
  | 'PETROLEO'; // <--- Nuevo

export interface PositionR2 {
  x: number;
  y: number;
}

// Extensión para Geometría Analítica
export interface MonsterCard extends BaseCard {
  // ... (propiedades previas)
  position?: PositionR2; // Control Espacial
}
```

---

### Extensión del Modelo PostgreSQL (Esquema SQL/ORM)

Para guardar y filtrar estas nuevas cartas, requerimos actualizar la base de datos PostgreSQL. Suponiendo un esquema tradicional, se añadirán los nuevos `Enums` y campos espaciales.

```sql
-- Actualización del tipo ENUM
ALTER TYPE career_area_enum ADD VALUE 'PETROLEO';

-- Si las cartas guardan posición preferida o alcance máximo:
ALTER TABLE cards ADD COLUMN spatial_range INTEGER NULL;
ALTER TABLE cards ADD COLUMN stoichiometric_cost INTEGER NULL;
```

---

### apps/server (Lógica de Sockets)

Implementaremos los nuevos *Controllers* en `duel.socket.ts` o en `academic-validator.ts` para manejar las mecánicas complejas:

1. **Balance Estequiométrico (Química):** 
   - Modificación del evento `summonMonster`.
   - Se verificará si la carta requiere `stoichiometric_cost`. Si lo requiere, el jugador debe descartar obligatoriamente la cantidad exacta de cartas de su mano equivalentes a ese valor (Conservación de Masa) para invocar al monstruo.
2. **Control Espacial (Geometría Analítica):**
   - En `attackBasic`, se usará la fórmula de la distancia entre dos puntos $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.
   - Si la distancia $d$ es mayor al rango del atacante, la validación falla (Fuera de Alcance Espacial).
3. **Resolución de Indeterminaciones (Cálculo I):**
   - Hechizos como "Regla de L'Hôpital" se interceptarán para eliminar bloqueos de estado (ej. cuando la Defensa de un monstruo se vuelva teóricamente "infinita" por un modificador) y la derivará forzosamente a su valor base.

---

## Diseño de Mecánicas (Ingeniería de Petróleo - Semestre I)

| Subproyecto | Nombre de la Carta | Tipo | Mecánica (Efecto en Juego) | Justificación Pedagógica |
| :--- | :--- | :--- | :--- | :--- |
| **Cálculo I** | Asíntota Inquebrantable | Monstruo | Su DEF no puede ser reducida o cruzada por efectos continuos. | Refuerza el concepto de una **asíntota**, una línea a la que una curva se acerca infinitamente pero nunca toca. |
| | Regla de L'Hôpital | Hechizo | Elimina "indeterminaciones" (Buffs infinitos o divisiones/bloqueos en 0) restaurando los ATK/DEF base. | Enseña que mediante la **derivada**, límites matemáticos "indeterminados" pueden hallar un valor real y concreto. |
| | Punto de Inflexión | Trampa | Cambia el objetivo del ataque enemigo de vuelta hacia sí mismo (Reflejo). | Muestra cómo la función cambia de **concavidad** en un punto, invirtiendo la tendencia de la "curva de combate". |
| **Química I** | Reacción Exotérmica | Monstruo | Al ser destruido o "reaccionar", libera 500 LP de daño al oponente. | Explica la **termoquímica** y los procesos que liberan energía en forma de calor hacia su entorno. |
| | Balance Estequiométrico | Hechizo | Requiere descartar de tu mano la cantidad EXACTA de niveles/coste de un monstruo para invocarlo. | Enseña el **balanceo de ecuaciones** y la ley de conservación de la materia (nada se crea, se transforma). |
| | Equilibrio Químico | Trampa | Iguala temporalmente los LP o ATK de ambos monstruos en combate. | Demuestra reacciones reversibles donde las tasas de formación de productos y reactivos se igualan dinámicamente. |
| **Geometría** | Guardián en R2 | Monstruo | Posee un rango espacial. Solo ataca si la fórmula de la distancia hasta el objetivo es < a su Rango. | Obliga al jugador a calcular mentalmente la **distancia entre dos puntos** geométricos en un plano cartesiano. |
| | Foco de la Parábola | Trampa | Atrae automáticamente todos los ataques dirigidos a tu lado del campo hacia esta carta. | Ilustra la propiedad fundamental de una **parábola**, donde todos los rayos paralelos se reflejan hacia su foco. |
| | Proyección Cilíndrica | Hechizo | Desplaza a un monstruo en el eje Z (volviéndolo inatacable en R2 por un turno). | Transición del pensamiento geométrico de figuras planas (R2) a figuras en el **espacio (R3)**. |
| **Lenguaje** | Coherencia Textual | Hechizo | Gana +300 ATK por cada carta en tu campo de la misma `CareerArea` (PETROLEO). | Refuerza que la **coherencia** ocurre cuando las partes de un todo mantienen el mismo hilo o tema central. |
| | Ruido en el Canal | Monstruo | Mientras esté en campo, el oponente no puede enviar mensajes (activar Trampas). | Demuestra los **factores de comunicación** que interfieren o impiden la decodificación correcta del mensaje. |
| | Código Compartido | Hechizo | Si ambos tienen un monstruo 'PETROLEO', robas 2 cartas. | Explica que para una comunicación óptima, emisor y receptor deben manejar el **mismo código**. |
| **Orientación** | Declaración de Misión | Hechizo (Equipar) | Eliges un objetivo fijo para tu monstruo. Mientras ataque a ese tipo/elemento, gana +500 ATK. | Simboliza el **Proyecto de Vida** y la misión. El enfoque claro y sostenido hacia una meta aumenta el rendimiento. |
| | Visión de Futuro | Hechizo | Mira tu mazo y pon la carta que "necesitarás en 5 turnos" en el tope. | Fomenta la planificación estratégica a largo plazo basada en tu **Misión y Visión** personal. |
| | Pilar de Resiliencia | Monstruo | Gana DEF permanente por cada vez que pierdas cartas o LP ("decisiones difíciles"). | Promueve el **auto-concepto y toma de decisiones**, enseñando que los tropiezos desarrollan fortaleza (Resiliencia). |

---

## Guía de Implementación para Controladores (`apps/server`)

1. **Inyección Espacial (`duel.socket.ts`):** 
   Se interceptará `summonMonster` para exigir que el cliente pase `{ x, y }` como argumentos, posicionando la entidad dentro de los límites matemáticos del campo validado por `academic-validator.ts`.
2. **Buffs por Misión (Orientación):**
   Se expandirá el array `activeEffects` para albergar modificadores que evalúen el estado de la partida constantemente. Por ejemplo, al asignar el hechizo "Misión", un evento de cron interno vigilará si el jugador se desvía de su objetivo y anulará el Buff si lo hace.
