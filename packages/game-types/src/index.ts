export type CardType = 'MONSTER' | 'SPELL' | 'TRAP';

export type CareerArea = 'INFORMATICA' | 'GENERAL' | 'CALCULO' | 'LOGICA' | 'LENGUAJE' | 'DESARROLLO' | 'FISICO' | 'CIVIL' | 'METEOROLOGIA' | 'ARQUITECTURA' | 'PETROLEO' | 'NEUTRAL';

export interface AcademicMetadata {
  careerArea: CareerArea;
  academicConcept: string;
  learningModule?: string;
}

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
  area?: string;
  isUnlockable?: boolean;
  academicMetadata: AcademicMetadata;
}

export interface MonsterCard extends BaseCard {
  type: 'MONSTER';
  attack: number;
  defense: number;
  basicAttackName: string;
  specialAttackName: string;
  specialAttackCost: number;
  hasAttacked?: boolean;
  instanceId?: string;
  activeEffects?: string[];
}

export interface SpellCard extends BaseCard {
  type: 'SPELL';
  energyCost: number;
  instanceId?: string;
  activeEffects?: string[];
  targetType?: 'SINGLE' | 'AOE' | 'NONE';
}

export type Card = MonsterCard | SpellCard;

export interface PlayerState {
  id: string;
  name: string;
  ready: boolean;
  hp: number;
  energy: number;
  hand: Card[];
  deck: Card[];
  monsterZone: (MonsterCard | null)[];
  defeatedMonsters: MonsterCard[];
  hasDrawnThisTurn?: boolean;
  unlockedCardIds?: string[];
  activeEffects?: string[];
  statusEffects?: string[];
  cardInventory?: Record<string, number>;
}

export type GamePhase = 'LOBBY' | 'PREPARATION' | 'STARTING' | 'BATTLE' | 'GAME_OVER';

export interface GameState {
  roomId: string;
  players: Record<string, PlayerState>;
  turn: string; // Player ID
  phase: GamePhase;
  winner: string | null;
  logs: string[];
  isFirstTurn: boolean;
  dominantTheme?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  cardInventory: Record<string, number>;
  pveWins: number;
}

export interface ServerToClientEvents {
  gameUpdate: (state: GameState) => void;
  roomCreated: (roomId: string) => void;
  error: (message: string) => void;
  profileUpdate: (profile: UserProfile) => void;
  playAnimation: (data: { type: 'ATTACK_IMPACT' | 'SPELL_CAST' | 'ACID_RAIN' | 'VORTEX_ELIMINATION' | 'SPELL_EFFECT', spellId?: string, attackerId?: string, targetId?: string, damage?: number, secondaryTargetId?: string, secondaryDamage?: number, targetDamage?: number, isDestroyed?: boolean }) => void;
  authSuccess: (profile: UserProfile) => void;
  authError: (message: string) => void;
  cardUnlocked: (cardName: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerId: string) => void;
  joinRoom: (roomId: string, playerId: string) => void;
  reconnect: (roomId: string, playerId: string) => void;
  setName: (name: string) => void;
  setReady: (ready: boolean) => void;
  setDeck: (cardIds: string[]) => void;
  selectDeck: (cardIds: string[]) => void;
  summonMonster: (cardId: string, positionIndex: number) => void;
  castSpell: (cardId: string, targetIndex?: number, isAllyTarget?: boolean) => void;
  attackBasic: (attackerIndex: number, targetIndex?: number) => void;
  attackSpecial: (attackerIndex: number, targetIndex?: number) => void;
  endTurn: () => void;
  getProfile: (playerId: string) => void;
  joinAdventure: (playerId: string) => void;
  nextAdventureEncounter: (playerId: string) => void;
  drawCard: () => void;
  executeAttacks: () => void;
  login: (username: string, password: string) => void;
  register: (username: string, password: string, displayName: string) => void;
}

export const MONSTERS: MonsterCard[] = [
  { id: 'm1', name: 'Dragón de Datos', type: 'MONSTER', description: 'Un dragón hecho de código.', attack: 1500, defense: 1000, basicAttackName: 'Mordisco Binario', specialAttackName: 'Aliento de Fuego', specialAttackCost: 2, area: 'INFORMATICA', academicMetadata: { careerArea: 'INFORMATICA' as CareerArea, academicConcept: 'Estructuras de Datos' } },
  { id: 'm2', name: 'Caballero de Acero', type: 'MONSTER', description: 'Un guerrero con armadura de titanio.', attack: 1800, defense: 1500, basicAttackName: 'Corte Metálico', specialAttackName: 'Golpe Sísmico', specialAttackCost: 2, area: 'CIVIL', academicMetadata: { careerArea: 'CIVIL' as CareerArea, academicConcept: 'Resistencia de Materiales' } },
  { id: 'm3', name: 'Mago Tormenta', type: 'MONSTER', description: 'Controla el clima a su voluntad.', attack: 1200, defense: 2000, basicAttackName: 'Rayo Eléctrico', specialAttackName: 'Tornado Destructor', specialAttackCost: 3, area: 'METEOROLOGIA', academicMetadata: { careerArea: 'METEOROLOGIA' as CareerArea, academicConcept: 'Presión Atmosférica' } },
  { id: 'm4', name: 'Gólem de Concreto', type: 'MONSTER', description: 'Hecho para resistir cualquier ataque.', attack: 1000, defense: 2500, basicAttackName: 'Puño de Piedra', specialAttackName: 'Terremoto', specialAttackCost: 2, area: 'ARQUITECTURA', academicMetadata: { careerArea: 'ARQUITECTURA' as CareerArea, academicConcept: 'Diseño Estructural' } },
  { id: 'm5', name: 'Limo Tóxico', type: 'MONSTER', description: 'Contamina todo a su paso.', attack: 1400, defense: 1200, basicAttackName: 'Salpicadura Ácida', specialAttackName: 'Lluvia Ácida', specialAttackCost: 2, area: 'PETROLEO', academicMetadata: { careerArea: 'PETROLEO' as CareerArea, academicConcept: 'Refinación de Crudo' } },
  { id: 'm6', name: 'Espectro de Red', type: 'MONSTER', description: 'Se infiltra en cualquier sistema.', attack: 1600, defense: 800, basicAttackName: 'Ataque DDoS', specialAttackName: 'Infección Malware', specialAttackCost: 2, area: 'INFORMATICA', academicMetadata: { careerArea: 'INFORMATICA' as CareerArea, academicConcept: 'Seguridad Informática' }, isUnlockable: true },
  { id: 'm7', name: 'Bestia de Asfalto', type: 'MONSTER', description: 'Corre a velocidades increíbles.', attack: 1700, defense: 1400, basicAttackName: 'Embestida', specialAttackName: 'Ruedas de Fuego', specialAttackCost: 2, area: 'CIVIL', academicMetadata: { careerArea: 'CIVIL' as CareerArea, academicConcept: 'Ingeniería de Vías' }, isUnlockable: true },
  { id: 'm8', name: 'Leviatán de Nubes', type: 'MONSTER', description: 'Habita en la estratosfera.', attack: 2000, defense: 1800, basicAttackName: 'Viento Cortante', specialAttackName: 'Huracán Categoría 5', specialAttackCost: 3, area: 'METEOROLOGIA', academicMetadata: { careerArea: 'METEOROLOGIA' as CareerArea, academicConcept: 'Dinámica de Nubes' }, isUnlockable: true },
  { id: 'm9', name: 'Titán de Cristal', type: 'MONSTER', description: 'Una estructura perfecta y frágil.', attack: 2500, defense: 500, basicAttackName: 'Rayo Refractado', specialAttackName: 'Prisma Láser', specialAttackCost: 4, area: 'ARQUITECTURA', academicMetadata: { careerArea: 'ARQUITECTURA' as CareerArea, academicConcept: 'Materiales de Construcción' }, isUnlockable: true },
  { id: 'm10', name: 'Guardián del Pozo', type: 'MONSTER', description: 'Protege las reservas de energía.', attack: 1900, defense: 2200, basicAttackName: 'Llamarada', specialAttackName: 'Erupción', specialAttackCost: 3, area: 'PETROLEO', academicMetadata: { careerArea: 'PETROLEO' as CareerArea, academicConcept: 'Extracción Petrolera' }, isUnlockable: true }
,
  // Pedagogical Monsters - Calculo
  // Lógica
  { id: 'm13', name: 'Predicado Universal', type: 'MONSTER', description: 'Su daño penetra a todos los monstruos defensores simultáneamente (Para todo x).', attack: 1800, defense: 1000, basicAttackName: 'Cuantificador', specialAttackName: 'Penetración Universal', specialAttackCost: 3, area: 'LOGICA', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Predicados' }, isUnlockable: true },
  { id: 'm14', name: 'Tautología, el Inmutable', type: 'MONSTER', description: 'Sus estadísticas no pueden ser alteradas.', attack: 2200, defense: 2200, basicAttackName: 'Verdad Absoluta', specialAttackName: 'Inmutabilidad', specialAttackCost: 3, area: 'LOGICA', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Tautología' }, isUnlockable: true },
  // Lenguaje
  { id: 'm15', name: 'Orador Persuasivo', type: 'MONSTER', description: 'Toma el control de un monstruo enemigo durante un turno.', attack: 1200, defense: 1200, basicAttackName: 'Argumento', specialAttackName: 'Persuasión', specialAttackCost: 3, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Persuasión' }, isUnlockable: true },
  { id: 'm16', name: 'Sujeto Tácito', type: 'MONSTER', description: 'Puede atacar directamente a los puntos de vida del oponente.', attack: 1400, defense: 800, basicAttackName: 'Ataque Oculto', specialAttackName: 'Invisibilidad', specialAttackCost: 2, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Sujeto Tácito' }, isUnlockable: true },
  // Desarrollo Personal
  { id: 'm17', name: 'Visión de Vida', type: 'MONSTER', description: 'Permite ver la carta superior de tu mazo al inicio de cada turno.', attack: 1000, defense: 2500, basicAttackName: 'Mirada al Futuro', specialAttackName: 'Previsión', specialAttackCost: 2, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Visión de Vida' }, isUnlockable: true },
  { id: 'm18', name: 'Buscador de Metas', type: 'MONSTER', description: 'Gana ATK cada vez que un hechizo es activado con éxito.', attack: 1600, defense: 1500, basicAttackName: 'Esfuerzo', specialAttackName: 'Logro', specialAttackCost: 2, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Metas' }, isUnlockable: true },
  // Físico
  { id: 'm19', name: 'Coloso de la Fuerza', type: 'MONSTER', description: 'ATK masivo pero requiere recuperación.', attack: 3000, defense: 1000, basicAttackName: 'Golpe Pesado', specialAttackName: 'Aplastamiento', specialAttackCost: 4, area: 'FISICO', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Fuerza Máxima' }, isUnlockable: true },
  { id: 'm20', name: 'Velocista del Viento', type: 'MONSTER', description: 'Puede atacar en el mismo turno en que es invocado.', attack: 1800, defense: 1200, basicAttackName: 'Carrera', specialAttackName: 'Aceleración', specialAttackCost: 2, area: 'FISICO', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Velocidad' }, isUnlockable: true }
];

export const SPELLS: SpellCard[] = [
  { id: 's1', name: 'Recarga de Energía', type: 'SPELL', description: 'Recuperas 2 puntos de energía.', energyCost: 0, area: 'NEUTRAL', academicMetadata: { careerArea: 'NEUTRAL' as CareerArea, academicConcept: 'Termodinámica' } },
  { id: 's2', name: 'Escudo de Firewall', type: 'SPELL', description: 'Aumenta la defensa de tu monstruo en 500.', energyCost: 1, area: 'INFORMATICA', academicMetadata: { careerArea: 'INFORMATICA' as CareerArea, academicConcept: 'Redes de Computadoras' }, targetType: 'SINGLE' },
  { id: 's3', name: 'Refuerzo Estructural', type: 'SPELL', description: 'Tu monstruo no puede ser destruido este turno.', energyCost: 2, area: 'CIVIL', academicMetadata: { careerArea: 'CIVIL' as CareerArea, academicConcept: 'Mecánica de Suelos' }, targetType: 'SINGLE' },
  { id: 's4', name: 'Lluvia Ácida', type: 'SPELL', description: 'Destruye a los monstruos del oponente, derritiéndolos con lluvia verde.', energyCost: 3, area: 'PETROLEO', academicMetadata: { careerArea: 'PETROLEO' as CareerArea, academicConcept: 'Impacto Ambiental' }, targetType: 'AOE' },
  { id: 's5', name: 'Reescritura de Historia', type: 'SPELL', description: 'Devuelve un monstruo del oponente a su mazo (eliminación de vórtice).', energyCost: 3, area: 'INFORMATICA', academicMetadata: { careerArea: 'INFORMATICA' as CareerArea, academicConcept: 'Sistemas Operativos' }, targetType: 'SINGLE' },
  { id: 's6', name: 'Planos de Demolición', type: 'SPELL', description: 'Destruye un monstruo objetivo y hace daño igual a la mitad de su defensa.', energyCost: 2, area: 'ARQUITECTURA', academicMetadata: { careerArea: 'ARQUITECTURA' as CareerArea, academicConcept: 'Dibujo Técnico' }, isUnlockable: true, targetType: 'SINGLE' },
  { id: 's7', name: 'Pronóstico de Niebla', type: 'SPELL', description: 'Los ataques básicos del oponente fallan este turno.', energyCost: 2, area: 'METEOROLOGIA', academicMetadata: { careerArea: 'METEOROLOGIA' as CareerArea, academicConcept: 'Fenómenos Climáticos' }, isUnlockable: true, targetType: 'AOE' },
  { id: 's8', name: 'Derrame Controlado', type: 'SPELL', description: 'El oponente pierde 1 de energía.', energyCost: 1, area: 'PETROLEO', academicMetadata: { careerArea: 'PETROLEO' as CareerArea, academicConcept: 'Gestión de Hidrocarburos' }, isUnlockable: true }
,
  // Pedagogical Spells - Calculo
  { id: 's9', name: 'Regla de la Cadena', type: 'SPELL', description: 'Permite que un monstruo aliado ataque dos veces.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Regla de la Cadena' }, isUnlockable: true },
  { id: 's10', name: 'Derivada de la Constante', type: 'SPELL', description: 'Reduce el ATK de un monstruo enemigo a 0.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Derivada' }, isUnlockable: true },
  { id: 's11', name: 'Asíntota Vertical', type: 'SPELL', description: 'Detiene un ataque directo creando una barrera infinita de Defensa.', energyCost: 1, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Asíntotas' }, isUnlockable: true },
  { id: 's24', name: 'Límites, Guardián del Infinito', type: 'SPELL', description: 'Aumenta el ATK de un aliado basado en la cantidad de monstruos en tu cementerio.', energyCost: 2, area: 'CALCULO', targetType: 'SINGLE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Límites' }, isUnlockable: true },
  { id: 's25', name: 'Continuidad Rota', type: 'SPELL', description: 'Anula la activación de los hechizos enemigos durante el turno.', energyCost: 2, area: 'CALCULO', targetType: 'NONE', academicMetadata: { careerArea: 'CALCULO', academicConcept: 'Continuidad' }, isUnlockable: true },
  // Lógica
  { id: 's12', name: 'Modus Ponens', type: 'SPELL', description: 'Si controlas una Premisa, invoca una Conclusión directamente desde tu mano al campo al azar.', energyCost: 2, area: 'LOGICA', targetType: 'NONE', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Modus Ponens' }, isUnlockable: true },
  { id: 's13', name: 'Contradicción Kaelisk', type: 'SPELL', description: 'Robas 1 carta adicional de tu mazo.', energyCost: 2, area: 'LOGICA', targetType: 'NONE', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Contradicción' }, isUnlockable: true },
  { id: 's14', name: 'Ley de De Morgan', type: 'SPELL', description: 'Invierte las posiciones de batalla (Ataque a Defensa y viceversa) de todos los monstruos.', energyCost: 3, area: 'LOGICA', targetType: 'AOE', academicMetadata: { careerArea: 'LOGICA', academicConcept: 'Leyes de De Morgan' }, isUnlockable: true },
  // Lenguaje
  { id: 's15', name: 'Sintaxis Perfecta', type: 'SPELL', description: 'Robas 2 cartas si tienes exactamente 3 cartas en tu mano.', energyCost: 1, area: 'LENGUAJE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Sintaxis' }, isUnlockable: true },
  { id: 's16', name: 'Falacia de Ambigüedad', type: 'SPELL', description: 'Engaña a un monstruo enemigo para que ataque a su propio jugador.', energyCost: 2, area: 'LENGUAJE', targetType: 'SINGLE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Falacias' }, isUnlockable: true },
  { id: 's17', name: 'Coherencia Textual', type: 'SPELL', description: 'Aumenta el ATK de tus monstruos si comparten el mismo Concepto.', energyCost: 2, area: 'LENGUAJE', targetType: 'AOE', academicMetadata: { careerArea: 'LENGUAJE', academicConcept: 'Coherencia Textual' }, isUnlockable: true },
  // Desarrollo Personal
  { id: 's18', name: 'Motivación al Logro', type: 'SPELL', description: 'Aumenta el ATK en base a monstruos destruidos previamente.', energyCost: 2, area: 'DESARROLLO', targetType: 'SINGLE', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Motivación' }, isUnlockable: true },
  { id: 's19', name: 'Resiliencia', type: 'SPELL', description: 'Si tus PV bajan a 0, te mantienes con 1 PV.', energyCost: 3, area: 'DESARROLLO', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Resiliencia' }, isUnlockable: true },
  { id: 's20', name: 'FODA', type: 'SPELL', description: 'Reduces el ATK de un enemigo a la mitad y aumentas su DEF al doble.', energyCost: 1, area: 'DESARROLLO', targetType: 'SINGLE', academicMetadata: { careerArea: 'DESARROLLO', academicConcept: 'Análisis FODA' }, isUnlockable: true },
  // Físico
  { id: 's21', name: 'Resistencia Aeróbica', type: 'SPELL', description: 'Protege a tus monstruos del cansancio.', energyCost: 2, area: 'FISICO', targetType: 'AOE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Resistencia Aeróbica' }, isUnlockable: true },
  { id: 's22', name: 'Fatiga Muscular', type: 'SPELL', description: 'El atacante pierde 500 ATK permanentemente.', energyCost: 1, area: 'FISICO', targetType: 'SINGLE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Fatiga' }, isUnlockable: true },
  { id: 's23', name: 'Flexibilidad Táctica', type: 'SPELL', description: 'Devuelve un monstruo aliado a tu mano y roba una carta.', energyCost: 1, area: 'FISICO', targetType: 'SINGLE', academicMetadata: { careerArea: 'FISICO', academicConcept: 'Flexibilidad' }, isUnlockable: true }
];

export const getCardCareers = (area?: string): string[] => {
  if (!area) return ['INFORMATICA'];
  const mappedArea = area.toUpperCase();
  switch (mappedArea) {
    case 'INFORMATICA':
      return ['INFORMATICA', 'CIVIL'];
    case 'CIVIL':
      return ['CIVIL'];
    case 'PETROLEO':
      return ['PETROLEO'];
    case 'ARQUITECTURA':
      return ['ARQUITECTURA'];
    case 'METEOROLOGIA':
      return ['METEOROLOGIA'];
    case 'CALCULO':
      return ['INFORMATICA', 'PETROLEO', 'CIVIL'];
    case 'LOGICA':
      return ['INFORMATICA'];
    case 'LENGUAJE':
      return ['INFORMATICA', 'PETROLEO', 'CIVIL', 'ARQUITECTURA'];
    case 'DESARROLLO':
      return ['INFORMATICA', 'PETROLEO'];
    case 'FISICO':
      return ['INFORMATICA', 'CIVIL', 'ARQUITECTURA'];
    case 'NEUTRAL':
    default:
      return ['INFORMATICA', 'PETROLEO', 'CIVIL', 'ARQUITECTURA', 'METEOROLOGIA'];
  }
};
