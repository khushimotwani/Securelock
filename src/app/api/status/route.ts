import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    isLockedDown: store.isLockedDown(),
    failCount: store.getFailCount(),
    logs: store.getLogs(),
  });
}

// Global memory resets (for testing)
export async function POST() {
  store.reset();
  return NextResponse.json({ success: true });
}
