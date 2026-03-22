import fs from 'fs';
import path from 'path';

export type LogEntry = {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'XSS_INJECTION' | 'SYSTEM_LOCKDOWN' | 'NORMAL' | 'RATE_LIMIT_EXCEEDED';
  message: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  pathId?: string;
  aiReasoning?: string;
};

type StoreState = {
  logs: LogEntry[];
  failCount: number;
  isLocked: boolean;
  isSentinelActive: boolean;
  rateLimitTracker: Record<string, number[]>; // IP mapped to an array of timestamps
  bannedIPs: string[];
};

const DB_PATH = path.join(process.cwd(), '.securelock-db.json');
const LOCKDOWN_THRESHOLD = 3;

// RATE LIMIT PARAMETERS
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 15; // Max 15 requests per IP every 10 seconds

function getState(): StoreState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return { logs: [], failCount: 0, isLocked: false, isSentinelActive: true, rateLimitTracker: {}, bannedIPs: [] };
}

function saveState(state: StoreState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

class SecurityStore {
  
  // ---------------------------------------------------------------------------------
  // RATE LIMITING ENFORCEMENT & DDOS PROTECTION
  // ---------------------------------------------------------------------------------
  checkRateLimit(ip: string, userAgent: string): boolean {
    const state = getState();
    const now = Date.now();
    
    // Initialize or filter tracking window for this IP
    if (!state.rateLimitTracker) state.rateLimitTracker = {};
    if (!state.rateLimitTracker[ip]) state.rateLimitTracker[ip] = [];
    
    // Drop timestamps older than the sliding window
    state.rateLimitTracker[ip] = state.rateLimitTracker[ip].filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    
    // Add current request
    state.rateLimitTracker[ip].push(now);
    
    // Evaluate if IP is exceeding reasonable human traffic speeds
    if (state.rateLimitTracker[ip].length > MAX_REQUESTS_PER_WINDOW && state.isSentinelActive) {
       saveState(state);
       
       // Log the excessive traffic once per burst to avoid log flooding
       if (state.rateLimitTracker[ip].length === MAX_REQUESTS_PER_WINDOW + 1) {
           this.addLog({
               type: 'RATE_LIMIT_EXCEEDED',
               message: `CRITICAL: Brute-Force/DDoS signature detected. Velocity exceeds ${MAX_REQUESTS_PER_WINDOW} req/${RATE_LIMIT_WINDOW_MS/1000}s. Auto-dropping packets.`,
               ip,
               userAgent,
               pathId: 'GLOBAL_RATE_LIMITER'
           });
       }
       return false; // RATE LIMIT FAILED (Blocked)
    }
    
    saveState(state);
    return true; // RATE LIMIT PASSED (Allowed)
  }

  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>) {
    const state = getState();
    const entry: LogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      // Adding robust fallback forensics
      userAgent: log.userAgent || 'Unknown Entity',
    };
    state.logs.unshift(entry);

    if (log.type !== 'NORMAL' && log.type !== 'SYSTEM_LOCKDOWN' && log.type !== 'RATE_LIMIT_EXCEEDED') {
      state.failCount += 1;
      if (state.failCount >= LOCKDOWN_THRESHOLD && !state.isLocked) {
        state.isLocked = true;
        if (!state.bannedIPs) state.bannedIPs = [];
        if (!state.bannedIPs.includes(log.ip)) state.bannedIPs.push(log.ip);
        
        state.logs.unshift({
          id: 'lockdown-' + Date.now(),
          type: 'SYSTEM_LOCKDOWN',
          message: `Threshold exceeded. Root authorization revoked. IP Tracker permanently banned [${log.ip}].`,
          timestamp: new Date().toISOString(),
          ip: 'SYSTEM_KERNEL',
          userAgent: 'Sentinel Auto-Defense'
        });
      }
    }
    
    if (state.logs.length > 50) {
      state.logs = state.logs.slice(0, 50);
    }
    
    saveState(state);
  }

  getLogs() { return getState().logs; }
  isLockedDown() { return getState().isLocked; }
  getFailCount() { return getState().failCount; }
  isDetectionActive() { return getState().isSentinelActive; }
  isBanned(ip: string) { return getState().bannedIPs?.includes(ip) || false; }
  
  toggleSentinel() {
    const state = getState();
    state.isSentinelActive = !state.isSentinelActive;
    saveState(state);
    return state.isSentinelActive;
  }

  reset() {
    saveState({ logs: [], failCount: 0, isLocked: false, isSentinelActive: true, rateLimitTracker: {}, bannedIPs: [] });
  }
}

export const store = new SecurityStore();
