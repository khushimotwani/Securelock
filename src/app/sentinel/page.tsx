'use client';
import { useEffect, useState } from 'react';
import { Shield, Activity, AlertTriangle, ShieldAlert, HeartPulse, Ban, LogIn, Lock, ShieldCheck, Cpu } from "lucide-react";
import Link from 'next/link';

type LogEntry = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  ip: string;
  userAgent?: string;
  aiReasoning?: string;
};

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

  useEffect(() => {
    setIsAdmin(typeof window !== 'undefined' && sessionStorage.getItem('securelock-admin') === 'true');
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
        if (data.isLockedDown && data.lockdownTimestamp && data.cooldownMs) {
          const elapsed = Date.now() - data.lockdownTimestamp;
          const remaining = Math.max(0, data.cooldownMs - elapsed);
          setHealCountdown(remaining);
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

  const handleReset = async () => {
    await fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    fetchStatus();
  };

  const formatCountdown = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine system status
  const isAlert = failCount >= 3 || bannedIPCount > 0;
  const statusLabel = isLocked ? 'LOCKDOWN' : isAlert ? 'ALERT' : 'SECURE';
  const statusColor = isLocked ? '#dc2626' : isAlert ? '#d97706' : '#16a34a';

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

          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: statusColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {statusLabel}
          </div>

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
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b3a5c', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Source Sans Pro, sans-serif' }}>
              <Activity style={{ width: '14px', height: '14px' }} /> Threat Intel Matrix
            </h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {/* Anomalies */}
              <div style={{ padding: '1rem', background: failCount >= 3 ? 'rgba(220,38,38,0.05)' : '#f9fafb', border: `1px solid ${failCount >= 3 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Anomalies</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: failCount >= 3 ? '#dc2626' : '#1b3a5c', marginTop: '4px' }}>
                  {failCount}<span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>/3</span>
                </div>
              </div>
              {/* Blocked */}
              <div style={{ padding: '1rem', background: totalAttacksBlocked > 0 ? 'rgba(220,38,38,0.05)' : '#f9fafb', border: `1px solid ${totalAttacksBlocked > 0 ? '#fca5a5' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Ban style={{ width: '10px', height: '10px' }} /> Blocked
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{totalAttacksBlocked}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Total attacks</span>
              </div>
              {/* Self-Heals */}
              <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HeartPulse style={{ width: '10px', height: '10px' }} /> Self-Heals
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{healCount}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Recovery cycles</span>
              </div>
              {/* Banned IPs */}
              <div style={{ padding: '1rem', background: bannedIPCount > 0 ? 'rgba(217,119,6,0.05)' : '#f9fafb', border: `1px solid ${bannedIPCount > 0 ? '#fcd34d' : '#e5e7eb'}`, borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Ban style={{ width: '10px', height: '10px' }} /> Banned IPs
                </span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{bannedIPCount}</div>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>Permanently blocked</span>
              </div>
            </div>

            {/* System vitals row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Defensive Posture</span>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: isLocked ? '#dc2626' : isAlert ? '#d97706' : '#1b3a5c', color: 'white', letterSpacing: '0.05em' }}>
                    {isLocked ? 'LOCKDOWN' : isAlert ? 'ELEVATED' : 'MONITORING'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu style={{ width: '10px', height: '10px' }} /> CPU Load
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b3a5c', marginTop: '4px' }}>{cpuUsage}%</div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '4px', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${cpuUsage}%`, background: '#1b3a5c', height: '100%', transition: 'width 0.5s' }}></div>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>MEM Load</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b3a5c', marginTop: '4px' }}>{memUsage}%</div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '4px', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${memUsage}%`, background: '#1b3a5c', height: '100%', transition: 'width 0.5s' }}></div>
                </div>
              </div>
            </div>

            {/* Alert banner when locked or under attack */}
            {(isLocked || isAlert) && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: isLocked ? 'rgba(220,38,38,0.06)' : 'rgba(217,119,6,0.06)', border: `1px solid ${isLocked ? '#fca5a5' : '#fcd34d'}`, borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: statusColor, flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>
                  {isLocked ? (
                    <>
                      <strong style={{ color: '#dc2626' }}>CRITICAL:</strong> Coordinated DDoS detected. All endpoints locked. Incoming traffic blocked.
                      {healCountdown !== null && healCountdown > 0 && (
                        <span style={{ display: 'block', marginTop: '4px', color: '#d97706' }}>
                          Self-healing in {formatCountdown(healCountdown)}. Attacker IPs remain permanently banned.
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <strong style={{ color: '#d97706' }}>ALERT:</strong> {totalAttacksBlocked} attack(s) intercepted. {bannedIPCount} IP(s) permanently banned. Legitimate users are unaffected.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Syslog Live Feed */}
      <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1b3a5c', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0, fontFamily: 'Source Sans Pro, sans-serif' }}>
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
              const isLoginAttempt = log.type === 'LOGIN_ATTEMPT';

              const iconBg = isLockdownEvent ? '#dc2626' : isHeal ? '#16a34a' : isBan ? '#d97706' : isAttack ? '#dc2626' : isLoginAttempt ? '#d97706' : isNormal ? '#16a34a' : '#6b7280';
              const iconEmoji = isLockdownEvent ? '🚨' : isHeal ? '💚' : isBan ? '🚫' : isAttack ? '⚠️' : isNormal ? '✅' : '⚠️';
              const msgColor = isLockdownEvent ? '#dc2626' : isHeal ? '#16a34a' : isBan ? '#d97706' : isAttack ? '#dc2626' : isNormal ? '#16a34a' : '#374151';

              return (
                <div key={log.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }}>{iconEmoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', color: msgColor, fontWeight: isLockdownEvent || isBan ? 700 : 400, margin: 0, fontFamily: 'Source Sans Pro, sans-serif' }}>
                      {log.message}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {log.type.replace(/_/g, ' ')}
                    </p>
                    {log.aiReasoning && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-8px', left: '8px', background: 'white', padding: '0 6px', fontSize: '0.6rem', color: '#1b3a5c', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Sentinel Reasoning</span>
                        <p style={{ fontSize: '0.78rem', color: '#1e40af', fontStyle: 'italic', margin: 0 }}>&ldquo;{log.aiReasoning}&rdquo;</p>
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
