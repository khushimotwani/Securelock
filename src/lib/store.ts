import fs from 'fs';
import path from 'path';

export type LogEntry = {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'SYSTEM_LOCKDOWN' | 'NORMAL';
  message: string;
  timestamp: string;
  ip: string;
};

type StoreState = {
  logs: LogEntry[];
  failCount: number;
  isLocked: boolean;
  isSentinelActive: boolean;
};

const DB_PATH = path.join(process.cwd(), '.securelock-db.json');
const LOCKDOWN_THRESHOLD = 3;

function getState(): StoreState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return { logs: [], failCount: 0, isLocked: false, isSentinelActive: true };
}

function saveState(state: StoreState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e);
  }
}

class SecurityStore {
  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>) {
    const state = getState();
    const entry: LogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    state.logs.unshift(entry);

    if (log.type !== 'NORMAL' && log.type !== 'SYSTEM_LOCKDOWN') {
      state.failCount += 1;
      if (state.failCount >= LOCKDOWN_THRESHOLD && !state.isLocked) {
        state.isLocked = true;
        state.logs.unshift({
          id: 'lockdown-' + Date.now(),
          type: 'SYSTEM_LOCKDOWN',
          message: 'Threshold exceeded. Automatic system lockdown activated.',
          timestamp: new Date().toISOString(),
          ip: 'SYSTEM',
        });
      }
    }
    
    // Keep logs manageable
    if (state.logs.length > 50) {
      state.logs = state.logs.slice(0, 50);
    }
    
    saveState(state);
  }

  getLogs() {
    return getState().logs;
  }

  isLockedDown() {
    return getState().isLocked;
  }

  getFailCount() {
    return getState().failCount;
  }

  isDetectionActive() {
    return getState().isSentinelActive;
  }

  toggleSentinel() {
    const state = getState();
    state.isSentinelActive = !state.isSentinelActive;
    saveState(state);
    return state.isSentinelActive;
  }

  reset() {
    saveState({ logs: [], failCount: 0, isLocked: false, isSentinelActive: true });
  }
}

export const store = new SecurityStore();
