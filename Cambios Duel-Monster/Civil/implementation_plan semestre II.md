# Plan de Expansión GBL: Ingeniería Civil (Semestre II)

El segundo semestre introduce conceptos fundacionales de diseño y estática. Integraremos Álgebra Lineal (Matrices/Vectores), Dibujo Geométrico (Cortes/Secciones) y el Teorema Fundamental del Cálculo en el núcleo del validador de Express.

## User Review Required

> [!IMPORTANT]
> **Teorema Fundamental del Cálculo (Encadenamiento):** Para emular que la integración es la operación inversa de la derivación, propongo que el validador permita "encadenar" hechizos. Si un jugador juega dos cartas en el mismo turno, el Teorema "integra" su valor, haciendo que la segunda carta no consuma energía. ¿Te parece bien este enfoque para la validación encadenada?

## Open Questions

> [!WARNING]
> 1. **Transformaciones Lineales (Álgebra):** ¿Deberían las matrices alterar temporalmente las estadísticas (ATK/DEF), o realizar transformaciones espaciales forzando al oponente a cambiar de coordenadas (x,y)?
> 2. **Cortes y Secciones:** Al ignorar el escudo enemigo (Daño Penetrante), ¿el monstruo defensor debería ser destruido obligatoriamente o solo recibir el daño directo a sus puntos de vida?

## Proposed Changes

---

### Validador Expreso (`apps/server/src/features/duel/academic-validator.ts`)

Actualizaremos el middleware/validador académico para que analice cadenas de eventos.
- **Teorema Fundamental del Cálculo:** Si el `gameState` detecta que el jugador ya activó una función de Cálculo este turno (la "Derivada"), la próxima carta de Cálculo (la "Integral") pasa la validación con un costo de `0` Energía (anulando el diferencial).

### Mecánicas de Socket (`apps/server/src/features/duel/duel.socket.ts`)

1. **Daño Penetrante (Corte y Sección):**
   - En la función `attackBasic`, si el monstruo o jugador tiene el efecto `CorteTransversal`, el bloque de mitigación se saltará: `let defensePower = 0;`. Esto ilustra cómo un "corte de dibujo" revela el interior, ignorando la coraza exterior (DEF).
2. **Vectores en R2 y Matrices (Álgebra Lineal):**
   - El vector de ataque (`attackVector`) no solo sufrirá fricción meteorológica, sino que se comparará con la posición de la matriz del oponente. Si usan "Matriz Identidad", todo multiplicador de vector será `x1` (inutilizando bonos espaciales).

---

## Diseño de 15 Cartas (Semestre II Civil)

Aquí tienes la propuesta de las 3 cartas por cada uno de los 5 subproyectos oficiales:

### 1. Cálculo II
| Nombre | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- |
| **Integral Definida** | Hechizo | **Efecto:** Suma el daño de los últimos 3 turnos y lo aplica al oponente.<br>**Justificación:** Visualiza el área bajo la curva del daño en el tiempo. |
| **Teorema Fundamental** | Hechizo | **Efecto:** Tu próximo hechizo este turno cuesta 0 de Energía.<br>**Justificación:** Demuestra la conexión inversa entre derivar (gastar) e integrar (acumular). |
| **Serie de Potencias** | Trampa | **Efecto:** El daño recibido se reduce a la mitad sucesivamente (1/2, 1/4, 1/8) cada turno.<br>**Justificación:** Enseña la convergencia infinita de las series matemáticas. |

### 2. Álgebra Lineal
| Nombre | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- |
| **Transformación Lineal** | Hechizo | **Efecto:** Intercambia el ATK por la DEF de un monstruo objetivo.<br>**Justificación:** Emula cómo una matriz puede rotar o transponer vectores en el espacio Euclidiano. |
| **Matriz Identidad** | Trampa | **Efecto:** Anula cualquier alteración de estadísticas en el campo (todos vuelven a base).<br>**Justificación:** Propiedad multiplicativa de la Identidad ($A * I = A$). |
| **Vector Ortogonal** | Monstruo | **Efecto:** Inmune a ataques frontales directos; solo puede recibir daño vectorial en ángulo.<br>**Justificación:** Muestra el producto punto igual a cero (ortogonalidad a 90 grados). |

### 3. Física I
| Nombre | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- |
| **Inercia de Newton** | Monstruo | **Efecto:** Gana +1000 ATK si no atacó ni se movió en el turno anterior.<br>**Justificación:** Primera Ley de Newton: un cuerpo en reposo tiende a permanecer en reposo acumulando energía potencial. |
| **Centro de Masa** | Equipar | **Efecto:** El monstruo no puede ser movido ni volteado boca abajo.<br>**Justificación:** Estabilidad del cuerpo rígido frente a torques externos. |
| **Fuerza Conservativa** | Hechizo | **Efecto:** Si tu monstruo es destruido, recuperas su coste exacto de energía.<br>**Justificación:** Ley de conservación de energía (no se crea ni se destruye). |

### 4. Dibujo
| Nombre | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- |
| **Corte Transversal** | Hechizo | **Efecto:** Tu monstruo gana Daño Penetrante (ignora DEF enemiga).<br>**Justificación:** Un corte arquitectónico revela el interior del plano, saltando la vista de fachada (escudo). |
| **Perspectiva Isométrica** | Campo | **Efecto:** Ninguna carta puede estar `isFaceDown`. Todo se revela.<br>**Justificación:** El isométrico proporciona visualización 3D completa de la estructura. |
| **Planta Topográfica** | Trampa | **Efecto:** Bloquea ataques a monstruos situados en elevación Z > 0.<br>**Justificación:** Importancia de la altimetría y curvas de nivel en las defensas y diseño civil. |

### 5. Desarrollo Endógeno
| Nombre | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- |
| **Agro-Ecología** | Campo | **Efecto:** Ambos jugadores recuperan 500 HP al final de cada turno.<br>**Justificación:** Fomenta la sustentabilidad comunitaria y biodiversidad a largo plazo. |
| **Cooperativismo** | Hechizo | **Efecto:** Gana +500 ATK por cada monstruo adicional en tu campo.<br>**Justificación:** El trabajo en equipo y las cooperativas suman sinergias exponenciales. |
| **Marco Legal Comunal** | Trampa | **Efecto:** Previene la destrucción de tu monstruo; el oponente pierde 1 Energía por penalidad.<br>**Justificación:** Ilustra el amparo de los basamentos legales comunitarios sobre los activos. |

---

## Plan de Ejecución
1. Alterar `game-types` para asegurar que el semestre admita `II`.
2. Escribir lógica de "Teorema Fundamental" en `academic-validator.ts`.
3. Inyectar Lógica de Daño Penetrante (Corte Transversal) e Inercia en `duel.socket.ts`.
