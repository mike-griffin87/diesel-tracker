// src/app/api/keepalive/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Use the Node.js runtime for compatibility with the Supabase admin client
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function sendAlert(message: string, isError: boolean = true) {
  const webhookUrl = process.env.KEEPALIVE_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return; // No webhook configured, skip

  try {
    const payload = {
      content: `${isError ? '🔴 **Keepalive Failed**' : '✅ Keepalive Success'}\n${message}`,
      embeds: [{
        title: isError ? 'Database Keepalive Error' : 'Database Keepalive',
        description: message,
        color: isError ? 15158332 : 3066993, // Red or green
        timestamp: new Date().toISOString(),
      }]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Don't let webhook failures break the keepalive
    console.error('Failed to send alert:', err);
  }
}

export async function GET(request: Request) {
  const cronHeader = request.headers.get('x-vercel-cron');
  const isCron = !!cronHeader; // Vercel Cron adds this header
  const timestamp = new Date().toISOString();

  // In production, only allow calls from Vercel Cron. In dev, allow manual hits.
  if (process.env.NODE_ENV === 'production' && !isCron) {
    console.warn(`[${timestamp}] Keepalive: Forbidden - missing cron header`);
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    console.log(`[${timestamp}] Keepalive: Starting database ping...`);
    
    // Minimal DB activity to prevent project pausing. This runs even if the table is empty.
    const { error } = await supabaseAdmin
      .from('fills')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) throw error;

    console.log(`[${timestamp}] Keepalive: Success ✓`);
    
    // Optionally log success (useful for the first few runs to confirm it's working)
    if (process.env.KEEPALIVE_LOG_SUCCESS === 'true') {
      await sendAlert(`Database ping successful at ${timestamp}`, false);
    }

    // No content needed; just indicate success and prevent caching.
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'keepalive failed';
    const errorDetails = `Time: ${timestamp}\nError: ${msg}\nEnvironment: ${process.env.NODE_ENV}`;
    
    console.error(`[${timestamp}] Keepalive: Failed ✗`, msg);
    
    // Send alert on failure
    await sendAlert(errorDetails, true);
    
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
