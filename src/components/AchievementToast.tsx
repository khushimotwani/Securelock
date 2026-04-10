'use client';
import { useEffect, useState } from 'react';

export type AchievementData = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const ACHIEVEMENT_DEFS: Record<string, AchievementData> = {
  sqli: { id: 'sqli', icon: '🎯', title: 'SQL Injection Master', description: 'Triggered your first SQL injection attack.' },
  xss: { id: 'xss', icon: '💥', title: 'XSS Artist', description: 'Injected your first Cross-Site Scripting payload.' },
  cmdi: { id: 'cmdi', icon: '☠️', title: 'Shell Commander', description: 'Attempted command injection into the system.' },
  path: { id: 'path', icon: '🗂️', title: 'Directory Diver', description: 'Tried to traverse the file system.' },
  banned: { id: 'banned', icon: '🚫', title: 'Permanently Banned', description: 'Your IP has been permanently blocked.' },
  lockdown: { id: 'lockdown', icon: '🔐', title: 'You Broke The System', description: 'Triggered a full system lockdown.' },
  ctf: { id: 'ctf', icon: '🚩', title: 'Flag Captured!', description: 'You found the hidden CTF flag!' },
};

// Export so sentinel page can use the definitions
export { ACHIEVEMENT_DEFS };

type ToastItem = AchievementData & { toastId: string; visible: boolean };

export default function AchievementToast({ newAchievementIds }: { newAchievementIds: string[] }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!newAchievementIds.length) return;

    const newToasts: ToastItem[] = newAchievementIds
      .map(id => ACHIEVEMENT_DEFS[id])
      .filter(Boolean)
      .map(ach => ({ ...ach, toastId: `${ach.id}-${Date.now()}`, visible: true }));

    if (!newToasts.length) return;

    setToasts(prev => [...prev, ...newToasts]);

    // Fade out after 4s
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => newToasts.find(n => n.toastId === t.toastId) ? { ...t, visible: false } : t)
      );
    }, 4000);

    // Remove from DOM after fade completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => !newToasts.find(n => n.toastId === t.toastId)));
    }, 4600);
  }, [newAchievementIds]);

  if (!toasts.length) return null;

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9998, display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px' }}>
      <style>{`
        @keyframes achievementIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes achievementOut {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
      {toasts.map(toast => (
        <div
          key={toast.toastId}
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 8px 32px rgba(245,158,11,0.25), 0 2px 8px rgba(0,0,0,0.4)',
            animation: toast.visible
              ? 'achievementIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'achievementOut 0.5s ease-in forwards',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #b45309, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(217,119,6,0.4)',
          }}>
            {toast.icon}
          </div>

          <div>
            <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>
              Achievement Unlocked!
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {toast.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
