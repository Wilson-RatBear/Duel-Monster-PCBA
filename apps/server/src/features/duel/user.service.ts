import { UserProfile, Card, MONSTERS, SPELLS } from '@repo/game-types';
import { supabase } from '../../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface DbProfile {
  id: string;
  name: string;
  password?: string;
  pve_wins: number;
  card_inventory: Record<string, any>;
}

const PROFILES_DIR = path.join(process.cwd(), 'profiles');

function getProfilePath(id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9-]/g, '');
  return path.join(PROFILES_DIR, `${safeId}.json`);
}

function mapDbToProfile(dbRow: DbProfile): UserProfile {
  const inventory = dbRow.card_inventory || {};
  const cardInventory: Record<string, number> = {};
  
  let pveMatches = 0;
  let pvpMatches = 0;
  let matchHistory: any[] = [];
  let savedDecks: any[] = [];
  
  for (const [key, value] of Object.entries(inventory)) {
    if (key === '_pveMatches') {
      pveMatches = Number(value);
    } else if (key === '_pvpMatches') {
      pvpMatches = Number(value);
    } else if (key === '_matchHistory') {
      matchHistory = Array.isArray(value) ? value : [];
    } else if (key === '_savedDecks') {
      savedDecks = Array.isArray(value) ? value : [];
    } else {
      cardInventory[key] = Number(value);
    }
  }
  
  return {
    id: dbRow.id,
    name: dbRow.name,
    pveWins: dbRow.pve_wins,
    cardInventory,
    pveMatches,
    pvpMatches,
    matchHistory,
    savedDecks
  };
}

function saveLocalProfile(profile: UserProfile & { password?: string }) {
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }
  const filePath = getProfilePath(profile.id);
  try {
    let password = profile.password;
    if (!password && fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const existing = JSON.parse(data);
        password = existing.password;
      } catch (e) {}
    }
    
    const dataToWrite = {
      ...profile,
      password: password || ''
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToWrite, null, 2), 'utf8');
  } catch (err) {
    console.error(`[USER DB] Error writing local profile for ${profile.id}:`, err);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const dbInventory: Record<string, any> = { ...profile.cardInventory };
  
  if (profile.pveMatches !== undefined) dbInventory._pveMatches = profile.pveMatches;
  if (profile.pvpMatches !== undefined) dbInventory._pvpMatches = profile.pvpMatches;
  if (profile.matchHistory !== undefined) dbInventory._matchHistory = profile.matchHistory;
  if (profile.savedDecks !== undefined) dbInventory._savedDecks = profile.savedDecks;

  let hasSavedSupabase = false;

  if (process.env.SUPABASE_URL) {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        pve_wins: profile.pveWins,
        card_inventory: dbInventory
      })
      .eq('id', profile.id);

    if (!error) {
      hasSavedSupabase = true;
    } else {
      console.error(`[USER DB] Error writing profile to Supabase for ${profile.id}:`, error);
    }
  }

  if (!hasSavedSupabase) {
    saveLocalProfile(profile);
  }
}

export async function getUserProfile(id: string): Promise<UserProfile & { password?: string }> {
  if (process.env.SUPABASE_URL) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, password, pve_wins, card_inventory')
      .eq('id', id)
      .single();

    if (!error && data) {
      const profile = mapDbToProfile(data as DbProfile);
      return {
        ...profile,
        password: data.password
      };
    }
  }

  // Local fallback
  const filePath = getProfilePath(id);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`[USER DB] Error reading local profile for ${id}:`, err);
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

  const profile: UserProfile & { password?: string } = {
    id,
    name: 'Estudiante',
    pveWins: 0,
    cardInventory: initialInventory,
    pveMatches: 0,
    pvpMatches: 0,
    matchHistory: [],
    savedDecks: [],
    password: ''
  };

  if (process.env.SUPABASE_URL) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: profile.id,
        name: profile.name,
        password: '',
        pve_wins: profile.pveWins,
        card_inventory: profile.cardInventory
      });

    if (insertError) {
      console.error(`[USER DB] Error creating default profile on Supabase for ${id}:`, insertError);
    }
  }

  saveLocalProfile(profile);
  return profile;
}

export async function addStudentProgress(data: { studentId: string; concept: string; masteryPoints: number }) {
  console.log(`[DB SYNC] Guardando progreso de ${data.studentId}: ${data.concept} (+${data.masteryPoints} XP)`);
}

export async function addWin(id: string): Promise<{ profile: UserProfile; unlockedCard?: Card }> {
  const profile = await getUserProfile(id);
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

  await saveUserProfile(profile);
  return { profile, unlockedCard };
}

export async function recordMatchResult(
  playerId: string,
  opponentId: string,
  opponentName: string,
  isAdventure: boolean,
  result: 'win' | 'loss',
  myHp: number,
  opponentHp: number
): Promise<UserProfile> {
  const profile = await getUserProfile(playerId);
  if (profile.pveMatches === undefined) profile.pveMatches = 0;
  if (profile.pvpMatches === undefined) profile.pvpMatches = 0;
  if (!profile.matchHistory) profile.matchHistory = [];
  
  const mode = isAdventure ? 'adventure' : 'multiplayer';
  if (isAdventure) {
    profile.pveMatches += 1;
  } else {
    profile.pvpMatches += 1;
  }
  
  profile.matchHistory.unshift({
    id: uuidv4(),
    date: new Date().toISOString(),
    mode,
    opponentId,
    opponentName,
    result,
    myHp,
    opponentHp
  });
  
  if (profile.matchHistory.length > 50) {
    profile.matchHistory = profile.matchHistory.slice(0, 50);
  }
  
  await saveUserProfile(profile);
  return profile;
}

export async function registerUser(username: string, password: string, displayName: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Nombre de usuario inválido.' };
  }
  
  if (!process.env.SUPABASE_URL) {
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
      cardInventory: initialInventory,
      pveMatches: 0,
      pvpMatches: 0,
      matchHistory: [],
      savedDecks: []
    };
    
    try {
      saveLocalProfile(profile);
      const { password: _, ...cleanProfile } = profile;
      return { success: true, message: 'Usuario registrado con éxito.', profile: cleanProfile };
    } catch (err) {
      return { success: false, message: 'Error al crear la cuenta localmente.' };
    }
  }
  
  // Check if user already exists in Supabase
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', cleanUsername)
    .single();

  if (existingUser) {
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
    pve_wins: 0,
    card_inventory: initialInventory
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .insert(profile);

    if (error) throw error;

    const userProfile: UserProfile = {
      id: profile.id,
      name: profile.name,
      pveWins: profile.pve_wins,
      cardInventory: profile.card_inventory,
      pveMatches: 0,
      pvpMatches: 0,
      matchHistory: [],
      savedDecks: []
    };

    return { success: true, message: 'Usuario registrado con éxito.', profile: userProfile };
  } catch (err) {
    console.error(`[USER DB] Error registering user ${cleanUsername}:`, err);
    return { success: false, message: 'Error al crear la cuenta en el servidor.' };
  }
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Nombre de usuario inválido.' };
  }

  if (!process.env.SUPABASE_URL) {
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
      return { success: false, message: 'Error al iniciar sesión localmente.' };
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, password, pve_wins, card_inventory')
    .eq('id', cleanUsername)
    .single();

  if (error || !data) {
    return { success: false, message: 'El usuario no existe.' };
  }

  if (data.password !== password) {
    return { success: false, message: 'Contraseña incorrecta.' };
  }

  const userProfile: UserProfile = mapDbToProfile(data as DbProfile);
  return { success: true, message: 'Sesión iniciada con éxito.', profile: userProfile };
}
