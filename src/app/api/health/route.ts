import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for production monitoring.
 * Returns system vitals, security status, and self-heal info.
 */
export async function GET() {
  const status = store.getFullStatus();
  
  return NextResponse.json({
    status: status.isLockedDown ? 'LOCKDOWN' : 'OPERATIONAL',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    security: {
      sentinelActive: status.isSentinelActive,
      isLockedDown: status.isLockedDown,
      anomalyCount: status.failCount,
      lockdownThreshold: 3,
      totalAttacksBlocked: status.totalAttacksBlocked,
      selfHealCycles: status.healCount,
      bannedIPCount: status.bannedIPCount,
      lockdownTimestamp: status.lockdownTimestamp,
      cooldownMs: status.cooldownMs,
      timeUntilHeal: status.lockdownTimestamp 
        ? Math.max(0, status.cooldownMs - (Date.now() - status.lockdownTimestamp))
        : null,
    },
    node: {
      version: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage().heapUsed,
    },
  });
}
