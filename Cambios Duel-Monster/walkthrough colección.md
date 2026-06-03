# Walkthrough: Sistema de Robo Manual de Cartas

Se han completado todas las modificaciones necesarias para implementar el sistema de robo manual en lugar del robado automático. Ahora, robar cartas del mazo es una decisión estratégica explícita que el jugador debe realizar cada turno.

### 4. Interfaz de Colección
- **Pestañas de Menú Principal:** Añadido un conmutador ("Jugar" y "Colección") en la pantalla principal antes de unirse a una sala.
- **Renderizado del Inventario:**
  - Las cartas que el jugador posee se muestran utilizando el componente interactivo `GameCardContent` (el mismo usado en el campo de batalla). Permite hacer zoom haciendo click en ellas.
  - Las cartas que el jugador **no posee** se oscurecen (estilo silueta, sin mostrar arte, nombre, ni descripción) utilizando un contenedor anónimo con un icono de candado (`🔒`) para mantener el misterio hasta su desbloqueo.
- **Sincronización:** Se utiliza el nuevo evento de WebSockets `getProfile` y `profileUpdate` para mantener en tiempo real la información de las cartas obtenidas.

## Siguientes Pasos
- Pulido visual de detalles adicionales (por ejemplo, parte delantera de las cartas según feedback futuro).
- Sistema de aventura expandido.

## Cambios Realizados

### 1. Interfaz Gráfica (`page.tsx`)
- **Componente de Mazo Visual**: Añadido en la esquina inferior izquierda del campo de batalla.
- El mazo muestra cuántas cartas restan.
- Destellos dorados y una sutil animación te indicarán si puedes robar.
- Se deshabilita y se torna gris una vez robada la carta o en el turno del oponente.
- Se envía el evento `drawCard` al servidor cuando se hace clic.

### 2. Estructuras de Datos (`packages/game-types`)
- Añadido el atributo `hasDrawnThisTurn` al estado de cada jugador (`PlayerState`).
- Nuevo evento `drawCard` en la interfaz `ClientToServerEvents`.

### 3. Lógica Central (`duel.socket.ts` y `duel.service.ts`)
- **Bloqueo Automático Desactivado**: El juego ya no roba cartas automáticamente al principio del turno ni al invocar un monstruo.
- **Nuevo Evento `drawCard`**: Implementado con validación de una sola vez por turno.
- **Fin del Juego Integrado**: Si intentas robar carta y tu mazo está vacío, perderás la partida instantáneamente.
- **Recolección de Datos**: El hechizo `s5` ("Recolección de Datos") ahora llama directamente a la función de robar carta sin afectar el límite de `hasDrawnThisTurn` de tu turno.
- **Inteligencia Artificial**: La CPU fue actualizada para "hacer clic" (simuladamente) en su mazo de forma automática y manual al principio de su bucle de ataque, asegurando que pueda jugar sin quedarse trabada.

## Verificación

- Inicia una nueva partida. Notarás que en tu turno ya no se te reponen cartas automáticamente.
- Da clic en el mazo ubicado en la esquina inferior izquierda para obtener tu carta correspondiente.
- Lanza "Recolección de Datos" para comprobar que robas una carta extra y sigues teniendo la opción de usar el mazo normal si no lo has hecho.
- Verás en los registros cómo la CPU también realiza su proceso de robo manual.
