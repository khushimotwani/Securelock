import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: The CTF flag lives ONLY in the database (flag column on the admin user row).
// It is intentionally NOT hardcoded here — participants must exploit the SQL injection
// vulnerability to extract it from the DB. Reading this source file gives nothing.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const flag = typeof body.flag === 'string' ? body.flag.trim() : '';

    if (!flag || flag.length === 0 || flag.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Invalid flag format.' },
        { status: 400 }
      );
    }

    // Retrieve the real flag from the DB — never from a source-visible constant
    const db = await getDb();
    const adminRow = await db.get(
      'SELECT flag FROM users WHERE username = ?',
      ['admin']
    );
    const realFlag: string = adminRow?.flag ?? '';

    if (realFlag && flag === realFlag) {
      store.unlockAchievement(
        'ctf',
        '🚩 Flag Captured!',
        'You exploited the SQL injection vulnerability and found the hidden flag.',
        '🚩'
      );
      return NextResponse.json({
        success: true,
        message: 'Congratulations! Flag accepted. Achievement unlocked!',
        achievement: {
          id: 'ctf',
          title: '🚩 Flag Captured!',
          description: 'You exploited the SQL injection vulnerability and found the hidden flag.',
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Incorrect flag. Keep trying!' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

// GET returns a subtle hint encoded in the response that skilled CTF players will find
export async function GET() {
  return NextResponse.json(
    { status: 'CTF module active', hint: 'The truth is in the query...', version: '1.0.0' },
    {
      headers: {
        // Hidden hint in a response header — standard CTF trick
        'X-CTF-Hint': 'Try: insecure mode + SQLi -> check the returned data',
      },
    }
  );
}
