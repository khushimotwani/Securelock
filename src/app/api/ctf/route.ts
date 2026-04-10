import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

// The CTF flag is also hidden in the DB (flag column on admin user)
const CTF_FLAG = 'FLAG{s3cur3l0ck_SQLi_m4st3r}';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const flag = typeof body.flag === 'string' ? body.flag.trim() : '';

    if (flag === CTF_FLAG) {
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
        'X-CTF-Hint': 'Try: insecure mode + SQLi → check the returned data',
      },
    }
  );
}
