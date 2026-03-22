import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getDb } from '@/lib/db';
import { analyzePayload } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // ---------------------------------------------------------------------------------
  // PSYCHOLOGICAL WARFARE: RICKROLL BANNED IPs
  // ---------------------------------------------------------------------------------
  if (store.isBanned(ip)) {
     return NextResponse.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 302);
  }

  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down. API requests are blocked at the server level (403 Forbidden).' },
      { status: 403 }
    );
  }

  try {
    const userAgent = req.headers.get('user-agent') || 'Unknown Origin';

    // ---------------------------------------------------------------------------------
    // RATE LIMITING & DDOS PREVENTION
    // ---------------------------------------------------------------------------------
    if (!store.checkRateLimit(ip, userAgent)) {
      return NextResponse.json(
        { error: '429 Too Many Requests. Network velocity limits breached. Traffic dropped.' },
        { status: 429 }
      );
    }

    // ---------------------------------------------------------------------------------
    // PAYLOAD SIZE CONSTRAINTS (Preventing Buffer Exhaustion)
    // ---------------------------------------------------------------------------------
    const rawBody = await req.text();
    if (rawBody.length > 800) {
      return NextResponse.json(
        { error: '413 Payload Too Large. Sentinel Edge Constraint Violated.' },
        { status: 413 }
      );
    }

    const { username, password, secureMode = false } = JSON.parse(rawBody);
    const isDetectionActive = store.isDetectionActive();
    
    // ---------------------------------------------------------------------------------
    // AI-POWERED THREAT DETECTION (SENTINEL LLM)
    // ---------------------------------------------------------------------------------
    if (isDetectionActive) {
      const evaluation = await analyzePayload(
        `Username: ${username} | Password: ${password}`, 
        "SQL Authentication Credentials Layer"
      );
      
      if (evaluation.isMalicious) {
        store.addLog({
          type: 'SQL_INJECTION',
          message: `Sentinel AI blocked login attempt for user: ${username} (Confidence: ${evaluation.confidence}%)`,
          ip,
          userAgent,
          aiReasoning: evaluation.reasoning,
        });
        
        // ---------------------------------------------------------------------------------
        // TARPIT ACTIVE DEFENSE (Starve the Attacker's Threads)
        // ---------------------------------------------------------------------------------
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return NextResponse.json(
          { error: `AI Intervention: Blocked due to malicious intent. Reason: ${evaluation.reasoning}` },
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
      userRecord = await db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?', 
        [username, password]
      );
    } else {
      const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
      try {
        userRecord = await db.get(query);
      } catch (err: unknown) {
        return NextResponse.json({ error: 'Database Syntax Error' }, { status: 500 });
      }
    }

    // ---------------------------------------------------------------------------------
    // AUTHENTICATION DECISION
    // ---------------------------------------------------------------------------------
    if (userRecord) {
      const isSuccessfulBypass = userRecord.username === 'admin' && password !== 'admin123';
      
      store.addLog({
        type: 'NORMAL',
        message: isSuccessfulBypass 
          ? `CRITICAL: Authentication bypassed via SQLi payload. Logged in as: ${userRecord.username}` 
          : `Successful login for user: ${userRecord.username}`,
        ip,
        userAgent
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
        userAgent
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
