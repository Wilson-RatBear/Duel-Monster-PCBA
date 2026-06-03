import { GameState, Card, SpellCard, MonsterCard } from '@repo/game-types';

export interface ValidationResult {
  success: boolean;
  message?: string;
}

export const validateAcademicAction = (card: Card, gameState: GameState, playerId: string): ValidationResult => {
  if (card.type === 'SPELL') {
    return validateSpell(card as SpellCard, gameState, playerId);
  }
  
  if (card.type === 'MONSTER') {
    return validateMonster(card as MonsterCard, gameState, playerId);
  }
  
  return { success: true };
};

const validateMonster = (monster: MonsterCard, gameState: GameState, playerId: string): ValidationResult => {
  const concept = monster.academicMetadata?.academicConcept;
  // Specific spawn conditions can go here
  return { success: true };
};

const validateSpell = (spell: SpellCard, gameState: GameState, playerId: string): ValidationResult => {
  const concept = spell.academicMetadata?.academicConcept;
  const player = gameState.players[playerId];

  switch (concept) {
    case 'Regla de la Cadena':
      if (!player.monsterZone.some(m => m !== null)) {
        return { success: false, message: 'Se requiere un monstruo en el campo para aplicar la Regla de la Cadena.' };
      }
      return { success: true };

    case 'Modus Ponens':
      // "Premisa" check: for simplicity, check if there's any monster in field.
      if (!player.monsterZone.some(m => m !== null)) {
        return { success: false, message: 'No controlas ninguna Premisa (monstruo) para aplicar Modus Ponens.' };
      }
      return { success: true };

    case 'Sintaxis':
      // Robas 2 cartas si tienes exactamente 3 cartas en tu mano
      if (player.hand.length !== 3) {
        return { success: false, message: 'Debes tener exactamente 3 cartas en tu mano para tener una Sintaxis Perfecta.' };
      }
      return { success: true };

    default:
      return { success: true };
  }
};
