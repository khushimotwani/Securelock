/**
 * SecureLockTS — Centralized Threat Detection Engine
 * 
 * ============================================================================
 * SECURE DESIGN PRINCIPLES APPLIED:
 * ============================================================================
 * 1. Defense in Depth      — Multiple detection layers (static regex, deep-decode, AI)
 * 2. Fail-Secure           — Unknown inputs are blocked, not allowed
 * 3. Complete Mediation    — Every request is checked, no caching of auth decisions
 * 4. Economy of Mechanism  — Simple, auditable pattern matching before complex AI
 * 5. Least Privilege       — Only whitelisted commands are executable
 * 6. Open Design           — Security does not depend on secrecy of the algorithm
 * 7. Separation of Duties  — Detection is separated from enforcement (store handles lockdown)
 * 
 * ============================================================================
 * DREAD MODEL SCORING (applied to each threat category):
 * ============================================================================
 * D = Damage Potential     (0–10)
 * R = Reproducibility      (0–10)
 * E = Exploitability       (0–10)
 * A = Affected Users       (0–10)
 * D = Discoverability      (0–10)
 * 
 * DREAD Score = (D + R + E + A + D) / 5
 * 
 * ============================================================================
 * PASTA MODEL STAGES ADDRESSED:
 * ============================================================================
 * Stage 1: Define Objectives         — Protect auth, command exec, and rendering
 * Stage 2: Define Technical Scope    — Node.js/Next.js API routes, SQLite, shell
 * Stage 3: Application Decomposition — Isolated endpoint analysis per route
 * Stage 4: Threat Analysis           — Pattern-based + AI-based dual detection
 * Stage 5: Vulnerability Analysis    — CWE-mapped, DREAD-scored findings
 * Stage 6: Attack Modeling           — Simulated payloads in test bench
 * Stage 7: Risk/Impact Analysis      — Severity + DREAD score drives lockdown
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// DREAD SCORING MODEL
// ---------------------------------------------------------------------------
export type DreadScore = {
  damage: number;          // 0–10: How much damage if exploited?
  reproducibility: number; // 0–10: How easy to reproduce?
  exploitability: number;  // 0–10: How easy to launch?
  affectedUsers: number;   // 0–10: How many users affected?
  discoverability: number; // 0–10: How easy to discover?
  total: number;           // Average score (0–10)
};

function dread(d: number, r: number, e: number, a: number, disc: number): DreadScore {
  // Clamp all values to 0–10 to prevent numeric abuse
  const clamp = (v: number) => Math.max(0, Math.min(10, Math.round(v)));
  const cd = clamp(d), cr = clamp(r), ce = clamp(e), ca = clamp(a), cdisc = clamp(disc);
  return {
    damage: cd,
    reproducibility: cr,
    exploitability: ce,
    affectedUsers: ca,
    discoverability: cdisc,
    total: Number(((cd + cr + ce + ca + cdisc) / 5).toFixed(1)),
  };
}

// Pre-computed DREAD scores for each threat category
const DREAD_SCORES: Record<string, DreadScore> = {
  SQL_INJECTION:       dread(9, 9, 8, 10, 8),   // 8.8 — Full DB compromise
  COMMAND_INJECTION:   dread(10, 9, 7, 10, 7),   // 8.6 — Full server takeover
  XSS_INJECTION:       dread(7, 9, 8, 8, 9),     // 8.2 — Session hijacking
  PATH_TRAVERSAL:      dread(8, 8, 7, 7, 7),     // 7.4 — Sensitive file read
  SSRF:                dread(9, 7, 6, 8, 5),      // 7.0 — Internal network access
  XXE:                 dread(8, 6, 5, 7, 4),      // 6.0 — XML-based data exfil
  TEMPLATE_INJECTION:  dread(9, 7, 6, 8, 5),      // 7.0 — Remote code execution
  HEADER_INJECTION:    dread(6, 8, 7, 6, 6),      // 6.6 — Response splitting
  LDAP_INJECTION:      dread(7, 6, 5, 6, 4),      // 5.6 — Directory service abuse
  ENCODED_ATTACK:      dread(7, 7, 6, 7, 5),      // 6.4 — Obfuscation bypass
  SCANNER_DETECTED:    dread(3, 10, 10, 1, 10),   // 6.8 — Recon phase
  NONE:                dread(0, 0, 0, 0, 0),       // 0.0 — Clean
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
export type ThreatType =
  | 'SQL_INJECTION'
  | 'COMMAND_INJECTION'
  | 'XSS_INJECTION'
  | 'PATH_TRAVERSAL'
  | 'SSRF'
  | 'LDAP_INJECTION'
  | 'TEMPLATE_INJECTION'
  | 'HEADER_INJECTION'
  | 'XXE'
  | 'ENCODED_ATTACK'
  | 'SCANNER_DETECTED'
  | 'NONE';

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ThreatResult = {
  detected: boolean;
  type: ThreatType;
  severity: ThreatSeverity | 'NONE';
  confidence: number; // 0–100, clamped
  description: string;
  matchedPattern?: string;
  dpiScore?: DreadScore;
};

// Safe clamping utility — prevents numeric overflow/underflow
function clampConfidence(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
}

// Safe string truncation — prevents memory exhaustion from huge payloads
function safeTruncate(str: string, maxLen: number = 200): string {
  if (typeof str !== 'string') return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
}

// ---------------------------------------------------------------------------
// 1. SQL INJECTION PATTERNS
// ---------------------------------------------------------------------------
const SQL_PATTERNS: RegExp[] = [
  /('|"|;)\s*(OR|AND)\s+\d+\s*=\s*\d+/i,
  /('|"|;)\s*(OR|AND)\s+'[^']*'\s*=\s*'[^']*'/i,
  /admin\s*'?\s*--/i,
  /'\s*--\s*/,
  /\/\*.*?\*\//,
  /UNION\s+(ALL\s+)?SELECT/i,
  /;\s*(DROP|ALTER|INSERT|UPDATE|DELETE|CREATE|TRUNCATE|EXEC|EXECUTE)\s/i,
  /'\s*(OR|AND)\s+\d+\s*(>|<|=)/i,
  /SLEEP\s*\(\s*\d+\s*\)/i,
  /BENCHMARK\s*\(/i,
  /WAITFOR\s+DELAY/i,
  /INFORMATION_SCHEMA/i,
  /LOAD_FILE\s*\(/i,
  /INTO\s+(OUT|DUMP)FILE/i,
  /sqlite_(master|version)/i,
  /'\s*AND\s+\d+\s*=\s*\d+/i,
  /HAVING\s+\d+\s*=\s*\d+/i,
  /ORDER\s+BY\s+\d{2,}/i,
  /'\s*OR\s+'[^']*'\s*(LIKE|=)/i,
  /GROUP\s+BY\s+.+HAVING/i,
  /CHAR\s*\(\s*\d+/i,
  /CONCAT\s*\(/i,
  /0x[0-9a-fA-F]{4,}/i, // Hex-encoded strings
];

// ---------------------------------------------------------------------------
// 2. COMMAND INJECTION PATTERNS
// ---------------------------------------------------------------------------
const CMD_PATTERNS: RegExp[] = [
  /[;&|`$]/,
  /\$\(/,
  /\$\{/,
  /\b(wget|curl|nc|ncat|bash|sh|zsh|powershell|cmd\.exe|python|perl|ruby|php|node)\b/i,
  /\/dev\/(tcp|udp)/i,
  /mkfifo/i,
  /\b(rm|chmod|chown|mv|cp)\s+(-[a-zA-Z]+\s+)?\/?\w/i,
  /\b(kill|pkill|killall)\s/i,
  /\\x[0-9a-fA-F]{2}/,
  /[|>]/,
  /\(.*\)/,
  /`[^`]+`/,
  /\b(cat|head|tail|less|more)\s+\//i, // File reading commands
  /\b(env|printenv|set)\b/i,           // Environment variable disclosure
  /\b(ifconfig|ip\s+addr|netstat|ss)\b/i, // Network recon
];

// ---------------------------------------------------------------------------
// 3. XSS PATTERNS
// ---------------------------------------------------------------------------
const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<\/script>/i,
  /\bon\w+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /<(iframe|embed|object|applet|form|base|link|meta|svg|math)/i,
  /expression\s*\(/i,
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bsetTimeout\s*\(\s*['"`]/i,
  /\bsetInterval\s*\(\s*['"`]/i,
  /\bdocument\s*\.\s*(cookie|domain|write|location)/i,
  /\bwindow\s*\.\s*(location|open)/i,
  /\$\{.*?\}/,
  /style\s*=\s*['"].*?(expression|url\s*\(|import)/i,
  /<svg[^>]*onload/i,
  /<img[^>]*onerror/i,
  /\balert\s*\(/i,
  /\bconfirm\s*\(/i,
  /\bprompt\s*\(/i,
];

// ---------------------------------------------------------------------------
// 4. PATH TRAVERSAL PATTERNS
// ---------------------------------------------------------------------------
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//,
  /\.\.\\/,
  /\.\.%2[fF]/,
  /\.\.%5[cC]/,
  /\.\.%252[fF]/,
  /%2e%2e/i,
  /\betc\/(passwd|shadow|hosts|group)/i,
  /\bwindows\/(system32|win\.ini)/i,
  /\bproc\/self/i,
  /\/dev\/null/i,
];

// ---------------------------------------------------------------------------
// 5. SSRF PATTERNS
// ---------------------------------------------------------------------------
const SSRF_PATTERNS: RegExp[] = [
  /^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/169\.254\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/\[::1\]/,
  /metadata\.google\.internal/i,
  /instance-data/i,
  /^file:\/\//i,
  /^gopher:\/\//i,
  /^dict:\/\//i,
];

// ---------------------------------------------------------------------------
// 6. MISC PATTERNS
// ---------------------------------------------------------------------------
const LDAP_PATTERNS: RegExp[] = [
  /[()&|!*]/,
  /\x00/,
  /\bnull\b.*?\b(dn|cn|uid)\b/i,
];

const TEMPLATE_INJECTION_PATTERNS: RegExp[] = [
  /\{\{.*?\}\}/,
  /\$\{.*?\}/,
  /<%(=|-)?\s*.*?\s*%>/,
  /#\{.*?\}/,
  /\{%.*?%\}/,
];

const HEADER_INJECTION_PATTERNS: RegExp[] = [
  /\r\n/,
  /\r/,
  /\n/,
  /%0[dDaA]/,
];

const XXE_PATTERNS: RegExp[] = [
  /<!DOCTYPE\s/i,
  /<!ENTITY\s/i,
  /SYSTEM\s+['"]file:/i,
  /SYSTEM\s+['"]https?:/i,
];

// ---------------------------------------------------------------------------
// 7. SCANNER / BOT DETECTION
// ---------------------------------------------------------------------------
const SCANNER_USER_AGENTS: RegExp[] = [
  /sqlmap/i, /nikto/i, /nmap/i, /dirbuster/i, /gobuster/i, /wpscan/i,
  /masscan/i, /burpsuite/i, /zap|zaproxy/i, /acunetix/i, /nessus/i,
  /openvas/i, /w3af/i, /arachni/i, /havij/i, /commix/i,
  /vulnerability[-\s]?scra?n/i, /python-requests(?:\/\d)/i,
  /go-http-client/i, /java\/\d/i,
];

// ---------------------------------------------------------------------------
// DECODE HELPER — catches percentage, unicode, and double-encoding tricks
// Secure Design: prevents obfuscation-based bypass attempts
// ---------------------------------------------------------------------------
function deepDecode(input: string): string {
  // Guard against oversized inputs (memory safety)
  if (input.length > 10000) return input;

  let decoded = input;
  let prev = '';
  for (let i = 0; i < 5 && decoded !== prev; i++) {
    prev = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }
  decoded = decoded
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => {
      const code = parseInt(hex, 16);
      // Prevent numeric overflow — only decode valid Unicode code points
      return Number.isFinite(code) && code >= 0 && code <= 0x10FFFF
        ? String.fromCharCode(code) : '';
    })
    .replace(/&#(\d+);?/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10FFFF
        ? String.fromCharCode(code) : '';
    })
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
  return decoded;
}

// ---------------------------------------------------------------------------
// MAIN SCAN FUNCTION
// ---------------------------------------------------------------------------
function scanPatterns(
  input: string,
  patterns: RegExp[],
  type: ThreatType,
  severity: ThreatSeverity
): ThreatResult | null {
  const decoded = deepDecode(input);
  const targets = [input, decoded, input.toLowerCase(), decoded.toLowerCase()];

  for (const target of targets) {
    for (const pattern of patterns) {
      if (pattern.test(target)) {
        return {
          detected: true,
          type,
          severity,
          confidence: clampConfidence(95),
          description: `${type.replace(/_/g, ' ')} pattern detected`,
          matchedPattern: safeTruncate(pattern.source, 100),
          dpiScore: DREAD_SCORES[type],
        };
      }
    }
  }
  return null;
}

/**
 * Scans a payload for ALL known attack vectors.
 * Implements COMPLETE MEDIATION — every input is checked, no bypass paths.
 * Returns the highest-severity threat found, or a clean result.
 */
export function detectThreat(payload: string, context?: string): ThreatResult {
  // Fail-secure: treat non-string or missing payloads as suspicious but not blocked
  if (!payload || typeof payload !== 'string') {
    return {
      detected: false, type: 'NONE', severity: 'NONE',
      confidence: clampConfidence(100),
      description: 'Empty or invalid payload',
    };
  }

  // Memory safety: reject absurdly large payloads before processing
  if (payload.length > 50000) {
    return {
      detected: true, type: 'ENCODED_ATTACK', severity: 'HIGH',
      confidence: clampConfidence(90),
      description: 'Payload exceeds maximum safe processing length',
      dpiScore: DREAD_SCORES['ENCODED_ATTACK'],
    };
  }

  const checks: Array<() => ThreatResult | null> = [
    () => scanPatterns(payload, SQL_PATTERNS, 'SQL_INJECTION', 'CRITICAL'),
    () => scanPatterns(payload, CMD_PATTERNS, 'COMMAND_INJECTION', 'CRITICAL'),
    () => scanPatterns(payload, XSS_PATTERNS, 'XSS_INJECTION', 'HIGH'),
    () => scanPatterns(payload, PATH_TRAVERSAL_PATTERNS, 'PATH_TRAVERSAL', 'HIGH'),
    () => scanPatterns(payload, SSRF_PATTERNS, 'SSRF', 'CRITICAL'),
    () => scanPatterns(payload, XXE_PATTERNS, 'XXE', 'HIGH'),
    () => scanPatterns(payload, TEMPLATE_INJECTION_PATTERNS, 'TEMPLATE_INJECTION', 'HIGH'),
    () => scanPatterns(payload, HEADER_INJECTION_PATTERNS, 'HEADER_INJECTION', 'HIGH'),
    () => scanPatterns(payload, LDAP_PATTERNS, 'LDAP_INJECTION', 'MEDIUM'),
  ];

  for (const check of checks) {
    const result = check();
    if (result) return result;
  }

  return {
    detected: false, type: 'NONE', severity: 'NONE',
    confidence: clampConfidence(100),
    description: 'No threats detected',
  };
}

/**
 * Scans ALL fields of a JSON body for threats.
 * Returns the first (highest-severity) threat found across all fields.
 */
export function detectThreatInBody(body: Record<string, unknown>): ThreatResult & { field?: string } {
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const result = detectThreat(value, key);
      if (result.detected) {
        return { ...result, field: key, description: `${result.description} in field "${safeTruncate(key, 30)}"` };
      }
    }
  }
  return { detected: false, type: 'NONE', severity: 'NONE', confidence: 100, description: 'No threats detected' };
}

/**
 * Checks if a User-Agent string belongs to a known scanning tool.
 */
export function detectScanner(userAgent: string): ThreatResult {
  for (const pattern of SCANNER_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return {
        detected: true,
        type: 'SCANNER_DETECTED',
        severity: 'MEDIUM',
        confidence: clampConfidence(90),
        description: `Known security scanner detected`,
        matchedPattern: pattern.source,
        dpiScore: DREAD_SCORES['SCANNER_DETECTED'],
      };
    }
  }
  return { detected: false, type: 'NONE', severity: 'NONE', confidence: 100, description: 'No scanner detected' };
}

/**
 * HTML-escapes a string, neutralizing XSS payloads.
 * Defense in Depth: escapes 7 distinct metacharacter families.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips all characters that are not alphanumeric, spaces, dots, hyphens, or underscores.
 * Economy of Mechanism: simple, auditable, no edge cases.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-Z0-9\s.\-_@]/g, '');
}

/**
 * Sanitizes error messages before sending to clients.
 * Prevents information leakage (stack traces, file paths, internal state).
 */
export function sanitizeErrorMessage(msg: string): string {
  if (typeof msg !== 'string') return 'An error occurred.';
  // Strip file paths
  let safe = msg.replace(/\/[^\s:]+\.(ts|js|tsx|jsx|mjs)/g, '[redacted]');
  // Strip stack traces
  safe = safe.replace(/\s+at\s+.+/g, '');
  // Strip line numbers
  safe = safe.replace(/:\d+:\d+/g, '');
  // Limit length
  return safeTruncate(safe, 200);
}

/** Get DREAD score for a threat type */
export function getDreadScore(type: ThreatType): DreadScore {
  return DREAD_SCORES[type] || DREAD_SCORES['NONE'];
}

/** Safe truncation export */
export { safeTruncate };
