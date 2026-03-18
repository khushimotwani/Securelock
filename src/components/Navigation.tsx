'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Poll the status
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setIsLocked(data.isLockedDown);
        }
      } catch (e) {
        // Ignore fetch errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { label: 'Dashboard', href: '/' },
    { label: 'Login', href: '/login' },
    { label: 'Injection Test', href: '/test-injection' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flexjustify-between h-16 flex items-center justify-between">
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="text-2xl animate-pulse">🔒</span>
            <span className="font-bold text-xl tracking-wide text-primary terminal-text uppercase">
              SecureLock<span className="text-white">TS</span>
            </span>
            {isLocked && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                LOCKED
              </span>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-primary terminal-text'
                      : 'border-transparent text-muted-foreground hover:border-muted hover:text-white transition-all'
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
