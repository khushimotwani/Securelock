'use client';
import { useState } from 'react';
import Link from 'next/link';

const HINTS = [
  'SecureLock has a login page with a Secure / Insecure mode toggle.',
  'In Insecure Mode, the SQL query is built by string concatenation — not parameterized.',
  "Classic SQLi bypass: try username `' OR '1'='1' --` and look carefully at what comes back.",
];

export default function CTFPage() {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [flag, setFlag] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const revealHint = (i: number) => {
    if (!revealedHints.includes(i)) {
      setRevealedHints(prev => [...prev, i]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/ctf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch {
      setResult({ success: false, message: 'Network error. Try again.' });
    }
    setSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 0' }}>
      <style>{`
        @keyframes flagWave {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes terminalBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .ctf-hint-btn:hover { background: rgba(245,158,11,0.15) !important; border-color: #f59e0b !important; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem', display: 'inline-block', animation: 'flagWave 2s ease-in-out infinite' }}>🚩</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1b3a5c', fontFamily: 'Merriweather, Georgia, serif', marginBottom: '0.5rem' }}>
          Capture The Flag Challenge
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
          A secret flag is hidden somewhere inside SecureLock. Use your hacking skills — specifically the <strong>intentional vulnerabilities</strong> — to find it.
        </p>
      </div>

      {/* Challenge Card */}
      <div style={{ background: '#0f172a', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', border: '1px solid #1e3a5f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6)' }} />

        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#22d3ee', marginBottom: '1.5rem', lineHeight: 1.8 }}>
          <span style={{ color: '#6b7280' }}>$ </span>
          <span style={{ color: '#4ade80' }}>cat</span>
          <span style={{ color: '#fff' }}> challenge.txt</span>
          <br />
          <br />
          <span style={{ color: '#94a3b8' }}>{'> SecureLock deliberately exposes two authentication modes:'}</span>
          <br />
          <span style={{ color: '#94a3b8' }}>{'> [SECURE]   — Parameterized SQL queries (safe)'}</span>
          <br />
          <span style={{ color: '#94a3b8' }}>{'> [INSECURE] — Raw string interpolation (vulnerable)'}</span>
          <br />
          <br />
          <span style={{ color: '#f59e0b' }}>{'> OBJECTIVE: Find and extract FLAG{...} from the database'}</span>
          <br />
          <span style={{ color: '#6b7280' }}>{'> HINT: The flag is a database field — retrieve it via injection.'}</span>
          <br />
          <br />
          <span style={{ color: '#fff' }}>_<span style={{ animation: 'terminalBlink 1s infinite' }}>█</span></span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '6px 12px' }}>
            <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>DIFFICULTY: MEDIUM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '6px', padding: '6px 12px' }}>
            <span style={{ color: '#22d3ee', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>CATEGORY: SQL INJECTION</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '6px 12px' }}>
            <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>🚩 ACHIEVEMENT: FLAG CAPTURED</span>
          </div>
        </div>
      </div>

      {/* Hints */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Progressive Hints
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {HINTS.map((hint, i) => {
            const revealed = revealedHints.includes(i);
            const prevRevealed = i === 0 || revealedHints.includes(i - 1);
            return (
              <div
                key={i}
                style={{
                  background: revealed ? 'rgba(245,158,11,0.06)' : '#f9fafb',
                  border: `1px solid ${revealed ? 'rgba(245,158,11,0.3)' : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  opacity: (!prevRevealed && !revealed) ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: revealed ? '#f59e0b' : '#9ca3af', letterSpacing: '0.1em', flexShrink: 0, paddingTop: '2px' }}>
                  HINT {i + 1}
                </span>
                {revealed ? (
                  <span style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{hint}</span>
                ) : (
                  <button
                    className="ctf-hint-btn"
                    onClick={() => prevRevealed && revealHint(i)}
                    disabled={!prevRevealed}
                    style={{
                      background: 'transparent', border: '1px solid #d1d5db',
                      borderRadius: '4px', padding: '4px 16px', fontSize: '0.75rem',
                      color: '#6b7280', cursor: prevRevealed ? 'pointer' : 'not-allowed',
                      fontWeight: 600, letterSpacing: '0.05em', transition: 'all 0.2s',
                    }}
                  >
                    {prevRevealed ? '🔓 Reveal Hint' : '🔒 Complete previous hint first'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Flag Submission */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1b3a5c', marginBottom: '0.5rem', fontFamily: 'Merriweather, Georgia, serif' }}>
          Submit Your Flag
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Found the flag? Enter it below. Format: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px', fontSize: '0.75rem' }}>FLAG&#123;...&#125;</code>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={flag}
            onChange={e => setFlag(e.target.value)}
            placeholder="FLAG{...}"
            required
            style={{
              flex: '1 1 260px', padding: '10px 14px',
              background: '#f9fafb', border: '1px solid #d1d5db',
              borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.875rem',
              color: '#1b3a5c', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 24px', background: '#1b3a5c', color: 'white',
              border: 'none', borderRadius: '6px', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.05em',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Checking...' : '🚩 Submit Flag'}
          </button>
        </form>

        {result && (
          <div style={{
            marginTop: '1rem', padding: '0.875rem 1rem',
            background: result.success ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)',
            border: `1px solid ${result.success ? '#86efac' : '#fca5a5'}`,
            borderRadius: '6px', fontSize: '0.875rem',
            color: result.success ? '#15803d' : '#b91c1c',
            fontWeight: 600,
          }}>
            {result.success ? '🎉 ' : '❌ '}{result.message}
          </div>
        )}
      </div>

      {/* Go attack link */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#1b3a5c', fontSize: '0.8rem', fontWeight: 600,
          textDecoration: 'none', letterSpacing: '0.05em',
        }}>
          ← Go to the Login Demo to start your attack
        </Link>
      </div>
    </div>
  );
}
