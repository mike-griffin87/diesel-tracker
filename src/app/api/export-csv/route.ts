// src/app/api/export-csv/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import type { Database } from '../../../types/supabase';

type Fill = Database['public']['Tables']['fills']['Row'];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('fills')
      .select('*')
      .order('filled_at', { ascending: false });

    if (error) throw error;

    const fills = data as Fill[];

    // CSV headers
    const headers = [
      'Date',
      'Price (c/L)',
      'Total Cost (€)',
      'Estimated Liters',
      'Range Remaining (km)',
      'Garage',
      'Reset Trip',
      'Note',
      'Created At'
    ];

    // Convert data to CSV rows
    const rows = (fills || []).map((fill: Fill) => {
      const liters = fill.total_cost_eur > 0 && fill.price_cents_per_liter > 0
        ? (fill.total_cost_eur / fill.price_cents_per_liter * 100).toFixed(2)
        : '';

      return [
        new Date(fill.filled_at).toLocaleDateString(),
        fill.price_cents_per_liter.toFixed(1),
        fill.total_cost_eur.toFixed(2),
        liters,
        fill.range_remaining_km || '',
        fill.station_name || '',
        fill.reset_trip ? 'Yes' : 'No',
        fill.note ? `"${fill.note.replace(/"/g, '""')}"` : '',
        new Date(fill.created_at || fill.filled_at).toISOString()
      ].join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="diesel-tracker-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Export failed';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
