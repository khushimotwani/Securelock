'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error);
      }
    } catch (e) {
      setMessage('Network error or system locked.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="glass p-8 w-full max-w-md rounded-2xl relative border-primary shadow-[0_0_30px_rgba(0,255,0,0.1)]">
        <div className="absolute top-4 right-4 text-primary animate-pulse text-xl">⚡</div>
        <h1 className="text-2xl font-bold mb-6 text-primary terminal-text uppercase tracking-widest border-b border-primary/30 pb-2">&gt; ROOT_LOGIN</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 font-mono text-primary/80 uppercase">Username</label>
            <input
              type="text"
              className="w-full bg-black/50 border border-primary/50 text-primary rounded px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder-primary/30"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 font-mono text-primary/80 uppercase">Password</label>
            <input
              type="password"
              className="w-full bg-black/50 border border-primary/50 text-primary rounded px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder-primary/30"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary/20 border border-primary text-primary py-2 mt-4 rounded font-mono font-bold hover:bg-primary/40 transition-colors uppercase tracking-widest"
          >
            Sign In
          </button>
        </form>

        {message && (
          <div className="mt-6 p-3 rounded bg-black/50 font-mono text-sm font-bold text-center border border-primary flex items-center justify-center gap-2 text-primary shadow-[0_0_10px_rgba(0,255,0,0.2)]">
            <span className="animate-pulse">&gt;</span> {message}
          </div>
        )}

        <div className="mt-8 text-xs text-primary/70 border-t border-primary/30 pt-4 font-mono">
          <p className="font-bold mb-3 text-primary uppercase tracking-widest">Known Attack Vectors:</p>
          <ul className="list-disc pl-4 space-y-2 opacity-80">
            <li>Brute-force: Repeatedly login with wrong passwords.</li>
            <li>SQL Injection: Try <code className="bg-primary/10 text-primary border border-primary/20 px-1 rounded">admin'--</code> or <code className="bg-primary/10 text-primary border border-primary/20 px-1 rounded">' OR 1=1;</code> as username.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
