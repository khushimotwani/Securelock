'use client';
import { Lock, Shield, ShieldOff, Cloud, ShieldCheck } from 'lucide-react';
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
    { label: 'Overview', href: '/' },
    { label: 'Cloud Gateway', href: '/login' },
    { label: 'Diagnostics', href: '/test-injection' },
    { label: 'Sentinel Core', href: '/sentinel' },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 transition-colors border-b border-white/5 bg-slate-900/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 box-shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center transition-all">
              <Cloud className="text-white w-5 h-5 stroke-2" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-sans drop-shadow-md">
              The <span className="text-indigo-400 font-extrabold">Securelock</span>
            </span>
            {isLocked && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-[10px] font-sans font-bold text-red-400 shadow-[0_0_10px_rgba(255,0,0,0.3)] animate-pulse">
                SYS_LOCKED
              </span>
            )}
            
            <button
              onClick={toggleSentinel}
              title="Toggle WAF Engine"
              className={`ml-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-sans font-bold shadow-sm transition-all ${
                isSentinelActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isSentinelActive ? <ShieldCheck className="w-3.5 h-3.5"/> : <ShieldOff className="w-3.5 h-3.5"/>}
              WAF {isSentinelActive ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium font-sans transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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
