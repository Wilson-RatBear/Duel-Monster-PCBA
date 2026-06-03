# Evolución GBL: Duel Monsters para UNELLEZ - VPDS

Este documento detalla el plan de implementación para transformar "duel-monsters" en una herramienta de Aprendizaje Basado en Juegos (GBL), enfocada en los aspirantes del primer semestre de Ingeniería en Informática.

## User Review Required

> [!IMPORTANT]
> **Aprobación del Plan:** Este plan propone una arquitectura y mecánicas iniciales. Por favor revisa las propuestas de cartas y el flujo de base de datos antes de proceder con el código.

## Open Questions

> [!WARNING]
> 1. **ORM o Query Builder:** Mencionas PostgreSQL en el stack, pero no especificaste un ORM (como Prisma o TypeORM) o si usas consultas directas (pg). ¿Qué herramienta estás utilizando para conectarte a la BD en `apps/server`?
> 2. **Ponderación de Progreso:** ¿El progreso del estudiante se guardará como "Experiencia (XP)" por concepto académico (Ej: 100 XP en "Derivadas"), o es un sistema binario (Dominado / No Dominado)?

## Proposed Changes

---

### packages/game-types

Se refactorizará el sistema de tipos base para inyectar la metadata académica en todas las cartas y eventos, asegurando tipado estricto a través del monorepo.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
- Se añadirá el tipo `CareerArea` (ej. `'INFORMATICA'`, `'GENERAL'`).
- Se creará la interfaz `AcademicMetadata` conteniendo `careerArea`, `academicConcept` y `learningModule`.
- Se extenderá `BaseCard` para que incluya de forma obligatoria `academicMetadata`.

---

### apps/server

Se creará una capa de validación para asegurar que las mecánicas del juego (especialmente los "Hechizos") obedezcan reglas académicas antes de resolver sus efectos.

#### [NEW] [academic-validator.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/apps/server/src/features/duel/academic-validator.ts)
- Sistema centralizado de validación (`validateAcademicAction`) que intercepta acciones de Socket.io.
- Ejemplo: Para activar el hechizo "Modus Ponens" (Lógica), la función validará que haya un estado condicional previo cumplido en el campo.

#### [MODIFY] [duel.socket.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/apps/server/src/features/duel/duel.socket.ts)
- Se inyectará el validador académico en los eventos `castSpell` y `summonMonster`.
- **Sincronización de Conocimiento:** Se añadirá una llamada asíncrona a la base de datos (PostgreSQL) al final del turno o de la partida, mapeando las cartas usadas exitosamente a puntos de progreso del jugador.

---

## Diseño de Mecánicas Pedagógicas (25 Cartas Iniciales)

A continuación, la propuesta conceptual de las primeras 5 cartas por subproyecto:

### 1. Cálculo I (Límites y Derivadas)
- **Monstruo:** *Límes, Guardián del Infinito*. (Metáfora: Límite al Infinito). **Efecto:** No puede ser destruido por daño de combate de monstruos con ATK exacto; el atacante debe tener ATK que "tienda" a superarlo por un margen (ej. +500).
- **Hechizo:** *Regla de la Cadena*. **Efecto:** Permite que un monstruo ataque dos veces si destruye a un monstruo enemigo (encadenamiento de funciones).
- **Monstruo:** *Continuidad Rota*. **Efecto:** Anula los efectos en cadena de los hechizos enemigos durante el turno.
- **Hechizo:** *Derivada de la Constante*. **Efecto:** Reduce el ATK de un monstruo enemigo a 0.
- **Trampa:** *Asíntota Vertical*. **Efecto:** Detiene un ataque directo creando una barrera infinita de Defensa.

### 2. Lógica (Proposicional y Predicados)
- **Hechizo:** *Modus Ponens*. **Efecto:** Si controlas un monstruo "Premisa", invoca a un monstruo "Conclusión" directamente desde tu mazo.
- **Trampa:** *Contradicción Kaelisk*. **Efecto:** Si ambos jugadores activan efectos en el mismo turno, el último efecto es anulado.
- **Monstruo:** *Predicado Universal*. **Efecto:** Su daño penetra a todos los monstruos defensores simultáneamente (Para todo 'x').
- **Monstruo:** *Tautología, el Inmutable*. **Efecto:** Sus estadísticas (ATK/DEF) no pueden ser alteradas por ningún efecto, siendo siempre verdaderas.
- **Hechizo:** *Ley de De Morgan*. **Efecto:** Invierte las posiciones de batalla (Ataque a Defensa y viceversa) de todos los monstruos en el campo.

### 3. Lenguaje y Comunicación (Comprensión y Redacción)
- **Hechizo:** *Sintaxis Perfecta*. **Efecto:** Robas 2 cartas si tienes exactamente 3 cartas en tu mano (Estructura correcta).
- **Monstruo:** *Orador Persuasivo*. **Efecto:** Toma el control de un monstruo enemigo durante un turno.
- **Trampa:** *Falacia de Ambigüedad*. **Efecto:** Redirige un ataque enemigo al azar entre tus monstruos defensores.
- **Hechizo:** *Coherencia Textual*. **Efecto:** Aumenta el ATK de todos tus monstruos si comparten el mismo Atributo o Concepto Académico.
- **Monstruo:** *Sujeto Tácito*. **Efecto:** Puede atacar directamente a los puntos de vida del oponente sin ser detectado (no puede ser blanco de Trampas).

### 4. Desarrollo Personal y Profesional (Autoconocimiento y Logro)
- **Hechizo:** *Motivación al Logro*. **Efecto:** Aumenta el ATK de un monstruo en +100 por cada monstruo tuyo destruido previamente en el duelo.
- **Monstruo:** *Visión de Vida*. **Efecto:** Permite ver la carta superior de tu mazo al inicio de cada turno.
- **Trampa:** *Resiliencia*. **Efecto:** Si tus puntos de vida bajan a 0, te mantienes en el juego con 1 punto de vida este turno.
- **Hechizo:** *FODA (Fortalezas y Debilidades)*. **Efecto:** Eliges un monstruo enemigo: reduces su ATK a la mitad y aumentas su DEF al doble.
- **Monstruo:** *Buscador de Metas*. **Efecto:** Gana ATK cada vez que un hechizo es activado con éxito.

### 5. Entrenamiento Físico General (Fisiología y Valencias)
- **Monstruo:** *Coloso de la Fuerza*. **Efecto:** ATK masivo pero no puede atacar el mismo turno en que es invocado (requiere recuperación).
- **Hechizo:** *Resistencia Aeróbica*. **Efecto:** Tus monstruos no se ven afectados por hechizos de "Cansancio" o reducción de stats durante 3 turnos.
- **Trampa:** *Fatiga Muscular*. **Efecto:** El monstruo atacante pierde 500 ATK permanentemente después de su cálculo de daño.
- **Monstruo:** *Velocista del Viento*. **Efecto:** Puede atacar en el mismo turno en que es invocado.
- **Hechizo:** *Flexibilidad Táctica*. **Efecto:** Cambia un monstruo de tu campo a tu mano para invocar otro de igual coste.

---

## Flujo de Datos Real-time (Sincronización de Conocimiento)

Para integrar Socket.io con PostgreSQL reflejando el progreso:

1. **Memoria vs Persistencia:** Socket.io manejará el estado volátil (`GameState`) en memoria durante el duelo para garantizar baja latencia (< 50ms). PostgreSQL solo será consultado/actualizado en puntos clave, no en cada milisegundo.
2. **Action Interceptors:** Al disparar un evento en el cliente (ej. `socket.emit('castSpell', id)`), el servidor de Node/Express lo recibe a través del `duel.socket.ts`.
3. **Validación Académica:** Se llama a la capa lógica para verificar la legitimidad. Si "Regla de la Cadena" se activa exitosamente:
4. **Knowledge Event:** El servidor emite internamente un evento (usando Node `EventEmitter` o de forma directa asíncrona) que desencadena un Job de guardado:
   ```javascript
   // Pseudo-código de flujo
   socket.on('castSpell', async (cardId) => {
      const result = validator.validate(cardId, gameState);
      if(result.success) {
         updateGameState();
         io.to(roomId).emit('gameUpdate', gameState);
         
         // Sincronización asíncrona con PostgreSQL sin bloquear el hilo principal del juego
         await DbService.addStudentProgress({
             studentId: playerId,
             concept: card.academicMetadata.academicConcept,
             masteryPoints: 10
         });
      }
   });
   ```
5. **Feedback Visual:** Una vez que PostgreSQL confirma el guardado, el servidor puede emitir un evento especial al cliente `socket.emit('knowledgeLeveledUp', { concept: 'Derivadas', newLevel: 2 })` para lanzar una animación en el UI (Next.js).

## Verification Plan

### Automática
- Ejecución de las suites de validación de Typescript (`tsc --noEmit` o Turborepo build) para asegurar que la nueva interfaz `Card` es respetada por el cliente y el servidor.

### Manual
- **Prueba de Instanciación:** El usuario iniciará el servidor y el cliente localmente.
- **Prueba de Dominio:** Simularemos invocar una carta como "Regla de la Cadena" en un entorno controlado (estado forzado de la sala) para verificar la validación en servidor.
- **Prueba de Persistencia:** Revisar en PostgreSQL si el registro de progreso del estudiante (XP o status) fue actualizado correspondientemente.
