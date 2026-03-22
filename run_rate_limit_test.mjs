const baseUrl = 'http://localhost:3000';

const USER_AGENT_SPOOF = 'Automated-Vulnerability-Scraper-Bot/v9.0 Build/Nightly';

async function fireRequest(id) {
  try {
    const res = await globalThis.fetch(baseUrl + '/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT_SPOOF, 
        'X-Forwarded-For': '192.168.1.100' // Simulating external IP
      },
      body: JSON.stringify({ cmd: 'whoami' })
    });
    const text = await res.text();
    console.log(`[Req #${id}] Status: ${res.status}. Response: ${text.substring(0, 100)}`);
  } catch (err) {
    console.error(`[Req #${id}] Failed:`, err.message);
  }
}

async function runStressTest() {
  console.log('--- INITIALIZING SENTINEL RATE-LIMIT & FORENSIC PENETRATION TEST ---');
  
  // Reset any past state
  await globalThis.fetch(baseUrl + '/api/status', { method: 'POST' });
  // Ensure Sentinel is ON
  await globalThis.fetch(baseUrl + '/api/sentinel', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({ action: 'toggle' }) 
  }); 

  console.log('\\n[!] Blasting 20 concurrent requests at the backend in &lt;1000ms...\\n');
  const promises = [];
  for (let i = 1; i <= 20; i++) {
    promises.push(fireRequest(i));
  }
  
  await Promise.all(promises);
  console.log('\\n[✓] Stress Test Completed.');
  console.log('Check the Next.js Dashboard UI (http://localhost:3000).');
  console.log(`You should see the Syslog identifying: "${USER_AGENT_SPOOF}" and dropping 5+ requests via "RATE_LIMIT_EXCEEDED".`);
}

runStressTest();
