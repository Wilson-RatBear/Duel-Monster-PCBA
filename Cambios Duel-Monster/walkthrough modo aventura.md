# Walkthrough: Modo Aventura y Cartas Desbloqueables

Hemos inyectado una capa de progresión GBL (Aprendizaje Basado en Juegos) real. El estudiante ya no tendrá acceso inmediato a todos los conocimientos académicos avanzados (como las Integrales o Matrices Identidad). Tendrá que enfrentarse a la máquina y ganarse su conocimiento a través de la persistencia.

## Resumen de la Implementación

1. **Gestión de Perfiles y Progresión (`user.service.ts`)**
   - Construí un `user.service.ts` que almacena un Perfil de Usuario en la memoria del servidor de Node.js (actuando como el esqueleto para PostgreSQL).
   - Rastreará las victorias PvE (`pveWins`) de un `socket.id` y mantendrá un inventario de IDs de cartas exclusivas que el jugador vaya consiguiendo (`unlockedCardIds`).

2. **Cartas Base vs Desbloqueables (`duel.service.ts`)**
   - Modifiqué el pool total de `MONSTERS` y `SPELLS`. El *Dragón de Fuego*, *Guerrero de Hielo*, y *Poción de Vida* se mantendrán libres.
   - Las mecánicas académicas profundas que implementamos anteriormente (ej. `Masa Pendular`, `Tubo de Venturi`, `Proyección Diédrica` e `Integral Acumulada`) fueron etiquetadas con `isUnlockable: true`, retirándolas del mazo inicial por defecto de los nuevos estudiantes.
   - La función generadora del mazo (`createInitialPlayerState`) fue reescrita para inyectar dinámicamente las cartas de acuerdo al progreso del jugador.

3. **La Inteligencia Artificial (Modo Aventura) (`duel.socket.ts`)**
   - Añadí el evento `joinAdventure`, que crea una sala especial donde el oponente asume la identidad de `"cpu"`.
   - Se diseñó el algoritmo `processCpuTurn`. Si es el turno de la CPU, esperará asíncronamente 1.5 segundos y luego buscará la primera carta de monstruo en su mano. Si la encuentra, la invocará agresivamente y ejecutará un ataque directo o frontal hacia el monstruo que defienda al jugador, terminando su turno después del cálculo de daño.
   - Al terminar el combate, si los Life Points de la CPU llegan a 0, la función de recompensas `processPvERewards` evalúa el perfil. Si llegas al múltiplo mágico de 5 victorias, elige aleatoriamente una carta secreta desbloqueable, la registra en tu perfil y dispara una alerta gloriosa en tus logs para informarte de la nueva carta aprendida.

## Siguientes Pasos

> [!TIP]
> ¡El backend ya no solo procesa matemáticas, también tiene metas e incentivos RPG! Esto impulsará masivamente la motivación de los aspirantes en los subproyectos universitarios.

**El Frontend:**
La necesidad de iniciar con Next.js ahora es prioritaria. Necesitamos el lienzo visual para que los usuarios puedan hacer clic en "Empezar Modo Aventura" e intentar vencer a esta CPU automatizada.
