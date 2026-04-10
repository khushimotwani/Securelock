import fs from 'fs';
import path from 'path';

export type LogEntry = {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'XSS_INJECTION' | 'PATH_TRAVERSAL' | 'SSRF' | 'SCANNER_DETECTED' | 'TEMPLATE_INJECTION' | 'HEADER_INJECTION' | 'XXE' | 'LDAP_INJECTION' | 'ENCODED_ATTACK' | 'SYSTEM_LOCKDOWN' | 'SYSTEM_HEALED' | 'NORMAL' | 'RATE_LIMIT_EXCEEDED' | 'IP_BANNED';
  message: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  pathId?: string;
  aiReasoning?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  // Geolocation for attack map
  country?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
};

type IPReputation = {
  score: number;
  attacks: number;
  lastAttack: number;
  firstSeen: number;
  banned: boolean;
  bannedAt?: number;
};

type StoreState = {
  logs: LogEntry[];
  globalFailCount: number;
  isGlobalLockdown: boolean;       // Only for DDoS-level events
  isSentinelActive: boolean;
  rateLimitTracker: Record<string, number[]>;
  ipReputation: Record<string, IPReputation>;
  globalLockdownTimestamp: number | null;
  totalAttacksBlocked: number;
  healCount: number;
  distinctAttackerIPs: string[];   // IPs that attacked in the current window
  ddosWindowStart: number | null;  // When the DDoS detection window started
  achievements: Achievement[];     // Unlocked achievements
};

const DB_PATH = path.join(process.cwd(), '.securelock-db.json');

// PER-IP THRESHOLDS
const IP_BAN_THRESHOLD = 3;             // Ban an IP after 3 attacks

// GLOBAL LOCKDOWN — ONLY FOR COORDINATED DDoS
const DDOS_ATTACKER_THRESHOLD = 10;     // 10+ distinct attacker IPs
const DDOS_ATTACK_THRESHOLD = 50;       // 50+ total attacks
const DDOS_WINDOW_MS = 60 * 1000;       // Within 1 minute window

// RATE LIMIT PARAMETERS
const RATE_LIMIT_WINDOW_MS = 10000;
const MAX_REQUESTS_PER_WINDOW = 15;
const TIGHT_RATE_LIMIT = 5;

// SELF-HEALING
const GLOBAL_LOCKDOWN_COOLDOWN_MS = 5 * 60 * 1000;  // 5 min for global lockdown
const IP_REPUTATION_DECAY_MS = 30 * 60 * 1000;

function getState(): StoreState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const state = JSON.parse(data);
      if (!state.ipReputation) state.ipReputation = {};
      if (!state.globalLockdownTimestamp) state.globalLockdownTimestamp = null;
      if (!state.totalAttacksBlocked) state.totalAttacksBlocked = 0;
      if (!state.healCount) state.healCount = 0;
      if (!state.distinctAttackerIPs) state.distinctAttackerIPs = [];
      if (!state.ddosWindowStart) state.ddosWindowStart = null;
      if (!state.achievements) state.achievements = [];
      if (state.isLocked !== undefined) {
        state.isGlobalLockdown = state.isLocked;
        delete state.isLocked;
      }
      if (!state.globalFailCount && state.failCount) {
        state.globalFailCount = state.failCount;
      }
      if (!state.globalFailCount) state.globalFailCount = 0;
      return state;
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return {
    logs: [], globalFailCount: 0, isGlobalLockdown: false, isSentinelActive: true,
    rateLimitTracker: {}, ipReputation: {}, globalLockdownTimestamp: null,
    totalAttacksBlocked: 0, healCount: 0, distinctAttackerIPs: [], ddosWindowStart: null,
    achievements: [],
  };
}

function saveState(state: StoreState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

class SecurityStore {

  // Self-heal for global lockdown only
  private checkAutoHeal(state: StoreState): StoreState {
    if (state.isGlobalLockdown && state.globalLockdownTimestamp) {
      const elapsed = Date.now() - state.globalLockdownTimestamp;
      if (elapsed >= GLOBAL_LOCKDOWN_COOLDOWN_MS) {
        state.isGlobalLockdown = false;
        state.globalFailCount = 0;
        state.globalLockdownTimestamp = null;
        state.healCount = (state.healCount || 0) + 1;
        state.distinctAttackerIPs = [];
        state.ddosWindowStart = null;
        state.logs.unshift({
          id: 'heal-' + Date.now(),
          type: 'SYSTEM_HEALED',
          message: `Global lockdown lifted after ${Math.round(GLOBAL_LOCKDOWN_COOLDOWN_MS / 60000)} min cooldown. Heal cycle #${state.healCount}. Individual IP bans remain active.`,
          timestamp: new Date().toISOString(),
          ip: 'SYSTEM',
          userAgent: 'Self-Heal Engine',
        });
        saveState(state);
      }
    }
    return state;
  }

  // -----------------------------------------------------------------------
  // PER-IP REPUTATION & BANNING
  // -----------------------------------------------------------------------
  updateReputation(ip: string, malicious: boolean): number {
    const state = getState();
    if (!state.ipReputation) state.ipReputation = {};

    const now = Date.now();
    if (!state.ipReputation[ip]) {
      state.ipReputation[ip] = { score: 0, attacks: 0, lastAttack: 0, firstSeen: now, banned: false };
    }

    const rep = state.ipReputation[ip];

    if (malicious) {
      const increment = Math.min(25 + (rep.attacks * 5), 50);
      rep.score = Math.min(rep.score + increment, 100);
      rep.attacks += 1;
      rep.lastAttack = now;

      // Per-IP ban: ban this specific IP after threshold
      if (rep.attacks >= IP_BAN_THRESHOLD && !rep.banned) {
        rep.banned = true;
        rep.bannedAt = now;
        state.logs.unshift({
          id: 'ban-' + Date.now(),
          type: 'IP_BANNED',
          message: `IP [${ip}] permanently banned after ${rep.attacks} attacks. Other users unaffected.`,
          timestamp: new Date().toISOString(),
          ip,
          userAgent: 'Per-IP Isolation Engine',
        });
      }
    } else {
      if (rep.lastAttack && (now - rep.lastAttack) > IP_REPUTATION_DECAY_MS) {
        rep.score = Math.max(rep.score - 10, 0);
      }
    }

    state.ipReputation[ip] = rep;
    saveState(state);
    return rep.score;
  }

  /** Check if a specific IP is banned */
  isBanned(ip: string): boolean {
    const state = getState();
    return state.ipReputation?.[ip]?.banned === true;
  }

  /** Check if global lockdown is active (DDoS only) */
  isGloballyLockedDown(): boolean {
    const state = getState();
    this.checkAutoHeal(state);
    return state.isGlobalLockdown;
  }

  /** Combined check: is this IP blocked? (either per-IP ban OR global lockdown) */
  isBlocked(ip: string): 'banned' | 'lockdown' | false {
    if (this.isBanned(ip)) return 'banned';
    if (this.isGloballyLockedDown()) return 'lockdown';
    return false;
  }

  // -----------------------------------------------------------------------
  // RATE LIMITING WITH PROGRESSIVE PENALTIES
  // -----------------------------------------------------------------------
  checkRateLimit(ip: string, userAgent: string): boolean {
    const state = getState();
    const now = Date.now();

    if (!state.rateLimitTracker) state.rateLimitTracker = {};
    if (!state.rateLimitTracker[ip]) state.rateLimitTracker[ip] = [];

    state.rateLimitTracker[ip] = state.rateLimitTracker[ip].filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    state.rateLimitTracker[ip].push(now);

    const rep = state.ipReputation?.[ip];
    const maxReqs = (rep && rep.attacks >= 3) ? TIGHT_RATE_LIMIT : MAX_REQUESTS_PER_WINDOW;

    if (state.rateLimitTracker[ip].length > maxReqs && state.isSentinelActive) {
      saveState(state);
      if (state.rateLimitTracker[ip].length === maxReqs + 1) {
        this.addLog({
          type: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for IP [${ip}]. Velocity: ${state.rateLimitTracker[ip].length} req/${RATE_LIMIT_WINDOW_MS / 1000}s.${rep && rep.attacks >= 3 ? ' (Progressive penalty)' : ''}`,
          ip,
          userAgent,
        });
      }
      return false;
    }

    saveState(state);
    return true;
  }

  // -----------------------------------------------------------------------
  // LOG & ATTACK TRACKING
  // -----------------------------------------------------------------------
  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>) {
    const state = getState();
    this.checkAutoHeal(state);

    const entry: LogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userAgent: log.userAgent || 'Unknown',
    };
    state.logs.unshift(entry);

    const attackTypes = ['SQL_INJECTION', 'COMMAND_INJECTION', 'XSS_INJECTION', 'PATH_TRAVERSAL', 'SSRF', 'TEMPLATE_INJECTION', 'HEADER_INJECTION', 'XXE', 'LDAP_INJECTION', 'ENCODED_ATTACK', 'SCANNER_DETECTED'];
    const isAttack = attackTypes.includes(log.type);

    if (isAttack) {
      state.globalFailCount += 1;
      state.totalAttacksBlocked = (state.totalAttacksBlocked || 0) + 1;

      // DDoS tracking: count distinct attacker IPs in the current window
      const now = Date.now();
      if (!state.ddosWindowStart || (now - state.ddosWindowStart) > DDOS_WINDOW_MS) {
        state.ddosWindowStart = now;
        state.distinctAttackerIPs = [];
      }
      if (!state.distinctAttackerIPs.includes(log.ip)) {
        state.distinctAttackerIPs.push(log.ip);
      }

      // Global lockdown ONLY for coordinated DDoS
      if (
        state.distinctAttackerIPs.length >= DDOS_ATTACKER_THRESHOLD &&
        state.globalFailCount >= DDOS_ATTACK_THRESHOLD &&
        !state.isGlobalLockdown
      ) {
        state.isGlobalLockdown = true;
        state.globalLockdownTimestamp = now;
        state.logs.unshift({
          id: 'lockdown-' + now,
          type: 'SYSTEM_LOCKDOWN',
          message: `GLOBAL LOCKDOWN: Coordinated DDoS detected. ${state.distinctAttackerIPs.length} attacker IPs, ${state.globalFailCount} attacks in ${DDOS_WINDOW_MS / 1000}s. Full site shutdown initiated. Auto-heal in ${GLOBAL_LOCKDOWN_COOLDOWN_MS / 60000} min.`,
          timestamp: new Date().toISOString(),
          ip: 'SYSTEM',
          userAgent: 'DDoS Defense Engine',
        });
      }
    }

    if (state.logs.length > 100) {
      state.logs = state.logs.slice(0, 100);
    }

    saveState(state);
  }

  // -----------------------------------------------------------------------
  // ACCESSORS
  // -----------------------------------------------------------------------
  getLogs() { return getState().logs; }
  getGlobalFailCount() { return getState().globalFailCount; }
  isDetectionActive() { return getState().isSentinelActive; }
  getTotalAttacksBlocked() { return getState().totalAttacksBlocked || 0; }
  getHealCount() { return getState().healCount || 0; }

  getBannedIPCount(): number {
    const state = getState();
    return Object.values(state.ipReputation || {}).filter(r => r.banned).length;
  }

  getFullStatus() {
    const state = getState();
    this.checkAutoHeal(state);
    return {
      isLockedDown: state.isGlobalLockdown,
      failCount: state.globalFailCount,
      isSentinelActive: state.isSentinelActive,
      logs: state.logs,
      totalAttacksBlocked: state.totalAttacksBlocked || 0,
      healCount: state.healCount || 0,
      lockdownTimestamp: state.globalLockdownTimestamp,
      cooldownMs: GLOBAL_LOCKDOWN_COOLDOWN_MS,
      bannedIPCount: this.getBannedIPCount(),
      distinctAttackerIPs: state.distinctAttackerIPs?.length || 0,
      ddosThreshold: DDOS_ATTACKER_THRESHOLD,
      ipBanThreshold: IP_BAN_THRESHOLD,
      achievements: state.achievements || [],
    };
  }

  unlockAchievement(id: string, title: string, description: string, icon: string) {
    const state = getState();
    if (!state.achievements) state.achievements = [];
    // Don't duplicate
    if (state.achievements.some(a => a.id === id)) return false;
    state.achievements.push({
      id,
      title,
      description,
      icon,
      unlockedAt: new Date().toISOString(),
    });
    saveState(state);
    return true;
  }

  getAchievements(): Achievement[] {
    return getState().achievements || [];
  }

  toggleSentinel() {
    const state = getState();
    state.isSentinelActive = !state.isSentinelActive;
    saveState(state);
    return state.isSentinelActive;
  }

  reset() {
    saveState({
      logs: [], globalFailCount: 0, isGlobalLockdown: false, isSentinelActive: true,
      rateLimitTracker: {}, ipReputation: {}, globalLockdownTimestamp: null,
      totalAttacksBlocked: 0, healCount: 0, distinctAttackerIPs: [], ddosWindowStart: null,
      achievements: [],
    });
  }
}

export const store = new SecurityStore();
