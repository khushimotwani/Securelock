import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (store.isLockedDown()) {
    return NextResponse.json(
      { error: 'System is locked down.' },
      { status: 403 }
    );
  }

  try {
    const { username, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Simple vulnerable authentication logic bypass detection
    const sqlInjectionRegex = /(' OR '1'='1'|' OR 1=1;|admin'--)/i;
    const isDetectionActive = store.isDetectionActive();

    if (isDetectionActive && (sqlInjectionRegex.test(username) || sqlInjectionRegex.test(password))) {
      store.addLog({
        type: 'SQL_INJECTION',
        message: `Detected potential SQL injection attack in login attempt for username: ${username}`,
        ip,
      });
      return NextResponse.json(
        { error: 'Suspicious input detected.' },
        { status: 400 }
      );
    }

    // IF DETECTION IS INACTIVE, WE ACTUALLY PROCESS THE VULNERABLE SQLi BYPASS!
    const isSuccessfulBypass = !isDetectionActive && (username.includes("' OR") || username.includes("admin'--"));

    if (isSuccessfulBypass || (username === 'admin' && password === 'admin123')) {
      store.addLog({
        type: 'NORMAL',
        message: isSuccessfulBypass ? `Authentication bypassed via SQLi payload: ${username}` : 'Successful login for user: admin',
        ip,
      });
      return NextResponse.json({ success: true, message: isSuccessfulBypass ? 'CRITICAL: Auth Bypassed via SQLi payload!' : 'Login successful' });
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
