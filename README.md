# SecureLockTS

**A Self-Lockdown Application for Real-Time Attack Detection and Automated System Protection**

*Khushi, Taiba, Heer*

---

## Overview

SecureLockTS is a TypeScript web application built with Next.js that demonstrates how proactive, built-in security mechanisms can detect and respond to cyberattacks in real time. The application is styled as a decoy frontend—**"God Bless America — A Patriot's Blog"**—but underneath, it intentionally includes controlled vulnerabilities alongside an AI-powered Sentinel detection engine. The system monitors input patterns and automatically locks down when attack thresholds are breached.

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 + TypeScript (strict mode) | Full-stack web application with API routes |
| **Database** | SQLite (via `sqlite3`) | Stores user credentials (scrypt-hashed passwords) for auth demo |
| **AI Detection** | Google Gemini API (`gemini-2.5-flash`) | Analyzes payloads for malicious intent in real time |
| **State Management** | In-memory cache + async JSON persistence | Tracks logs, anomaly count, lockdown state, rate limits, and IP bans |
| **Password Hashing** | Node.js `crypto.scrypt` | OWASP-recommended KDF with random salt and timing-safe comparison |
| **Static Analysis** | ESLint + `eslint-plugin-security`, TypeScript strict mode | Identifies unsafe coding patterns at build time |
| **Security Headers** | Next.js config (CSP, HSTS, X-Frame-Options, etc.) | Defense-in-depth HTTP hardening |

## Target Vulnerabilities

| # | Vulnerability | CWE | Endpoint | Description |
|---|---|---|---|---|
| 1 | **SQL Injection** | CWE-89 | `/api/auth`, `/api/ctf` | User input is concatenated directly into SQL queries when `secureMode` is off |
| 2 | **OS Command Injection** | CWE-78 | `/api/command` | User input is passed directly to `child_process.exec()` when `secureMode` is off |
| 3 | **Reflected XSS** | CWE-79 | `/api/xss` | User-supplied HTML is returned unescaped when `secureMode` is off |
| 4 | **Path Traversal** | CWE-22 | `/blog/[slug]` | Application resolves user-provided paths allowing for unauthorized filesystem access |

Each vulnerability has a **secure mode** toggle that demonstrates the proper remediation (parameterized queries, input validation, canonicalization, HTML escaping).

## Defensive Mechanisms

- **Sentinel AI Engine** — LLM-powered payload analysis via Google Gemini with automatic regex fallback when API is unavailable
- **WAF Middleware** — HTTP verb filtering, URL encoding validation, payload size constraints
- **Rate Limiting** — Sliding-window IP-based rate limiter (15 req/10s) to prevent brute-force and DDoS
- **Automatic Lockdown** — After 3 anomalies, all API endpoints return `403 Forbidden`
- **Tarpit Defense** — Malicious requests are artificially delayed by 5 seconds to exhaust attacker resources
- **IP Banning & Rickroll Redirect** — Banned IPs are redirected to a YouTube rickroll
- **Honeypot Endpoint** — `/api/admin/dump` streams infinite junk JSON to crash attacker tools
- **Security Headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## Pages

| Route | Description |
|---|---|
| `/` | **A Patriot's Blog** (Decoy corporate/blog frontend) |
| `/blog/[slug]` | Individual blog articles — Test Path Traversal here |
| `/ctf` | **Capture the Flag** — Interactive SQL Injection challenge to retrieve the flag |
| `/vulnlab` | **Vulnerability Lab** — Side-by-side comparison of secure vs vulnerable code |
| `/login` | Authentication page — Test SQL injection here |
| `/test-injection` | Command execution terminal — Test OS command injection here |
| `/xss-test` | XSS lab — Test reflected cross-site scripting here |
| `/sentinel` | Real-time security monitoring dashboard with live syslog feed |

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- (Optional) A Google Gemini API key for AI-powered detection

### Installation

```bash
git clone https://github.com/your-repo/Securelock.git
cd Securelock
npm install
```

### Running

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required for AI-powered threat detection
GEMINI_API_KEY=your_gemini_api_key_here

# Admin session token — change to a strong random secret in production
# Generate one with: openssl rand -base64 32
ADMIN_SESSION_TOKEN=your_secret_token_here
```

> **Note:** If `ADMIN_SESSION_TOKEN` is not set, a development-only fallback is used. For production, always set this to a cryptographically random value.

### Running the Test Bench

With the dev server running in another terminal:

```bash
# Full verification test bench (all security mechanisms)
npm test

# Individual test suites
npm run test:attacks          # Sequential attack simulation
npm run test:rate-limit       # DDoS/brute-force stress test
```

### Static Analysis

```bash
# Run ESLint with security plugin
npm run lint

# Generate JSON report
npx eslint src/ --format json -o eslint-report.json
```

## Troubleshooting

- **Port 3000 in use**: If you encounter an error stating `Port 3000 is in use` or `Unable to acquire lock`, you can terminate the existing process using `kill -9 $(lsof -t -i:3000)` and run `npm run dev` again.
- **Middleware Warning**: You might see a warning about the `middleware` file convention being deprecated in Next.js 16. This does not affect the core application functionality.
- **Dependencies Missing**: If you get errors related to missing modules like `tailwindcss` or `lucide-react`, ensure you have run `npm install` directly in the project root.

## Static Analysis Tools

- **ESLint + `eslint-plugin-security`** — Detects unsafe regex, `eval()` usage, non-literal `exec()` calls, and other security anti-patterns
- **TypeScript Strict Mode** — Enforces strict type checking, eliminating `any` type leaks and ensuring safe error handling
- **SonarQube** (configured via `sonar-project.properties`) — Advanced SAST including taint analysis for injection tracking

## References

- OWASP Foundation. (2025). *OWASP Top 10:2025*. https://owasp.org/Top10/
- Bathgate, R. (2026). *The vast majority of breaches are enabled by preventable gaps*. IT Pro.
- Kobie, N. (2025). *74% of companies admit insecure code caused a security breach*. IT Pro.
- SonarSource. (2025). *Advanced code security tool for developers*. https://www.sonarsource.com/solutions/security/
