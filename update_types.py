import re

with open('packages/game-types/src/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace CardType with CardType + new types
content = content.replace(
    "export type CardType = 'MONSTER' | 'SPELL' | 'TRAP';",
    "export type CardType = 'MONSTER' | 'SPELL' | 'TRAP';\n\nexport type CareerArea = 'INFORMATICA' | 'GENERAL' | 'CALCULO' | 'LOGICA' | 'LENGUAJE' | 'DESARROLLO' | 'FISICO' | 'CIVIL' | 'METEOROLOGIA' | 'ARQUITECTURA' | 'PETROLEO' | 'NEUTRAL';\n\nexport interface AcademicMetadata {\n  careerArea: CareerArea;\n  academicConcept: string;\n  learningModule?: string;\n}"
)

# Update BaseCard
content = content.replace(
    "  isUnlockable?: boolean;\n}",
    "  isUnlockable?: boolean;\n  academicMetadata: AcademicMetadata;\n}"
)

# Update SpellCard
content = content.replace(
    "  targetType?: 'SINGLE' | 'AOE';\n  academicMetadata?: {\n    academicConcept: string;\n  };\n}",
    "  targetType?: 'SINGLE' | 'AOE';\n}"
)

# Add academicMetadata to all existing objects having area: '...'
def repl(match):
    area = match.group(1)
    # default concept to 'Concepto General'
    return f"area: '{area}', academicMetadata: {{ careerArea: '{area}' as CareerArea, academicConcept: 'Concepto General' }}"

content = re.sub(r"area:\s*'([^']+)'", repl, content)

new_monsters = """
  // Lógica
  { id: 'm13', name: 'Predicado Universal', type: 'MONSTER', description: 'Su daño penetra a todos los monstruos defensores simultáneamente (Para todo x).', attack: 1800, defense: 1000, basicAttackName: 'Cuantificador', specialAttackName: 'Penetración Universal', specialAttackCost: 3, area: 'LOGICA', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Predicados' } },
  { id: 'm14', name: 'Tautología, el Inmutable', type: 'MONSTER', description: 'Sus estadísticas no pueden ser alteradas.', attack: 2200, defense: 2200, basicAttackName: 'Verdad Absoluta', specialAttackName: 'Inmutabilidad', specialAttackCost: 3, area: 'LOGICA', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Tautología' } },
  // Lenguaje
  { id: 'm15', name: 'Orador Persuasivo', type: 'MONSTER', description: 'Toma el control de un monstruo enemigo durante un turno.', attack: 1200, defense: 1200, basicAttackName: 'Argumento', specialAttackName: 'Persuasión', specialAttackCost: 3, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Persuasión' } },
  { id: 'm16', name: 'Sujeto Tácito', type: 'MONSTER', description: 'Puede atacar directamente a los puntos de vida del oponente.', attack: 1400, defense: 800, basicAttackName: 'Ataque Oculto', specialAttackName: 'Invisibilidad', specialAttackCost: 2, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Sujeto Tácito' } },
  // Desarrollo Personal
  { id: 'm17', name: 'Visión de Vida', type: 'MONSTER', description: 'Permite ver la carta superior de tu mazo al inicio de cada turno.', attack: 1000, defense: 2500, basicAttackName: 'Mirada al Futuro', specialAttackName: 'Previsión', specialAttackCost: 2, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Visión de Vida' } },
  { id: 'm18', name: 'Buscador de Metas', type: 'MONSTER', description: 'Gana ATK cada vez que un hechizo es activado con éxito.', attack: 1600, defense: 1500, basicAttackName: 'Esfuerzo', specialAttackName: 'Logro', specialAttackCost: 2, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Metas' } },
  // Físico
  { id: 'm19', name: 'Coloso de la Fuerza', type: 'MONSTER', description: 'ATK masivo pero requiere recuperación.', attack: 3000, defense: 1000, basicAttackName: 'Golpe Pesado', specialAttackName: 'Aplastamiento', specialAttackCost: 4, area: 'FISICO', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Fuerza Máxima' } },
  { id: 'm20', name: 'Velocista del Viento', type: 'MONSTER', description: 'Puede atacar en el mismo turno en que es invocado.', attack: 1800, defense: 1200, basicAttackName: 'Carrera', specialAttackName: 'Aceleración', specialAttackCost: 2, area: 'FISICO', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Velocidad' } }
"""

new_spells = """
  // Pedagogical Spells - Calculo
  { id: 's9', name: 'Regla de la Cadena', type: 'SPELL', description: 'Permite que un monstruo aliado ataque dos veces.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Regla de la Cadena' } },
  { id: 's10', name: 'Derivada de la Constante', type: 'SPELL', description: 'Reduce el ATK de un monstruo enemigo a 0.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Derivada' } },
  { id: 's11', name: 'Asíntota Vertical', type: 'SPELL', description: 'Detiene un ataque directo creando una barrera infinita de Defensa.', energyCost: 1, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Asíntotas' } },
  { id: 's24', name: 'Límites, Guardián del Infinito', type: 'SPELL', description: 'Aumenta el ATK de un aliado basado en la cantidad de monstruos en tu cementerio.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Límites' } },
  { id: 's25', name: 'Continuidad Rota', type: 'SPELL', description: 'Anula la activación de los hechizos enemigos durante el turno.', energyCost: 2, area: 'CALCULO', targetType: 'NONE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Continuidad' } },
  // Lógica
  { id: 's12', name: 'Modus Ponens', type: 'SPELL', description: 'Si controlas una Premisa, invoca una Conclusión directamente.', energyCost: 2, area: 'LOGICA', targetType: 'SINGLE', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Modus Ponens' } },
  { id: 's13', name: 'Contradicción Kaelisk', type: 'SPELL', description: 'Anula el último efecto activado.', energyCost: 2, area: 'LOGICA', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Contradicción' } },
  { id: 's14', name: 'Ley de De Morgan', type: 'SPELL', description: 'Invierte las posiciones de batalla (Ataque a Defensa y viceversa) de todos los monstruos.', energyCost: 3, area: 'LOGICA', targetType: 'AOE', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Leyes de De Morgan' } },
  // Lenguaje
  { id: 's15', name: 'Sintaxis Perfecta', type: 'SPELL', description: 'Robas 2 cartas si tienes exactamente 3 cartas en tu mano.', energyCost: 1, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Sintaxis' } },
  { id: 's16', name: 'Falacia de Ambigüedad', type: 'SPELL', description: 'Redirige un ataque enemigo al azar.', energyCost: 2, area: 'LENGUAJE', targetType: 'SINGLE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Falacias' } },
  { id: 's17', name: 'Coherencia Textual', type: 'SPELL', description: 'Aumenta el ATK de tus monstruos si comparten el mismo Concepto.', energyCost: 2, area: 'LENGUAJE', targetType: 'AOE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Coherencia Textual' } },
  // Desarrollo Personal
  { id: 's18', name: 'Motivación al Logro', type: 'SPELL', description: 'Aumenta el ATK en base a monstruos destruidos previamente.', energyCost: 2, area: 'DESARROLLO', targetType: 'SINGLE', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Motivación' } },
  { id: 's19', name: 'Resiliencia', type: 'SPELL', description: 'Si tus PV bajan a 0, te mantienes con 1 PV.', energyCost: 3, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Resiliencia' } },
  { id: 's20', name: 'FODA', type: 'SPELL', description: 'Reduces el ATK de un enemigo a la mitad y aumentas su DEF al doble.', energyCost: 1, area: 'DESARROLLO', targetType: 'SINGLE', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Análisis FODA' } },
  // Físico
  { id: 's21', name: 'Resistencia Aeróbica', type: 'SPELL', description: 'Protege a tus monstruos del cansancio.', energyCost: 2, area: 'FISICO', targetType: 'AOE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Resistencia Aeróbica' } },
  { id: 's22', name: 'Fatiga Muscular', type: 'SPELL', description: 'El atacante pierde 500 ATK permanentemente.', energyCost: 1, area: 'FISICO', targetType: 'SINGLE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Fatiga' } },
  { id: 's23', name: 'Flexibilidad Táctica', type: 'SPELL', description: 'Devuelve un monstruo a tu mano para invocar otro de igual coste.', energyCost: 1, area: 'FISICO', targetType: 'SINGLE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Flexibilidad' } }
"""

content = re.sub(r"export const MONSTERS: MonsterCard\[\] = \[([\s\S]*?)\];", f"export const MONSTERS: MonsterCard[] = [\\1,{new_monsters}];", content)
content = re.sub(r"export const SPELLS: SpellCard\[\] = \[([\s\S]*?)\];", f"export const SPELLS: SpellCard[] = [\\1,{new_spells}];", content)

with open('packages/game-types/src/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)
