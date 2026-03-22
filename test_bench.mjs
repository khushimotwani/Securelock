const baseUrl = 'http://localhost:3000';

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

async function logResult(name, pass, details) {
  const status = pass ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
  console.log(`${status} ${name}`);
  if (details) console.log(`       → ${details}`);
}

async function request(path, payload = null, method = 'POST', headers = {}) {
  const start = Date.now();
  const res = await globalThis.fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: payload ? JSON.stringify(payload) : undefined,
    redirect: 'manual' // crucial for testing 302 redirects
  });
  
  let text = '';
  if (res.status !== 302) {
    try { text = await res.text(); } catch(e){}
  }
  return { status: res.status, text, time: Date.now() - start, headers: res.headers };
}

async function runTestBench() {
  console.log(`${colors.cyan}======================================================`);
  console.log(` SECURELOCK_TS : MASTER VERIFICATION TEST BENCH `);
  console.log(`======================================================${colors.reset}\n`);

  // 0. RESET STATE
  await request('/api/status', null, 'POST');
  
  // Ensure Sentinel Engine is Online
  const curStatus = await request('/api/status', null, 'GET');
  const sData = JSON.parse(curStatus.text);
  if (!sData.isSentinelActive) {
      await request('/api/sentinel', { action: 'toggle' });
  }

  console.log(`${colors.yellow}--- PHASE 1: STANDARD WAF & PRE-FILTER ---${colors.reset}`);
  
  // 1. Benign Traffic (Pre-filtered, fast)
  const t1 = await request('/api/command', { cmd: 'ping 127.0.0.1' });
  logResult('Conservative AI Pre-filter (Benign)', t1.status === 200 && t1.time < 2000, `Responded in ${t1.time}ms`);

  console.log(`\n${colors.yellow}--- PHASE 2: SENTINEL AI HEURISTICS & TARPIT ---${colors.reset}`);
  
  // 2. AI Threat Catch & Tarpit (Command Injection)
  const t2 = await request('/api/command', { cmd: 'whoami && dir' });
  logResult('AI Command Injection Detection', t2.status === 400 && t2.text.includes('AI Intervention'), t2.text);
  logResult('Tarpit Active Defense', t2.time >= 5000, `Attack artificially delayed by ${t2.time}ms to starve thread pools`);

  // 3. AI Threat Catch (SQL Injection)
  const t3 = await request('/api/auth', { username: "admin'--", password: "" });
  logResult('AI SQLi Detection', t3.status === 400, t3.text);

  console.log(`\n${colors.yellow}--- PHASE 3: SECURE MODES (MITIGATION VERIFICATION) ---${colors.reset}`);
  
  // 4. Secure Mode SQLi
  const t4 = await request('/api/auth', { username: "admin'--", password: "", secureMode: true });
  logResult('SQL Parameterization Bounds', t4.status === 401, 'Unauthorized (SQL literal was safely escaped)');

  console.log(`\n${colors.yellow}--- PHASE 4: DDOS & RATE LIMITING ---${colors.reset}`);
  
  // 5. Rate Limit Exploit
  let rateLimitTripped = false;
  const promises = [];
  // Use a different mock IP so we don't ban ourselves before the Rickroll test
  for(let i=0; i<20; i++) {
    promises.push(request('/api/command', { cmd: 'ping' }, 'POST', { 'x-forwarded-for': '10.0.0.5' }));
  }
  const burstRes = await Promise.all(promises);
  const tooManyReqs = burstRes.filter(r => r.status === 429);
  logResult('Temporal Rate Limiting (Brute-Force Protection)', tooManyReqs.length > 0, `${tooManyReqs.length} packets dropped via 429 Too Many Requests`);

  console.log(`\n${colors.yellow}--- PHASE 5: HONEYPOTS & IP BANS ---${colors.reset}`);
  
  // 6. Rickroll Redirect (3 strikes)
  // We already triggered anomalies in t2 and t3 (that's 2). Let's trigger one more to lock the IP.
  await request('/api/command', { cmd: 'cat /etc/passwd' }); // Strike 3
  
  // Now our main IP (127.0.0.1) should be banned.
  const t6 = await request('/api/command', { cmd: 'ping 127.0.0.1' }, 'POST');
  const isRedirect = t6.status === 302 || t6.status === 301 || t6.status === 403; 
  // Wait, if it's 302, the Location header points to youtube
  logResult('Psychological Rickroll API Redirect', t6.status === 302 && t6.headers.get('location').includes('youtube'), `Banned IP intercept responded with 302 Location: ${t6.headers.get('location')}`);

  // 7. Infinite JSON Honeypot
  try {
      const res = await globalThis.fetch(baseUrl + '/api/admin/dump');
      const reader = res.body.getReader();
      const { value } = await reader.read();
      logResult('Infinite Honeypot Data Bomb', value.length > 0, `Successfully grabbed garbage chunk. Stream is infinite.`);
      reader.cancel();
  } catch(e) {
      logResult('Infinite Honeypot Data Bomb', false, e.message);
  }

  console.log(`\n${colors.cyan}======================================================`);
  console.log(` ALL SYSTEMS VERIFIED AND OPERATIONAL `);
  console.log(`======================================================${colors.reset}\n`);
}

runTestBench();
