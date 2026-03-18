async function runTests() {
  console.log("Starting attack simulations...");
  
  // 1. SQL Injection attempt
  let res = await fetch("http://localhost:3000/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin'--", password: "123" })
  });
  console.log("SQLi attempt 1:", await res.json());

  // 2. Command Injection attempt
  res = await fetch("http://localhost:3000/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: "ls -la; cat /etc/passwd" })
  });
  console.log("CMD Inject attempt 2:", await res.json());

  // 3. Brute-force attempt
  res = await fetch("http://localhost:3000/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong_password" })
  });
  console.log("Bruteforce attempt 3:", await res.json());

  // 4. Status Check
  res = await fetch("http://localhost:3000/api/status");
  const status = await res.json();
  console.log("Final Status:", status);
  if(status.isLockedDown) {
      console.log("✅ SUCCESS: System correctly locked down after 3 attempts.");
  } else {
      console.log("❌ FAILURE: System did not lock down.");
  }
}

runTests();
