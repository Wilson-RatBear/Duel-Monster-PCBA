import { UserProfile, Card, MONSTERS, SPELLS } from '@repo/game-types';
import fs from 'fs';
import path from 'path';

// Local storage for user profiles on disk
const PROFILES_DIR = path.join(process.cwd(), 'profiles');

// Ensure directory exists
if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

function getProfilePath(id: string): string {
  // Prevent directory traversal
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '');
  return path.join(PROFILES_DIR, `${safeId}.json`);
}

export function saveUserProfile(profile: UserProfile) {
  const filePath = getProfilePath(profile.id);
  try {
    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf8');
  } catch (err) {
    console.error(`[USER DB] Error writing profile for ${profile.id}:`, err);
  }
}

export function getUserProfile(id: string): UserProfile {
  const filePath = getProfilePath(id);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`[USER DB] Error reading profile for ${id}, creating new one`, err);
    }
  }

  // Create new profile with starter cards only (non-unlockable)
  const initialInventory: Record<string, number> = {};
  const allCards = [...MONSTERS, ...SPELLS];
  
  allCards.forEach(c => {
    if (!c.isUnlockable) {
      initialInventory[c.id] = 1;
    }
  });

  const profile: UserProfile = {
    id,
    name: 'Estudiante',
    pveWins: 0,
    cardInventory: initialInventory
  };

  saveUserProfile(profile);
  return profile;
}

export async function addStudentProgress(data: { studentId: string; concept: string; masteryPoints: number }) {
  console.log(`[DB SYNC] Guardando progreso de ${data.studentId}: ${data.concept} (+${data.masteryPoints} XP)`);
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

  saveUserProfile(profile);
  return { profile, unlockedCard };
}

export function registerUser(username: string, password: string, displayName: string): { success: boolean; message: string; profile?: UserProfile } {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Nombre de usuario inválido.' };
  }
  
  const filePath = getProfilePath(cleanUsername);
  if (fs.existsSync(filePath)) {
    return { success: false, message: 'El usuario ya existe.' };
  }

  const initialInventory: Record<string, number> = {};
  const allCards = [...MONSTERS, ...SPELLS];
  allCards.forEach(c => {
    if (!c.isUnlockable) {
      initialInventory[c.id] = 1;
    }
  });

  const profile = {
    id: cleanUsername,
    name: displayName?.trim() || username,
    password: password,
    pveWins: 0,
    cardInventory: initialInventory
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf8');
    const { password: _, ...cleanProfile } = profile;
    return { success: true, message: 'Usuario registrado con éxito.', profile: cleanProfile };
  } catch (err) {
    console.error(`[USER DB] Error registering user ${cleanUsername}:`, err);
    return { success: false, message: 'Error al crear la cuenta en el servidor.' };
  }
}

export function loginUser(username: string, password: string): { success: boolean; message: string; profile?: UserProfile } {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Nombre de usuario inválido.' };
  }

  const filePath = getProfilePath(cleanUsername);
  if (!fs.existsSync(filePath)) {
    return { success: false, message: 'El usuario no existe.' };
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const profile = JSON.parse(data);
    if (profile.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
    const { password: _, ...cleanProfile } = profile;
    return { success: true, message: 'Sesión iniciada con éxito.', profile: cleanProfile };
  } catch (err) {
    console.error(`[USER DB] Error logging in user ${cleanUsername}:`, err);
    return { success: false, message: 'Error al iniciar sesión en el servidor.' };
  }
}

