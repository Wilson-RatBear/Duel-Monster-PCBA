import { 
  GameState, 
  PlayerState, 
  Card, 
  MonsterCard, 
  SpellCard
} from '@repo/game-types';

export const MONSTERS: MonsterCard[] = [
  {
    id: 'm1',
    name: 'Dragón de Fuego',
    type: 'MONSTER',
    description: 'Un dragón poderoso que escupe fuego.',
    attack: 2000,
    defense: 1500,
    basicAttackName: 'Llamarada',
    specialAttackName: 'Explosión Ígnea',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm2',
    name: 'Guerrero de Hielo',
    type: 'MONSTER',
    description: 'Un guerrero forjado en las montañas heladas.',
    attack: 1800,
    defense: 2000,
    basicAttackName: 'Corte Gélido',
    specialAttackName: 'Prisión de Hielo',
    specialAttackCost: 2,
    hasAttacked: false
  },
  {
    id: 'm3',
    name: 'Golem de Piedra',
    type: 'MONSTER',
    description: 'Una criatura lenta pero extremadamente resistente.',
    attack: 1500,
    defense: 3000,
    basicAttackName: 'Golpe de Roca',
    specialAttackName: 'Terremoto',
    specialAttackCost: 1,
    hasAttacked: false
  }
];

export const SPELLS: SpellCard[] = [
  {
    id: 's1',
    name: 'Poción de Vida',
    type: 'SPELL',
    description: 'Recupera 1000 LP.',
    energyCost: 1
  },
  {
    id: 's2',
    name: 'Rayo Eléctrico',
    type: 'SPELL',
    description: 'Inflige 1500 de daño al monstruo enemigo.',
    energyCost: 2
  },
  {
    id: 's3',
    name: 'Escudo de Luz',
    type: 'SPELL',
    description: 'Aumenta la defensa de tu monstruo en 1000.',
    energyCost: 3
  }
];

export function createInitialPlayerState(id: string, name: string): PlayerState {
  const deck: Card[] = [...MONSTERS, ...SPELLS].sort(() => Math.random() - 0.5);
  const hand = deck.splice(0, 3);
  
  return {
    id,
    name,
    ready: false,
    hp: 8000,
    energy: 1,
    hand,
    deck,
    field: null,
    defeatedMonsters: []
  };
}

export function checkGameOver(game: GameState, attackerId: string, opponentId: string): boolean {
  const opponent = game.players[opponentId];
  if (!opponent) return false;

  const monstersLeft = 
    opponent.hand.filter(c => c.type === 'MONSTER').length + 
    opponent.deck.filter(c => c.type === 'MONSTER').length + 
    (opponent.field ? 1 : 0);

  if (monstersLeft === 0) {
    game.phase = 'GAME_OVER';
    game.winner = attackerId;
    game.logs.push(`¡${game.players[attackerId]?.name} ha ganado el duelo!`);
    return true;
  }
  return false;
}
