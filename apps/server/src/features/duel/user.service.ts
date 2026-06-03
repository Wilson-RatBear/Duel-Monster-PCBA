import { UserProfile, Card, MONSTERS, SPELLS } from '@repo/game-types';

// Base de datos en memoria para los perfiles de usuario (Mock de PostgreSQL)
const usersDb = new Map<string, UserProfile>();

export function getUserProfile(id: string): UserProfile {
  if (!usersDb.has(id)) {
    const initialInventory: Record<string, number> = {};
    const allCards = [...MONSTERS, ...SPELLS];
    
    // Give exactly 1 copy of all base cards (non-unlockable)
    allCards.forEach(c => {
      if (!c.isUnlockable) {
        initialInventory[c.id] = 1;
      }
    });

    usersDb.set(id, {
      id,
      name: 'Estudiante',
      pveWins: 0,
      cardInventory: initialInventory
    });
  }
  return usersDb.get(id)!;
}

export async function addStudentProgress(data: { studentId: string; concept: string; masteryPoints: number }) {
  // Mock PostgreSQL sync
  console.log(`[DB SYNC] Guardando progreso de ${data.studentId}: ${data.concept} (+${data.masteryPoints} XP)`);
  // Here we could update usersDb if we extended UserProfile to track XP per concept
}

export function addWin(id: string): { profile: UserProfile; unlockedCard?: Card } {
  const profile = getUserProfile(id);
  profile.pveWins += 1;
  
  let unlockedCard: Card | undefined;

  // Cada 5 victorias en Modo Aventura, el jugador gana una copia de una carta
  if (profile.pveWins % 5 === 0) {
    const allCards: Card[] = [...MONSTERS, ...SPELLS];
    
    // Filtrar cartas que el jugador pueda recibir (máximo 10 copias permitidas)
    const availableDrops = allCards.filter(c => (profile.cardInventory[c.id] || 0) < 10);
    
    if (availableDrops.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableDrops.length);
      unlockedCard = availableDrops[randomIndex];
      
      profile.cardInventory[unlockedCard.id] = (profile.cardInventory[unlockedCard.id] || 0) + 1;
      console.log(`[USER DB] Jugador ${id} obtuvo la carta: ${unlockedCard.name} (Copias: ${profile.cardInventory[unlockedCard.id]})`);
    }
  }

  return { profile, unlockedCard };
}
