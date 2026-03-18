'use client';
import { useEffect, useState } from 'react';

type LogEntry = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  ip: string;
};

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setIsLocked(data.isLockedDown);
        setFailCount(data.failCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    await fetch('/api/status', { method: 'POST' });
    fetchStatus();
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="scanline"></div>
      
      <div className="flex items-center justify-between border-b border-primary/30 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary terminal-text uppercase">&gt; System Monitoring_</h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-primary text-primary bg-primary/10 rounded font-mono hover:bg-primary/20 transition-colors text-sm uppercase"
        >
          Reset Environment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className={`glass p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all duration-500 ${isLocked ? 'border-destructive bg-destructive/10 lockdown-flash' : 'border-primary/50'}`}>
          <h2 className="text-xl font-bold font-mono tracking-widest text-primary/80">STATUS</h2>
          {isLocked ? (
            <div className="text-destructive font-bold text-2xl flex items-center gap-2 uppercase tracking-widest">
              <span className="text-3xl">☠️</span> SYSTEM LOCKED
            </div>
          ) : (
             <div className="text-primary font-bold text-2xl flex items-center gap-2 terminal-text uppercase tracking-widest">
               <span className="text-3xl animate-pulse">✓</span> SECURE
             </div>
          )}
          <p className="text-xs text-primary/60 mt-2 font-mono uppercase">
            Sentinel module online.
          </p>
        </div>

        <div className="glass p-6 flex flex-col justify-center space-y-2 md:col-span-2 relative overflow-hidden">
          <div className="absolute opacity-10 top-0 left-0 w-full h-full text-9xl font-mono text-primary rotate-12 -z-10 select-none">10100101</div>
          <h2 className="text-xl font-bold font-mono text-primary/80 uppercase tracking-wide">Threat Intel</h2>
          <div className="flex gap-12 mt-4">
            <div>
              <p className="text-xs text-primary/60 font-mono uppercase">Anomalies Detected</p>
              <p className="text-3xl font-bold text-primary terminal-text">{failCount} <span className="text-sm">/ 3</span></p>
            </div>
            <div>
              <p className="text-xs text-primary/60 font-mono uppercase">Active Defense</p>
              <p className="text-lg font-mono text-primary/90">Strict Block (Threshold: 3)</p>
            </div>
          </div>
          {isLocked && (
             <div className="mt-4 p-3 bg-red-100 text-red-900 border border-red-200 rounded-lg text-sm">
               The threshold of suspicious input patterns has been exceeded. All application endpoints will currently reject requests to prevent further exploitation until reset.
             </div>
          )}
        </div>
      </div>

      <div className="glass overflow-hidden mt-8">
        <div className="p-4 border-b border-primary/30 bg-primary/5 flex items-center gap-2">
          <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
          <h2 className="text-lg font-bold font-mono tracking-widest text-primary uppercase">Event Log</h2>
        </div>
        <div className="divide-y divide-primary/20">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-primary/40 font-mono text-sm">Waiting for incoming telemetry...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {log.type === 'SYSTEM_LOCKDOWN' && <span className="text-xl">🚨</span>}
                  {log.type === 'NORMAL' && <span className="text-xl">✅</span>}
                  {(log.type === 'SQL_INJECTION' || log.type === 'COMMAND_INJECTION' || log.type === 'LOGIN_ATTEMPT') && <span className="text-xl">⚠️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary font-mono uppercase tracking-wider">
                    {log.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-primary/70 break-all font-mono">
                    {log.message}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right text-xs text-primary/50 space-y-1 font-mono">
                  <p>{new Date(log.timestamp).toLocaleTimeString()}</p>
                  <p className="bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded text-primary">{log.ip}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
