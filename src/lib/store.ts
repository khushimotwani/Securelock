// In a real app this would be Redis or a database.
// For demonstration, we use in-memory state.
export type LogEntry = {
  id: string;
  type: 'LOGIN_ATTEMPT' | 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'SYSTEM_LOCKDOWN' | 'NORMAL';
  message: string;
  timestamp: string;
  ip: string;
};

class SecurityStore {
  private logs: LogEntry[] = [];
  private failCount: number = 0;
  private isLocked: boolean = false;
  private readonly LOCKDOWN_THRESHOLD = 3;

  addLog(log: Omit<LogEntry, 'id' | 'timestamp'>) {
    const entry: LogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(entry);

    if (log.type !== 'NORMAL' && log.type !== 'SYSTEM_LOCKDOWN') {
      this.failCount += 1;
      if (this.failCount >= this.LOCKDOWN_THRESHOLD && !this.isLocked) {
        this.isLocked = true;
        this.logs.unshift({
          id: 'lockdown-' + Date.now(),
          type: 'SYSTEM_LOCKDOWN',
          message: 'Threshold exceeded. Automatic system lockdown activated.',
          timestamp: new Date().toISOString(),
          ip: 'SYSTEM',
        });
      }
    }
  }

  getLogs() {
    return this.logs;
  }

  isLockedDown() {
    return this.isLocked;
  }

  getFailCount() {
    return this.failCount;
  }

  reset() {
    this.logs = [];
    this.failCount = 0;
    this.isLocked = false;
  }
}

// Global instance
declare global {
  var securityStore: SecurityStore | undefined;
}

export const store = global.securityStore || new SecurityStore();

if (process.env.NODE_ENV !== 'production') {
  global.securityStore = store;
}
