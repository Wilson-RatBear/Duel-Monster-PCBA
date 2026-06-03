# 🎒 Nuevo Sistema de Inventario y Límites de Mazo

Se ha rediseñado completamente la forma en que los jugadores coleccionan cartas y construyen sus mazos. Ahora ya no solo "desbloqueas" una carta, sino que acumulas copias de ellas.

## 📦 Sistema de Inventario
- El progreso ha pasado de ser una lista de "cartas descubiertas" a un **inventario real con cantidades**.
- **Inicio justo:** Al iniciar a jugar por primera vez, recibes exactamente **1 copia** de cada carta base del juego.
- **Modo Aventura Expansivo:** Cada 5 victorias en el Modo Aventura, el juego te otorgará **1 copia al azar** de cualquier carta existente (hasta un máximo de 10 copias por carta). ¡Esto incluye la posibilidad de ganar más copias de tus monstruos base (como el Compilador Binario) o descubrir cartas ocultas!

> [!TIP]
> Si ya tienes 10 copias de una carta, el sistema ya no te soltará más esa carta y automáticamente buscará entregarte otra diferente que aún no tengas maximizada.

## 🃏 Armado de Mazos (Fase de Preparación)
El constructor de mazos en la interfaz y el servidor han sido completamente ajustados para acomodarse a las nuevas reglas:

1. **Límite de Mazo Expandido:** Ahora puedes colocar entre **5 y 25 cartas** en tu mazo.
2. **Límite de Monstruos:** Está estrictamente validado para que no exceda de **9 monstruos**.
3. **Límite de Hechizos:** Puedes agregar todos los hechizos que desees, ¡incluso de la misma carta!, siempre que tu inventario te lo permita y no pases de las 25 cartas totales.
4. **Validación de Inventario:** Ahora, cada carta en la pantalla de selección te muestra un indicador como `x0 / 1`. Al darle clic aumentará a `x1 / 1`. Si intentas agregar más cartas de las que posees, el indicador se pondrá rojo y te lo impedirá.

> [!NOTE]
> Estas reglas también aplican de la misma forma para el bot en el Modo Aventura, el cual ahora es capaz de construir de forma aleatoria un mazo válido respetando el nuevo tope de 25 cartas y máximo 9 monstruos.
