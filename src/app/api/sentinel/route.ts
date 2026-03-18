import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    if (action === 'toggle') {
      const newState = store.toggleSentinel();
      return NextResponse.json({ success: true, isSentinelActive: newState });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
