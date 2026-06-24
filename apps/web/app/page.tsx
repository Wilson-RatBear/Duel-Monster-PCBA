'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence, usePresence, animate } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  ClientToServerEvents, 
  ServerToClientEvents,
  MonsterCard,
  MONSTERS,
  SPELLS,
  Card,
  SpellCard,
  UserProfile,
  getCardCareers
} from '@repo/game-types';

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (node) {
      const start = parseInt(node.textContent || '0');
      if (start === value) return;
      const controls = animate(start, value, {
        duration: 2.0,
        ease: 'linear',
        onUpdate(v) {
          node.textContent = Math.round(v).toString();
        }
      });
      return () => controls.stop();
    }
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://duel-monster-pcba--mapachewilson.replit.app';

const BOARD_THEMES: Record<string, any> = {
  NEUTRAL: {
    root: 'bg-slate-950 bg-[radial-gradient(ellipse_at_center,_rgba(30,27,75,0.8)_0%,_rgba(2,6,23,1)_100%)]',
    board: 'bg-indigo-950/20 border border-indigo-900/20 shadow-[inset_0_0_50px_rgba(49,46,129,0.3)]',
    opponentSlot: 'border-purple-900/30 bg-purple-900/10 shadow-[inset_0_0_20px_rgba(88,28,135,0.2)]',
    mySlot: 'border-blue-900/40 bg-blue-900/20 shadow-[inset_0_0_30px_rgba(30,58,138,0.3)]',
    text: 'text-indigo-300',
    sidebar: 'bg-slate-900/80 border-slate-800',
    highlight: 'text-purple-400',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute left-1/2 top-1/2 w-[400px] h-[400px] border border-indigo-500/20 rounded-full" style={{ animation: `spin ${15 + i*3}s linear infinite`, transform: `translate(-50%, -50%) rotateX(70deg) rotateY(${i*30}deg)` }}>
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_#60a5fa] -translate-x-1/2 -translate-y-1/2 animate-ping" />
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 w-12 h-12 bg-purple-500 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
    )
  },
  PETROLEO: {
    root: 'bg-stone-950 bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.04)_0%,_rgba(12,10,9,1)_80%)]',
    board: 'bg-stone-900/30 border border-yellow-950/30',
    opponentSlot: 'border-yellow-700/30 bg-stone-900/60 shadow-[0_0_15px_rgba(234,179,8,0.05)]',
    mySlot: 'border-yellow-700/50 bg-stone-900/80 shadow-[0_0_20px_rgba(234,179,8,0.1)]',
    text: 'text-amber-500/80',
    sidebar: 'bg-stone-950 border-stone-900',
    highlight: 'text-amber-500',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -inset-[10px] bg-[radial-gradient(circle_at_bottom,rgba(234,179,8,0.08)_0%,transparent_60%)] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-1 h-32 bg-gradient-to-t from-yellow-600/20 to-transparent rounded blur-sm animate-pulse" />
        <div className="absolute bottom-10 left-3/4 w-1.5 h-40 bg-gradient-to-t from-amber-600/20 to-transparent rounded blur-sm animate-pulse" />
      </div>
    )
  },
  ARQUITECTURA: {
    root: 'bg-sky-950 bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:30px_30px]',
    board: 'bg-sky-950/50 border border-sky-900/30',
    opponentSlot: 'border-sky-500/30 bg-sky-950/40 shadow-[0_0_15px_rgba(14,165,233,0.05)]',
    mySlot: 'border-sky-500/50 bg-sky-950/70 shadow-[0_0_25px_rgba(14,165,233,0.12)]',
    text: 'text-sky-400/80',
    sidebar: 'bg-sky-950 border-sky-900',
    highlight: 'text-sky-400',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 font-mono text-[9px] text-sky-500/20 select-none">
        <div className="absolute top-4 left-4 border-l border-t border-sky-500/30 w-8 h-8 pl-1 pt-1">R: 0,0,0</div>
        <div className="absolute bottom-4 right-4 border-r border-b border-sky-500/30 w-16 h-8 text-right pr-1 pt-4">Scale 1:50</div>
        <div className="absolute top-1/2 left-8 w-24 border-t border-dashed border-sky-500/20 text-center">x-axis</div>
        <div className="absolute top-8 right-1/4 w-1 h-32 border-l border-dashed border-sky-500/20" />
      </div>
    )
  },
  CIVIL: {
    root: 'bg-slate-900 bg-[radial-gradient(circle_at_center,_rgba(71,85,105,0.05)_0%,_rgba(15,23,42,1)_85%)]',
    board: 'bg-slate-800/30 border border-slate-700/20 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]',
    opponentSlot: 'border-slate-500/30 bg-slate-800/50 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]',
    mySlot: 'border-slate-500/60 bg-slate-800/80 shadow-[inset_0_0_25px_rgba(0,0,0,0.6)]',
    text: 'text-slate-400/80',
    sidebar: 'bg-slate-950 border-slate-800',
    highlight: 'text-slate-200',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-500/30 border-dashed border-l" />
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-500/30 border-dashed border-t" />
        <div className="absolute top-10 left-10 w-4 h-4 border border-slate-500/40 rounded-full animate-ping" />
      </div>
    )
  },
  METEOROLOGIA: {
    root: 'bg-slate-950 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.05)_0%,_rgba(15,23,42,1)_85%)]',
    board: 'bg-slate-900/40 border border-teal-950/20',
    opponentSlot: 'border-teal-500/30 bg-slate-950/50 shadow-[0_0_15px_rgba(20,184,166,0.05)]',
    mySlot: 'border-teal-500/60 bg-teal-950/40 shadow-[0_0_25px_rgba(20,184,166,0.15)]',
    text: 'text-teal-400/80',
    sidebar: 'bg-slate-950 border-teal-950/50',
    highlight: 'text-teal-400',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -inset-[20px] bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.05)_0%,transparent_60%)]" />
        <svg className="absolute w-full h-full text-teal-500/10" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,100 Q 200,50 400,150 T 800,50" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-pulse" />
          <path d="M 0,250 Q 300,300 600,200 T 1200,300" fill="none" stroke="currentColor" strokeWidth="1" className="animate-pulse" />
        </svg>
      </div>
    )
  },
  INFORMATICA: {
    root: 'bg-black bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px]',
    board: 'bg-neutral-950/80 border border-emerald-950/40 shadow-[0_0_30px_rgba(16,185,129,0.02)]',
    opponentSlot: 'border-emerald-500/30 bg-black/60 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
    mySlot: 'border-emerald-500/60 bg-neutral-900/90 shadow-[0_0_25px_rgba(16,185,129,0.12)]',
    text: 'text-emerald-500/70 font-mono',
    sidebar: 'bg-black border-neutral-900',
    highlight: 'text-emerald-400 font-mono',
    particles: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 font-mono text-[8px] text-emerald-500 select-none flex justify-around">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col animate-bounce" style={{ animationDuration: `${3 + i * 2}s` }}>
            <span>01001001</span>
            <span>01001110</span>
            <span>01000110</span>
            <span>01001111</span>
          </div>
        ))}
      </div>
    )
  }
};

const themeContainerVariants = {
  NEUTRAL: { transition: { staggerChildren: 0.3 } },
  INFORMATICA: { transition: { staggerChildren: 0.5 } },
  ARQUITECTURA: { transition: { staggerChildren: 0.5 } },
  CIVIL: { transition: { staggerChildren: 0.5 } },
  METEOROLOGIA: { transition: { staggerChildren: 0.5 } },
  PETROLEO: { transition: { staggerChildren: 0.5 } }
};

const layer1BgVariants = {
  NEUTRAL: { opacity: 1, backgroundColor: 'transparent', transition: { duration: 0.8 } },
  INFORMATICA: { opacity: 0.85, backgroundColor: '#000000', transition: { duration: 0.5 } },
  ARQUITECTURA: { opacity: 0.85, backgroundColor: '#082f49', transition: { duration: 0.5 } },
  CIVIL: { opacity: 0.85, backgroundColor: '#1c1917', transition: { duration: 0.5 } },
  METEOROLOGIA: { opacity: 0.85, backgroundColor: '#0f172a', transition: { duration: 0.5 } },
  PETROLEO: { opacity: 0.85, backgroundColor: '#1a1614', transition: { duration: 0.5 } }
};

const layer2GridVariants = {
  NEUTRAL: { opacity: 0.3, scale: 1, transition: { duration: 0.5 } },
  INFORMATICA: { opacity: [0, 1], y: [-50, 0], transition: { duration: 0.6 } },
  ARQUITECTURA: { opacity: [0, 1], scale: [0, 1], transition: { duration: 0.8, ease: "easeOut" } },
  CIVIL: { opacity: [0, 1], y: [-100, 0], transition: { type: 'spring', bounce: 0.6 } },
  METEOROLOGIA: { opacity: [0, 1], scale: [0.9, 1.1, 1], transition: { duration: 1 } },
  PETROLEO: { opacity: [0, 1], clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'], transition: { duration: 1 } }
};

const layer3SlotVariants = {
  NEUTRAL: { opacity: 1, scale: 1, borderColor: 'rgba(51, 65, 85, 0.3)', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  INFORMATICA: { opacity: [0, 1, 0.5, 1], scale: 1, borderColor: 'rgba(16, 185, 129, 0.8)', backgroundColor: 'rgba(0, 0, 0, 0.8)', boxShadow: '0 0 20px rgba(16,185,129,0.4)', transition: { duration: 0.8, times: [0, 0.3, 0.6, 1] } },
  ARQUITECTURA: { opacity: [0, 1], scaleX: [0.5, 1], borderColor: 'rgba(14, 165, 233, 0.8)', backgroundColor: 'rgba(8, 47, 73, 0.6)', transition: { duration: 0.5 } },
  CIVIL: { opacity: [0, 1], scale: [1.2, 1], borderColor: 'rgba(120, 113, 108, 0.8)', backgroundColor: 'rgba(41, 37, 36, 0.8)', borderStyle: 'solid', borderWidth: '4px', transition: { type: 'spring', bounce: 0.5 } },
  METEOROLOGIA: { opacity: [0, 1], filter: ['hue-rotate(90deg)', 'hue-rotate(0deg)', 'hue-rotate(-90deg)', 'hue-rotate(0deg)'], borderColor: 'rgba(20, 184, 166, 0.8)', backgroundColor: 'rgba(2, 6, 23, 0.6)', transition: { duration: 1 } },
  PETROLEO: { opacity: [0, 1], scaleY: [0, 1], borderColor: 'rgba(234, 179, 8, 0.8)', backgroundColor: 'rgba(28, 25, 23, 0.8)', borderStyle: 'double', borderWidth: '6px', transition: { duration: 0.6 } }
};

function Layer1Background({ theme }: { theme: string }) {
  return (
    <motion.div variants={layer1BgVariants} className="absolute inset-0 z-0">
      <motion.div animate={theme} variants={{
        INFORMATICA: { opacity: 0 },
        ARQUITECTURA: { opacity: 0.1, backgroundImage: 'linear-gradient(rgba(14,165,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,1) 1px, transparent 1px)', backgroundSize: '30px 30px' },
        CIVIL: { opacity: 0.2, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' },
        PETROLEO: { opacity: 0.3, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.1\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.8\'/%3E%3C/svg%3E")' },
        METEOROLOGIA: { opacity: 0.3, backgroundImage: 'radial-gradient(circle at top right, rgba(20,184,166,0.3) 0%, transparent 60%)' },
        NEUTRAL: { opacity: 0.1, backgroundImage: 'radial-gradient(circle at center, rgba(71,85,105,0.5) 0%, transparent 85%)' }
      }} className="absolute inset-0" />
    </motion.div>
  );
}

function Layer2Grid({ theme }: { theme: string }) {
  return (
    <motion.div variants={layer2GridVariants as any} className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {theme === 'INFORMATICA' && (
         <div className="w-full h-full flex justify-around overflow-hidden opacity-60 font-mono text-emerald-500 text-xs sm:text-sm absolute top-0 left-0 pointer-events-none">
           {[...Array(40)].map((_, i) => (
             <motion.div 
               key={`rain-${i}`} 
               initial={{ y: '-100vh' }}
               animate={{ y: '100vh' }} 
               transition={{ 
                 duration: 3 + Math.random() * 4, 
                 repeat: Infinity, 
                 ease: 'linear', 
                 delay: Math.random() * -5 
               }}
               className="flex flex-col items-center"
               style={{ textShadow: '0 0 8px rgba(16,185,129,0.8)' }}
             >
               {Array.from({ length: 20 }).map((_, j) => (
                 <div key={j} style={{ opacity: Math.max(0, 1 - j * 0.05), color: j === 0 ? '#fff' : undefined }}>
                   {Math.random() > 0.5 ? '1' : '0'}
                 </div>
               ))}
             </motion.div>
           ))}
         </div>
      )}
      {theme === 'ARQUITECTURA' && (
         <div className="w-full h-full relative">
           <div className="absolute top-1/2 left-0 w-full h-[2px] bg-sky-400/50" />
           <div className="absolute left-1/2 top-0 h-full w-[2px] bg-sky-400/50" />
           <div className="absolute top-1/2 left-1/2 w-96 h-96 -ml-48 -mt-48 border-[2px] border-sky-400/30 rounded-full" />
           <div className="absolute top-1/2 left-1/2 w-64 h-64 -ml-32 -mt-32 border-[2px] border-sky-400/30 rounded-full" />
         </div>
      )}
      {theme === 'CIVIL' && (
         <div className="w-full h-full relative">
           <div className="absolute top-1/3 w-full h-8 bg-gradient-to-b from-stone-500 to-stone-700 border-y-4 border-stone-800 shadow-2xl" />
           <div className="absolute top-2/3 w-full h-8 bg-gradient-to-b from-stone-500 to-stone-700 border-y-4 border-stone-800 shadow-2xl" />
           <div className="absolute left-1/3 h-full w-8 bg-gradient-to-r from-stone-500 to-stone-700 border-x-4 border-stone-800 shadow-2xl" />
           <div className="absolute left-2/3 h-full w-8 bg-gradient-to-r from-stone-500 to-stone-700 border-x-4 border-stone-800 shadow-2xl" />
         </div>
      )}
      {theme === 'METEOROLOGIA' && (
         <div className="w-full h-full relative flex items-center justify-center">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="absolute border-2 border-teal-500/40 rounded-[30%] animate-[spin_12s_linear_infinite]" style={{ width: `${i*25}%`, height: `${i*25}%`, animationDuration: `${i*4}s` }} />
           ))}
         </div>
      )}
      {theme === 'PETROLEO' && (
         <div className="w-full h-full relative overflow-hidden">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={`puddle-${i}`} 
               className="absolute rounded-full bg-[#110e0c]/80 border border-[#2a2420]/50 shadow-[inset_0_0_20px_rgba(0,0,0,1)]"
               animate={{ 
                 scale: [1, 1.1, 0.9, 1], 
                 opacity: [0.6, 0.9, 0.6] 
               }}
               transition={{ 
                 duration: 4 + Math.random() * 3, 
                 repeat: Infinity, 
                 ease: "easeInOut",
                 delay: Math.random() * 2 
               }}
               style={{ 
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
                 width: `${100 + Math.random() * 200}px`,
                 height: `${80 + Math.random() * 150}px`,
                 filter: 'blur(4px)',
                 transform: `rotate(${Math.random() * 360}deg)`
               }}
             >
                <motion.div
                  className="absolute bg-[#2a2420] rounded-full opacity-50"
                  animate={{ scale: [0, 1.5], opacity: [0.8, 0] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  style={{
                    left: '40%', top: '40%', width: '20px', height: '20px'
                  }}
                />
             </motion.div>
           ))}
         </div>
      )}
      {theme === 'NEUTRAL' && (
         <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent absolute top-1/2 -translate-y-1/2" />
      )}
    </motion.div>
  );
}

export default function GamePage() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [animatingCard, setAnimatingCard] = useState<{ id: string, type: 'ATTACK_IMPACT' | 'SPELL_CAST' | 'ACID_RAIN' | 'VORTEX_ELIMINATION' | 'SPELL_EFFECT', targetId?: string, damage?: number, secondaryTargetId?: string, secondaryDamage?: number, targetDamage?: number, isDestroyed?: boolean } | null>(null);
  const [isActionLocked, setIsActionLocked] = useState(false);
  const [selectedActionCard, setSelectedActionCard] = useState<string | null>(null);
  
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'MONSTER' | 'SPELL'>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mainMenuTab, setMainMenuTab] = useState<'PLAY' | 'COLLECTION' | 'MANUAL' | 'PROFILE'>('PLAY');

  // New features states
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [deckNameInput, setDeckNameInput] = useState('');
  const [confirmDeckToLoad, setConfirmDeckToLoad] = useState<any | null>(null);

  // Docente and Admin states
  const [adminUsersList, setAdminUsersList] = useState<UserProfile[]>([]);
  const [teacherStudentProfile, setTeacherStudentProfile] = useState<UserProfile | null>(null);
  const [teacherSearchError, setTeacherSearchError] = useState<string | null>(null);
  const [teacherSearchInput, setTeacherSearchInput] = useState('');
  const [teacherNoteInput, setTeacherNoteInput] = useState('');
  const [adminTab, setAdminTab] = useState<'USERS' | 'STUDENTS' | 'TEACHERS'>('USERS');
  const [adminSelectedStudent, setAdminSelectedStudent] = useState<UserProfile | null>(null);
  const [adminStudentSearchInput, setAdminStudentSearchInput] = useState('');
  const [adminCreateTeacherUsername, setAdminCreateTeacherUsername] = useState('');
  const [adminCreateTeacherPassword, setAdminCreateTeacherPassword] = useState('');
  const [adminCreateTeacherName, setAdminCreateTeacherName] = useState('');
  const [adminCardEditorUser, setAdminCardEditorUser] = useState<UserProfile | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);

  // Authentication State
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');

  // Unlocked Card Alert State
  const [unlockedCardAlert, setUnlockedCardAlert] = useState<string | null>(null);

  // Theme and animations state
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme_mode');
    if (stored === 'light') {
      setIsLightMode(true);
    }
  }, []);

  const toggleThemeMode = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    localStorage.setItem('theme_mode', newMode ? 'light' : 'dark');
  };

  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER') {
      const timer = setTimeout(() => setShowGameOver(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowGameOver(false);
    }
  }, [gameState?.phase]);

  const initializedPrepRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const allCards = [...MONSTERS, ...SPELLS];

  useEffect(() => {
    let pid = localStorage.getItem('duel_monster_username');
    if (pid) {
      setPlayerId(pid);
    }

    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('gameUpdate', (state) => {
      setGameState(state);
      localStorage.setItem('duel_monster_room_id', state.roomId);
      setError(null);
    });

    newSocket.on('roomCreated', (id) => {
      localStorage.setItem('duel_monster_room_id', id);
    });

    newSocket.on('error', (msg) => {
      setError(msg);
    });

    newSocket.on('profileUpdate', (profile) => {
      setUserProfile(profile);
    });

    newSocket.on('adminDashboardData', (data) => {
      setAdminUsersList(data.users);
    });

    newSocket.on('teacherStudentSearchResult', (profile) => {
      setTeacherStudentProfile(profile);
      setTeacherSearchError(profile ? null : 'Alumno no encontrado.');
    });

    newSocket.on('cardUnlocked', (cardId) => {
      setUnlockedCardAlert(cardId);
    });

    newSocket.on('authSuccess', (profile) => {
      localStorage.setItem('duel_monster_username', profile.id);
      setPlayerId(profile.id);
      setUserProfile(profile);
      setAuthErrorMsg(null);
    });

    newSocket.on('authError', (msg) => {
      setAuthErrorMsg(msg);
    });

    newSocket.on('playAnimation', (data: any) => {
      setAnimatingCard({ id: data.attackerId || data.spellId || '', type: data.type, targetId: data.targetId, damage: data.damage, secondaryTargetId: data.secondaryTargetId, secondaryDamage: data.secondaryDamage });
      setTimeout(() => {
        setAnimatingCard(null);
      }, data.type === 'SPELL_EFFECT' ? 1500 : 800);
    });

    const savedRoom = localStorage.getItem('duel_monster_room_id');
    if (savedRoom && pid) {
      newSocket.emit('reconnect', savedRoom, pid);
    } else if (pid) {
      newSocket.emit('getProfile', pid);
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      socket?.emit('adminGetDashboardData');
    }
  }, [userProfile, socket]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  useEffect(() => {
    if (gameState?.phase === 'PREPARATION' && playerId) {
      if (!initializedPrepRef.current) {
        initializedPrepRef.current = true;
        setSelectedCards([]);
      }
    } else if (gameState?.phase !== 'PREPARATION') {
      initializedPrepRef.current = false;
    }
  }, [gameState?.phase, playerId, gameState]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    if (authMode === 'LOGIN') {
      socket?.emit('login', usernameInput, passwordInput);
    } else {
      socket?.emit('register', usernameInput, passwordInput, displayNameInput);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('duel_monster_username');
    localStorage.removeItem('duel_monster_room_id');
    setPlayerId(null);
    setUserProfile(null);
    setGameState(null);
    setUsernameInput('');
    setPasswordInput('');
    setDisplayNameInput('');
  };

  const createRoom = () => { if (playerId) socket?.emit('createRoom', playerId); };
  const joinRoom = () => { if (playerId) socket?.emit('joinRoom', roomIdInput, playerId); };
  const startAdventure = () => { if (playerId) socket?.emit('joinAdventure', playerId); };
  const nextAdventure = () => { if (playerId) socket?.emit('nextAdventureEncounter', playerId); };

  const setReady = (ready: boolean) => socket?.emit('setReady', ready);
  const setName = () => socket?.emit('setName', nameInput);
  
  const executeAttacks = () => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    (socket as any)?.emit('executeAttacks');
    setTimeout(() => setIsActionLocked(false), 1000);
  };

  const endTurn = () => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    setSelectedActionCard(null);
    socket?.emit('endTurn');
    setTimeout(() => setIsActionLocked(false), 500);
  };
  const summonMonster = (cardId: string, index: number) => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    socket?.emit('summonMonster', cardId, index);
    setTimeout(() => setIsActionLocked(false), 800);
  };
  const attackBasic = (attackerIndex: number) => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    socket?.emit('attackBasic', attackerIndex);
    setTimeout(() => setIsActionLocked(false), 1500);
  };
  const castSpell = (cardId: string, targetIndex?: number, isAllyTarget?: boolean) => {
    if (isActionLocked) return;
    setIsActionLocked(true);
    socket?.emit('castSpell', cardId, targetIndex, isAllyTarget);
    setTimeout(() => setIsActionLocked(false), 800);
  };
  const drawCard = () => socket?.emit('drawCard');

  const handleHandCardClick = (card: Card) => {
    if (!isMyTurn || isActionLocked) return;
    
    const me = gameState?.players[playerId || ''];
    if (card.type === 'MONSTER') {
      const isFull = me?.monsterZone.every(m => m !== null);
      if (isFull) {
        setError("Tu zona de monstruos está llena.");
        return;
      }
      setSelectedActionCard(card.id);
    } else if (card.type === 'SPELL') {
      const spellCard = card as SpellCard;
      if (me && me.energy < spellCard.energyCost) {
         setError('No tienes suficiente energía.');
         return;
      }
      if (spellCard.targetType === 'SINGLE') {
        setSelectedActionCard(card.id);
      } else {
        castSpell(card.id);
      }
    }
  };

  const handleMySlotClick = (index: number) => {
    if (!isMyTurn || isActionLocked) return;
    const me = gameState?.players[playerId || ''];
    const m = me?.monsterZone?.[index];

    if (selectedActionCard) {
      const card = me?.hand.find(c => c.id === selectedActionCard);
      if (card?.type === 'MONSTER') {
        if (!m) {
          summonMonster(card.id, index);
          setSelectedActionCard(null);
        }
      } else if (card?.type === 'SPELL') {
        if (m) {
          castSpell(card.id, index, true);
          setSelectedActionCard(null);
        } else {
          setError("Debes apuntar a un aliado válido.");
        }
      }
    } else if (m) {
      if (m.hasAttacked) return;
      // Instant column attack
      attackBasic(index);
    }
  };

  const handleOpponentSlotClick = (index: number) => {
    if (!isMyTurn || isActionLocked) return;
    const opponentId = Object.keys(gameState?.players || {}).find(id => id !== playerId);
    const opponent = opponentId ? gameState?.players[opponentId] : null;
    const m = opponent?.monsterZone?.[index];
    
    if (selectedActionCard) {
      const me = gameState?.players[playerId || ''];
      const card = me?.hand.find(c => c.id === selectedActionCard);
      if (card?.type === 'SPELL') { 
        if (m) {
          castSpell(card.id, index, false);
          setSelectedActionCard(null);
        } else {
          setError("Debes seleccionar un monstruo válido.");
        }
      }
    }
  };

  const handleOpponentAvatarClick = () => {
    if (!isMyTurn || isActionLocked) return;
    const opponentId = Object.keys(gameState?.players || {}).find(id => id !== playerId);
    
    // Solo permitir clics aquí si hay un hechizo que selecciona al jugador (actualmente no hay, pero por si acaso)
  };

  const clearSession = () => {
    localStorage.removeItem('duel_monster_room_id');
    setGameState(null);
    setSelectedCards([]);
    window.location.reload();
  };

  const addCardToDeck = (cardId: string) => {
    if (selectedCards.length >= 25) return;
    const countInDeck = selectedCards.filter(id => id === cardId).length;
    const baseCard = allCards.find(c => c.id === cardId);
    let countOwned = userProfile?.cardInventory?.[cardId] || 0;
    if (countOwned === 0 && baseCard && !baseCard.isUnlockable) {
      countOwned = 1;
    }
    if (countInDeck < countOwned) {
      setSelectedCards(prev => [...prev, cardId]);
    }
  };

  const removeCardFromDeck = (index: number) => {
    setSelectedCards(prev => {
      const newCards = [...prev];
      newCards.splice(index, 1);
      return newCards;
    });
  };

  const confirmDeck = () => {
    socket?.emit('selectDeck', selectedCards);
  };

  const renderTeacherDashboard = () => {
    const [teacherTab, setTeacherTab] = useState<'CARDS' | 'DECK' | 'HISTORY' | 'NOTES'>('CARDS');
    
    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (teacherSearchInput.trim()) {
        socket?.emit('teacherSearchStudent', teacherSearchInput.trim());
      }
    };
    
    const handleSaveNote = () => {
      if (teacherNoteInput.trim() && teacherStudentProfile) {
        socket?.emit('teacherAddNote', teacherStudentProfile.id, teacherNoteInput.trim());
        setTeacherNoteInput('');
      }
    };
    
    return (
      <div className={`flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden ${isLightMode ? 'light' : ''}`}>
        {/* Starry bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,25,60,0.6)_0%,_rgba(2,5,15,1)_85%)] z-0" />
        
        {/* Header */}
        <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-900/80">
          <div className="flex items-center space-x-2">
            <img src="/symbols/concepto.png" className="w-6 h-6 object-contain" alt="" />
            <span className="font-mono text-sm tracking-[0.3em] font-black uppercase text-slate-300">DOCENTE - DUEL MONSTERS</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleThemeMode} className="p-2 border border-slate-800/40 hover:bg-slate-800/30 rounded-full text-sm cursor-pointer transition-all flex items-center justify-center">
              {isLightMode ? '🌙' : '☀️'}
            </button>
            <span className="text-xs font-mono text-slate-400">Sesión: {userProfile?.name}</span>
            <button onClick={() => setShowLogoutConfirm(true)} className="px-4 py-2 border border-red-900/50 hover:bg-red-950/30 text-red-400 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Dashboard Main Area */}
        <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8 overflow-hidden h-[calc(100vh-100px)]">
          {/* Left panel: Search & Logs */}
          <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6">
            {/* Search Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl">
              <h3 className="text-lg font-black uppercase tracking-wider text-purple-400 mb-4">🔍 Búsqueda de Alumno</h3>
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="text"
                  placeholder="ID del Alumno (ej: yugi_muto)"
                  value={teacherSearchInput}
                  onChange={(e) => setTeacherSearchInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm placeholder-slate-700 text-white px-4"
                />
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all cursor-pointer">
                  Buscar Perfil
                </button>
              </form>
              {teacherSearchError && (
                <div className="mt-4 bg-red-950/40 border border-red-900/50 text-red-400 p-3 rounded-xl text-center text-xs font-mono animate-pulse">
                  ⚠️ {teacherSearchError}
                </div>
              )}
            </div>

            {/* Visit Logs */}
            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl flex-grow overflow-hidden flex flex-col">
              <h3 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Alumnos Visitados</h3>
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {userProfile?.visitedStudents && userProfile.visitedStudents.length > 0 ? (
                  userProfile.visitedStudents.map((log: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => socket?.emit('teacherSearchStudent', log.studentId)}
                      className="p-3 bg-slate-950/40 border border-slate-900 hover:bg-purple-950/10 hover:border-purple-500/30 transition-all rounded-xl cursor-pointer text-left"
                    >
                      <h4 className="text-xs font-bold text-slate-200">{log.studentName}</h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{log.studentId} • {new Date(log.date).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600 italic">No has visitado alumnos en esta sesión.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Student Profile Details */}
          <div className="flex-grow bg-slate-900/20 border border-slate-800/60 backdrop-blur-2xl p-8 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            {teacherStudentProfile ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header profile details */}
                <div className="flex justify-between items-start border-b border-slate-800/50 pb-6 mb-6">
                  <div>
                    <h2 className="text-3xl font-black text-white">{teacherStudentProfile.name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">ID Alumno: {teacherStudentProfile.id}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                      <span className="block text-lg font-bold text-amber-400">{teacherStudentProfile.pveWins}</span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Victorias PVE</span>
                    </div>
                    <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                      <span className="block text-lg font-bold text-blue-400">{teacherStudentProfile.pveMatches || 0}</span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Partidas PVE</span>
                    </div>
                    <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                      <span className="block text-lg font-bold text-purple-400">{teacherStudentProfile.pvpMatches || 0}</span>
                      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Partidas PVP</span>
                    </div>
                  </div>
                </div>

                {/* Sub Tab selection */}
                <div className="flex space-x-2 mb-6 border-b border-slate-800/30 pb-2">
                  {(['CARDS', 'DECK', 'HISTORY', 'NOTES'] as const).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setTeacherTab(tab)} 
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${teacherTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {tab === 'CARDS' ? 'Inventario de Cartas' : tab === 'DECK' ? 'Mazos Guardados' : tab === 'HISTORY' ? 'Historial de Duelos' : 'Notas Pedagógicas'}
                    </button>
                  ))}
                </div>

                {/* Tab content scrollable */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  {teacherTab === 'CARDS' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-6">
                      {allCards.map(card => {
                        const hasCard = (teacherStudentProfile.cardInventory?.[card.id] || 0) > 0;
                        return (
                          <div key={card.id} className="relative flex flex-col items-center">
                            {hasCard ? (
                              <div className="w-28 h-40 relative">
                                <GameCardContent card={card} onPreview={() => setPreviewCardId(card.id)} />
                              </div>
                            ) : (
                              <div className="w-28 h-40 bg-slate-950 border-2 border-dashed border-slate-900 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden grayscale opacity-40 shadow-inner">
                                <span className="text-3xl mb-2">🔒</span>
                                <span className="text-[8px] text-slate-600 font-bold tracking-widest text-center uppercase">Bloqueada</span>
                              </div>
                            )}
                            <div className="mt-2 text-center">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold tracking-widest border ${hasCard ? (card.type === 'MONSTER' ? 'bg-amber-950/80 text-amber-400 border-amber-900/50' : 'bg-emerald-950/80 text-emerald-400 border-emerald-900/50') : 'bg-slate-950 text-slate-700 border-slate-900'}`}>
                                {hasCard ? `x${teacherStudentProfile.cardInventory?.[card.id] || 0}` : 'MISTERIO'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {teacherTab === 'DECK' && (
                    <div className="space-y-6 pb-6 text-left">
                      {teacherStudentProfile.savedDecks && teacherStudentProfile.savedDecks.length > 0 ? (
                        teacherStudentProfile.savedDecks.map((deck: any, idx: number) => (
                          <div key={idx} className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
                            <h4 className="text-md font-bold text-purple-300 uppercase tracking-wide">{deck.name}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-1">{deck.cards.length} cartas en total</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                              {deck.cards.map((cardId: string, cIdx: number) => {
                                const card = allCards.find(c => c.id === cardId);
                                if (!card) return null;
                                return (
                                  <span key={cIdx} className={`px-2.5 py-1 bg-slate-900 border text-xs font-medium rounded-lg ${card.type === 'MONSTER' ? 'text-amber-400 border-amber-900/30' : 'text-emerald-400 border-emerald-900/30'}`}>
                                    {card.name} ({card.type})
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-10">Este alumno no ha guardado mazos.</p>
                      )}
                    </div>
                  )}

                  {teacherTab === 'HISTORY' && (
                    <div className="space-y-3 pb-6 text-left">
                      {teacherStudentProfile.matchHistory && teacherStudentProfile.matchHistory.length > 0 ? (
                        teacherStudentProfile.matchHistory.map((match: any) => {
                          const isWin = match.result === 'win';
                          return (
                            <div key={match.id} className={`p-4 rounded-xl border flex items-center justify-between ${isWin ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-red-950/10 border-red-900/20'}`}>
                              <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${isWin ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/60 text-red-400 border-red-800/40'}`}>
                                  {isWin ? 'VIC' : 'DEF'}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-white">vs {match.opponentName}</span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${match.mode === 'adventure' ? 'bg-amber-950/60 text-amber-400 border-amber-900/30' : 'bg-blue-950/60 text-blue-400 border-blue-900/30'}`}>
                                      {match.mode === 'adventure' ? 'Aventura' : 'Multijugador'}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-1">{new Date(match.date).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="text-right font-mono text-sm text-slate-300">
                                {match.myHp} LP vs {match.opponentHp} LP
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic text-center py-10">No hay duelos registrados para este alumno.</p>
                      )}
                    </div>
                  )}

                  {teacherTab === 'NOTES' && (
                    <div className="space-y-6 pb-6 text-left">
                      {/* Editor Note */}
                      <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Agregar Nota Pedagógica</h4>
                        <textarea
                          placeholder="Escribe comentarios, observaciones académicas o notas sobre el progreso del alumno..."
                          value={teacherNoteInput}
                          onChange={(e) => setTeacherNoteInput(e.target.value)}
                          maxLength={300}
                          className="w-full h-24 bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-white placeholder-slate-700 resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-600 font-mono">{300 - teacherNoteInput.length} caracteres disponibles</span>
                          <button onClick={handleSaveNote} disabled={!teacherNoteInput.trim()} className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer">
                            Guardar Nota
                          </button>
                        </div>
                      </div>

                      {/* Notes list */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Historial de Anotaciones</h4>
                        {teacherStudentProfile.teacherNotes && teacherStudentProfile.teacherNotes.length > 0 ? (
                          teacherStudentProfile.teacherNotes.map((note: any) => (
                            <div key={note.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2 relative">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-purple-300">Docente: {note.teacherName}</span>
                                <span className="text-[9px] text-slate-500 font-mono">{new Date(note.date).toLocaleString()}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-600 italic">No hay notas registradas para este alumno.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-600 opacity-70 border border-dashed border-slate-800 rounded-2xl py-20 text-center">
                <span className="text-6xl mb-4">👤</span>
                <h4 className="font-mono text-sm uppercase tracking-widest">Ningún Alumno Seleccionado</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-sm">Busca un ID de alumno o selecciona uno visitado recientemente en el panel izquierdo para examinar su rendimiento.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const handleRegisterTeacher = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminCreateTeacherUsername.trim() && adminCreateTeacherPassword.trim() && adminCreateTeacherName.trim()) {
        socket?.emit('adminCreateTeacher', adminCreateTeacherUsername.trim(), adminCreateTeacherPassword.trim(), adminCreateTeacherName.trim());
        setAdminCreateTeacherUsername('');
        setAdminCreateTeacherPassword('');
        setAdminCreateTeacherName('');
      }
    };
    
    const [userFilter, setUserFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
    const [userSearch, setUserSearch] = useState('');
    
    const filteredUsers = adminUsersList.filter(user => {
      if (userFilter !== 'ALL' && user.role !== userFilter.toLowerCase()) return false;
      if (userSearch.trim()) {
        const query = userSearch.toLowerCase();
        return user.id.toLowerCase().includes(query) || user.name.toLowerCase().includes(query);
      }
      return true;
    });

    const studentsList = adminUsersList.filter(u => u.role === 'student');
    const teachersList = adminUsersList.filter(u => u.role === 'teacher');
    
    const studentSearchResult = adminSelectedStudent ? adminUsersList.find(u => u.id === adminSelectedStudent.id) : null;
    
    const [selectedTeacherActivityId, setSelectedTeacherActivityId] = useState<string | null>(null);
    const selectedTeacherProfile = teachersList.find(t => t.id === selectedTeacherActivityId);

    return (
      <div className={`flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden ${isLightMode ? 'light' : ''}`}>
        {/* Starry bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,25,60,0.6)_0%,_rgba(2,5,15,1)_85%)] z-0" />
        
        {/* Header */}
        <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-900/80">
          <div className="flex items-center space-x-2">
            <img src="/symbols/concepto.png" className="w-6 h-6 object-contain" alt="" />
            <span className="font-mono text-sm tracking-[0.3em] font-black uppercase text-slate-300">ADMINISTRADOR - DUEL MONSTERS</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleThemeMode} className="p-2 border border-slate-800/40 hover:bg-slate-800/30 rounded-full text-sm cursor-pointer transition-all flex items-center justify-center">
              {isLightMode ? '🌙' : '☀️'}
            </button>
            <span className="text-xs font-mono text-slate-400">Sesión: {userProfile?.name}</span>
            <button onClick={() => setShowLogoutConfirm(true)} className="px-4 py-2 border border-red-900/50 hover:bg-red-950/30 text-red-400 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 mt-6">
          <div className="flex space-x-4 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md w-fit">
            {(['USERS', 'STUDENTS', 'TEACHERS'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setAdminTab(tab)} 
                className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${adminTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {tab === 'USERS' ? 'Gestión de Usuarios' : tab === 'STUDENTS' ? 'Búsqueda de Alumnos' : 'Actividad de Docentes'}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Main Area */}
        <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-8 flex flex-col overflow-hidden h-[calc(100vh-170px)]">
          
          {/* TAB 1: USER MANAGEMENT */}
          {adminTab === 'USERS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
              
              {/* Form to create Teacher */}
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl text-left">
                <h3 className="text-lg font-black uppercase tracking-wider text-blue-400 mb-4 flex items-center gap-2">
                  <span>🎓</span> Crear Cuenta de Docente
                </h3>
                <form onSubmit={handleRegisterTeacher} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-slate-500 mb-1 px-1">Usuario</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: profesor_muto"
                      value={adminCreateTeacherUsername}
                      onChange={(e) => setAdminCreateTeacherUsername(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-xs placeholder-slate-700 text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-slate-500 mb-1 px-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminCreateTeacherPassword}
                      onChange={(e) => setAdminCreateTeacherPassword(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-xs placeholder-slate-700 text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest uppercase text-slate-500 mb-1 px-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: Profesor Muto"
                      value={adminCreateTeacherName}
                      onChange={(e) => setAdminCreateTeacherName(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl text-xs placeholder-slate-700 text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all cursor-pointer">
                    Crear Docente
                  </button>
                </form>
              </div>

              {/* Users table list */}
              <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/60 backdrop-blur-2xl p-6 rounded-3xl shadow-xl flex flex-col h-full overflow-hidden min-h-[500px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="text-md font-bold uppercase tracking-wider text-slate-300">Cuentas Registradas ({adminUsersList.length})</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar por ID/Nombre..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg placeholder-slate-700 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={userFilter}
                      onChange={(e: any) => setUserFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos</option>
                      <option value="STUDENT">Alumnos</option>
                      <option value="TEACHER">Docentes</option>
                    </select>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                        <th className="pb-3 pl-3">Usuario/ID</th>
                        <th className="pb-3">Nombre</th>
                        <th className="pb-3">Rol</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3 pr-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-900/20 transition-all">
                          <td className="py-3.5 pl-3 font-mono font-bold text-white">{user.id}</td>
                          <td className="py-3.5 text-slate-300">{user.name}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black border ${user.role === 'admin' ? 'bg-red-950/60 text-red-400 border-red-900/30' : user.role === 'teacher' ? 'bg-purple-950/60 text-purple-400 border-purple-900/30' : 'bg-blue-950/60 text-blue-400 border-blue-900/30'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${user.blocked ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50'}`}>
                              {user.blocked ? 'Bloqueado' : 'Activo'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-right space-x-1.5">
                            {user.role === 'student' && (
                              <button 
                                onClick={() => setAdminCardEditorUser(user)}
                                className="bg-amber-600/20 hover:bg-amber-600 border border-amber-500/50 text-amber-300 hover:text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Cartas
                              </button>
                            )}
                            {user.id !== 'admin' && (
                              <>
                                <button 
                                  onClick={() => socket?.emit('adminToggleBlockUser', user.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${user.blocked ? 'bg-emerald-600/20 hover:bg-emerald-600 border-emerald-500/50 text-emerald-300 hover:text-white' : 'bg-red-600/20 hover:bg-red-600 border-red-500/50 text-red-300 hover:text-white'}`}
                                >
                                  {user.blocked ? 'Desbloquear' : 'Bloquear'}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`¿Seguro que quieres eliminar la cuenta de ${user.name} (@${user.id})?`)) {
                                      socket?.emit('adminDeleteUser', user.id);
                                    }
                                  }}
                                  className="bg-red-900/40 hover:bg-red-600 border border-red-805 text-red-400 hover:text-white px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT PROFILE BROWSER */}
          {adminTab === 'STUDENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
              
              {/* Left Column: Student selection */}
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl flex flex-col max-h-[500px] overflow-hidden text-left">
                <h3 className="text-lg font-black uppercase tracking-wider text-blue-400 mb-4">🔍 Búsqueda de Alumno</h3>
                <input
                  type="text"
                  placeholder="Buscar por ID de alumno..."
                  value={adminStudentSearchInput}
                  onChange={(e) => setAdminStudentSearchInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl text-sm placeholder-slate-700 text-white px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
                />
                
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                  {studentsList
                    .filter(s => s.id.toLowerCase().includes(adminStudentSearchInput.toLowerCase()) || s.name.toLowerCase().includes(adminStudentSearchInput.toLowerCase()))
                    .map((student) => (
                      <div 
                        key={student.id} 
                        onClick={() => setAdminSelectedStudent(student)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all hover:bg-blue-950/10 ${adminSelectedStudent?.id === student.id ? 'bg-blue-950/20 border-blue-500/40' : 'bg-slate-950/30 border-slate-900'}`}
                      >
                        <h4 className="text-xs font-bold text-white">{student.name}</h4>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {student.id}</p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Panel: Student Profile Details */}
              <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/60 backdrop-blur-2xl p-8 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[500px] h-full">
                {studentSearchResult ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-start border-b border-slate-800/50 pb-6 mb-6">
                      <div>
                        <h2 className="text-3xl font-black text-white">{studentSearchResult.name}</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">ID Alumno: {studentSearchResult.id}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                          <span className="block text-lg font-bold text-amber-400">{studentSearchResult.pveWins}</span>
                          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Victorias PVE</span>
                        </div>
                        <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                          <span className="block text-lg font-bold text-blue-400">{studentSearchResult.pveMatches || 0}</span>
                          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Partidas PVE</span>
                        </div>
                        <div className="bg-slate-950/40 px-4 py-2 border border-slate-800/50 rounded-xl text-center">
                          <span className="block text-lg font-bold text-purple-400">{studentSearchResult.pvpMatches || 0}</span>
                          <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Partidas PVP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8 text-left pb-6">
                      {/* Inventory cards */}
                      <div>
                        <h4 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Cartas en posesión</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {allCards.map(card => {
                            const hasCard = (studentSearchResult.cardInventory?.[card.id] || 0) > 0;
                            return (
                              <div key={card.id} className="relative flex flex-col items-center">
                                {hasCard ? (
                                  <div className="w-20 h-28 relative">
                                    <GameCardContent card={card} onPreview={() => setPreviewCardId(card.id)} />
                                  </div>
                                ) : (
                                  <div className="w-20 h-28 bg-slate-950 border border-dashed border-slate-900 rounded-lg flex flex-col items-center justify-center grayscale opacity-30 shadow-inner">
                                    <span className="text-lg">🔒</span>
                                  </div>
                                )}
                                <div className="mt-1.5 text-center">
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${hasCard ? (card.type === 'MONSTER' ? 'bg-amber-950/80 text-amber-400 border-amber-900/50' : 'bg-emerald-950/80 text-emerald-400 border-emerald-900/50') : 'bg-slate-950 text-slate-700 border-slate-900'}`}>
                                    {hasCard ? `x${studentSearchResult.cardInventory?.[card.id] || 0}` : 'MISTERIO'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Decks */}
                      <div>
                        <h4 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Mazos Guardados</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentSearchResult.savedDecks && studentSearchResult.savedDecks.length > 0 ? (
                            studentSearchResult.savedDecks.map((deck: any, idx: number) => (
                              <div key={idx} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-left">
                                <h5 className="font-bold text-slate-300">{deck.name}</h5>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{deck.cards.length} cartas</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-600 italic">No tiene mazos guardados.</p>
                          )}
                        </div>
                      </div>

                      {/* History */}
                      <div>
                        <h4 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Historial de Partidas</h4>
                        <div className="space-y-2">
                          {studentSearchResult.matchHistory && studentSearchResult.matchHistory.length > 0 ? (
                            studentSearchResult.matchHistory.map((match: any) => {
                              const isWin = match.result === 'win';
                              return (
                                <div key={match.id} className={`p-3 rounded-lg border flex items-center justify-between text-xs ${isWin ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-red-950/10 border-red-900/20'}`}>
                                  <div className="flex items-center space-x-3">
                                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[8px] uppercase ${isWin ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                                      {isWin ? 'VIC' : 'DEF'}
                                    </span>
                                    <span className="font-bold text-white">vs {match.opponentName}</span>
                                    <span className="text-[9px] text-slate-505">{match.mode}</span>
                                  </div>
                                  <span className="font-mono text-slate-400">{match.myHp} LP vs {match.opponentHp} LP</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-600 italic">No hay partidas registradas.</p>
                          )}
                        </div>
                      </div>

                      {/* Notes left by teachers */}
                      <div>
                        <h4 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-4">Notas de Docentes</h4>
                        <div className="space-y-3">
                          {studentSearchResult.teacherNotes && studentSearchResult.teacherNotes.length > 0 ? (
                            studentSearchResult.teacherNotes.map((note: any) => (
                              <div key={note.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                                <div className="flex justify-between items-start text-[10px] font-mono text-slate-500">
                                  <span className="font-bold text-purple-400">Docente: {note.teacherName}</span>
                                  <span>{new Date(note.date).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-600 italic">No hay notas registradas para este alumno.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-600 opacity-70 border border-dashed border-slate-800 rounded-2xl py-20 text-center">
                    <span className="text-6xl mb-4">👤</span>
                    <h4 className="font-mono text-sm uppercase tracking-widest">Selecciona un Alumno</h4>
                    <p className="text-xs text-slate-505 mt-2 max-w-sm">Elige un alumno del panel izquierdo para examinar su rendimiento, inventario de cartas e historial de anotaciones docentes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEACHER ACTIVITY LOGS */}
          {adminTab === 'TEACHERS' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
              
              {/* Left Column: Teacher accounts list */}
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-6 rounded-3xl shadow-xl flex flex-col max-h-[500px] overflow-hidden text-left">
                <h3 className="text-lg font-black uppercase tracking-wider text-purple-400 mb-4">Docentes Registrados</h3>
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                  {teachersList.map((teacher) => (
                    <div 
                      key={teacher.id} 
                      onClick={() => setSelectedTeacherActivityId(teacher.id)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all hover:bg-purple-950/10 ${selectedTeacherActivityId === teacher.id ? 'bg-purple-950/20 border-purple-500/40' : 'bg-slate-950/30 border-slate-900'}`}
                    >
                      <h4 className="text-xs font-bold text-white">{teacher.name}</h4>
                      <p className="text-[9px] text-slate-505 font-mono mt-0.5">ID: {teacher.id}</p>
                    </div>
                  ))}
                  {teachersList.length === 0 && (
                    <p className="text-xs text-slate-600 italic">No hay docentes registrados en el sistema.</p>
                  )}
                </div>
              </div>

              {/* Right Panel: Teacher logs details */}
              <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/60 backdrop-blur-2xl p-8 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[500px] h-full">
                {selectedTeacherProfile ? (
                  <div className="flex flex-col h-full overflow-hidden text-left">
                    <div className="border-b border-slate-800 pb-4 mb-6">
                      <h2 className="text-2xl font-black text-white">Actividad de {selectedTeacherProfile.name}</h2>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">ID Docente: {selectedTeacherProfile.id}</p>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-6">
                      {/* Visit logs */}
                      <div>
                        <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-3">Historial de Perfiles Visitados</h4>
                        <div className="space-y-2">
                          {selectedTeacherProfile.visitedStudents && selectedTeacherProfile.visitedStudents.length > 0 ? (
                            selectedTeacherProfile.visitedStudents.map((log: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-bold text-white">{log.studentName}</span>
                                  <span className="text-[10px] text-slate-505 font-mono ml-2">(@{log.studentId})</span>
                                </div>
                                <span className="text-[9px] text-slate-505 font-mono">{new Date(log.date).toLocaleString()}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-600 italic">El docente no ha visitado perfiles de estudiantes.</p>
                          )}
                        </div>
                      </div>

                      {/* Notes left */}
                      <div>
                        <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-3">Historial de Notas Redactadas</h4>
                        <div className="space-y-3">
                          {selectedTeacherProfile.notesLeft && selectedTeacherProfile.notesLeft.length > 0 ? (
                            selectedTeacherProfile.notesLeft.map((note: any) => (
                              <div key={note.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2">
                                <div className="flex justify-between items-start text-[10px] font-mono text-slate-500">
                                  <span className="font-bold text-blue-400">Alumno: {note.studentName} (@{note.studentId})</span>
                                  <span>{new Date(note.date).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-600 italic">El docente no ha redactado notas pedagógicas.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-slate-600 opacity-70 border border-dashed border-slate-800 rounded-2xl py-20 text-center">
                    <span className="text-6xl mb-4">📊</span>
                    <h4 className="font-mono text-sm uppercase tracking-widest">Actividad de Docente</h4>
                    <p className="text-xs text-slate-505 mt-2 max-w-sm">Selecciona un docente de la lista para inspeccionar qué alumnos ha estado monitoreando y las notas pedagógicas que ha redactado.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Card Editor Modal */}
        <AnimatePresence>
          {adminCardEditorUser && (
            <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 border border-slate-700/50 p-6 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4 text-left">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">📦 Editar Inventario</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Usuario: {adminCardEditorUser.name} (@{adminCardEditorUser.id})</p>
                  </div>
                  <button onClick={() => setAdminCardEditorUser(null)} className="text-slate-400 hover:text-white transition-colors text-lg font-bold">✕</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                  {allCards.map(card => {
                    const currentCount = adminUsersList.find(u => u.id === adminCardEditorUser.id)?.cardInventory?.[card.id] || 0;
                    return (
                      <div key={card.id} className="p-3 bg-slate-950/50 border border-slate-700/40 rounded-2xl flex items-center justify-between text-left">
                        <div className="flex-grow overflow-hidden pr-2">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{card.name}</h4>
                          <p className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">{card.type} • {card.id}</p>
                          <p className="text-[10px] font-bold text-blue-400 font-mono mt-1">Copias: {currentCount}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button 
                            onClick={() => socket?.emit('adminModifyUserCards', adminCardEditorUser.id, card.id, 1)}
                            className="bg-blue-600 hover:bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => {
                              if (currentCount > 0) {
                                socket?.emit('adminModifyUserCards', adminCardEditorUser.id, card.id, -1);
                              }
                            }}
                            disabled={currentCount === 0}
                            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-700 pt-4 flex justify-end">
                  <button onClick={() => setAdminCardEditorUser(null)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer">
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!playerId) {
    return (
      <div className={`flex flex-col min-h-screen circuit-bg text-slate-100 font-sans overflow-x-hidden relative ${isLightMode ? 'light' : ''}`}>
        {/* Deep starry background with radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,25,60,0.6)_0%,_rgba(2,5,15,1)_85%)] z-0" style={{ opacity: isLightMode ? 0.05 : 1 }} />
        
        {/* Twinkling stars */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const delay = (i % 5) * 1.5;
            const duration = 2 + (i % 3) * 2;
            const size = 1 + (i % 3);
            const top = `${Math.floor((i * 7.7) % 100)}%`;
            const left = `${Math.floor((i * 13.3) % 100)}%`;
            return (
              <motion.div
                key={`star-${i}`}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bg-white rounded-full"
                style={{ top, left, width: `${size}px`, height: `${size}px`, boxShadow: size > 2 ? '0 0 8px rgba(255,255,255,0.8)' : 'none' }}
              />
            );
          })}
        </div>

        {/* Crescent Moon */}
        <div className="absolute top-12 right-12 md:right-24 z-0 pointer-events-none opacity-60">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_0_15px_rgba(251,243,219,0.3)]">
            <path d="M75,25 C50,25 35,45 35,65 C35,80 45,90 60,95 C35,95 20,80 20,55 C20,30 40,10 75,25 Z" fill="#fef3c7" />
          </svg>
        </div>

        {/* Concept Constellation SVG lines and glowing nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-0">
          <line x1="10%" y1="20%" x2="30%" y2="15%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="30%" y1="15%" x2="25%" y2="45%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="25%" y1="45%" x2="48%" y2="35%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="48%" y1="35%" x2="40%" y2="65%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="40%" y1="65%" x2="65%" y2="55%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="65%" y1="55%" x2="80%" y2="75%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="80%" y1="75%" x2="90%" y2="50%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="90%" y1="50%" x2="75%" y2="30%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />
          <line x1="75%" y1="30%" x2="60%" y2="15%" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" />

          {/* Node points */}
          <circle cx="10%" cy="20%" r="3" fill="#60a5fa" className="animate-pulse" />
          <circle cx="30%" cy="15%" r="4" fill="#818cf8" className="animate-pulse" />
          <circle cx="25%" cy="45%" r="3" fill="#a78bfa" className="animate-pulse" />
          <circle cx="48%" cy="35%" r="5" fill="#60a5fa" className="animate-pulse" />
          <circle cx="40%" cy="65%" r="3" fill="#818cf8" className="animate-pulse" />
          <circle cx="65%" cy="55%" r="4.5" fill="#f43f5e" className="animate-pulse" />
          <circle cx="80%" cy="75%" r="3" fill="#34d399" className="animate-pulse" />
          <circle cx="90%" cy="50%" r="5" fill="#fbbf24" className="animate-pulse" />
          <circle cx="75%" cy="30%" r="3.5" fill="#a78bfa" className="animate-pulse" />
          <circle cx="60%" cy="15%" r="4" fill="#60a5fa" className="animate-pulse" />
        </svg>

        {/* Landscape Hills Silhouette at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-40 md:h-56 z-0 pointer-events-none overflow-hidden select-none">
          <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,240C240,270,480,285,720,270C960,255,1200,210,1440,230L1440,320L0,320Z" fill="#040612" />
            <path d="M0,280C300,240,600,290,900,270C1200,250,1320,285,1440,295L1440,320L0,320Z" fill="#080c22" opacity="0.4" />
          </svg>
        </div>

        {/* Header/NavBar */}
        <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/symbols/concepto.png" className="w-6 h-6 object-contain" alt="" />
            <span className="font-mono text-sm tracking-[0.3em] font-black uppercase text-slate-300">DUEL MONSTERS</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={toggleThemeMode} className="p-2 border border-slate-800/40 hover:bg-slate-800/30 rounded-full text-sm cursor-pointer transition-all flex items-center justify-center">
              {isLightMode ? '🌙' : '☀️'}
            </button>
            <button 
              onClick={() => { setAuthMode('LOGIN'); setAuthErrorMsg(null); }}
              className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Entrar
            </button>
            <button 
              onClick={() => { setAuthMode('REGISTER'); setAuthErrorMsg(null); }}
              className="text-xs font-mono uppercase tracking-widest px-4 py-2 border border-slate-700/60 rounded-full hover:bg-slate-900/50 hover:border-slate-400 transition-all cursor-pointer"
            >
              Registrarse
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Left Hero Column */}
          <div className="w-full md:w-1/2 flex flex-col text-left space-y-6">
            <h1 className="text-4xl md:text-6xl font-serif font-light leading-tight tracking-tight text-white">
              Explora las ciencias.<br />
              <span className="font-sans font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
                Pon tu conocimiento a batallar
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
              Un juego de cartas estratégico e interactivo donde las disciplinas académicas se transforman en tus recursos de combate. Conecta los conceptos clave para alterar el tablero en tiempo real.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => { setAuthMode('REGISTER'); setAuthErrorMsg(null); }}
                className="bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/50 text-blue-300 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer animate-pulse"
              >
                Comienza Ahora
              </button>
            </div>
          </div>

          {/* Right Login Card Column */}
          <div className="w-full md:w-[420px] flex-shrink-0 relative">
            {/* Glow backdrop behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20" />
            
            <div className="relative bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl flex flex-col w-full">
              
              <div className="flex space-x-2 mb-6 bg-slate-950/60 p-1 rounded-full border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => { setAuthMode('LOGIN'); setAuthErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${authMode === 'LOGIN' ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('REGISTER'); setAuthErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${authMode === 'REGISTER' ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white'}`}
                >
                  Crear Cuenta
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-1.5 px-3">Nombre de Usuario</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="ej: yugi_muto"
                    className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-sm placeholder-slate-700 transition-all shadow-inner text-white px-5"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-1.5 px-3">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-sm placeholder-slate-700 transition-all shadow-inner text-white px-5"
                  />
                </div>

                {authMode === 'REGISTER' && (
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-1.5 px-3">Nombre de Duelista (Opcional)</label>
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="ej: Yugi Muto"
                      className="w-full bg-slate-950/60 border border-slate-800/80 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-sm placeholder-slate-700 transition-all shadow-inner text-white px-5"
                    />
                  </div>
                )}

                {authErrorMsg && (
                  <div className="bg-red-950/40 border border-red-900/50 text-red-400 p-3 rounded-2xl text-center text-xs animate-pulse font-mono">
                    ⚠️ {authErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-full font-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5 text-xs tracking-widest uppercase mt-6 cursor-pointer"
                >
                  {authMode === 'LOGIN' ? 'Entrar a Jugar' : 'Registrar y Entrar'}
                </button>
              </form>
            </div>
          </div>
        </main>

        {/* Feature Grid Columns Section (Thin glowing outlines) */}
        <section className="relative z-10 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 border-t border-slate-900/80 mt-auto bg-slate-950/20 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            
            {/* Column 1 */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-900/60 bg-slate-900/10 hover:border-slate-800/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="filter drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 00-3-3H9.75a3 3 0 00-3 3h1.5m1.125-3h.008v.008h-.008v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-slate-200 tracking-wider uppercase">Pensamiento Crítico</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Conecta los símbolos temáticos de tus monstruos y hechizos en juego para desbloquear y transicionar dinámicamente entre ambientes semánticos.
              </p>
            </div>

            {/* Column 2 */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-900/60 bg-slate-900/10 hover:border-slate-800/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h7.5v7.5h-7.5v-7.5z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-slate-200 tracking-wider uppercase">Tecnología y Ciencia</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Invoca cartas modeladas en base a conceptos reales de disciplinas clave: Informática, Arquitectura, Clima, Petróleo y Civil.
              </p>
            </div>

            {/* Column 3 */}
            <div className="space-y-3 p-6 rounded-2xl border border-slate-900/60 bg-slate-900/10 hover:border-slate-800/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-sm text-slate-200 tracking-wider uppercase">Progreso Persistente</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Comienza con un mazo de inicio y gana nuevas cartas a través de victorias en el Modo Aventura, almacenadas individualmente y de forma segura en tu cuenta.
              </p>
            </div>

          </div>
          
          <div className="mt-8 text-center text-slate-700 text-[10px] font-mono tracking-[0.2em] uppercase">
            DUEL MONSTERS v0.1.0 • ESTRATEGIA ACADÉMICA INTERACTIVA
          </div>
        </section>
      </div>
    );
  }

  if (!gameState) {
    if (userProfile?.role === 'admin') {
      return renderAdminDashboard();
    }
    if (userProfile?.role === 'teacher') {
      return renderTeacherDashboard();
    }

    return (
      <div className={`flex flex-col items-center justify-center min-h-screen circuit-bg text-white p-4 md:p-8 overflow-y-auto relative ${isLightMode ? 'light' : ''}`}>
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,_rgba(30,41,59,0.5)_0%,_rgba(2,6,23,1)_100%)] z-0"></div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div animate={{ y: [0, -20, 0], rotate: [12, 15, 12] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-10 -left-10 w-64 h-96 bg-blue-900/30 border border-blue-500/20 rounded-2xl blur-[4px] p-6 flex flex-col shadow-2xl">
            <div className="w-full h-1/2 bg-black/30 rounded-xl mb-4"></div><div className="w-full h-4 bg-black/20 rounded mb-2"></div><div className="w-3/4 h-4 bg-black/20 rounded"></div>
          </motion.div>
          
          <motion.div animate={{ y: [0, 30, 0], rotate: [-15, -10, -15] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute top-1/4 -right-16 w-72 h-[28rem] bg-amber-900/20 border border-amber-500/20 rounded-2xl blur-[6px] p-6 flex flex-col shadow-2xl">
            <div className="w-full h-1/2 bg-black/30 rounded-xl mb-4"></div><div className="w-full h-4 bg-black/20 rounded mb-2"></div><div className="w-1/2 h-4 bg-black/20 rounded"></div>
          </motion.div>
 
          <motion.div animate={{ y: [0, -25, 0], rotate: [25, 20, 25] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="absolute -bottom-20 left-1/4 w-56 h-80 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl blur-[5px] p-5 flex flex-col shadow-2xl">
            <div className="w-full h-1/2 bg-black/30 rounded-xl mb-4"></div><div className="w-full h-4 bg-black/20 rounded mb-2"></div><div className="w-2/3 h-4 bg-black/20 rounded"></div>
          </motion.div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mt-8">
          <h1 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-widest text-center drop-shadow-2xl">
            Duel Monsters
          </h1>
          
          <div className="flex space-x-4 mb-8 bg-slate-900/60 p-2 rounded-xl border border-slate-700/50 backdrop-blur-md items-center">
            <button onClick={() => setMainMenuTab('PLAY')} className={`px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all ${mainMenuTab === 'PLAY' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              Jugar
            </button>
            <button onClick={() => { setMainMenuTab('COLLECTION'); if (playerId) socket?.emit('getProfile', playerId); }} className={`px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all ${mainMenuTab === 'COLLECTION' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              Colección
            </button>
            <button onClick={() => { setMainMenuTab('PROFILE'); if (playerId) socket?.emit('getProfile', playerId); }} className={`px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all ${mainMenuTab === 'PROFILE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              Perfil
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} className="px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all text-red-400 hover:text-red-300 hover:bg-red-950/30">
              Cerrar Sesión
            </button>
            <button onClick={toggleThemeMode} className="px-4 py-3 rounded-lg font-black uppercase tracking-widest transition-all text-slate-300 hover:text-white hover:bg-slate-800/50 cursor-pointer flex items-center justify-center">
              {isLightMode ? '🌙' : '☀️'}
            </button>
          </div>

          {mainMenuTab === 'PLAY' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              <div className="bg-slate-900/80 p-8 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.05)] border border-amber-900/30 flex flex-col items-center justify-between relative overflow-hidden group backdrop-blur-sm min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 z-0 group-hover:opacity-100 transition-opacity opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center w-full text-center">
                  <div className="w-24 h-24 bg-amber-950/50 rounded-full flex items-center justify-center mb-6 border border-amber-800/50 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <img src="/modo aventura.png" alt="Modo Aventura" className="w-14 h-14 object-contain" />
                  </div>
                  <h2 className="text-3xl font-black text-amber-400 mb-4 uppercase tracking-widest drop-shadow-lg">Modo Aventura</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">Enfréntate a la IA en una serie de duelos continuos. Desbloquea nuevas cartas cada 5 victorias, domina las disciplinas y demuestra tu conocimiento estratégico.</p>
                </div>
                <div className="relative z-10 w-full mt-auto">
                  <button onClick={startAdventure} className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 py-4 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] transform hover:-translate-y-1 flex items-center justify-center space-x-3 cursor-pointer text-lg tracking-widest">
                    <img src="/symbols/batalla.png" className="w-5 h-5 object-contain" alt="" />
                    <span>INICIAR AVENTURA</span>
                    <img src="/symbols/batalla.png" className="w-5 h-5 object-contain" alt="" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/80 p-8 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.05)] border border-blue-900/30 flex flex-col items-center justify-between relative overflow-hidden group backdrop-blur-sm min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-indigo-500/5 z-0 group-hover:opacity-100 transition-opacity opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center w-full text-center">
                  <div className="w-24 h-24 bg-blue-950/50 rounded-full flex items-center justify-center mb-6 border border-blue-800/50 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl">🌐</span>
                  </div>
                  <h2 className="text-3xl font-black text-blue-400 mb-4 uppercase tracking-widest drop-shadow-lg">Multijugador</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">Desafía a otros duelistas en línea. Crea una sala privada para invitar a tus amigos o únete a una batalla existente mediante su código de acceso.</p>
                </div>
                <div className="relative z-10 w-full mt-auto space-y-5">
                  <button onClick={createRoom} className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl font-bold transition-all border border-blue-400/30 shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer tracking-wider">
                    CREAR SALA PRIVADA
                  </button>
                  <div className="relative flex items-center w-full">
                    <div className="flex-grow border-t border-slate-700/80"></div>
                    <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono tracking-widest uppercase">O Únete a Una</span>
                    <div className="flex-grow border-t border-slate-700/80"></div>
                  </div>
                  <div className="flex w-full space-x-3">
                    <input type="text" placeholder="ID SALA" value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())} className="w-2/3 bg-slate-950/80 border border-slate-700 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-center font-mono font-bold placeholder-slate-700 tracking-widest text-lg shadow-inner transition-all" />
                    <button onClick={joinRoom} className="w-1/3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center cursor-pointer tracking-wider text-sm">
                      ENTRAR
                    </button>
                  </div>
                  {error && <div className="absolute -bottom-14 left-0 w-full bg-red-950/80 border border-red-900/50 text-red-400 p-2 rounded-lg text-center text-xs animate-pulse font-mono">⚠️ {error}</div>}
                </div>
              </div>

              <div className="bg-slate-900/80 p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)] border border-emerald-900/30 flex flex-col items-center justify-between relative overflow-hidden group backdrop-blur-sm min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 z-0 group-hover:opacity-100 transition-opacity opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center w-full text-center">
                  <div className="w-24 h-24 bg-emerald-950/50 rounded-full flex items-center justify-center mb-6 border border-emerald-800/50 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <span className="text-5xl">📖</span>
                  </div>
                  <h2 className="text-3xl font-black text-emerald-400 mb-4 uppercase tracking-widest drop-shadow-lg">Manual de Juego</h2>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">Conoce todas las reglas, estrategias y secretos de las disciplinas académicas. Domina las mecánicas y los iconos para asegurar la victoria.</p>
                </div>
                <div className="relative z-10 w-full mt-auto">
                  <button onClick={() => setMainMenuTab('MANUAL')} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl font-bold transition-all border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer tracking-wider">
                    LEER MANUAL
                  </button>
                </div>
              </div>
            </div>
          ) : mainMenuTab === 'COLLECTION' ? (
            <div className="w-full bg-slate-900/80 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.05)] border border-slate-700/50 backdrop-blur-sm flex flex-col min-h-[600px] mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-amber-400 uppercase tracking-widest drop-shadow-lg flex items-center space-x-3">
                  <img src="/symbols/concepto.png" className="w-6 h-6 object-contain inline-block mr-2" alt="" />
                  <span>Tu Colección</span>
                </h2>
                <div className="bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-lg font-mono text-sm">
                  Cartas Obtenidas: <span className="text-amber-400 font-bold">{Object.values(userProfile?.cardInventory || {}).filter(c => c > 0).length}</span> / {allCards.length}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-y-auto pr-2 custom-scrollbar pb-12" style={{ maxHeight: '60vh' }}>
                {allCards.map(card => {
                  const hasCard = (userProfile?.cardInventory?.[card.id] || 0) > 0;
                  return (
                    <div key={card.id} className="relative flex flex-col items-center">
                      {hasCard ? (
                        <div className="w-36 h-52 relative">
                          <GameCardContent card={card} onPreview={() => setPreviewCardId(card.id)} />
                        </div>
                      ) : (
                        <div className="w-36 h-52 bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner grayscale opacity-60">
                          <span className="text-5xl mb-4 text-slate-700 opacity-50">🔒</span>
                          <span className="text-[9px] text-slate-600 font-bold tracking-widest text-center uppercase">Carta Bloqueada</span>
                        </div>
                      )}
                      <div className="mt-3 text-center">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest border ${hasCard ? (card.type === 'MONSTER' ? 'bg-amber-950/80 text-amber-400 border-amber-900/50' : 'bg-emerald-950/80 text-emerald-400 border-emerald-900/50') : 'bg-slate-950 text-slate-700 border-slate-800'}`}>
                          {hasCard ? `x${userProfile?.cardInventory?.[card.id] || 0}` : 'MISTERIO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : mainMenuTab === 'PROFILE' ? (
            <div className="w-full bg-slate-900/80 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(139,92,246,0.05)] border border-slate-700/50 backdrop-blur-sm flex flex-col min-h-[600px] mb-8 relative">
              <button onClick={() => setMainMenuTab('PLAY')} className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg font-bold text-slate-300 transition-colors">Volver</button>
              <h2 className="text-3xl font-black text-purple-400 mb-8 uppercase tracking-widest border-b border-purple-900/50 pb-4 flex items-center">
                <span className="text-3xl mr-3">👤</span> Perfil de Duelista
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden">
                {/* Left Panel: Stats */}
                <div className="space-y-6 lg:border-r lg:border-slate-800 lg:pr-8">
                  <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                    <div className="w-20 h-20 bg-purple-950/40 rounded-full flex items-center justify-center mb-4 border border-purple-800/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      <span className="text-4xl">🎓</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{userProfile?.name || 'Estudiante'}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {userProfile?.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 text-center">
                      <span className="block text-2xl font-black text-amber-400">{userProfile?.pveWins || 0}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Victorias Aventura</span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 text-center">
                      <span className="block text-2xl font-black text-blue-400">{userProfile?.pveMatches || 0}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Partidas Aventura</span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 text-center col-span-2">
                      <span className="block text-2xl font-black text-purple-400">{userProfile?.pvpMatches || 0}</span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Partidas Multijugador</span>
                    </div>
                  </div>

                  {/* Multiplayer Opponents List */}
                  <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50">
                    <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase mb-3">Oponentes Enfrentados</h4>
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                      {(() => {
                        const pvpOpponents = Array.from(new Set(
                          (userProfile?.matchHistory || [])
                            .filter((m: any) => m.mode === 'multiplayer')
                            .map((m: any) => m.opponentName)
                        ));
                        return pvpOpponents.length > 0 ? (
                          pvpOpponents.map((oppName: any, idx) => (
                            <span key={idx} className="px-3 py-1 bg-purple-950/30 text-purple-300 border border-purple-900/40 rounded-full text-xs font-semibold">
                              ⚔️ {oppName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-600 italic">No has jugado partidas multijugador aún.</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Match History */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden h-full">
                  <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center">
                    📖 Historial de Partidas
                  </h3>
                  <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[55vh]">
                    {userProfile?.matchHistory && userProfile.matchHistory.length > 0 ? (
                      userProfile.matchHistory.map((match: any) => {
                        const isWin = match.result === 'win';
                        return (
                          <div key={match.id} className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${isWin ? 'bg-emerald-950/10 border-emerald-900/30 shadow-[0_0_15px_rgba(16,185,129,0.02)]' : 'bg-red-950/10 border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.02)]'}`}>
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${isWin ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/60 text-red-400 border border-red-800/40'}`}>
                                {isWin ? 'VIC' : 'DEF'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-bold text-white">vs {match.opponentName}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-black ${match.mode === 'adventure' ? 'bg-amber-950/60 text-amber-400 border border-amber-900/30' : 'bg-blue-950/60 text-blue-400 border border-blue-900/30'}`}>
                                    {match.mode === 'adventure' ? 'Aventura' : 'Multijugador'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                  {new Date(match.date).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono text-slate-400">Puntos de Vida</p>
                              <p className="text-sm font-bold text-white mt-0.5">
                                {match.myHp} LP <span className="text-slate-500 font-normal">vs</span> {match.opponentHp} LP
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        <span className="text-4xl mb-3">⚔️</span>
                        <p className="font-mono text-xs uppercase tracking-widest">No hay duelos registrados</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full bg-slate-900/80 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)] border border-slate-700/50 backdrop-blur-sm flex flex-col min-h-[600px] mb-8 relative">
               <button onClick={() => setMainMenuTab('PLAY')} className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg font-bold text-slate-300">Volver</button>
               <h2 className="text-3xl font-black text-emerald-400 mb-8 uppercase tracking-widest border-b border-emerald-900/50 pb-4">Manual de Juego</h2>
               <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar max-h-[65vh]">
                  
                  <section>
                    <h3 className="text-2xl font-bold text-blue-400 mb-3 flex items-center"><span className="text-3xl mr-2">📜</span> Reglas Básicas</h3>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed space-y-4">
                      <p><strong className="text-blue-300">Objetivo del Juego:</strong> Reduce los Puntos de Vida (LP) de tu oponente a 0 para ganar el duelo.</p>
                      <p><strong className="text-blue-300">Turnos y Energía:</strong> Cada jugador comienza su turno robando una carta y recuperando su Energía al máximo. La energía se utiliza para lanzar Hechizos.</p>
                      <p><strong className="text-blue-300">El Tablero:</strong> Tienes 3 espacios (Slots) para invocar Monstruos. No puedes tener más de 3 monstruos al mismo tiempo en el campo.</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-2xl font-bold text-red-400 mb-3 flex items-center">
                      <img src="/symbols/batalla.png" className="w-8 h-8 object-contain mr-2" alt="" />
                      Combate y Mecánicas
                    </h3>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed space-y-4">
                      <p><strong className="text-red-300">Ataques:</strong> Los monstruos que ya estaban en el campo desde el turno anterior pueden atacar. Si atacas a una columna donde el oponente tiene un monstruo, tu monstruo hará daño a la <strong>Defensa (DEF)</strong> de ese monstruo.</p>
                      <p><strong className="text-red-300">Daño Directo:</strong> Si atacas a una columna vacía, tu monstruo infligirá daño directamente a los <strong>LP</strong> del oponente igual a su poder de Ataque (ATK).</p>
                      <p><strong className="text-red-300">Destrucción:</strong> Cuando la Defensa (DEF) de un monstruo llega a 0, este es destruido y enviado al cementerio.</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-2xl font-bold text-amber-400 mb-3 flex items-center"><span className="text-3xl mr-2">🎴</span> Tipos de Cartas</h3>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                         <h4 className="font-bold text-lg text-amber-300 mb-2 flex items-center gap-2">
                           <img src="/symbols/monster.png" className="w-5 h-5 object-contain" alt="" />
                           Monstruos
                         </h4>
                         <p className="text-sm">Representan conceptos académicos materializados. Tienen puntos de <strong>ATK</strong> y <strong>DEF</strong>. Invocar monstruos no cuesta energía, pero ocupan espacio en el tablero.</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                         <h4 className="font-bold text-lg text-emerald-300 mb-2 flex items-center gap-2">
                           <img src="/symbols/spell.png" className="w-5 h-5 object-contain" alt="" />
                           Hechizos
                         </h4>
                         <p className="text-sm">Son acciones tácticas que alteran el curso de la batalla. Lanzarlos consume <strong>Energía</strong>. Pueden afectar a monstruos aliados, monstruos enemigos o a los jugadores directamente.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-2xl font-bold text-purple-400 mb-3 flex items-center">
                      <img src="/symbols/lupa.png" alt="Leyenda" className="w-8 h-8 object-contain mr-2 drop-shadow-md" />
                      Leyenda de Iconos
                    </h3>
                    
                    <h4 className="text-sm font-bold text-slate-400 mb-2 mt-4 uppercase tracking-wider">Atributos y Estadísticas</h4>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800"><span className="block text-2xl mb-2 text-red-500 font-bold">ATK</span>Poder de Daño</div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800"><span className="block text-2xl mb-2 text-blue-500 font-bold">DEF</span>Resistencia</div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800"><span className="block text-2xl mb-2">⚡</span>Energía del Jugador</div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                        <img src="/symbols/concepto.png" className="w-8 h-8 object-contain mx-auto mb-2" alt="" />
                        Concepto Académico
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Tipos de Cartas</h4>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed grid grid-cols-3 gap-4 text-center mb-6">
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                        <img src="/symbols/monster.png" className="w-8 h-8 object-contain mx-auto mb-2" alt="Monstruo" />
                        <strong className="text-amber-400 text-xs uppercase block mb-1">Monstruo</strong>
                        <span className="text-[10px] text-slate-400">Conceptos invocados al campo (ATK/DEF)</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                        <img src="/symbols/spell.png" className="w-8 h-8 object-contain mx-auto mb-2" alt="Hechizo" />
                        <strong className="text-emerald-400 text-xs uppercase block mb-1">Hechizo</strong>
                        <span className="text-[10px] text-slate-400">Efectos y acciones mágicas instantáneas</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                        <span className="block text-3xl mb-2">⚠️</span>
                        <strong className="text-rose-400 text-xs uppercase block mb-1">Trampa</strong>
                        <span className="text-[10px] text-slate-400">Efectos de defensa reactivos y mitigación</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Símbolos de Carreras</h4>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-slate-300 leading-relaxed grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                        <img src="/symbols/INFORMATICA.png" alt="Informática" className="w-10 h-10 object-contain mb-2 filter drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]" />
                        <span className="font-bold text-xs text-slate-200">Informática</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                        <img src="/symbols/ARQUITECTURA.png" alt="Arquitectura" className="w-10 h-10 object-contain mb-2 filter drop-shadow-[0_0_3px_rgba(249,115,22,0.3)]" />
                        <span className="font-bold text-xs text-slate-200">Arquitectura</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                        <img src="/symbols/CIVIL.png" alt="Civil" className="w-10 h-10 object-contain mb-2 filter drop-shadow-[0_0_3px_rgba(168,162,158,0.3)]" />
                        <span className="font-bold text-xs text-slate-200">Civil</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                        <img src="/symbols/PETROLEO.png" alt="Petróleo" className="w-10 h-10 object-contain mb-2 filter drop-shadow-[0_0_3px_rgba(234,179,8,0.3)]" />
                        <span className="font-bold text-xs text-slate-200">Petróleo</span>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                        <img src="/symbols/METEOROLOGIA.png" alt="Meteorología" className="w-10 h-10 object-contain mb-2 filter drop-shadow-[0_0_3px_rgba(6,182,212,0.3)]" />
                        <span className="font-bold text-xs text-slate-200">Meteorología</span>
                      </div>
                    </div>
                  </section>
               </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-slate-600 text-xs font-mono tracking-widest">ENGINE VERSION 0.1.0 • ACADEMIC DUEL SYSTEM</div>

        <AnimatePresence>
          {previewCardId && (
            <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} onClick={() => setPreviewCardId(null)} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 cursor-pointer">
              <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative cursor-default">
                <div className="relative hover:scale-[1.02] transition-transform duration-300 w-80 h-[30rem]">
                  <GameCardContent card={allCards.find(c => c.id === previewCardId)!} isExpanded={true} />
                </div>
                <button onClick={() => setPreviewCardId(null)} className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg text-sm z-50 border border-red-800">X</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const me = gameState.players[playerId || ''];
  const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
  const opponent = opponentId ? gameState.players[opponentId] : null;
  const isMyTurn = gameState.turn === playerId;
  const currentTheme = BOARD_THEMES[gameState.dominantTheme || 'NEUTRAL'] || BOARD_THEMES.NEUTRAL;

  if (gameState.phase === 'LOBBY') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
          <h2 className="text-2xl font-bold mb-2 text-center">Sala: <span className="text-blue-400">{gameState.roomId}</span></h2>
          <p className="text-slate-400 text-center mb-8 text-sm">Comparte el ID con tu oponente</p>
          <div className="space-y-4 mb-8">
            <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
              <input type="text" placeholder="Tu nombre de duelista" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onBlur={setName} className="w-full bg-slate-800 border border-slate-700 p-2 rounded mb-4 focus:outline-none" />
              <div className="flex items-center justify-between">
                <span>{me?.name} (Tú)</span>
                <span className={me?.ready ? 'text-emerald-400' : 'text-amber-400'}>{me?.ready ? '✓ Listo' : 'Esperando...'}</span>
              </div>
            </div>
            {opponent ? (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 flex items-center justify-between">
                <span>{opponent.name}</span>
                <span className={opponent.ready ? 'text-emerald-400' : 'text-amber-400'}>{opponent.ready ? '✓ Listo' : 'Esperando...'}</span>
              </div>
            ) : (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 border-dashed animate-pulse text-center text-slate-500">Esperando oponente...</div>
            )}
          </div>
          <button onClick={() => setReady(!me?.ready)} className={`w-full py-4 rounded-lg font-bold transition-all ${me?.ready ? 'bg-slate-600 hover:bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}>
            {me?.ready ? 'Cancelar' : '¡ESTOY LISTO!'}
          </button>
          <button onClick={clearSession} className="w-full mt-4 text-xs text-slate-500 hover:text-slate-400 underline">Abandonar Sala</button>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'PREPARATION') {
    const availableCards = [...MONSTERS, ...SPELLS].filter(c => !c.isUnlockable || me?.unlockedCardIds?.includes(c.id));
    const filteredCards = availableCards.filter(c => {
      if (activeTab !== 'ALL' && c.type !== activeTab) return false;
      if (selectedArea !== 'ALL' && !getCardCareers(c.area).includes(selectedArea)) return false;
      return true;
    });

    const selectedMonsters = selectedCards.filter(id => MONSTERS.find(m => m.id === id)).length;
    const selectedSpells = selectedCards.length - selectedMonsters;
    const isValidSize = selectedCards.length >= 5 && selectedCards.length <= 25;
    const hasMonster = selectedMonsters >= 1;
    const isDeckValid = isValidSize && hasMonster;

    // Academic area distribution calculation
    const areaDistribution: Record<string, number> = {};
    selectedCards.forEach(id => {
      const card = availableCards.find(c => c.id === id);
      if (card && card.area) {
        areaDistribution[card.area] = (areaDistribution[card.area] || 0) + 1;
      }
    });

    let dominantArea = 'ALL';
    let maxCount = 0;
    Object.entries(areaDistribution).forEach(([area, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantArea = area;
      }
    });

    const areaStyles: Record<string, { bg: string, text: string, border: string, glow: string, icon: string, gradient: string }> = {
      INFORMATICA: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/50', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.2)]', icon: '/symbols/INFORMATICA.png', gradient: 'from-blue-900/40 to-slate-900' },
      ARQUITECTURA: { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_40px_rgba(249,115,22,0.2)]', icon: '/symbols/ARQUITECTURA.png', gradient: 'from-orange-900/40 to-slate-900' },
      CIVIL: { bg: 'bg-stone-600/30', text: 'text-stone-300', border: 'border-stone-500/50', glow: 'shadow-[0_0_40px_rgba(168,162,158,0.2)]', icon: '/symbols/CIVIL.png', gradient: 'from-stone-800/40 to-slate-900' },
      PETROLEO: { bg: 'bg-zinc-800/80', text: 'text-yellow-500', border: 'border-yellow-600/50', glow: 'shadow-[0_0_40px_rgba(202,138,4,0.2)]', icon: '/symbols/PETROLEO.png', gradient: 'from-yellow-900/30 to-slate-900' },
      METEOROLOGIA: { bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-[0_0_40px_rgba(6,182,212,0.2)]', icon: '/symbols/METEOROLOGIA.png', gradient: 'from-cyan-900/40 to-slate-900' },
      CALCULO: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/concepto.png', gradient: 'from-slate-900 to-blue-950/20' },
      LOGICA: { bg: 'bg-blue-600/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/INFORMATICA.png', gradient: 'from-blue-900/20 to-slate-900' },
      LENGUAJE: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/concepto.png', gradient: 'from-slate-900 to-blue-950/20' },
      DESARROLLO: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/concepto.png', gradient: 'from-slate-900 to-blue-950/20' },
      FISICO: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/concepto.png', gradient: 'from-slate-900 to-blue-950/20' },
      NEUTRAL: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '/symbols/concepto.png', gradient: 'from-slate-900 to-blue-950/20' },
      ALL: { bg: 'bg-slate-800/50', text: 'text-slate-300', border: 'border-slate-700', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.05)]', icon: '🌐', gradient: 'from-slate-900 to-blue-950/20' }
    };

    const currentDeckStyle = areaStyles[dominantArea] || areaStyles['ALL'];

    return (
      <div className={`flex h-screen ${currentTheme?.root || 'bg-slate-950'} text-white font-sans overflow-hidden relative ${isLightMode ? 'light' : ''}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${currentDeckStyle.gradient} opacity-40 transition-colors duration-1000`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/80 to-black z-0 pointer-events-none" />
        <div className="flex-grow flex p-4 gap-6 backdrop-blur-sm relative z-10 h-full overflow-hidden">
          
          {/* Left Side: Card Catalog */}
          <div className="flex-grow flex flex-col w-2/3 h-full overflow-hidden bg-slate-900/60 rounded-3xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">Catálogo</h2>
                <p className="text-slate-400 text-xs font-mono mt-1">Selecciona entre 5 y 15 cartas para tu estrategia.</p>
              </div>
              <div className="flex space-x-4 items-center">
                <div className="flex space-x-2">
                  {['ALL', 'MONSTER', 'SPELL'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition-all ${activeTab === tab ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 border border-slate-800'}`}>
                      {tab === 'ALL' ? 'Todas' : tab === 'MONSTER' ? 'Monstruos' : 'Hechizos'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowExitConfirm(true)} className="px-4 py-1.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-white font-bold text-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                  Salir
                </button>
              </div>
            </div>

            {/* Filter Area */}
            <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-950/50 flex space-x-2 overflow-x-auto custom-scrollbar">
              {['ALL', 'INFORMATICA', 'ARQUITECTURA', 'CIVIL', 'PETROLEO', 'METEOROLOGIA'].map(area => {
                const style = areaStyles[area] || areaStyles['ALL'];
                const isSelected = selectedArea === area;
                return (
                  <button 
                    key={area} 
                    onClick={() => setSelectedArea(area)} 
                    className={`flex-shrink-0 px-3 py-1.5 rounded-md font-bold uppercase text-[10px] tracking-wider transition-all flex items-center space-x-2 ${isSelected ? `${style.bg} ${style.text} border ${style.border}` : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 border border-slate-800'}`}
                  >
                    {style.icon.startsWith('/') ? (
                      <img src={style.icon} className="w-4 h-4 object-contain" alt="" />
                    ) : (
                      <span>{style.icon}</span>
                    )}
                    <span>{area === 'ALL' ? 'Todas las Áreas' : area}</span>
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
              <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {filteredCards.map(card => {
                    const countInDeck = selectedCards.filter(id => id === card.id).length;
                    let countOwned = userProfile?.cardInventory?.[card.id] || 0;
                    if (countOwned === 0 && !card.isUnlockable) countOwned = 1;
                    const isMaxedOut = countInDeck >= countOwned || selectedCards.length >= 25;
                    
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        whileHover={{ scale: isMaxedOut ? 1 : 1.05 }}
                        key={card.id} 
                        className={`relative flex flex-col items-center group ${isMaxedOut ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => { if (!isMaxedOut) addCardToDeck(card.id); }}
                      >
                        <div className="w-36 h-52 relative">
                          <GameCardContent card={card} onPreview={() => setPreviewCardId(card.id)} />
                        </div>
                        
                        <div className="mt-2 text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 w-full text-center">
                           Posees: {countOwned} | En Mazo: <span className={countInDeck > 0 ? 'text-blue-400' : ''}>{countInDeck}</span>
                        </div>

                        {!isMaxedOut && (
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition-colors rounded-xl flex items-center justify-center pointer-events-none">
                             <span className="opacity-0 group-hover:opacity-100 text-4xl transform scale-50 group-hover:scale-100 transition-all font-black text-white drop-shadow-md">+</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Right Side: Selected Deck */}
          <div className={`w-1/3 flex flex-col h-full bg-slate-950/90 rounded-3xl border ${currentDeckStyle.border} ${currentDeckStyle.glow} backdrop-blur-xl overflow-hidden relative transition-all duration-700`}>
            <div className={`p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r ${currentDeckStyle.gradient} transition-colors duration-700`}>
              <div className="flex items-center space-x-3">
                {currentDeckStyle.icon.startsWith('/') ? (
                  <img src={currentDeckStyle.icon} className="w-6 h-6 object-contain" alt="" />
                ) : (
                  <span className="text-2xl">{currentDeckStyle.icon}</span>
                )}
                <h2 className={`text-xl font-black uppercase tracking-widest ${currentDeckStyle.text}`}>Tu Mazo</h2>
              </div>
              <span className={`text-sm font-mono font-bold px-2 py-1 rounded border ${!isValidSize ? 'bg-red-950/50 text-red-400 border-red-900/50 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
                {selectedCards.length} / 25
              </span>
            </div>

            <div className="flex flex-col px-6 py-3 bg-slate-900/50 border-b border-slate-800">
              <div className="flex justify-between text-[10px] font-mono tracking-widest text-slate-400 mb-2">
                <span className={!hasMonster ? 'text-red-400 animate-pulse font-bold' : 'text-amber-400'}>Monstruos: {selectedMonsters}</span>
                <span className="text-emerald-400">Hechizos: {selectedSpells}</span>
              </div>
              
              {/* Academic Area Breakdown */}
              {Object.keys(areaDistribution).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(areaDistribution).map(([area, count]) => {
                    if (!area) return null;
                    const style = areaStyles[area] || areaStyles['ALL'];
                    return (
                      <div key={area} className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${style.bg} ${style.text} ${style.border}`}>
                        {style.icon.startsWith('/') ? (
                          <img src={style.icon} className="w-3.5 h-3.5 object-contain" alt="" />
                        ) : (
                          <span>{style.icon}</span>
                        )}
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save & Load Deck Controls */}
            <div className="flex space-x-2 px-6 py-2 bg-slate-950/50 border-b border-slate-800">
              <button 
                onClick={() => { setDeckNameInput(''); setShowSaveModal(true); }}
                disabled={selectedCards.length === 0}
                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/50 text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>💾 Guardar Mazo</span>
              </button>
              <button 
                onClick={() => { setConfirmDeckToLoad(null); setShowLoadModal(true); }}
                className="flex-1 py-2 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/50 text-purple-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>📂 Cargar Mazo</span>
              </button>
            </div>

            {/* Deck List */}
            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
              <motion.div layout className="flex flex-col space-y-2">
                <AnimatePresence>
                  {selectedCards.map((id, index) => {
                    const card = availableCards.find(c => c.id === id);
                    if (!card) return null;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        key={`${id}-${index}`}
                        onClick={() => removeCardFromDeck(index)}
                        className={`flex items-center p-2 rounded-xl cursor-pointer border hover:bg-slate-800 transition-colors group ${card.type === 'MONSTER' ? 'bg-slate-900/80 border-amber-900/30' : 'bg-slate-900/80 border-emerald-900/30'}`}
                      >
                        <div className={`w-10 h-14 flex-shrink-0 rounded flex items-center justify-center border ${card.type === 'MONSTER' ? 'bg-amber-950/50 border-amber-800/50 text-amber-500' : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-500'}`}>
                          {card.type === 'MONSTER' ? (
                            <img src="/symbols/monster.png" className="w-5 h-5 object-contain" alt="" />
                          ) : (
                            <img src="/symbols/spell.png" className="w-5 h-5 object-contain" alt="" />
                          )}
                        </div>
                        <div className="ml-3 flex-grow overflow-hidden">
                          <h3 className="text-xs font-bold truncate text-slate-200 group-hover:text-white transition-colors">{card.name}</h3>
                          <div className="flex space-x-2 mt-1">
                            <span className="text-[9px] text-slate-500 uppercase">{card.type}</span>
                            {card.area && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border flex items-center space-x-1 ${areaStyles[card.area]?.bg || ''} ${areaStyles[card.area]?.text || 'text-slate-400'} ${areaStyles[card.area]?.border || 'border-slate-700'}`}>
                                {areaStyles[card.area]?.icon?.startsWith('/') ? (
                                  <img src={areaStyles[card.area]?.icon} className="w-3 h-3 object-contain" alt="" />
                                ) : (
                                  <span>{areaStyles[card.area]?.icon || '🎓'}</span>
                                )}
                                <span>{card.area}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-red-950/30 text-red-500 flex items-center justify-center text-xs font-bold border border-red-900/30 group-hover:bg-red-600 group-hover:text-white transition-all opacity-50 group-hover:opacity-100">
                          -
                        </div>
                      </motion.div>
                    );
                  })}
                  {selectedCards.length === 0 && (
                     <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 opacity-50 py-20 text-center">
                       <img src="/symbols/cartas.png" alt="Mazo Vacío" className="w-16 h-16 object-contain mb-4 filter grayscale opacity-70" />
                       <p className="font-mono text-xs uppercase tracking-widest">El mazo está vacío</p>
                     </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/80">
              <button 
                  onClick={() => socket?.emit('selectDeck', selectedCards)} 
                  disabled={!isDeckValid || me?.ready} 
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center ${isDeckValid && !me?.ready ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-900/30 transform hover:-translate-y-1' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                >
                  {me?.ready ? 'Esperando al Oponente...' : 'Confirmar Mazo'}
              </button>
              
              <div className="h-6 mt-3 text-center">
                {!isValidSize && selectedCards.length > 0 && (
                  <p className="text-red-400 text-[10px] font-bold animate-pulse">⚠️ Requiere de 5 a 25 cartas</p>
                )}
                {!hasMonster && selectedCards.length > 0 && (
                  <p className="text-red-400 text-[10px] font-bold animate-pulse">⚠️ Requiere mínimo 1 monstruo</p>
                )}
                {opponentId && (
                  <div className="text-[10px] font-mono mt-1">
                    <span className="text-slate-400">Oponente: </span>
                    <span className={opponent?.ready ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {opponent?.ready ? '¡Listo!' : 'Preparando mazo...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <AnimatePresence>
          {previewCardId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} onClick={() => setPreviewCardId(null)} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 cursor-pointer">
              <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative cursor-default">
                <div className="relative hover:scale-[1.02] transition-transform duration-300 w-80 h-[30rem]">
                  <GameCardContent card={allCards.find(c => c.id === previewCardId)!} isExpanded={true} />
                </div>
                <button onClick={() => setPreviewCardId(null)} className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg text-sm z-50 border border-red-800">X</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 p-8 rounded-2xl border-2 border-red-900/50 shadow-2xl text-center max-w-sm w-full">
                <h3 className="text-2xl font-bold mb-4 text-slate-200">¿Abandonar Preparación?</h3>
                <p className="text-slate-400 mb-8 text-sm">¿Seguro que quieres volver al menú principal?</p>
                <div className="flex space-x-4">
                  <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all cursor-pointer">No</button>
                  <button onClick={() => { setShowExitConfirm(false); clearSession(); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.3)]">Sí, Salir</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentThemeStr = gameState.dominantTheme || 'NEUTRAL';

  return (
    <motion.div animate={currentThemeStr} variants={themeContainerVariants as any} className={`flex h-screen text-white font-sans overflow-hidden relative bg-black ${isLightMode ? 'light' : ''}`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        {BOARD_THEMES.NEUTRAL.particles}
      </div>
      <Layer1Background theme={currentThemeStr} />
      <Layer2Grid theme={currentThemeStr} />
      {currentThemeStr === 'METEOROLOGIA' && <LightningStorm />}
      {animatingCard?.type === 'ATTACK_IMPACT' && (
        <AttackAnimationOverlay animatingCard={animatingCard} gameState={gameState} playerId={playerId} />
      )}
      
      {animatingCard?.type === 'ACID_RAIN' && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 rain-container"></div>
          <div className="absolute inset-0 bg-green-900/20 mix-blend-color-burn animate-pulse"></div>
        </div>
      )}

      <div className="flex-grow flex flex-col relative z-10 h-full w-full overflow-hidden">
        <div className="absolute top-6 left-6 z-20 cursor-pointer" onClick={handleOpponentAvatarClick}>
          <div id="avatar-opponent" className={`bg-slate-900/80 px-6 py-2 rounded-full border transition-all shadow-inner flex items-center space-x-4 border-red-900/50`}>
            <p className="text-2xl font-mono font-bold text-red-500 tracking-tighter">
              <AnimatedNumber value={opponent?.hp || 0} /> LP
              {animatingCard?.targetId === opponentId && (
                <span className="text-orange-500 ml-2 animate-pulse">-{animatingCard?.damage}</span>
              )}
            </p>
            <div className="w-px h-4 bg-slate-700"></div>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-4 h-4 transition-all duration-300 ${i < (opponent?.energy || 0) ? 'opacity-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'opacity-30 grayscale'}`}>
                  <img src="/symbols/energia.png" className="w-full h-full object-contain" alt="Energy" />
                </div>
              ))}
            </div>
            <div className="text-[10px] font-bold text-slate-500 ml-2 uppercase">{opponent?.name}</div>
          </div>
        </div>

        <div className="flex-shrink-0 h-24 sm:h-32 flex justify-center items-start pt-2 sm:pt-6 space-x-[-15px]">
          {opponent?.hand.map((_, i) => (
            <div key={i} className="w-14 h-20 sm:w-16 sm:h-22 md:w-18 md:h-26 lg:w-20 lg:h-28 bg-gradient-to-br from-red-900 to-slate-900 rounded-xl border-2 border-red-900/50 shadow-xl transform hover:-translate-y-2 transition-transform flex items-center justify-center">
              <div className="w-3/5 h-3/5 border border-red-800/30 rounded-lg flex items-center justify-center opacity-40">
                <img src="/symbols/cartas.png" alt="Carta" className="w-full h-full object-contain drop-shadow-md" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex-grow flex flex-col justify-center gap-4 sm:gap-6 items-center z-10 pointer-events-none transform scale-[0.75] sm:scale-[0.85] md:scale-95 lg:scale-100 origin-center py-2">
          
          <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-2xl justify-items-center pointer-events-auto">
            {[0, 1, 2].map(i => {
              const m = opponent?.monsterZone?.[i];
              return (
                <div key={`opp-slot-${i}`} onClick={() => handleOpponentSlotClick(i)} className="w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 flex items-center justify-center relative cursor-pointer">
                  <motion.div variants={layer3SlotVariants as any} className="absolute inset-0 rounded-2xl -z-10" />
                  <AnimatePresence mode="popLayout">
                    {m && (
                      <MonsterCardDisplay 
                        monster={m} 
                        isOpponent={true} 
                        isAttacking={animatingCard?.id === m.instanceId && animatingCard?.type === 'ATTACK_IMPACT'}
                        isTakingDamage={animatingCard?.targetId === m.instanceId}
                        damageAmount={animatingCard?.targetId === m.instanceId ? animatingCard?.targetDamage : undefined}
                        isDestroyed={animatingCard?.targetId === m.instanceId ? animatingCard?.isDestroyed : false}
                        onPreview={() => setPreviewCardId(m.id)}
                      />
                    )}
                  </AnimatePresence>
                  {!m && (
                    <span className="text-slate-500/50 font-bold tracking-widest text-xs sm:text-sm uppercase">Vacío</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-2xl justify-items-center pointer-events-auto">
            {[0, 1, 2].map(i => {
              const m = me?.monsterZone?.[i];
              const isSelectedTarget = selectedActionCard && me?.hand.find(c => c.id === selectedActionCard)?.type === 'MONSTER' && !m;
              return (
                <div key={`my-slot-${i}`} onClick={() => handleMySlotClick(i)} className={`w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 flex items-center justify-center relative cursor-pointer hover:-translate-y-2 transition-transform ${isSelectedTarget ? 'ring-4 ring-blue-500 animate-pulse' : ''}`}>
                  <motion.div variants={layer3SlotVariants as any} className="absolute inset-0 rounded-2xl -z-10" />
                  <AnimatePresence mode="popLayout">
                    {m && (
                      <MonsterCardDisplay 
                        monster={m} 
                        isAttacking={animatingCard?.id === m.instanceId && animatingCard?.type === 'ATTACK_IMPACT'}
                        isTakingDamage={animatingCard?.targetId === m.instanceId || animatingCard?.secondaryTargetId === m.instanceId}
                        damageAmount={(animatingCard?.targetId === m.instanceId) ? animatingCard?.targetDamage : ((animatingCard?.secondaryTargetId === m.instanceId) ? animatingCard?.secondaryDamage : undefined)}
                        isDestroyed={(animatingCard?.targetId === m.instanceId) ? animatingCard?.isDestroyed : false}
                        onPreview={() => setPreviewCardId(m.id)}
                      />
                    )}
                  </AnimatePresence>
                  {!m && (
                    <span className="text-slate-500/50 font-bold tracking-widest text-xs sm:text-sm uppercase">Vacío</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-shrink-0 w-full p-4 sm:p-6 flex justify-between items-end z-20 pointer-events-none bg-transparent">
          <div className="flex space-x-6 items-end pointer-events-auto">
            
            <div className="flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <span className="bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
                  Mazo: {me?.deck.length || 0}
                </span>
              </div>
              <button onClick={drawCard} disabled={!isMyTurn || me?.hasDrawnThisTurn || me?.deck.length === 0} className={`relative w-14 h-22 sm:w-16 sm:h-26 md:w-18 md:h-28 lg:w-20 lg:h-32 rounded-xl border-2 transition-all duration-300 group cursor-pointer ${!isMyTurn || me?.hasDrawnThisTurn || me?.deck.length === 0 ? 'bg-slate-800 border-slate-700 opacity-50 grayscale pointer-events-none' : 'bg-gradient-to-br from-indigo-800 to-slate-900 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'}`}>
                <div className={`absolute -bottom-1 -right-1 w-full h-full rounded-xl border border-slate-700/50 -z-10 ${!isMyTurn || me?.hasDrawnThisTurn ? 'bg-slate-800' : 'bg-slate-900'}`}></div>
                <div className={`absolute -bottom-2 -right-2 w-full h-full rounded-xl border border-slate-700/30 -z-20 ${!isMyTurn || me?.hasDrawnThisTurn ? 'bg-slate-800' : 'bg-slate-900'}`}></div>
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img src="/symbols/cartas.png" alt="Robar" className="w-6 h-6 sm:w-8 sm:h-8 mb-1 object-contain filter drop-shadow-md group-hover:animate-bounce" />
                  <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${(!isMyTurn || me?.hasDrawnThisTurn || me?.deck.length === 0) ? 'text-slate-500' : 'text-blue-300'}`}>
                    {me?.hasDrawnThisTurn ? 'Robado' : (me?.deck.length === 0 ? 'Vacío' : 'Robar')}
                  </span>
                </div>
              </button>
            </div>

            <div className="w-px h-24 sm:h-32 bg-slate-800 mx-2"></div>

            <div className="flex space-x-4 overflow-x-auto custom-scrollbar px-2 pb-2 max-w-[50vw]">
              <AnimatePresence>
                {me?.hand.map((card, i) => (
                <motion.button 
                  key={card.instanceId || `hand-${i}`}
                  layoutId={card.instanceId}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  onClick={() => handleHandCardClick(card)}
                  disabled={!isMyTurn || isActionLocked}
                  className={`group relative transition-all duration-300 hover:-translate-y-6 hover:scale-105 disabled:hover:translate-y-0 disabled:hover:scale-100 text-left flex-shrink-0 w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 ${selectedActionCard === card.id ? '-translate-y-6 ring-4 ring-blue-500 rounded-xl shadow-2xl' : 'hover:shadow-2xl hover:shadow-blue-900/50'}`}
                >
                  <GameCardContent card={card} onPreview={() => setPreviewCardId(card.id)} />
                  {isMyTurn && !isActionLocked && selectedActionCard !== card.id && (
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none border-2 ${card.type === 'MONSTER' ? 'bg-blue-500/20 border-blue-400' : 'bg-emerald-500/20 border-emerald-400'}`}>
                      <span className={`${card.type === 'MONSTER' ? 'bg-blue-600' : 'bg-emerald-600'} text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-bold`}>
                        {card.type === 'MONSTER' ? 'SELECCIONAR' : 'SELECCIONAR'}
                      </span>
                    </div>
                  )}
                  {selectedActionCard === card.id && (
                    <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-blue-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold z-10 animate-bounce text-xs">
                      !
                    </div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-4 z-20 pointer-events-auto mb-2">
            <div id="avatar-my" className="bg-slate-900/80 backdrop-blur-sm px-6 py-2 rounded-full border border-blue-900/50 shadow-inner flex items-center space-x-4">
              <p className="text-2xl font-mono font-bold text-blue-500 tracking-tighter">
                <AnimatedNumber value={me?.hp || 0} /> LP
                {animatingCard?.secondaryTargetId === playerId && (
                  <span className="text-orange-500 ml-2 animate-pulse">-{animatingCard?.secondaryDamage}</span>
                )}
                {animatingCard?.targetId === playerId && (
                  <span className="text-orange-500 ml-2 animate-pulse">-{animatingCard?.damage}</span>
                )}
              </p>
              <div className="w-px h-4 bg-slate-700"></div>
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 transition-all duration-300 ${i < (me?.energy || 0) ? 'opacity-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse' : 'opacity-30 grayscale'}`}>
                    <img src="/symbols/energia.png" className="w-full h-full object-contain" alt="Energy" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              {selectedActionCard && (
                <button onClick={() => { setSelectedActionCard(null); }} className="bg-red-600/80 hover:bg-red-500 border border-red-500 px-8 py-2 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 uppercase text-sm tracking-widest">
                  Cancelar Acción
                </button>
              )}
              <button 
                onClick={executeAttacks} 
                disabled={!isMyTurn || isActionLocked || gameState.isFirstTurn || !me?.monsterZone.some(m => m && !m.hasAttacked)} 
                className="bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 px-8 py-2 rounded-lg font-bold transition-all border border-red-500 disabled:border-slate-700 shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:shadow-none uppercase text-sm tracking-widest"
              >
                Atacar
              </button>
              <button onClick={endTurn} disabled={!isMyTurn || isActionLocked} className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 px-8 py-2 rounded-lg font-bold transition-all border border-slate-600 uppercase text-sm tracking-widest">
                Terminar Turno
              </button>
            </div>
          </div>
        </div>

        <div className={`absolute top-4 right-4 px-6 py-2 rounded-full border transition-all ${isMyTurn ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-red-600/20 border-red-500 text-red-400'}`}>
          <span className="font-bold uppercase tracking-widest text-sm animate-pulse">{isMyTurn ? 'Tu Turno' : 'Turno Oponente'}</span>
        </div>
      </div>

      <div className={`w-80 border-l flex-shrink-0 z-50 flex flex-col transition-all duration-500 ${currentTheme?.sidebar || 'bg-slate-900 border-slate-800'}`}>
        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Registro de Duelo</h3>
          <button onClick={() => setShowExitConfirm(true)} className="text-[10px] text-red-500 hover:text-red-400 uppercase cursor-pointer">Salir</button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {gameState.logs.map((log, i) => (
            <div key={i} className="text-slate-400 border-l-2 border-slate-700 pl-2 py-1 bg-slate-800/20 rounded-r">
              <span className="text-slate-600 mr-2">[{i+1}]</span>{log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
        <div className="p-4 bg-slate-950 text-[10px] text-slate-600 italic">Duel Monsters Engine v0.1.0</div>
      </div>

      <AnimatePresence>
        {animatingCard?.type === 'SPELL_EFFECT' && <SpellEffectOverlay spellId={animatingCard.id} />}
      </AnimatePresence>

      <AnimatePresence>
        {showGameOver && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(16px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            {gameState.winner === playerId ? <Confetti /> : <BloodEffect />}
            <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }} className="bg-slate-800 p-12 rounded-3xl border-4 border-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.2)] text-center max-w-sm w-full">
              <h2 className="text-6xl mb-6">{gameState.winner === playerId ? '🏆' : '💀'}</h2>
              <h3 className="text-4xl font-bold mb-2 uppercase tracking-tighter">{gameState.winner === playerId ? '¡Victoria!' : 'Derrota'}</h3>
              <p className="text-slate-400 mb-8">{gameState.winner === playerId ? 'Has dominado el campo de batalla.' : 'Tus monstruos han caído en combate.'}</p>
              {opponentId === 'cpu' ? (
                <div className="space-y-4">
                  <button onClick={nextAdventure} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest cursor-pointer">
                    {gameState.winner === playerId ? 'Siguiente Enfrentamiento' : 'Volver a intentar'}
                  </button>
                  <button onClick={clearSession} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl font-bold transition-all uppercase tracking-widest text-sm cursor-pointer">
                    Abandonar
                  </button>
                </div>
              ) : (
                <button onClick={clearSession} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-4 rounded-xl font-black transition-all shadow-xl shadow-amber-900/40 uppercase tracking-widest cursor-pointer">Nuevo Duelo</button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 p-8 rounded-2xl border-2 border-red-900/50 shadow-2xl text-center max-w-sm w-full">
              <h3 className="text-2xl font-bold mb-4 text-slate-200">¿Abandonar Duelo?</h3>
              <p className="text-slate-400 mb-8 text-sm">¿Seguro que quieres abandonar el duelo? Perderás todo tu progreso en esta partida.</p>
              <div className="flex space-x-4">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all cursor-pointer">No</button>
                <button onClick={() => { setShowExitConfirm(false); clearSession(); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.3)]">Sí, Salir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewCardId && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} onClick={() => setPreviewCardId(null)} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 cursor-pointer">
            <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 50, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative cursor-default">
              <div className="relative hover:scale-[1.02] transition-transform duration-300 w-80 h-[30rem]">
                <GameCardContent card={allCards.find(c => c.id === previewCardId)!} isExpanded={true} />
              </div>
              <button onClick={() => setPreviewCardId(null)} className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg text-sm z-50 border border-red-800">X</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedCardAlert && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} 
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }} 
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }} 
            className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.8, y: 50, opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 350 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-slate-900/90 border-2 border-indigo-500/50 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.4)] max-w-2xl w-full p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden backdrop-blur-xl"
            >
              {/* Starry Night glowing accents */}
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-600/30 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-600/30 rounded-full blur-[60px] pointer-events-none" />
              
              {/* Unlocked Card display */}
              <div className="w-64 h-96 flex-shrink-0 relative">
                {(() => {
                  const card = allCards.find(c => c.id === unlockedCardAlert);
                  return card ? (
                    <GameCardContent card={card} isExpanded={true} />
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500">
                      Carta no encontrada
                    </div>
                  );
                })()}
              </div>

              {/* Text content & action */}
              <div className="flex-grow flex flex-col text-center md:text-left">
                <div className="inline-flex items-center justify-center md:justify-start gap-2 text-indigo-400 font-extrabold uppercase tracking-wider text-sm mb-3">
                  <span className="text-xl">✨</span> ¡Nuevo Conocimiento Adquirido!
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-blue-300">
                  ¡Felicidades!
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed mb-6 font-medium">
                  felicidades: haz adquirido nuevo conocimiento, una carta aliada se ha añadido a tu colección
                </p>
                <button 
                  onClick={() => setUnlockedCardAlert(null)} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
                >
                  Entendido
                </button>
              </div>

              {/* Close button in top-right */}
              <button 
                onClick={() => setUnlockedCardAlert(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl font-bold cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Modals */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 p-8 rounded-2xl border-2 border-red-900/50 shadow-2xl text-center max-w-sm w-full">
              <h3 className="text-2xl font-bold mb-4 text-slate-200">¿Cerrar Sesión?</h3>
              <p className="text-slate-400 mb-8 text-sm">¿Seguro que quieres cerrar tu sesión actual?</p>
              <div className="flex space-x-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all cursor-pointer">No</button>
                <button onClick={() => { setShowLogoutConfirm(false); handleLogout(); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.3)]">Sí, Salir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveModal && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 p-8 rounded-2xl border border-slate-700/30 shadow-2xl text-center max-w-sm w-full">
              <h3 className="text-2xl font-bold mb-2 text-slate-200 uppercase tracking-wider">💾 Guardar Mazo</h3>
              <p className="text-slate-400 mb-6 text-xs">Asigna un nombre para identificar tu mazo guardado.</p>
              <input
                type="text"
                required
                maxLength={25}
                placeholder="Nombre del Mazo"
                value={deckNameInput}
                onChange={(e) => setDeckNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-slate-700 text-center font-bold text-white mb-6"
              />
              <div className="flex space-x-4">
                <button onClick={() => setShowSaveModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all cursor-pointer text-xs uppercase tracking-widest">Cancelar</button>
                <button 
                  onClick={() => {
                    if (deckNameInput.trim()) {
                      socket?.emit('saveDeck', deckNameInput.trim(), selectedCards);
                      setShowSaveModal(false);
                    }
                  }} 
                  disabled={!deckNameInput.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white py-3 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:shadow-none text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoadModal && (
          <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-slate-800 p-8 rounded-2xl border border-slate-700/30 shadow-2xl text-center max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">
              
              {confirmDeckToLoad ? (
                <div className="py-4">
                  <h3 className="text-2xl font-bold mb-4 text-slate-200 uppercase tracking-wider">🎮 ¿Confirmar Mazo?</h3>
                  <p className="text-slate-300 mb-8 text-sm">
                    ¿Quieres jugar con el mazo <strong className="text-purple-400">"{confirmDeckToLoad.name}"</strong>? ({confirmDeckToLoad.cards.length} cartas)
                  </p>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setConfirmDeckToLoad(null)} 
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all cursor-pointer text-xs uppercase tracking-widest"
                    >
                      No, Volver
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCards(confirmDeckToLoad.cards);
                        socket?.emit('selectDeck', confirmDeckToLoad.cards);
                        setShowLoadModal(false);
                        setConfirmDeckToLoad(null);
                      }} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs uppercase tracking-widest"
                    >
                      Sí, Jugar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-2 text-slate-200 uppercase tracking-wider flex items-center justify-center space-x-2">
                    <span>📂 Cargar Mazo</span>
                  </h3>
                  <p className="text-slate-400 mb-6 text-xs">Selecciona uno de tus mazos guardados anteriormente.</p>
                  
                  <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6 min-h-[150px]">
                    {userProfile?.savedDecks && userProfile.savedDecks.length > 0 ? (
                      userProfile.savedDecks.map((deck: any, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => setConfirmDeckToLoad(deck)}
                          className="p-4 bg-slate-900/60 border border-slate-700/40 rounded-xl flex items-center justify-between hover:bg-purple-950/20 hover:border-purple-500/40 transition-all cursor-pointer group"
                        >
                          <div className="text-left">
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{deck.name}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{deck.cards.length} cartas</p>
                          </div>
                          <span className="text-slate-500 group-hover:text-purple-400 transition-colors text-lg">➔</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-600 italic border border-dashed border-slate-700/50 rounded-xl">
                        <span>No tienes mazos registrados.</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowLoadModal(false)} 
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3.5 rounded-lg font-bold transition-all cursor-pointer text-xs uppercase tracking-widest"
                  >
                    Salir y construir manualmente
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}



function GameCardContent({ card, isOpponent, defensePercentage = 100, isTakingDamage = false, className = "", onPreview, isExpanded = false }: any) {
  const [imgError, setImgError] = useState(false);
  // Mock rarity mapping based on name length to match the visual variety in the image
  const nameLen = card.name?.length || 0;
  const rarityStr = card.rarity || (nameLen > 15 ? 'SR' : nameLen > 10 ? 'R' : nameLen > 6 ? 'UC' : 'C');
  
  let borderColor = 'border-slate-500';
  let textColor = 'text-slate-300';
  if (rarityStr === 'SR') { borderColor = 'border-blue-500'; textColor = 'text-blue-300'; }
  else if (rarityStr === 'R') { borderColor = 'border-green-500'; textColor = 'text-green-400'; }
  else if (rarityStr === 'C') { borderColor = 'border-amber-700'; textColor = 'text-amber-500'; }

  return (
    <div 
      className={`w-full h-full rounded-xl border-[6px] ${borderColor} bg-[#0a0f1d] flex flex-col overflow-hidden relative group cursor-pointer ${className} ${isOpponent ? 'opacity-90' : ''}`}
    >
      {/* Inner thin grey border */}
      <div className="absolute inset-0.5 rounded-lg border border-slate-600/60 pointer-events-none z-20"></div>

      {/* Header */}
      <div className={`flex items-center justify-between ${isExpanded ? 'px-4 py-3' : 'px-3 py-1.5'} z-10 border-b border-slate-800/50`}>
        <div className="flex items-center gap-2 truncate max-w-[65%]">
          <span className={`flex items-center justify-center font-bold ${isExpanded ? 'text-xl' : ''}`}>
            {card.type === 'MONSTER' ? (
              <img src="/symbols/monster.png" className={`${isExpanded ? 'w-6 h-6' : 'w-4 h-4'} object-contain`} alt="Monstruo" />
            ) : ['s11', 's13', 's16', 's19', 's22'].includes(card.id) ? (
              <span className={isExpanded ? 'text-[20px]' : 'text-[14px]'}>⚠️</span>
            ) : (
              <img src="/symbols/spell.png" className={`${isExpanded ? 'w-6 h-6' : 'w-4 h-4'} object-contain`} alt="Hechizo" />
            )}
          </span>
          <span className={`${isExpanded ? 'text-lg' : 'text-[10px]'} font-serif font-bold text-slate-200 truncate`}>{card.name}</span>
        </div>
        <div className="flex items-center gap-0.5 z-20">
          {getCardCareers(card.area).map(career => (
            <img 
              key={career}
              src={`/symbols/${career}.png`} 
              alt={career} 
              className={`${isExpanded ? 'w-5 h-5' : 'w-3.5 h-3.5'} object-contain filter drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]`}
            />
          ))}
        </div>
      </div>

      {/* Main Image Box */}
      <div className="mx-1.5 mt-1.5 bg-[#1c2438] h-[45%] rounded flex items-center justify-center relative overflow-hidden z-10 border-t border-slate-600/30 shadow-inner group/image">
        {!imgError ? (
          <img 
            src={`/cards/${card.name}.jpg`} 
            alt={card.name} 
            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover/image:scale-110" 
            onError={() => setImgError(true)} 
          />
        ) : (
          <>
            {/* Giant faint University Logo */}
            <img 
              src="/symbols/logo_universidad.png" 
              alt="Logo Universidad" 
              className={`${isExpanded ? 'w-48 h-48' : 'w-24 h-24'} opacity-15 absolute select-none pointer-events-none object-contain`} 
            />
            
            {/* Card Name Centered */}
            <p className={`text-center ${isExpanded ? 'text-2xl' : 'text-xs'} font-serif font-bold text-slate-200 z-10 px-2 drop-shadow-md`}>
              {card.name}
            </p>
          </>
        )}

        {onPreview && !isExpanded && (
          <div 
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="absolute bottom-1 left-1 w-6 h-6 flex items-center justify-center cursor-pointer z-50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 bg-[#0a0f1d]/90 rounded-full p-1 border border-blue-500/50 shadow-lg">
            <img src="/symbols/lupa.png" alt="Ampliar" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Description & Academic Info Text */}
      <div className={`${isExpanded ? 'px-4 py-3' : 'px-2 py-1.5'} flex-grow z-10 overflow-hidden flex flex-col`}>
        {/* Career & Subject Section */}
        {(card.area || (card as any).academicMetadata?.academicConcept) && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {card.area && (
              <span className={`bg-emerald-900/60 border border-emerald-700 text-emerald-300 ${isExpanded ? 'text-[10px] px-2 py-1' : 'text-[6px] px-1.5 py-0.5'} font-bold rounded-sm uppercase tracking-wider shadow-sm`}>
                🎓 {card.area}
              </span>
            )}
            {(card as any).academicMetadata?.academicConcept && (
              <span className={`bg-blue-900/60 border border-blue-700 text-blue-300 ${isExpanded ? 'text-[10px] px-2 py-1' : 'text-[6px] px-1.5 py-0.5'} font-bold rounded-sm uppercase tracking-wider shadow-sm flex items-center gap-1`}>
                <img src="/symbols/concepto.png" className={`${isExpanded ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} object-contain`} alt="" />
                {(card as any).academicMetadata?.academicConcept}
              </span>
            )}
          </div>
        )}
        
        <div className="flex-grow flex flex-col">
          <p className={`${isExpanded ? 'text-[14px] leading-snug line-clamp-none overflow-y-auto custom-scrollbar' : 'text-[7.5px] leading-tight line-clamp-5'} text-slate-300 font-serif text-justify`}>
            {card.description}
          </p>
          {(card as any).academicMetadata?.academicConcept && (
            <div className={`mt-auto pt-1 border-t border-slate-700/50 ${isExpanded ? 'mt-4 pt-3' : ''}`}>
              <p className={`${isExpanded ? 'text-[12px]' : 'text-[6.5px]'} text-blue-300/90 italic font-serif leading-tight`}>
                <span className="font-bold">Concepto:</span> {(card as any).academicMetadata?.academicConcept}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bottom */}
      {card.type === 'MONSTER' ? (
        <div className={`flex w-full ${isExpanded ? 'h-[12%] min-h-[50px]' : 'h-[15%] min-h-[36px]'} border-t border-slate-800 z-10 mt-auto bg-black/80`}>
          <div className="flex-1 border-r border-slate-800 flex flex-col items-center justify-center">
            <span className={`${isExpanded ? 'text-[12px]' : 'text-[7px]'} font-bold text-red-600 drop-shadow-[0_0_2px_rgba(220,38,38,0.8)] tracking-widest`}>ATK</span>
            <span className={`${isExpanded ? 'text-3xl mt-1' : 'text-base mt-0.5'} font-serif font-bold text-white drop-shadow-[0_0_4px_rgba(220,38,38,0.5)] leading-none`}>{card.attack}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Health Bar overlay */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/50 transition-all duration-300" style={{ width: `${defensePercentage}%` }}></div>
            <span className={`${isExpanded ? 'text-[12px]' : 'text-[7px]'} font-bold text-blue-500 drop-shadow-[0_0_2px_rgba(59,130,246,0.8)] tracking-widest`}>DEF</span>
            <span className={`${isExpanded ? 'text-3xl mt-1' : 'text-base mt-0.5'} font-serif font-bold text-white drop-shadow-[0_0_4px_rgba(59,130,246,0.5)] leading-none`}><AnimatedNumber value={card.defense} /></span>
          </div>
        </div>
      ) : (
        <div className={`flex w-full ${isExpanded ? 'h-[12%] min-h-[50px]' : 'h-[15%] min-h-[36px]'} border-t border-slate-800 z-10 mt-auto bg-black/80 items-center justify-center`}>
          <span className={`${isExpanded ? 'text-[12px]' : 'text-[9px]'} font-bold text-emerald-500 drop-shadow-[0_0_2px_rgba(16,185,129,0.8)] tracking-widest mr-2`}>COSTE</span>
          <span className={`${isExpanded ? 'text-3xl' : 'text-base'} font-serif font-bold text-white drop-shadow-[0_0_4px_rgba(16,185,129,0.5)] leading-none`}>{card.energyCost}⚡</span>
        </div>
      )}
    </div>
  );
}

function MonsterCardDisplay({ monster, isOpponent = false, isAttacking = false, isTakingDamage = false, damageAmount, isDestroyed = false, onPreview }: any) {
  const originalMonster = MONSTERS.find(m => m.id === monster.id);
  const maxDefense = originalMonster ? originalMonster.defense : monster.defense;
  const defensePercentage = Math.max(0, Math.min(100, (monster.defense / maxDefense) * 100));

  const [isPresent, safeToRemove] = usePresence();

  const isVortex = monster.activeEffects?.includes('VORTEX_ELIMINATION');
  const isAcid = monster.activeEffects?.includes('ACID_MELTING');

  if (!isPresent) {
    if (isVortex) {
      return <motion.div animate={{ opacity: 0 }} transition={{ duration: 0 }} onAnimationComplete={safeToRemove} className="hidden" />;
    }
    if (isAcid) {
      return (
        <div className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 z-30 pointer-events-none">
          <motion.div initial={{ opacity: 1, scaleY: 1, y: 0, filter: 'drop-shadow(0 0 15px #22c55e)' }} animate={{ opacity: 0, scaleY: 0, y: 120, filter: 'drop-shadow(0 0 30px #22c55e) blur(4px) contrast(150%)' }} transition={{ duration: 1.5, ease: 'easeIn' }} onAnimationComplete={safeToRemove} className="absolute inset-0 origin-bottom">
            <GameCardContent card={monster} isOpponent={isOpponent} defensePercentage={defensePercentage} isTakingDamage={false} />
          </motion.div>
        </div>
      );
    }
    
    // Normal Destruction animation
    return (
      <div className="relative w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 z-30 pointer-events-none">
        <motion.div initial={{ x: 0, y: 0, opacity: 1, filter: 'grayscale(0%) blur(0px)' }} animate={{ x: -40, y: -40, opacity: 0, filter: 'grayscale(100%) blur(10px)', rotate: -15, scale: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 60%)' }} className="absolute inset-0" onAnimationComplete={safeToRemove}>
          <GameCardContent card={monster} isOpponent={isOpponent} defensePercentage={defensePercentage} isTakingDamage={false} />
        </motion.div>
        <motion.div initial={{ x: 0, y: 0, opacity: 1, filter: 'grayscale(0%) blur(0px)' }} animate={{ x: 40, y: 40, opacity: 0, filter: 'grayscale(100%) blur(10px)', rotate: 15, scale: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} style={{ clipPath: 'polygon(0 60%, 100% 40%, 100% 100%, 0 100%)' }} className="absolute inset-0">
          <GameCardContent card={monster} isOpponent={isOpponent} defensePercentage={defensePercentage} isTakingDamage={false} />
        </motion.div>
        {/* Particle dust effect */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div key={i} initial={{ x: 0, y: 0, opacity: 1, scale: Math.random() * 1.5 + 0.5 }} animate={{ x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, opacity: 0, scale: 0 }} transition={{ duration: 0.8 + Math.random() * 0.8, ease: 'easeOut' }} className="absolute top-1/2 left-1/2 w-3 h-3 bg-slate-200 rounded-full shadow-[0_0_20px_white]" />
        ))}
        <motion.div initial={{ scale: 0, opacity: 1, rotate: -15 }} animate={{ scale: [1, 2], opacity: [1, 0] }} transition={{ duration: 0.4, ease: 'easeOut' }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
           <div className="w-[200%] h-2 bg-white shadow-[0_0_30px_white]" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      id={monster.instanceId}
      layoutId={monster.instanceId}
      animate={{ 
        y: isAttacking ? (isOpponent ? [-15, 60, 0] : [15, -60, 0]) : 0, 
        scale: isAttacking ? [1, 1.1, 1] : 1,
        x: isTakingDamage ? [0, -12, 12, -10, 10, -8, 8, 0] : 0,
        filter: isTakingDamage ? ['brightness(1)', 'brightness(2) drop-shadow(0 0 30px red)', 'brightness(1)'] : 'brightness(1)'
      }}
      transition={{ 
        layout: { type: 'spring', stiffness: 250, damping: 20 },
        y: isAttacking ? { duration: 0.6, times: [0, 0.4, 1], ease: ["easeOut", "easeIn", "easeOut"] } : { type: 'spring', stiffness: 400, damping: 25 },
        scale: isAttacking ? { duration: 0.6, times: [0, 0.4, 1] } : { type: 'spring', stiffness: 400, damping: 25 },
        x: { duration: 0.5 }, 
        filter: { duration: 0.5 }
      }}
      className={`relative z-20 w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52 ${isTakingDamage ? 'bg-red-950 rounded-xl' : ''}`}
    >
      <AnimatePresence>
        {isTakingDamage && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }} transition={{ duration: 0.5, ease: 'easeOut' }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]">X</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isTakingDamage && damageAmount !== undefined && (
          <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -40, scale: 1.5 }} exit={{ opacity: 0, y: -60, scale: 1 }} transition={{ duration: 0.8 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="text-5xl font-black text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,1)]" style={{ WebkitTextStroke: '2px black' }}>-{damageAmount}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {isVortex && (
        <motion.div initial={{ scale: 0, opacity: 0, rotate: -180 }} animate={{ scale: [0, 2, 0], opacity: [0, 1, 1, 0], rotate: [0, 180, 360, 540] }} transition={{ duration: 1.5, ease: 'easeInOut' }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
           <div className="w-[140px] h-[140px] rounded-full blur-xl opacity-90" style={{ background: 'conic-gradient(from 0deg, #1e1b4b, #a855f7, #000, #1e1b4b, #a855f7, #000)' }} />
           <div className="absolute inset-0 w-[140px] h-[140px] rounded-full blur-md opacity-100 animate-pulse" style={{ background: 'radial-gradient(circle, transparent 30%, #581c87 70%, #000 100%)' }} />
        </motion.div>
      )}
      {isAcid && (
        <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: [0, 1, 0.8], scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
           <span className="text-7xl drop-shadow-[0_0_20px_#22c55e]">☠️</span>
        </motion.div>
      )}
      <GameCardContent card={monster} isOpponent={isOpponent} defensePercentage={defensePercentage} isTakingDamage={isTakingDamage} onPreview={onPreview} />
    </motion.div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#14b8a6'][Math.floor(Math.random() * 7)],
    size: 6 + Math.random() * 8
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -50, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '120vh', rotate: 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "linear", repeat: Infinity }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            top: 0
          }}
        />
      ))}
    </div>
  );
}

function BloodEffect() {
  const pieces = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 0.5 + Math.random() * 1,
    size: 2 + Math.random() * 15
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-multiply">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: `${p.y - 10}vh`, x: `${p.x}vw`, scale: 0, opacity: 1, borderRadius: '50%' }}
          animate={{ y: `${p.y + 20}vh`, scale: [0, 1, 0.8], opacity: [1, 0.8, 0], scaleY: [1, 2, 3] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: '#7f1d1d',
            filter: 'blur(1px)'
          }}
        />
      ))}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.3 }} 
        transition={{ duration: 1 }} 
        className="absolute inset-0 bg-red-950 pointer-events-none" 
      />
    </div>
  );
}

function SpellEffectOverlay({ spellId }: { spellId: string }) {
  const effectMap: Record<string, string> = {
    s1: '⚡', s2: '🛡️', s3: '🏰', s4: '🌧️', s5: '🌀', s6: '💥', s7: '🌫️',
    s8: '🛢️', s9: '🔗', s10: '📉', s11: '🧱', s12: '🧠', s13: '🔙',
    s14: '🔄', s15: '📚', s16: '😵', s17: '🤝', s18: '🔥', s19: '❤️‍🩹',
    s20: '📊', s21: '🏃', s22: '🥵', s23: '🤸'
  };
  const emoji = effectMap[spellId] || '✨';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0, rotate: -180 }} 
      animate={{ opacity: [0, 1, 1, 0], scale: [0, 2, 2, 3], rotate: 0 }} 
      transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }} 
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
    >
       <div className="text-[15rem] filter drop-shadow-[0_0_50px_rgba(168,85,247,0.8)]">{emoji}</div>
    </motion.div>
  );
}

function LightningStorm() {
  const [lightning, setLightning] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    const triggerStrike = () => {
      const x1 = 100 + Math.random() * (window.innerWidth - 200);
      const y1 = 0;
      const x2 = x1 + (Math.random() - 0.5) * 200;
      const y2 = window.innerHeight * 0.7;

      let path = `M ${x1} ${y1}`;
      let cx = x1;
      let cy = y1;
      const segments = 6 + Math.floor(Math.random() * 4);
      const dx = (x2 - x1) / segments;
      const dy = (y2 - y1) / segments;
      for (let i = 1; i < segments; i++) {
        cx += dx + (Math.random() - 0.5) * 50;
        cy += dy + (Math.random() - 0.5) * 15;
        path += ` L ${cx} ${cy}`;
      }
      path += ` L ${x2} ${y2}`;

      setLightning(path);
      setFlashActive(true);

      setTimeout(() => setFlashActive(false), 200);
      setTimeout(() => setLightning(null), 500);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.45) {
        triggerStrike();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.2, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-cyan-200/35 mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      {lightning && (
        <svg className="absolute inset-0 w-full h-full text-cyan-300 pointer-events-none" style={{ filter: 'drop-shadow(0 0 12px rgba(103,232,249,0.85)) drop-shadow(0 0 25px rgba(6,182,212,0.6))' }}>
          <motion.path
            d={lightning}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 0.8, 1, 0] }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </svg>
      )}
    </div>
  );
}

function AttackAnimationOverlay({ animatingCard, gameState, playerId }: { animatingCard: any, gameState: GameState | null, playerId: string | null }) {
  const [coords, setCoords] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  useEffect(() => {
    if (!animatingCard || !gameState) return;

    const timer = setTimeout(() => {
      const attackerEl = document.getElementById(animatingCard.id);
      
      const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
      let targetId = animatingCard.targetId;
      if (targetId === opponentId) {
        targetId = 'avatar-opponent';
      } else if (targetId === playerId) {
        targetId = 'avatar-my';
      }
      
      const targetEl = document.getElementById(targetId);

      if (attackerEl && targetEl) {
        const rectA = attackerEl.getBoundingClientRect();
        const rectT = targetEl.getBoundingClientRect();
        setCoords({
          x1: rectA.left + rectA.width / 2,
          y1: rectA.top + rectA.height / 2,
          x2: rectT.left + rectT.width / 2,
          y2: rectT.top + rectT.height / 2
        });
      } else {
        setCoords({
          x1: window.innerWidth / 2,
          y1: window.innerHeight / 2 + 100,
          x2: window.innerWidth / 2,
          y2: window.innerHeight / 2 - 100
        });
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [animatingCard, gameState, playerId]);

  if (!coords) return null;

  let attackerMonsterId = '';
  if (gameState) {
    for (const player of Object.values(gameState.players)) {
      const found = player.monsterZone.find(m => m && m.instanceId === animatingCard.id);
      if (found) {
        attackerMonsterId = found.id;
        break;
      }
    }
  }

  if (!attackerMonsterId) {
    attackerMonsterId = 'm1';
  }

  const { x1, y1, x2, y2 } = coords;
  const distanceX = x2 - x1;
  const distanceY = y2 - y1;
  const angle = Math.atan2(distanceY, distanceX) * (180 / Math.PI);

  switch (attackerMonsterId) {
    case 'm1': // Dragón de Datos
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, scale: 0.5, rotate: 0 }}
            animate={{ left: [x1, x2], top: [y1, y2], scale: [0.5, 1.2, 1], rotate: 360 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-emerald-500 border-2 border-emerald-400 shadow-[0_0_15px_#10b981] flex flex-wrap p-0.5 rounded-none relative">
              <div className="w-2.5 h-2.5 bg-yellow-300 mr-0.5 mb-0.5 animate-pulse" />
              <div className="w-2.5 h-2.5 bg-emerald-300 mb-0.5 animate-ping" />
              <div className="w-2.5 h-2.5 bg-green-400 mr-0.5" />
              <div className="w-2.5 h-2.5 bg-emerald-600" />
              <div className="absolute right-7 top-1 w-2 h-2 bg-emerald-500 opacity-80" />
              <div className="absolute -right-3 bottom-1 w-2.5 h-2.5 bg-green-400 opacity-60" />
            </div>
          </motion.div>
          <motion.div
            initial={{ left: x2, top: y2, scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2.5], opacity: [1, 0] }}
            transition={{ duration: 0.4, delay: 0.48 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center"
          >
            <div className="grid grid-cols-3 gap-1.5 w-full h-full">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-full h-full bg-emerald-400 border border-green-300 shadow-[0_0_5px_#10b981]" />
              ))}
            </div>
          </motion.div>
        </div>
      );

    case 'm2': // Caballero de Acero
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x2, top: y2 - 60, rotate: -45, scale: 0.8, opacity: 0 }}
            animate={{ rotate: [-45, 45], scale: [0.8, 1.4, 1.2], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.5, times: [0, 0.3, 0.7, 1] }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-36 origin-bottom flex flex-col items-center"
          >
            <div className="w-4 h-28 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-t-lg border-x border-t border-slate-50 relative shadow-[0_0_20px_rgba(255,255,255,0.7)]">
              <div className="absolute left-1.5 top-0 w-0.5 h-full bg-white opacity-60" />
            </div>
            <div className="w-14 h-3 bg-amber-500 border border-amber-600 rounded" />
            <div className="w-2.5 h-8 bg-amber-950 rounded-b" />
          </motion.div>
          <motion.div
            initial={{ left: x2 - 80, top: y2 - 20, width: 0, opacity: 1 }}
            animate={{ width: [0, 160], opacity: [1, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ rotate: '25deg' }}
            className="absolute h-1.5 bg-white shadow-[0_0_15px_white] rounded-full"
          />
        </div>
      );

    case 'm3': // Mago Tormenta
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.2, 0.7, 0] }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-blue-400/20 mix-blend-overlay"
          />
          <svg className="absolute inset-0 w-full h-full text-blue-400" style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.8))' }}>
            <motion.path
              d={`M ${x1} ${y1} L ${(x1+x2)/2 + (Math.random()-0.5)*60} ${(y1+y2)/2 + (Math.random()-0.5)*40} L ${x2} ${y2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1], opacity: [1, 0.8, 1, 0] }}
              transition={{ duration: 0.45 }}
            />
            <motion.path
              d={`M ${x1+20} ${y1-10} L ${(x1+x2)/2 - 30} ${(y1+y2)/2} L ${x2} ${y2}`}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1], opacity: [1, 0] }}
              transition={{ duration: 0.4, delay: 0.05 }}
            />
          </svg>
          {[...Array(6)].map((_, i) => {
            const dx = (Math.random() - 0.5) * 80;
            const dy = (Math.random() - 0.5) * 80;
            return (
              <motion.div
                key={i}
                initial={{ left: x2, top: y2, scale: 0, opacity: 1 }}
                animate={{ left: x2 + dx, top: y2 + dy, scale: [0, 1.5, 0], opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="absolute w-2 h-2 bg-blue-300 rounded-full shadow-[0_0_8px_#3b82f6]"
              />
            );
          })}
        </div>
      );

    case 'm4': // Gólem de Concreto
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x2, top: y2 - 120, scale: 1.8, opacity: 0 }}
            animate={{ top: [y2 - 120, y2], scale: [1.8, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.5, times: [0, 0.4, 0.8, 1], ease: 'easeIn' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center text-6xl drop-shadow-[0_0_15px_black]"
          >
            ✊
          </motion.div>
          <motion.div
            initial={{ left: x2, top: y2, scale: 0, opacity: 1, border: '2px solid rgba(120,113,108,0.8)' }}
            animate={{ scale: [0, 2.5], opacity: [1, 0] }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full"
          />
          {[...Array(8)].map((_, i) => {
            const rx = (Math.random() - 0.5) * 120;
            const ry = (Math.random() - 0.5) * 80 - 40;
            return (
              <motion.div
                key={i}
                initial={{ left: x2, top: y2, scale: 1 }}
                animate={{ left: x2 + rx, top: y2 + ry, y: [0, -60, 40], scale: 0, rotate: 360 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="absolute w-3.5 h-3 bg-stone-600 border border-stone-800 rounded"
              />
            );
          })}
        </div>
      );

    case 'm5': // Limo Tóxico
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, scale: 0.6 }}
            animate={{ left: [x1, x2], top: [y1, y2], scale: [0.6, 1.2, 0.8] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-green-500 rounded-full blur-[1px] border border-green-400 shadow-[0_0_12px_#22c55e]"
          />
          {[...Array(10)].map((_, i) => {
            const vx = (Math.random() - 0.5) * 90;
            const vy = (Math.random() - 0.5) * 90;
            return (
              <motion.div
                key={i}
                initial={{ left: x2, top: y2, scale: 1.2, opacity: 1 }}
                animate={{ left: x2 + vx, top: y2 + vy, scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute w-3 h-3 bg-green-400 rounded-full blur-[0.5px]"
              />
            );
          })}
        </div>
      );

    case 'm6': // Espectro de Red
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1.5, 0] }}
              transition={{ duration: 0.6 }}
              className="w-1.5 h-screen bg-emerald-500/50 blur-[2px]"
              style={{ left: x2, position: 'absolute' }}
            />
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 0.8, 0], scaleX: [0, 1.5, 0] }}
              transition={{ duration: 0.6 }}
              className="h-1.5 w-screen bg-emerald-500/50 blur-[2px]"
              style={{ top: y2, position: 'absolute' }}
            />
          </div>
          {[...Array(5)].map((_, col) => {
            const cx = x2 + (col - 2) * 22;
            return (
              <div key={col} className="absolute flex flex-col font-mono text-[10px] text-emerald-400 font-bold" style={{ left: cx, top: y2 - 80 }}>
                {[...Array(6)].map((_, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: [0, 1, 0], y: 120 }}
                    transition={{ duration: 0.55, delay: col * 0.05 + idx * 0.04 }}
                  >
                    {Math.random() > 0.5 ? '1' : '0'}
                  </motion.span>
                ))}
              </div>
            );
          })}
        </div>
      );

    case 'm7': // Bestia de Asfalto
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, opacity: 0 }}
            animate={{ left: [x1, x2], top: [y1, y2], opacity: [0, 0.9, 0.2] }}
            transition={{ duration: 0.45, ease: 'easeIn' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-8 bg-slate-900 border border-slate-700 rounded-lg flex flex-col items-center justify-center shadow-lg"
          >
            <div className="w-full h-1 bg-gradient-to-r from-red-500 to-amber-500 animate-pulse" />
          </motion.div>
          <svg className="absolute inset-0 w-full h-full text-zinc-950/70" style={{ strokeWidth: 5, strokeDasharray: '4,4' }}>
            <motion.line
              x1={x1} y1={y1} x2={x2} y2={y2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [0.8, 0.8, 0] }}
              transition={{ duration: 0.6 }}
            />
          </svg>
          <motion.div
            initial={{ left: x2, top: y2, scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.8, 2.2], opacity: [1, 1, 0] }}
            transition={{ duration: 0.45, delay: 0.35 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            🔥
          </motion.div>
        </div>
      );

    case 'm8': // Leviatán de Nubes
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, scale: 0.4, rotate: 0 }}
            animate={{ left: [x1, x2], top: [y1, y2], scale: [0.4, 1.6, 1], rotate: 720 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center text-4xl filter drop-shadow-[0_0_10px_white]"
          >
            🌀
          </motion.div>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ left: x2, top: y2, scaleX: 0, opacity: 1, rotate: i * 60 }}
              animate={{ scaleX: [0, 1.8], opacity: [1, 0] }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="absolute w-24 h-0.5 bg-cyan-200 blur-[0.5px]"
            />
          ))}
        </div>
      );

    case 'm9': // Titán de Cristal
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <svg className="absolute inset-0 w-full h-full">
            <motion.line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="white"
              strokeWidth="4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [1, 1, 0] }}
              transition={{ duration: 0.4 }}
              style={{ filter: 'drop-shadow(0 0 8px white)' }}
            />
            <motion.line
              x1={x2} y1={y2} x2={x2 + (Math.random()-0.5)*100} y2={y2 + (Math.random()-0.5)*100}
              stroke="#ef4444"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [1, 0] }}
              transition={{ duration: 0.4, delay: 0.3 }}
            />
            <motion.line
              x1={x2} y1={y2} x2={x2 + (Math.random()-0.5)*100} y2={y2 + (Math.random()-0.5)*100}
              stroke="#10b981"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [1, 0] }}
              transition={{ duration: 0.4, delay: 0.3 }}
            />
            <motion.line
              x1={x2} y1={y2} x2={x2 + (Math.random()-0.5)*100} y2={y2 + (Math.random()-0.5)*100}
              stroke="#3b82f6"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [1, 0] }}
              transition={{ duration: 0.4, delay: 0.3 }}
            />
          </svg>
        </div>
      );

    case 'm10': // Guardián del Pozo
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x2, top: y2 + 80, height: 0, opacity: 0.9 }}
            animate={{ top: y2 - 40, height: 120, opacity: [0.9, 0.9, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 w-8 bg-zinc-950 rounded-full blur-[2px]"
          />
          <motion.div
            initial={{ left: x2, top: y2 + 10, scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2.2, 1.8], opacity: [1, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-5xl"
          >
            🔥💥
          </motion.div>
        </div>
      );

    case 'm13': // Predicado Universal
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, scale: 0.5, rotate: 0 }}
            animate={{ left: [x1, x2], top: [y1, y2], scale: [0.5, 2, 1.5], rotate: 360 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-purple-400 font-bold text-5xl font-mono filter drop-shadow-[0_0_10px_purple]"
          >
            ∀
          </motion.div>
          <motion.div
            initial={{ left: x1 - 30, top: y1 + 10, scale: 0.4, rotate: 0 }}
            animate={{ left: [x1 - 30, x2 - 20], top: [y1 + 10, y2 - 20], scale: [0.4, 1.8, 1.2], rotate: -360 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-cyan-400 font-bold text-4xl font-mono filter drop-shadow-[0_0_10px_cyan]"
          >
            ∃
          </motion.div>
        </div>
      );

    case 'm14': // Tautología
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x2, top: y2, scale: 0.2, opacity: 1 }}
            animate={{ scale: [0.2, 2.5], opacity: [1, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-r from-amber-400/40 to-yellow-300/40 border border-yellow-400/80 shadow-[0_0_30px_#fbbf24]"
          />
          {[...Array(5)].map((_, i) => {
            const rx = (Math.random() - 0.5) * 140;
            const ry = (Math.random() - 0.5) * 140;
            return (
              <motion.div
                key={i}
                initial={{ left: x2, top: y2, scale: 0.5, opacity: 1 }}
                animate={{ left: x2 + rx, top: y2 + ry, scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-yellow-300 font-black text-2xl font-mono"
              >
                T
              </motion.div>
            );
          })}
        </div>
      );

    case 'm15': // Orador Persuasivo
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ left: x1, top: y1, scale: 0.1, opacity: 0.9 }}
              animate={{ left: [x1, x2], top: [y1, y2], scale: [0.1, 1.8], opacity: [0.9, 0] }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-indigo-400/80 rounded-full flex items-center justify-center font-bold text-indigo-300"
            >
              💬
            </motion.div>
          ))}
        </div>
      );

    case 'm16': // Sujeto Tácito
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, opacity: 0.8, scale: 1 }}
            animate={{ left: [x1, x2, x2 + 40], top: [y1, y2, y2 + 10], opacity: [0.8, 0.8, 0] }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-20 bg-indigo-950 border border-purple-900/60 rounded-xl blur-[1.5px]"
          />
          <motion.div
            initial={{ left: x2 - 50, top: y2 - 40, width: 0, opacity: 1 }}
            animate={{ width: [0, 100], opacity: [1, 0] }}
            transition={{ duration: 0.35, delay: 0.25 }}
            style={{ rotate: '-35deg' }}
            className="absolute h-1 bg-purple-600 shadow-[0_0_15px_#a855f7]"
          />
        </div>
      );

    case 'm17': // Visión de Vida
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1 - 40, scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.5, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.2, 0.8, 1] }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            👁️
          </motion.div>
          <svg className="absolute inset-0 w-full h-full">
            <motion.line
              x1={x1} y1={y1 - 40} x2={x2} y2={y2}
              stroke="#c084fc"
              strokeWidth="5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ filter: 'drop-shadow(0 0 10px #c084fc)' }}
            />
          </svg>
        </div>
      );

    case 'm18': // Buscador de Metas
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, rotate: angle }}
            animate={{ left: [x1, x2], top: [y1, y2] }}
            transition={{ duration: 0.45, ease: 'easeIn' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl"
          >
            🏹
          </motion.div>
          <motion.div
            initial={{ left: x2, top: y2, scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.8, 1.8, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
          >
            🎯
          </motion.div>
        </div>
      );

    case 'm19': // Coloso de la Fuerza
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x2, top: y2, scale: 0.1, opacity: 1 }}
            animate={{ scale: [0.1, 3.5], opacity: [1, 0] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-4 border-red-500 shadow-[0_0_40px_#ef4444] mix-blend-color-dodge"
          />
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ left: x2, top: y2, scale: 0.2, opacity: 0.8 }}
              animate={{ scale: [0.2, 2.5 + i * 0.5], opacity: [0.8, 0] }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-orange-400"
            />
          ))}
        </div>
      );

    case 'm20': // Velocista del Viento
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, opacity: 0.8, scaleX: 2 }}
            animate={{ left: [x1, x2, x1], top: [y1, y2, y1], opacity: [0.8, 0.8, 0] }}
            transition={{ duration: 0.48, ease: 'easeInOut' }}
            style={{ rotate: angle }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-4 bg-gradient-to-r from-cyan-400/80 via-blue-500 to-transparent blur-[1px] rounded"
          />
          <motion.div
            initial={{ left: x2, top: y2, scale: 0.1, opacity: 1 }}
            animate={{ scale: [0.1, 2.2], opacity: [1, 0] }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-cyan-400 blur-[0.5px]"
          />
        </div>
      );

    default:
      return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          <motion.div
            initial={{ left: x1, top: y1, scale: 0.5 }}
            animate={{ left: [x1, x2], top: [y1, y2], scale: [0.5, 1.2, 0.8] }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_#fbbf24]"
          />
          <motion.div
            initial={{ left: x2, top: y2, scale: 0, opacity: 1 }}
            animate={{ scale: [0, 2], opacity: [1, 0] }}
            transition={{ duration: 0.3, delay: 0.38 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-[0_0_15px_white]"
          />
        </div>
      );
  }
}

