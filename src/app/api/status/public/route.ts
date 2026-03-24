import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = store.getFullStatus();
  return NextResponse.json({
    isLockedDown: status.isLockedDown,
    cooldownMs: 5 * 60 * 1000, // 5 min
    lockdownTimestamp: status.lockdownTimestamp
  });
}
