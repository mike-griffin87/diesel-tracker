// src/app/api/keepalive/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Use the Node.js runtime for compatibility with the Supabase admin client
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronHeader = request.headers.get('x-vercel-cron');
  const isCron = !!cronHeader; // Vercel Cron adds this header

  // In production, only allow calls from Vercel Cron. In dev, allow manual hits.
  if (process.env.NODE_ENV === 'production' && !isCron) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Minimal DB activity to prevent project pausing. This runs even if the table is empty.
    const { error } = await supabaseAdmin
      .from('fills')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) throw error;

    // No content needed; just indicate success and prevent caching.
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'keepalive failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
