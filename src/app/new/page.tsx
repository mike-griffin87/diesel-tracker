// src/app/new/page.tsx
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Database } from '../../types/supabase';

// Allowed stations list (limit dropdown to these only)
const ALLOWED_STATIONS = [
  'Kylemore Road',
  'Kinnegad Plaza',
  'Circle K Kinnegad',
  'Circle K Nass Road',
  'Emo Tullamore',
  'Circle K Citywest',
  'Applegreen Enfield',
  'Emo Kinnegad',
  'Top Oil Enfield',
];

type FillInsert = Database['public']['Tables']['fills']['Insert'];

function num(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? '')
    .trim()
    .replace('€', '')
    .replace(/\s+/g, '')
    .replace(',', '.');
  return parseFloat(s);
}

function intOrNull(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? '').trim().replace(/\D+/g, '');
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

// Convert a YYYY-MM-DD string to a local Date at noon (avoids DST edge cases)
function localDateFromYMD(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  return new Date(`${ymd}T12:00:00`);
}

async function createFill(formData: FormData) {
  'use server';
  const dateStr = String(formData.get('date') ?? '');
  const price = num(formData.get('price'));
  const cost = num(formData.get('cost'));
  const range = intOrNull(formData.get('range'));
  const stationRaw = String(formData.get('station') ?? '').trim();
  const noteRaw = String(formData.get('note') ?? '').trim();
  const station = stationRaw ? stationRaw : null;
  const note = noteRaw ? noteRaw : null;
  const resetRaw = String(formData.get('reset') ?? '').toLowerCase();
  const reset = resetRaw === 'true' || resetRaw === 'yes';

  const dt = dateStr ? localDateFromYMD(dateStr) : null;
  // Allow cost to be 0, but price must be > 0 and valid date required
  if (!dt || !isFinite(price) || price <= 0 || !isFinite(cost) || cost < 0) {
    throw new Error('Invalid date, price, or cost.');
  }

  const payload: FillInsert = {
    filled_at: dt.toISOString(),
    price_cents_per_liter: price,
    total_cost_eur: cost,
    range_remaining_km: range,
    station_name: station,
    reset_trip: reset,
    note,
  };

  const { error } = await supabaseAdmin.from('fills').insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}

function TodayYMD() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export async function NewFillForm({ stations = [] }: { stations?: string[] }) {
  // Curated + dynamic: merge baseline list with distinct DB names, then rank by last 180 days frequency
  const base = (stations && stations.length) ? stations : ALLOWED_STATIONS;

  // Look back 180 days so "most used" reflects recent behavior
  const sinceISO = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from('fills')
    .select('station_name, filled_at')
    .not('station_name', 'is', null)
    .gte('filled_at', sinceISO)
    .limit(1000);

  const fetched = Array.from(new Set((data ?? []).map((r) => r.station_name as string))).filter(Boolean);
  const allStations = Array.from(new Set([...base, ...fetched]));

  // Frequency by station (from recent window)
  const freq: Record<string, number> = {};
  for (const row of data ?? []) {
    const name = row.station_name as string | null;
    if (!name) continue;
    freq[name] = (freq[name] || 0) + 1;
  }

  // Top N by frequency; divider, then the rest alphabetically
  const TOP_N = 3;
  const byFreq = [...allStations].sort((a, b) => (freq[b] || 0) - (freq[a] || 0) || a.localeCompare(b));
  const top = byFreq.filter((s) => (freq[s] || 0) > 0).slice(0, TOP_N);
  const rest = allStations.filter((s) => !top.includes(s)).sort((a, b) => a.localeCompare(b));

  return (
    <form action={createFill} className="formGrid">
      <label className="field" htmlFor="date">
        <span className="label">Date</span>
        <input id="date" className="input" type="date" name="date" defaultValue={TodayYMD()} required />
      </label>

      <label className="field">
        <span className="label">Price (c/L)</span>
        <input className="input" name="price" inputMode="decimal" placeholder="169.9" required />
      </label>

      <label className="field">
        <span className="label">Cost (€)</span>
        <input className="input" name="cost" inputMode="decimal" placeholder="70.00" required />
      </label>

      <label className="field">
        <span className="label">Range Remaining (km)</span>
        <input className="input" name="range" inputMode="numeric" placeholder="95" />
      </label>

      <label className="field">
        <span className="label">Garage</span>
        <select className="input" name="station" defaultValue="" required>
          <option value="" disabled>Select garage</option>
          {top.map((s) => (
            <option key={`top-${s}`} value={s}>{s}</option>
          ))}
          {top.length && rest.length ? (
            <option key="divider" value="" disabled>────────────</option>
          ) : null}
          {rest.map((s) => (
            <option key={`rest-${s}`} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="label">Reset Clock</span>
        <div className="seg">
          <input type="radio" id="reset-no" name="reset" value="false" defaultChecked />
          <label htmlFor="reset-no">No</label>
          <input type="radio" id="reset-yes" name="reset" value="true" />
          <label htmlFor="reset-yes">Yes</label>
        </div>
        <div className="help">Set to <b>Yes</b> if you reset the trip/clock after this fill.</div>
      </label>

      <label className="field">
        <span className="label">Note (optional)</span>
        <textarea className="input" name="note" rows={3} placeholder="Why cost is zero, etc." />
      </label>

      <div className="actions">
        <button type="submit" className="btn btnPrimary">Save</button>
      </div>

      {/* local styles – these match the app's UI language; can move to globals later */}
      <style>{`
        .formGrid{display:grid;gap:12px}
        .field{display:flex;flex-direction:column;gap:6px}
        .label{font-size:12px;color:#444;font-weight:600}
        .input{padding:10px 12px;border:2px solid var(--line);background:var(--surface);border-radius:var(--radius);color:var(--fg)}
        .input:focus{outline:none;box-shadow:0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent)}
        .actions{margin-top:8px}
        .actions .btn{display:block;width:100%;text-align:center}
        .seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:center;background:var(--surface);border:2px solid var(--line);border-radius:var(--radius);padding:4px;width:100%}
        .seg input{position:absolute;opacity:0;pointer-events:none}
        .seg label{display:flex;align-items:center;justify-content:center;padding:10px;border-radius:10px;cursor:pointer;color:var(--muted);width:100%}
        .seg input:checked + label{background:var(--surface-2);color:var(--fg);border:1px solid var(--line)}
        .help{font-size:12px;color:var(--muted);margin-top:4px}
      `}</style>
    </form>
  );
}

export default async function NewFillPage() {
  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1 style={{ margin: '16px 0 8px', fontSize: 24, fontWeight: 700 }}>New Fill</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Price in <b>cents/L</b> (e.g., 169.9). Cost in €.</p>
      <NewFillForm />
    </div>
  );
}