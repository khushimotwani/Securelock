'use client';
import { useEffect, useRef, useState } from 'react';
import { Shield, Activity, AlertTriangle, ShieldAlert, HeartPulse, Ban, LogIn, Lock, ShieldCheck, Cpu, Trophy } from "lucide-react";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AchievementToast from '@/components/AchievementToast';

// Lazy-load the attack map (SVG-heavy, not needed for SSR)
const AttackMap = dynamic(() => import('@/components/AttackMap'), { ssr: false, loading: () => (
  <div style={{ background: '#0a1628', height: '260px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '0.8rem' }}>Loading attack map...</div>
)});

type LogEntry = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  aiReasoning?: string;
  severity?: string;
  lat?: number;
  lon?: number;
  country?: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
};

// Maps log type to the achievement ID it should trigger
const LOG_TYPE_TO_ACHIEVEMENT: Record<string, string> = {
  SQL_INJECTION: 'sqli',
  XSS_INJECTION: 'xss',
  COMMAND_INJECTION: 'cmdi',
  PATH_TRAVERSAL: 'path',
  IP_BANNED: 'banned',
  SYSTEM_LOCKDOWN: 'lockdown',
};

// ── Threat Meter ─────────────────────────────────────────────────────────────
function ThreatMeter({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const label = clamped >= 75 ? 'CRITICAL' : clamped >= 50 ? 'HIGH' : clamped >= 25 ? 'ELEVATED' : 'NORMAL';
  const color = clamped >= 75 ? '#dc2626' : clamped >= 50 ? '#f97316' : clamped >= 25 ? '#eab308' : '#16a34a';

  // SVG arc parameters
  const r = 38;
  const cx = 50; const cy = 50;
  const totalArc = Math.PI * 1.5; // 270° sweep
   const startAngle = Math.PI * 0.75; // starts bottom-left
  const arcLen = 2 * Math.PI * r;
  const dashArray = arcLen;
  const dashOffset = arcLen - (clamped / 100) * (totalArc / (2 * Math.PI)) * arcLen;

  const toXY = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const start = toXY(startAngle);
  const end = toXY(startAngle + totalArc);
  const largeArc = totalArc > Math.PI ? 1 : 0;
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const filledAngle = startAngle + (clamped / 100) * totalArc;
  const filledEnd = toXY(filledAngle);
  const filledLargeArc = (clamped / 100) * totalArc > Math.PI ? 1 : 0;
  const fillPath = clamped > 0 ? `M ${start.x} ${start.y} A ${r} ${r} 0 ${filledLargeArc} 1 ${filledEnd.x} ${filledEnd.y}` : '';

  return (
    <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', textAlign: 'center' }}>
      <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Threat Level</span>
      <div style={{ position: 'relative', width: '90px', margin: '0.25rem auto' }}>
        <svg viewBox="0 0 100 60" style={{ width: '90px', overflow: 'visible' }}>
          {/* Track */}
          <path d={trackPath} fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
          {/* Fill */}
          {clamped > 0 && (
            <path d={fillPath} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              style={{ transition: 'stroke 0.5s, d 0.5s', filter: `drop-shadow(0 0 4px ${color}80)` }} />
          )}
          {/* Score text */}
          <text x="50" y="56" textAnchor="middle" fontSize="11" fontWeight="800" fill={color}
            style={{ transition: 'fill 0.5s' }}>
            {clamped}
          </text>
        </svg>
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color, letterSpacing: '0.1em', transition: 'color 0.5s' }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSentinelActive, setIsSentinelActive] = useState(true);
  const [failCount, setFailCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(34);
  const [totalAttacksBlocked, setTotalAttacksBlocked] = useState(0);
  const [healCount, setHealCount] = useState(0);
  const [bannedIPCount, setBannedIPCount] = useState(0);
  const [healCountdown, setHealCountdown] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);

  // Track which log types we've already converted to achievements (client side)
  const seenLogTypes = useRef<Set<string>>(new Set());
  const seenAcvIds = useRef<Set<string>>(new Set());

  // Auth check: call the middleware-protected /api/status endpoint.
  // If the cookie is invalid/missing, middleware returns 401 and we show the gate.
  // sessionStorage is NOT used — it can be forged by anyone in DevTools.
  useEffect(() => {
    fetch('/api/status')
      .then(res => {
        if (res.ok) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setIsLocked(data.isLockedDown);
        setFailCount(data.failCount);
        setIsSentinelActive(data.isSentinelActive);
        setTotalAttacksBlocked(data.totalAttacksBlocked || 0);
        setHealCount(data.healCount || 0);
        setBannedIPCount(data.bannedIPCount || 0);

        // Detect new achievements from server
        if (data.achievements && Array.isArray(data.achievements)) {
          const incoming: string[] = [];
          for (const a of data.achievements as Achievement[]) {
            if (!seenAcvIds.current.has(a.id)) {
              seenAcvIds.current.add(a.id);
              incoming.push(a.id);
            }
          }
          if (incoming.length) setNewAchievementIds(incoming);
          setAchievements(data.achievements);
        }

        // Detect achievements from new log types (client-side)
        const newFromLogs: string[] = [];
        for (const log of data.logs as LogEntry[]) {
          const achId = LOG_TYPE_TO_ACHIEVEMENT[log.type];
          if (achId && !seenLogTypes.current.has(log.type) && !seenAcvIds.current.has(achId)) {
            seenLogTypes.current.add(log.type);
            seenAcvIds.current.add(achId);
            newFromLogs.push(achId);
          }
          // Also catch IP_BANNED and SYSTEM_LOCKDOWN
          if ((log.type === 'IP_BANNED' || log.type === 'SYSTEM_LOCKDOWN') && !seenLogTypes.current.has(log.id)) {
            const achId2 = LOG_TYPE_TO_ACHIEVEMENT[log.type];
            if (achId2 && !seenAcvIds.current.has(achId2)) {
              seenLogTypes.current.add(log.id);
              seenAcvIds.current.add(achId2);
              newFromLogs.push(achId2);
            }
          }
        }
        if (newFromLogs.length) setNewAchievementIds(prev => [...prev, ...newFromLogs]);

        if (data.isLockedDown && data.lockdownTimestamp && data.cooldownMs) {
          const elapsed = Date.now() - data.lockdownTimestamp;
          setHealCountdown(Math.max(0, data.cooldownMs - elapsed));
        } else {
          setHealCountdown(null);
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (isAdmin !== true) return;
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setCpuUsage(Math.floor(Math.random() * 15) + (isLocked ? 40 : 10));
      setMemUsage(Math.floor(Math.random() * 5) + (isLocked ? 60 : 30));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLocked, isAdmin]);

  // Clear new achievement IDs after AchievementToast consumes them
  useEffect(() => {
    if (newAchievementIds.length) {
      const t = setTimeout(() => setNewAchievementIds([]), 500);
      return () => clearTimeout(t);
    }
  }, [newAchievementIds]);

  const handleReset = async () => {
    await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    seenLogTypes.current.clear();
    seenAcvIds.current.clear();
    fetchStatus();
  };

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isAlert = failCount >= 3 || bannedIPCount > 0;
  const statusLabel = isLocked ? 'LOCKDOWN' : isAlert ? 'ALERT' : 'SECURE';
  const statusColor = isLocked ? '#dc2626' : isAlert ? '#d97706' : '#16a34a';
  const threatScore = Math.min(100, failCount * 8 + bannedIPCount * 15 + (isLocked ? 50 : 0));

  if (isAdmin === null) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Verifying credentials...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', borderRadius: '12px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock style={{ width: '32px', height: '32px', color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1b3a5c', marginBottom: '0.5rem', fontFamily: 'Merriweather, Georgia, serif' }}>Access Restricted</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            The Sentinel Core monitoring dashboard is restricted to authorized administrators only.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#1b3a5c', color: 'white', borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            <LogIn style={{ width: '16px', height: '16px' }} /> Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Achievement Toast */}
      <AchievementToast newAchievementIds={newAchievementIds} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1b3a5c', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1b3a5c', margin: 0, fontFamily: 'Merriweather, Georgia, serif' }}>
            🛡️ Sentinel Core Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px' }}>Network Operations Center — Production Mode</p>
        </div>
        <button onClick={handleReset} style={{ padding: '8px 20px', background: '#1b3a5c', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' }}>
          RESET ENVIRONMENT
        </button>
      </div>

      {/* Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Core Integrity Card */}
        <div style={{ background: 'white', border: `2px solid ${statusColor}`, borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Core Integrity</p>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', borderRadius: '50%', background: isLocked ? 'rgba(220,38,38,0.1)' : isAlert ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)', border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLocked ? <ShieldAlert style={{ width: '40px', height: '40px', color: statusColor }} /> :
             isAlert ? <AlertTriangle style={{ width: '40px', height: '40px', color: statusColor }} /> :
             <ShieldCheck style={{ width: '40px', height: '40px', color: statusColor }} />}
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: statusColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{statusLabel}</div>
          <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.75rem', padding: '4px 12px', background: '#f3f4f6', borderRadius: '4px', display: 'inline-block' }}>
            {isLocked ? 'All traffic blocked — DDoS detected' : isAlert ? 'Threats detected — IPs banned' : 'Sentinel Engine Online'}
          </p>
          {healCountdown !== null && healCountdown > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '4px', color: '#d97706', fontSize: '0.75rem', fontWeight: 600 }}>
              <HeartPulse style={{ width: '14px', height: '14px' }} />
              Self-heal in {formatCountdown(healCountdown)}
            </div>
          )}
        </div>

        {/* Threat Intel Matrix */}
        <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b3a5c', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ width: '14px', height: '14px' }} /> Threat Intel Matrix
            </h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Anomalies */}
              <div style={{ padding: '0.875rem', background: failCount >= 3 ? 'rgba(220,38,38,0.05)' : '#f9fafb', border: `1px solid ${failCount >= 3 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Anomalies</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: failCount >= 3 ? '#dc2626' : '#1b3a5c', marginTop: '4px' }}>
                  {failCount}<span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>/3</span>
                </div>
              </div>
              {/* Blocked */}
              <div style={{ padding: '0.875rem', background: totalAttacksBlocked > 0 ? 'rgba(220,38,38,0.05)' : '#f9fafb', border: `1px solid ${totalAttacksBlocked > 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Ban style={{ width: '9px', height: '9px' }} /> Blocked
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{totalAttacksBlocked}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Total</span>
              </div>
              {/* Self-Heals */}
              <div style={{ padding: '0.875rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <HeartPulse style={{ width: '9px', height: '9px' }} /> Heals
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{healCount}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Cycles</span>
              </div>
              {/* Banned IPs */}
              <div style={{ padding: '0.875rem', background: bannedIPCount > 0 ? 'rgba(217,119,6,0.05)' : '#f9fafb', border: `1px solid ${bannedIPCount > 0 ? '#fcd34d' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Ban style={{ width: '9px', height: '9px' }} /> Banned IPs
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{bannedIPCount}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Permanent</span>
              </div>
              {/* Achievements */}
              <div style={{ padding: '0.875rem', background: achievements.length > 0 ? 'rgba(245,158,11,0.05)' : '#f9fafb', border: `1px solid ${achievements.length > 0 ? '#fcd34d' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Trophy style={{ width: '9px', height: '9px' }} /> Unlocked
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{achievements.length}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Achievements</span>
              </div>
            </div>

            {/* System vitals row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.875rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Defensive Posture</span>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: isLocked ? '#dc2626' : isAlert ? '#d97706' : '#1b3a5c', color: 'white', letterSpacing: '0.05em' }}>
                    {isLocked ? 'LOCKDOWN' : isAlert ? 'ELEVATED' : 'MONITORING'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '0.875rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Cpu style={{ width: '9px', height: '9px' }} /> CPU Load <span style={{ opacity: 0.5, fontWeight: 400 }}>(simulated)</span>
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b3a5c', marginTop: '4px' }}>{cpuUsage}%</div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '4px', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${cpuUsage}%`, background: '#1b3a5c', height: '100%', transition: 'width 0.5s' }} />
                </div>
              </div>
              <div style={{ padding: '0.875rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>MEM Load <span style={{ opacity: 0.5, fontWeight: 400 }}>(simulated)</span></span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b3a5c', marginTop: '4px' }}>{memUsage}%</div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '4px', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${memUsage}%`, background: '#1b3a5c', height: '100%', transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>

            {/* Alert banner */}
            {(isLocked || isAlert) && (
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: isLocked ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.06)', border: `1px solid ${isLocked ? '#fca5a5' : '#fcd34d'}`, borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: statusColor, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                  {isLocked ? (
                    <><strong style={{ color: '#dc2626' }}>CRITICAL:</strong> Coordinated DDoS detected. All endpoints locked.
                      {healCountdown !== null && healCountdown > 0 && (
                        <span style={{ display: 'block', marginTop: '4px', color: '#d97706' }}>
                          Self-healing in {formatCountdown(healCountdown)}. Attacker IPs remain permanently banned.
                        </span>
                      )}
                    </>
                  ) : (
                    <><strong style={{ color: '#d97706' }}>ALERT:</strong> {totalAttacksBlocked} attack(s) intercepted. {bannedIPCount} IP(s) permanently banned. Legitimate users are unaffected.</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second row: Threat Meter + Achievements + Attack Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        <div>
          <ThreatMeter score={threatScore} />
          {/* Achievements mini panel */}
          {achievements.length > 0 && (
            <div style={{ marginTop: '0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.875rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                🏆 Achievements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {achievements.map(a => (
                  <span key={a.id} title={a.title} style={{ fontSize: '1rem', cursor: 'default' }}>{a.icon}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attack Map */}
        <AttackMap logs={logs} />
      </div>

      {/* Syslog Live Feed */}
      <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b3a5c', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Syslog Live Feed
            </h2>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#9ca3af', letterSpacing: '0.05em' }}>FILTERING: ALL EVENTS</span>
        </div>

        <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
              <Activity style={{ width: '32px', height: '32px', margin: '0 auto 1rem', opacity: 0.3 }} />
              Listening for incoming telemetry...
            </div>
          ) : (
            logs.map((log) => {
              const isAttack = ['SQL_INJECTION', 'COMMAND_INJECTION', 'XSS_INJECTION', 'PATH_TRAVERSAL', 'SSRF', 'TEMPLATE_INJECTION', 'HEADER_INJECTION', 'XXE', 'LDAP_INJECTION', 'ENCODED_ATTACK'].includes(log.type);
              const isBan = log.type === 'IP_BANNED';
              const isLockdownEvent = log.type === 'SYSTEM_LOCKDOWN';
              const isHeal = log.type === 'SYSTEM_HEALED';
              const isNormal = log.type === 'NORMAL';

              const iconEmoji = isLockdownEvent ? '🚨' : isHeal ? '💚' : isBan ? '🚫' : isAttack ? '⚠️' : isNormal ? '✅' : '⚠️';
              const msgColor = isLockdownEvent ? '#dc2626' : isHeal ? '#16a34a' : isBan ? '#d97706' : isAttack ? '#dc2626' : isNormal ? '#16a34a' : '#374151';

              return (
                <div key={log.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{iconEmoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', color: msgColor, fontWeight: isLockdownEvent || isBan ? 700 : 400, margin: 0 }}>
                      {log.message}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {log.type.replace(/_/g, ' ')}
                      {log.country && <span style={{ marginLeft: '8px', color: '#6b7280' }}>📍 {log.country}</span>}
                    </p>
                    {/* Enhanced AI Reasoning Card */}
                    {log.aiReasoning && (
                      <div style={{ marginTop: '10px', padding: '10px 14px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '1px solid #bfdbfe', borderRadius: '8px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem' }}>🧠</span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#1e40af', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Claude AI Analysis</span>
                          {log.severity && (
                            <span style={{
                              marginLeft: 'auto', fontSize: '0.55rem', fontWeight: 700,
                              padding: '2px 8px', borderRadius: '3px',
                              background: log.severity === 'CRITICAL' ? '#dc2626' : log.severity === 'HIGH' ? '#f97316' : '#eab308',
                              color: 'white', letterSpacing: '0.08em',
                            }}>
                              {log.severity}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#1e40af', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                          &ldquo;{log.aiReasoning}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '120px' }}>
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                    <p style={{ display: 'inline-block', marginTop: '4px', background: '#1b3a5c', color: 'white', padding: '2px 8px', borderRadius: '3px', fontSize: '0.65rem', fontFamily: 'monospace' }}>{log.ip}</p>
                    {log.userAgent && (
                      <p style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{log.userAgent.split(' ')[0]}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
