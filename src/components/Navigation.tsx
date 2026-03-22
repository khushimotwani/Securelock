'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LogIn, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(typeof window !== 'undefined' && sessionStorage.getItem('securelock-admin') === 'true');
  }, []);

  const publicLinks = [
    { label: 'Home', href: '/' },
    { label: 'National Anthem', href: '/blog/national-anthem' },
    { label: 'Why We Love America', href: '/blog/why-we-love-america' },
    { label: 'Patriots', href: '/blog/greatest-patriots' },
  ];

  return (
    <nav className="bg-[hsl(213,62%,22%)] shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 py-3">
          <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            🇺🇸 God Bless America
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-0">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-4 text-sm font-semibold transition-all border-b-3 ${
                pathname === link.href
                  ? 'text-white border-white bg-white/10'
                  : 'text-blue-100/80 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/sentinel"
              className={`px-4 py-4 text-sm font-semibold transition-all border-b-3 flex items-center gap-1 ${
                pathname === '/sentinel'
                  ? 'text-amber-300 border-amber-300 bg-white/10'
                  : 'text-amber-200/70 border-transparent hover:text-amber-200 hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Sentinel
            </Link>
          )}

          <Link
            href="/login"
            className={`px-4 py-4 text-sm font-semibold transition-all border-b-3 flex items-center gap-1 ${
              pathname === '/login'
                ? 'text-white border-white bg-white/10'
                : 'text-blue-200/60 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> {isAdmin ? 'Admin' : 'Sign In'}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[hsl(213,62%,19%)] border-t border-white/10 px-4 py-2">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-blue-100 hover:bg-white/10 rounded"
            >{link.label}</Link>
          ))}
          {isAdmin && (
            <Link href="/sentinel" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-amber-200 hover:bg-white/10 rounded"
            ><Shield className="w-3.5 h-3.5 inline mr-1" /> Sentinel</Link>
          )}
          <Link href="/login" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm text-blue-200/60 hover:bg-white/10 rounded"
          ><LogIn className="w-3.5 h-3.5 inline mr-1" /> Sign In</Link>
        </div>
      )}
    </nav>
  );
}
