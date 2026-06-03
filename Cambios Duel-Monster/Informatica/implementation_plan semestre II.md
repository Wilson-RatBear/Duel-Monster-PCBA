# Plan de Expansión GBL: Semestre II - Ingeniería en Informática

Este documento define la arquitectura y el diseño técnico para integrar el contenido programático del Segundo Semestre de la UNELLEZ-VPDS en "duel-monsters".

## User Review Required

> [!IMPORTANT]
> **Revisión de Mecánicas:** Se proponen 18 cartas (3 por subproyecto) adaptadas al sílabo del semestre II. Revisa que la justificación pedagógica encaje con los objetivos de tus estudiantes.

## Open Questions

> [!WARNING]
> 1. **Estados Permanentes:** Para mecánicas como "Desviación Estándar" de Estadística, necesitamos añadir "efectos de campo" persistentes (Buffs/Debuffs probabilísticos) al `GameState`. ¿Estás de acuerdo en extender el estado de la partida para manejar estos modificadores temporales?

## Proposed Changes

---

### packages/game-types

Se requiere ampliar el dominio del sistema de tipos para soportar filtrado y categorización por Semestre y nuevas áreas del conocimiento del Ciclo Básico y Profesional.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Se introducirá el tipo `Semester`.
- Se expandirá el tipo `CareerArea`.
- Se actualizará la interfaz `AcademicMetadata` para albergar la nueva propiedad de nivel académico.

```typescript
export type Semester = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';

export type CareerArea = 
  | 'INFORMATICA' 
  | 'GENERAL' 
  | 'MATEMATICAS' 
  | 'CIENCIAS_SOCIALES' 
  | 'LENGUAJES'
  | 'ECOLOGIA';

export interface AcademicMetadata {
  semester: Semester; // <--- Nuevo Campo
  careerArea: CareerArea;
  academicConcept: string; 
  learningModule: string; 
}
```

---

### apps/server

La adición de la materia "Estadística Descriptiva" requiere que el motor de combates maneje probabilidades, aleatoriedad condicional y cálculo en tiempo real de medias y varianzas.

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
- Se actualizará el manejador de `attackBasic`.
- **Motor de Probabilidad (Estadística):** Antes de resolver un ataque, el servidor evaluará si existen modificadores estadísticos en juego. Por ejemplo, calculará la *Media* del ATK de los monstruos y establecerá una probabilidad de acierto o desvío si un efecto de dispersión está activo.
- **Flujo:** 
  1. Cliente emite `attackBasic`.
  2. Servidor lee estado del defensor. Si el defensor tiene activada la variable probabilística (Ej. "Desviación Estándar" de 50%), genera un `Math.random()`.
  3. Si la varianza desvía el ataque, se emite un log "Ataque desviado por anomalía estadística" y no hay daño.

---

## Diseño de Mecánicas Académicas (Semestre II)

A continuación, la tabla con las 18 nuevas mecánicas diseñadas como puentes de conocimiento entre la teoría del subproyecto y la jugabilidad:

| Subproyecto | Nombre de la Carta | Tipo | Mecánica (Efecto en Juego) | Justificación Pedagógica |
| :--- | :--- | :--- | :--- | :--- |
| **Cálculo II** | Sumatoria Infinita | Monstruo | Gana +100 ATK/DEF al final de cada turno que permanezca en campo. | Ilustra el comportamiento de las **series divergentes** que tienden a infinito al acumular valores iterativamente. |
| | Antiderivada | Hechizo | Revive un monstruo destruido previamente del cementerio. | Metaforiza cómo la integración (antiderivada) "revierte" o recupera el estado previo de una función. |
| | Área Bajo la Curva | Trampa | Suma el ATK de tus monstruos y absorbe el daño entrante hasta ese monto exacto. | Explica las **Integrales Definidas** como la sumatoria exacta del área (poder acumulado) bajo los límites del campo. |
| **Intro. a la Informática** | Bucle 'While' | Monstruo | Puede atacar repetidamente en un turno MIENTRAS el defensor tenga < 1000 DEF. | Enseña las **estructuras de control repetitivas**, mostrando cómo una acción itera hasta que se rompe la condición. |
| | Kernel Panic | Trampa | Finaliza instantáneamente el turno del oponente (Forced End Phase). | Refleja un error fatal en el **Sistema Operativo**, forzando un cese abrupto del flujo de procesos del usuario. |
| | Diagrama Selectivo (IF/ELSE)| Hechizo | Si tus LP son < 2000, dobla el ATK de un monstruo; SINO, roba 1 carta. | Refuerza las **estructuras de control selectivas** y la toma de decisiones basada en el estado actual de las variables (Puntos de Vida). |
| **Estadística Descriptiva**| Promedio Ponderado | Monstruo | Su ATK es igual a la sumatoria del ATK de todos los monstruos en campo dividido entre N. | Introduce la **Media aritmética**, demostrando cómo el valor de un sujeto está influenciado por la población total. |
| | Desviación Estándar | Hechizo | El próximo ataque dirigido a ti tiene 50% de probabilidad de fallar (dispersión). | Enseña cómo la **dispersión de datos** genera incertidumbre y se aleja del resultado esperado o central. |
| | Valor Atípico (Outlier) | Monstruo | Si su ATK supera el promedio del campo por más de 2000 ptos, puede atacar directo. | Define lo que es un **Outlier**: un valor que se sale de la norma estadística, rompiendo los esquemas tradicionales. |
| **Inglés Instrumental** | Skimming Technique | Hechizo | Te permite ojear las 3 cartas superiores del mazo rival y reordenarlas. | Entrena estrategias de **comprensión lectora**. Skimming busca captar la idea principal u ojear el contenido rápido. |
| | Falso Cognado | Monstruo | Al ser atacado, invierte su valor de ATK por el de DEF. | Ilustra las palabras que parecen tener un significado pero operan de manera distinta a la esperada (engaño gramatical). |
| | Sufijo Potenciador | Hechizo | Equipas esto a un monstruo para alterar su nombre y duplicar su ATK base. | Demuestra los procesos de **formación de palabras** donde un sufijo cambia el grado o naturaleza de una raíz. |
| **Ecología y Ed. Ambiental**| Bioma Sostenible | Monstruo | Mientras esté en Posición de Defensa, restaura 500 LP al inicio de tu turno. | Enseña el **desarrollo sostenible**: sistemas ambientales capaces de regenerarse si no son sobreexplotados (atacando). |
| | Ley de Caza y Pesca | Hechizo | Destruye forzosamente el monstruo con el mayor ATK en todo el campo. | Relaciona la **normativa legal ambiental** que regula la sobreexplotación de las especies más dominantes en un ecosistema. |
| | Efecto Invernadero | Trampa | Resta 200 LP a ambos jugadores por cada monstruo que esté en el campo cada turno. | Demuestra cómo la sobreacumulación del sistema afecta globalmente, afectando a la **teoría general de sistemas ambientales**. |
| **Espacio y Geografía** | Defensor del Esequibo | Monstruo | Obtiene +800 ATK/DEF si es la única carta en tu campo fronterizo. | Fomenta la **identidad nacional y soberanía** al requerir mantener en defensa un territorio en solitario. |
| | Soberanía Nacional | Hechizo | Tus cartas son inmunes a los hechizos del oponente durante la fase de batalla. | Concepto de jurisdicción absoluta y no injerencia extranjera sobre el territorio (tu campo). |
| | Región Administrativa | Trampa | Suma toda tu DEF en campo y divídela equitativamente entre tus monstruos. | Enseña la **ubicación política-territorial**, mostrando cómo la descentralización y redistribución de recursos defiende el sistema. |

---

## Verification Plan

### Automática
- Pruebas de Typescript (`pnpm run check-types`) para validar que las extensiones del tipado (`Semester`) no rompan instanciaciones previas.

### Manual
- **Test de Probabilidad (Estadística):** Mediante pruebas cruzadas de sockets, simular múltiples `attackBasic` sobre un objetivo con `Desviación Estándar` activa, verificando en los logs que aproximadamente el 50% de los ataques fallen.
- Aprobación final pedagógica (a tu criterio).
