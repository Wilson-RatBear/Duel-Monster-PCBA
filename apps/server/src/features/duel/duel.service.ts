import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  PlayerState, 
  Card, 
  MonsterCard, 
  SpellCard,
  UserProfile,
  MONSTERS,
  SPELLS
} from '@repo/game-types';

export function createInitialPlayerState(id: string, name: string, userProfile?: UserProfile): PlayerState {
  const allCards: Card[] = [...MONSTERS, ...SPELLS];
  
  let deck: Card[] = [];
  let hand: Card[] = [];
  
  // Si es la CPU, le asignamos un mazo válido (max 25 cartas, max 9 monstruos)
  if (id === 'cpu') {
    const cpuDeck: Card[] = [];
    const availableCards = allCards.filter(c => !c.isUnlockable || (userProfile?.cardInventory && userProfile.cardInventory[c.id] > 0));
    
    const monsters = availableCards.filter(c => c.type === 'MONSTER');
    for (let i = 0; i < 9 && monsters.length > 0; i++) {
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
        cpuDeck.push(randomMonster);
    }
    
    const spells = availableCards.filter(c => c.type === 'SPELL');
    while (cpuDeck.length < 25 && spells.length > 0) {
        const randomSpell = spells[Math.floor(Math.random() * spells.length)];
        cpuDeck.push(randomSpell);
    }
    
    deck = JSON.parse(JSON.stringify(cpuDeck)).sort(() => Math.random() - 0.5).map((c: any) => ({ ...c, instanceId: uuidv4() }));
    hand = deck.splice(0, 3);
  }
  
  return {
    id,
    name,
    ready: false,
    hp: 8000,
    energy: 1,
    hand,
    deck,
    monsterZone: [null, null, null],
    defeatedMonsters: [],
    activeEffects: [],
    cardInventory: userProfile?.cardInventory || {},
    hasDrawnThisTurn: false
  };
}

export function checkGameOver(game: GameState, attackerId: string, opponentId: string): boolean {
  const opponent = game.players[opponentId];
  if (!opponent) return false;

  const monstersLeft = 
    opponent.hand.filter(c => c.type === 'MONSTER').length + 
    opponent.deck.filter(c => c.type === 'MONSTER').length + 
    opponent.monsterZone.filter(m => m !== null).length;

  const outOfCards = opponent.deck.length === 0 && opponent.hand.length === 0 && opponent.monsterZone.every(m => m === null);

  if (monstersLeft === 0 || opponent.hp <= 0 || outOfCards) {
    game.phase = 'GAME_OVER';
    game.winner = attackerId;
    game.logs.push(`¡${game.players[attackerId]?.name} ha ganado el duelo!`);
    return true;
  }
  return false;
}
