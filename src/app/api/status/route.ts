import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(store.getFullStatus());
}

import { cookies } from 'next/headers';

// Global memory resets (for testing)
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  
  if (!token || token.value !== 'securelock_authorized') {
    return NextResponse.json(
      { error: 'Unauthorized. Administrator credentials required to reset environment.' },
      { status: 401 }
    );
  }

  store.reset();
  return NextResponse.json({ success: true });
}
