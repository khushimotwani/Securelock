const baseUrl = 'http://localhost:3000';

async function fetchAndLog(url, method, body) {
  const res = await globalThis.fetch(baseUrl + url, {
    method,
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (TestBench)' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  console.log(`[${res.status}] ${method} ${url}: ${text}`);
  return { status: res.status, data: JSON.parse(text) };
}

async function run() {
  console.log('--- RESETTING ENVIRONMENT ---');
  await fetchAndLog('/api/status', 'POST');
  
  console.log('\n--- SENTINEL ON: COMMAND INJECTION INTERCEPT ---');
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami' });
  
  console.log('\n--- OFFLINING SENTINEL WAF ---');
  await fetchAndLog('/api/sentinel', 'POST', { action: 'toggle' });
  
  console.log('\n--- SENTINEL OFF: COMMAND INJECTION (VULNERABLE POSTURE) ---');
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami' });

  console.log('\n--- SENTINEL OFF: COMMAND INJECTION (SECURE MODE) ---');
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami', secureMode: true });

  console.log('\n--- SENTINEL OFF: SQL INJECTION (VULNERABLE) ---');
  await fetchAndLog('/api/auth', 'POST', { username: "admin'--", password: "bla" });

  console.log('\n--- SENTINEL OFF: SQL INJECTION (SECURE MODE) ---');
  await fetchAndLog('/api/auth', 'POST', { username: "admin'--", password: "bla", secureMode: true });

  console.log('\n--- TRIGGERING CRITICAL LOCKDOWN ---');
  // Toggle Sentinel Back ON to trigger anomalies
  await fetchAndLog('/api/sentinel', 'POST', { action: 'toggle' }); 
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami' }); // Anomaly 1 
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami' }); // Anomaly 2
  await fetchAndLog('/api/command', 'POST', { cmd: 'whoami' }); // Anomaly 3 triggers lockdown
  
  console.log('\n--- DIRECT API HIT DURING LOCKDOWN ---');
  // Attempt to hit the route again expecting a 403.
  await fetchAndLog('/api/command', 'POST', { cmd: 'echo test' });
}
run();
