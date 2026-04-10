'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Lock, RotateCcw } from 'lucide-react';

export default function LockdownOverlay() {
  const [isLocked, setIsLocked] = useState(false);
  const [healCountdown, setHealCountdown] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [typewriterText, setTypewriterText] = useState('');

  const WARNING_TEXT = 'COORDINATED ATTACK DETECTED — ALL ENDPOINTS LOCKED';

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status/public');
      if (res.ok) {
        const data = await res.json();
        setIsLocked(data.isLockedDown);
        if (data.isLockedDown && data.lockdownTimestamp && data.cooldownMs) {
          const remaining = Math.max(0, data.cooldownMs - (Date.now() - data.lockdownTimestamp));
          setHealCountdown(remaining);
        } else {
          setHealCountdown(null);
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect when locked
  useEffect(() => {
    if (!isLocked) { setTypewriterText(''); return; }
    let i = 0;
    setTypewriterText('');
    const timer = setInterval(() => {
      i++;
      setTypewriterText(WARNING_TEXT.slice(0, i));
      if (i >= WARNING_TEXT.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [isLocked]);

  const handleAdminReset = async () => {
    setResetting(true);
    setAuthError('');
    const loginRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: adminPass }),
    });
    if (!loginRes.ok) {
      setAuthError('Invalid administrator credentials.');
      setResetting(false);
      return;
    }
    const resetRes = await fetch('/api/status', { method: 'POST' });
    if (resetRes.ok) {
      setTimeout(() => {
        setResetting(false);
        setShowAdminAuth(false);
        setAdminPass('');
        fetchStatus();
      }, 1000);
    } else {
      setAuthError('Reset failed. Check authorization.');
      setResetting(false);
    }
  };

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLocked) return null;

  return (
    <>
      <style>{`
        @keyframes lockdownPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        @keyframes borderFlash {
          0%, 100% { border-color: #dc2626; box-shadow: 0 0 30px rgba(220,38,38,0.5), inset 0 0 30px rgba(220,38,38,0.05); }
          50% { border-color: #ef4444; box-shadow: 0 0 60px rgba(220,38,38,0.8), inset 0 0 60px rgba(220,38,38,0.1); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glitch {
          0%, 90%, 100% { transform: translate(0); }
          91% { transform: translate(-2px, 1px); }
          93% { transform: translate(2px, -1px); }
          95% { transform: translate(-1px, 2px); }
          97% { transform: translate(1px, -2px); }
        }
        @keyframes alertBlink {
          0%, 49% { background: rgba(220,38,38,0.15); color: #ef4444; }
          50%, 100% { background: rgba(220,38,38,0.05); color: #dc2626; }
        }
        @keyframes countdownGlow {
          0%, 100% { text-shadow: 0 0 10px #ef4444, 0 0 20px #dc2626; }
          50% { text-shadow: 0 0 30px #ef4444, 0 0 60px #dc2626, 0 0 80px #b91c1c; }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at center, #1a0000 0%, #0a0000 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        animation: 'lockdownPulse 2s ease-in-out infinite',
        border: '4px solid #dc2626',
        animationName: 'borderFlash',
        animationDuration: '1.5s',
        animationIterationCount: 'infinite',
      }}>
        {/* Scanline overlay */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.08,
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(transparent, rgba(255,50,50,0.8), transparent)',
            animation: 'scanline 3s linear infinite',
          }} />
        </div>

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{ textAlign: 'center', maxWidth: '680px', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
          {/* Alert badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '4px', marginBottom: '2rem',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em',
            animation: 'alertBlink 0.8s step-start infinite',
          }}>
            ⚠ CRITICAL SECURITY INCIDENT ACTIVE ⚠
          </div>

          {/* Shield icon */}
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 1.5rem',
            borderRadius: '16px', background: 'rgba(220,38,38,0.15)',
            border: '2px solid #dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glitch 4s infinite',
          }}>
            <ShieldAlert style={{ width: '48px', height: '48px', color: '#ef4444' }} />
          </div>

          {/* Main title */}
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 900, color: '#dc2626',
            fontFamily: 'Merriweather, Georgia, serif',
            letterSpacing: '0.05em', marginBottom: '0.75rem',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(220,38,38,0.5)',
          }}>
            System Lockdown
          </h1>

          {/* Typewriter warning */}
          <div style={{
            fontFamily: 'monospace', fontSize: '0.75rem', color: '#ef4444',
            letterSpacing: '0.1em', marginBottom: '1.5rem', minHeight: '1.2em',
            textShadow: '0 0 8px rgba(239,68,68,0.6)',
          }}>
            {typewriterText}<span style={{ animation: 'alertBlink 0.6s infinite' }}>█</span>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Our intrusion detection systems have identified a coordinated multi-source attack.
            All services are suspended to protect system integrity.
          </p>

          {/* Countdown */}
          {healCountdown !== null && healCountdown > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Auto-recovery in
              </div>
              <div style={{
                fontSize: '3rem', fontWeight: 900, color: '#ef4444',
                fontFamily: 'monospace', letterSpacing: '0.1em',
                animation: 'countdownGlow 1s ease-in-out infinite',
              }}>
                {formatCountdown(healCountdown)}
              </div>
            </div>
          )}

          {/* Lock icon row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '2rem', color: '#374151', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
            <Lock style={{ width: '12px', height: '12px', color: '#4b5563' }} />
            <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#4b5563' }}>DDoS Protection Active · All Traffic Blocked</span>
            <Lock style={{ width: '12px', height: '12px', color: '#4b5563' }} />
          </div>

          {/* Admin Reset */}
          {!showAdminAuth ? (
            <button
              onClick={() => setShowAdminAuth(true)}
              style={{
                padding: '10px 24px', background: 'transparent',
                border: '1px solid #374151', color: '#6b7280',
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#dc2626'; (e.target as HTMLElement).style.color = '#dc2626'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#374151'; (e.target as HTMLElement).style.color = '#6b7280'; }}
            >
              <RotateCcw style={{ width: '14px', height: '14px' }} /> Administrator Emergency Reset
            </button>
          ) : (
            <div style={{
              margin: '0 auto', maxWidth: '320px', background: 'rgba(15,23,42,0.8)',
              border: '1px solid #374151', borderRadius: '8px', padding: '1.5rem',
            }}>
              <p style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Admin Authentication Required</p>
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdminReset()}
                placeholder="Admin password"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', background: '#0f172a',
                  border: '1px solid #374151', borderRadius: '4px', color: '#fff',
                  fontSize: '0.875rem', marginBottom: '0.75rem', boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {authError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600 }}>{authError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setShowAdminAuth(false); setAdminPass(''); setAuthError(''); }}
                  style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #374151', color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={handleAdminReset}
                  disabled={resetting}
                  style={{ flex: 1, padding: '8px', background: '#7f1d1d', border: '1px solid #dc2626', color: '#fff', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', opacity: resetting ? 0.5 : 1 }}
                >
                  {resetting ? 'Resetting...' : 'Reset System'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
