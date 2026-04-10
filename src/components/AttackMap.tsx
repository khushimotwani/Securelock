'use client';
import { useEffect, useRef, useState } from 'react';

type AttackDot = {
  id: string;
  x: number;
  y: number;
  country: string;
  severity: string;
  createdAt: number;
  opacity: number;
};

type LogEntry = {
  id: string;
  type: string;
  lat?: number;
  lon?: number;
  country?: string;
  severity?: string;
  timestamp: string;
};

// Robinson projection approximation: maps lat/lon to SVG (0-100) space
function project(lat: number, lon: number): { x: number; y: number } {
  // Simple equirectangular for SVG simplicity, mapped to our viewbox
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  default: '#ef4444',
};

const ATTACK_TYPES = [
  'SQL_INJECTION', 'COMMAND_INJECTION', 'XSS_INJECTION', 'PATH_TRAVERSAL',
  'SSRF', 'TEMPLATE_INJECTION', 'HEADER_INJECTION', 'XXE', 'LDAP_INJECTION',
  'ENCODED_ATTACK', 'SCANNER_DETECTED',
];

export default function AttackMap({ logs }: { logs: LogEntry[] }) {
  const [dots, setDots] = useState<AttackDot[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const now = Date.now();
    const newDots: AttackDot[] = [];

    for (const log of logs) {
      if (seenIds.current.has(log.id)) continue;
      if (!ATTACK_TYPES.includes(log.type)) continue;

      seenIds.current.add(log.id);

      let lat = log.lat;
      let lon = log.lon;

      // If no geo data, use a random "attacker" location for demo
      if (lat == null || lon == null) {
        const demoCoords = [
          [55.75, 37.62], [39.92, 116.39], [51.51, -0.13], [48.86, 2.35],
          [40.34, 127.51], [32.43, 53.69], [-14.24, -51.93], [28.61, 77.21],
        ];
        const pick = demoCoords[Math.floor(Math.random() * demoCoords.length)];
        lat = pick[0]; lon = pick[1];
      }

      const { x, y } = project(lat, lon);
      newDots.push({
        id: log.id,
        x,
        y,
        country: log.country || 'Unknown',
        severity: log.severity || 'CRITICAL',
        createdAt: now,
        opacity: 1,
      });
    }

    if (newDots.length > 0) {
      setDots(prev => [...newDots, ...prev].slice(0, 60));
    }
  }, [logs]);

  // Fade out dots over time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setDots(prev =>
        prev
          .map(d => ({ ...d, opacity: Math.max(0, 1 - (now - d.createdAt) / 8000) }))
          .filter(d => d.opacity > 0.02)
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: '#0a1628', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #1e3a5f' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px #ef4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Live Attack Map
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.05em' }}>
          {dots.length} active threats
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', paddingBottom: '50%' }}>
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Ocean background */}
          <rect width="100" height="50" fill="#0a1628" />

          {/* Grid lines */}
          {[-60, -30, 0, 30, 60].map(lat => {
            const y = ((90 - lat) / 180) * 50;
            return <line key={lat} x1="0" y1={y} x2="100" y2={y} stroke="#1e3a5f" strokeWidth="0.2" opacity="0.5" />;
          })}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const x = ((lon + 180) / 360) * 100;
            return <line key={lon} x1={x} y1="0" x2={x} y2="50" stroke="#1e3a5f" strokeWidth="0.2" opacity="0.5" />;
          })}

          {/* Simplified continent outlines — filled polygons */}
          {/* North America */}
          <polygon points="8,8 22,6 26,10 24,18 20,22 14,20 10,16 6,12" fill="#1e3a5f" opacity="0.7" />
          {/* South America */}
          <polygon points="20,24 28,22 30,28 28,36 24,40 18,36 16,30" fill="#1e3a5f" opacity="0.7" />
          {/* Europe */}
          <polygon points="44,6 56,6 58,10 54,14 48,14 44,10" fill="#1e3a5f" opacity="0.7" />
          {/* Africa */}
          <polygon points="46,14 58,14 60,20 58,30 54,36 48,36 44,28 44,20" fill="#1e3a5f" opacity="0.7" />
          {/* Asia */}
          <polygon points="58,4 90,4 92,10 88,14 84,12 76,16 68,14 62,10 58,8" fill="#1e3a5f" opacity="0.7" />
          {/* South/SE Asia */}
          <polygon points="64,16 82,16 84,22 80,26 72,24 64,22" fill="#1e3a5f" opacity="0.7" />
          {/* Australia */}
          <polygon points="76,32 88,30 90,36 88,40 80,40 74,38" fill="#1e3a5f" opacity="0.7" />

          {/* Equator highlight */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#1e4a6f" strokeWidth="0.3" strokeDasharray="1,1" />

          {/* Attack dots */}
          {dots.map(dot => {
            const color = SEVERITY_COLORS[dot.severity] || SEVERITY_COLORS.default;
            const svgX = dot.x;
            const svgY = dot.y * 0.5; // scale to viewbox height
            return (
              <g key={dot.id} opacity={dot.opacity}>
                {/* Outer ring */}
                <circle cx={svgX} cy={svgY} r="1.5" fill="none" stroke={color} strokeWidth="0.3" opacity={0.5}>
                  <animate attributeName="r" values="1;3;1" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Inner dot */}
                <circle cx={svgX} cy={svgY} r="0.6" fill={color} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid #1e3a5f', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {Object.entries(SEVERITY_COLORS).filter(([k]) => k !== 'default').map(([sev, color]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.08em' }}>{sev}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#334155' }}>ip-api.com geolocation</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
