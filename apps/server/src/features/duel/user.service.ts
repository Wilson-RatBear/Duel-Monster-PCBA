import { UserProfile, Card, MONSTERS, SPELLS } from '@repo/game-types';
import { supabase } from '../../lib/supabase.js';

interface DbProfile {
  id: string;
  name: string;
  password?: string;
  pve_wins: number;
  card_inventory: Record<string, number>;
}

function mapDbToProfile(dbRow: DbProfile): UserProfile {
  return {
    id: dbRow.id,
    name: dbRow.name,
    pveWins: dbRow.pve_wins,
    cardInventory: dbRow.card_inventory
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      name: profile.name,
      pve_wins: profile.pveWins,
      card_inventory: profile.cardInventory
    })
    .eq('id', profile.id);

  if (error) {
    console.error(`[USER DB] Error writing profile for ${profile.id}:`, error);
  }
}

export async function getUserProfile(id: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, pve_wins, card_inventory')
    .eq('id', id)
    .single();

  if (error || !data) {
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

    // Supply an empty string as default password for auto-created profiles
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
      console.error(`[USER DB] Error creating default profile for ${id}:`, insertError);
    }

    return profile;
  }

  return mapDbToProfile(data as DbProfile);
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

export async function registerUser(username: string, password: string, displayName: string): Promise<{ success: boolean; message: string; profile?: UserProfile }> {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Nombre de usuario inválido.' };
  }
  
  // Check if user already exists
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
      cardInventory: profile.card_inventory
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
