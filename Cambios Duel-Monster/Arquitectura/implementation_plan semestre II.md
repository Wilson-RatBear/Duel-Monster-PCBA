# Plan de Expansión GBL: Arquitectura (Semestre II)

El segundo semestre introduce un rigor técnico monumental: las proyecciones exactas (Geometría Descriptiva), el cálculo de series/integrales, y las leyes dinámicas de Newton. Integraremos estas fuerzas pasivas y espaciales al motor.

## User Review Required

> [!IMPORTANT]
> **Vistas Diédricas (Saltar Defensas):** Para implementar la mecánica de "saltar" defensas que pide la Geometría Descriptiva, propongo que la "Proyección Diédrica" permita a tu monstruo **atacar directamente a los Life Points** del oponente ignorando por completo al monstruo defensor. Al visualizar el objeto desde una vista superior o lateral, la defensa frontal se anula geométricamente. ¿Estás de acuerdo?

## Open Questions

> [!WARNING]
> **Energía Potencial:** Al añadir el atributo `newtonianLoad` a las cartas, el servidor podrá sumar ese valor pasivamente al ATK del monstruo cada vez que el oponente termine su turno (acumulando fuerza en reposo). ¿Prefieres que esta carga cinética se reinicie a cero luego de que el monstruo ataque, o que el aumento sea permanente?

## Proposed Changes

---

### packages/game-types

Extenderemos la interfaz paramétrica para soportar físicas dinámicas y conservación histórica.

#### [MODIFY] [index.ts](file:///c:/Users/Mapache/Desktop/duel-monsters/packages/game-types/src/index.ts)
```typescript
export interface AcademicCard {
  // ...
  // Semestre II Arquitectura
  newtonianLoad?: number;  // Tasa de acumulación de Energía Potencial (Física)
  historicValue?: number;  // Valor Histórico / Conservación del Patrimonio (Historia)
}
```

---

### apps/server (Lógica de Sockets)

El servidor interpretará las áreas y las leyes de movimiento.

1. **Vistas Diédricas (Geometría Descriptiva I):**
   - El hechizo otorgará el flag de estado `VistaDiedrica`. En la función `attackBasic`, si el atacante tiene este flag, saltaremos directamente a la lógica de *ataque directo*, evadiendo al `opponent.field` para reflejar el salto de plano geométrico.
2. **Energía Potencial (Física):**
   - En la función `endTurn`, iteraremos sobre los monstruos del campo. Si el monstruo en el campo tiene la propiedad `newtonianLoad > 0`, se le sumará dicho valor a su `attack`. Esto simula la carga cinética acumulándose durante la inactividad.
3. **Acumulación Integral (Matemáticas II):**
   - La carta mágica invocará el Teorema de Integración utilizando el `game.turnDamageHistory`. Usaremos el método `reduce()` para integrar (sumar) el área total de daño de la partida y restaurar HP, devolviendo el sistema al equilibrio original.

---

## Diseño Detallado de 5 Cartas (Semestre II Arquitectura)

| Subproyecto | Nombre de la Carta | Tipo | Efecto Mecánico y Justificación Pedagógica |
| :--- | :--- | :--- | :--- |
| **Proyecto de Diseño 1.1** | Iteración Metodológica | Hechizo | **Efecto:** Descarta 1 carta de tu mano y roba otra por 1 de Energía.<br>**Justificación:** Muestra el proceso cíclico del diseño: analizar, descartar ideas y generar nuevas iteraciones para llegar a la solución de materialidad correcta. |
| **Historia de la Arquitectura II** | Cúpula Renacentista | Equipar | **Efecto:** Otorga +500 DEF. Si el monstruo equipado fuera a ser destruido, se consume el `historicValue` y sobrevive con 1 HP.<br>**Justificación:** Refleja cómo los avances constructivos del Renacimiento (como Brunelleschi) y su valor histórico-patrimonial le permiten resistir el paso del tiempo. |
| **Geometría Descriptiva I** | Proyección Diédrica | Hechizo | **Efecto:** Tu monstruo en el campo puede atacar directamente a los Life Points enemigos ignorando bloqueos este turno.<br>**Justificación:** El sistema diédrico ortogonal te permite "ver" múltiples planos. El atacante encuentra el ángulo en el plano lateral donde no existe defensa. |
| **Física** | Carga del Péndulo | Monstruo | **Efecto:** Posee un `newtonianLoad` de 300. Cada final de turno enemigo, acumula +300 ATK pasivo como Energía Potencial.<br>**Justificación:** Aplica las leyes de dinámica y trabajo de Newton, demostrando cómo la energía se acumula en un sistema antes de ser liberada. |
| **Matemáticas II** | Integral Acumulada | Trampa | **Efecto:** Suma el daño de todos los turnos anteriores (`turnDamageHistory`) y cura al usuario por el 50% de esa "área bajo la curva".<br>**Justificación:** Es la aplicación literal de la integral definida como la sumatoria de áreas infinitesimales a lo largo de un historial temporal. |

---

## Plan de Ejecución
1. Actualizar Tipos (Añadir `newtonianLoad` e `historicValue`).
2. Configurar el ataque directo en `attackBasic` para `VistaDiedrica`.
3. Integrar la mecánica de área bajo la curva (Integral Acumulada) y la Carga Cinética en el bucle principal de `endTurn`.
