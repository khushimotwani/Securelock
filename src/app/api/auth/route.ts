import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down. API requests are blocked at the server level (403 Forbidden).' },
      { status: 403 }
    );
  }

  try {
    const { username, password, secureMode = false } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const isDetectionActive = store.isDetectionActive();
    
    // ---------------------------------------------------------------------------------
    // SERVER-SIDE ATTACK DETECTION (WAF)
    // ---------------------------------------------------------------------------------
    if (isDetectionActive) {
      const sqlInjectionRegex = /(' OR '1'='1'|' OR 1=1|admin'--|;|UNION)/i;
      
      if (sqlInjectionRegex.test(username) || sqlInjectionRegex.test(password)) {
        store.addLog({
          type: 'SQL_INJECTION',
          message: `Sentinel intercepted SQL injection pattern in login for username: ${username}`,
          ip,
        });
        return NextResponse.json(
          { error: 'Suspicious input blocked by Sentinel Engine.' },
          { status: 400 }
        );
      }
    }

    const db = await getDb();
    let userRecord;

    // ---------------------------------------------------------------------------------
    // DATABASE QUERY EXECUTION
    // ---------------------------------------------------------------------------------
    if (secureMode) {
      // SECURE IMPLEMENTATION (For Report Comparison)
      // Uses parameterized queries which automatically escape single quotes and syntax.
      userRecord = await db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?', 
        [username, password]
      );
    } else {
      // VULNERABLE IMPLEMENTATION (Default)
      // Directly concatenates user input into the SQL string, enabling SQL injection!
      // CWE-89: Improper Neutralization of Special Elements used in an SQL Command
      const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
      
      try {
        userRecord = await db.get(query);
      } catch (err: unknown) {
        // If the injected SQL is malformed, the query will throw
        return NextResponse.json({ error: 'Database Syntax Error' }, { status: 500 });
      }
    }

    // ---------------------------------------------------------------------------------
    // AUTHENTICATION DECISION
    // ---------------------------------------------------------------------------------
    if (userRecord) {
      // Check if it was an actual bypass (logged in as admin without correct password)
      const isSuccessfulBypass = userRecord.username === 'admin' && password !== 'admin123';
      
      store.addLog({
        type: 'NORMAL',
        message: isSuccessfulBypass 
          ? `CRITICAL: Authentication bypassed via SQLi payload. Logged in as: ${userRecord.username}` 
          : `Successful login for user: ${userRecord.username}`,
        ip,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: isSuccessfulBypass 
          ? 'CRITICAL: Auth Bypassed via SQLi payload!' 
          : 'Login successful' 
      });
    } else {
      store.addLog({
        type: 'LOGIN_ATTEMPT',
        message: `Failed login attempt for username: ${username}`,
        ip,
      });
      return NextResponse.json(
        { error: 'Invalid credentials. Attempt logged.' },
        { status: 401 }
      );
    }

  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
