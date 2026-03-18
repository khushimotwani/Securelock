import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    isLockedDown: store.isLockedDown(),
    failCount: store.getFailCount(),
    isSentinelActive: store.isDetectionActive(),
    logs: store.getLogs(),
  });
}

// Global memory resets (for testing)
export async function POST() {
  store.reset();
  return NextResponse.json({ success: true });
}
