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
    console.log(`[${timestamp}] Keepalive: Starting database activity...`);
    
    // Perform substantial read operations that count as real activity
    // 1. Get count of all records
    const { count, error: countError } = await supabaseAdmin
      .from('fills')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // 2. Get recent records (if any exist) - this creates real query activity
    const { data: recentData, error: recentError } = await supabaseAdmin
      .from('fills')
      .select('id, filled_at')
      .order('filled_at', { ascending: false })
      .limit(5);
    
    if (recentError) throw recentError;
    
    // 3. Check for any records from the last 30 days - complex query
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: filterError } = await supabaseAdmin
      .from('fills')
      .select('*', { count: 'exact', head: true })
      .gte('filled_at', thirtyDaysAgo);
    
    if (filterError) throw filterError;

    console.log(`[${timestamp}] Keepalive: Database queries completed ✓ (total records: ${count || 0}, recent: ${recentCount || 0})`);
    
    // Optionally log success (useful for the first few runs to confirm it's working)
    if (process.env.KEEPALIVE_LOG_SUCCESS === 'true') {
      await sendAlert(`Database activity successful at ${timestamp} (${count || 0} total records, ${recentCount || 0} recent)`, false);
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
