'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Lock, RotateCcw, HeartPulse } from 'lucide-react';

/**
 * Global Lockdown Overlay — only shows during GLOBAL DDoS lockdown.
 * Per-IP bans are handled silently (rickroll redirect), not with a full-screen overlay.
 * This only appears when the site is under coordinated DDoS attack.
 */
export default function LockdownOverlay() {
  const [isLocked, setIsLocked] = useState(false);
  const [healCountdown, setHealCountdown] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');

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

  const handleAdminReset = async () => {
    setResetting(true);
    setAuthError('');
    
    // Step 1: Login to get the admin_token cookie
    const loginRes = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: adminPass })
    });
    
    if (!loginRes.ok) {
      setAuthError('Invalid administrator credentials.');
      setResetting(false);
      return;
    }

    // Step 2: Now that we have the cookie, call the protected reset API
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
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded bg-red-100 border-2 border-red-300 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-700" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-red-800 uppercase tracking-wide mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
          Service Temporarily Unavailable
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Our systems have detected an unusually high volume of hostile traffic from multiple sources. As a precautionary measure, all services have been temporarily suspended to protect system integrity.
        </p>

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-6">
          <Lock className="w-3 h-3" />
          <span className="uppercase tracking-wider font-semibold">Coordinated Attack Detected · DDoS Protection Active</span>
          <Lock className="w-3 h-3" />
        </div>

        {/* Self-heal countdown */}
        {healCountdown !== null && healCountdown > 0 && (
          <div className="mb-6 inline-flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-300 rounded-sm">
            <HeartPulse className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-amber-800 text-sm font-semibold uppercase tracking-wider">
              Auto-recovery in {formatCountdown(healCountdown)}
            </span>
          </div>
        )}

        {/* Admin Reset */}
        {!showAdminAuth ? (
          <div>
            <button
              onClick={() => setShowAdminAuth(true)}
              className="mt-2 px-6 py-2.5 bg-white border-2 border-red-300 text-red-700 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-red-50 transition-all flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Administrator Emergency Reset
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3 max-w-xs mx-auto bg-gray-50 border border-gray-200 rounded-sm p-5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Admin Authentication Required</p>
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminReset()}
              placeholder="Admin password"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-sm text-gray-800 text-sm focus:outline-none focus:border-blue-700 placeholder:text-gray-400"
              autoFocus
            />
            {authError && <p className="text-red-600 text-xs font-semibold">{authError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdminAuth(false); setAdminPass(''); setAuthError(''); }}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-500 text-xs font-semibold uppercase rounded-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminReset}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-[hsl(213,62%,22%)] text-white text-xs font-semibold uppercase rounded-sm hover:bg-[hsl(213,62%,30%)] transition-all disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset System'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
