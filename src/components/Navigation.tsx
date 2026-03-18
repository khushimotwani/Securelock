'use client';
import { Lock, Shield, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [isSentinelActive, setIsSentinelActive] = useState(true);

  useEffect(() => {
    // Poll the status
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setIsLocked(data.isLockedDown);
          setIsSentinelActive(data.isSentinelActive);
        }
      } catch (e) {
        // Ignore fetch errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleSentinel = async () => {
    try {
      const res = await fetch('/api/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsSentinelActive(data.isSentinelActive);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const links = [
    { label: 'Dashboard', href: '/' },
    { label: 'Login', href: '/login' },
    { label: 'Injection Test', href: '/test-injection' },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 transition-colors border-b border-primary/20 bg-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/40 flex items-center justify-center group-hover:neon-border transition-all">
              <span className="text-primary font-bold text-lg select-none">&gt;_</span>
            </div>
            <span className="font-bold text-xl tracking-[0.2em] text-primary neon-text uppercase font-mono">
              SecureLock<span className="text-primary/50">TS</span>
            </span>
            {isLocked && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded bg-destructive/10 border border-destructive/50 text-[10px] font-mono font-bold text-destructive uppercase tracking-widest shadow-[0_0_10px_red] animate-pulse">
                LOCKED
              </span>
            )}
            
            <button
              onClick={toggleSentinel}
              title="Toggle the Backend Detection Engine to Demo Vulnerabilities"
              className={`ml-4 flex items-center gap-2 px-3 py-1 rounded text-[10px] font-mono tracking-widest border transition-all ${
                isSentinelActive 
                  ? 'bg-primary/20 text-primary border-primary/50 neon-border' 
                  : 'bg-destructive/20 text-destructive border-destructive/50 shadow-[0_0_10px_red]'
              }`}
            >
              {isSentinelActive ? <Shield className="w-3 h-3"/> : <ShieldOff className="w-3 h-3 animate-pulse"/>}
              ENGINE: {isSentinelActive ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/50 neon-border'
                      : 'border border-transparent text-primary/50 hover:text-primary hover:bg-primary/10 hover:border-primary/20'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
