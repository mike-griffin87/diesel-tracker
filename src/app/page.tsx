// src/app/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { NewFillForm } from './new/page';

export const dynamic = 'force-dynamic';

// Allow numeric fields to arrive as string or number from Supabase
type Row = {
  id: string;
  filled_at: string;
  price_cents_per_liter: number | string;
  total_cost_eur: number | string;
  range_remaining_km: number | null;
  station_name: string | null;
  reset_trip: boolean;
  note: string | null;
};

function eur(n: number) {
  return `€${n.toFixed(2)}`;
}

function formatDateHuman(d: Date) {
  const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Distinct garage colours (brand map + palette fallback)
const BRAND_COLORS: { match: RegExp; color: string }[] = [
  { match: /\b(circle\s*k)\b/i, color: '#ef4444' }, // red
  { match: /\bapple\s*green\b/i, color: '#22c55e' }, // green
  { match: /\bemo\b/i, color: '#0ea5e9' }, // sky
  { match: /\bmaxol\b/i, color: '#1d4ed8' }, // blue
  { match: /\btexaco\b/i, color: '#111827' }, // near-black
  { match: /\bshell\b/i, color: '#f59e0b' }, // amber
  { match: /\btop\s*oil\b/i, color: '#10b981' }, // emerald
  { match: /\bamber\b/i, color: '#fb7185' }, // rose
];
const PALETTE = ['#2563eb','#f59e0b','#10b981','#a855f7','#ef4444','#14b8a6','#22c55e','#eab308','#06b6d4','#f97316'];
function colorFor(name: string | null) {
  if (!name) return '#cbd5e1';
  for (const b of BRAND_COLORS) if (b.match.test(name)) return b.color;
  let sum = 0; for (let i=0;i<name.length;i++) sum = (sum + name.charCodeAt(i)) >>> 0;
  return PALETTE[sum % PALETTE.length];
}

// Truncate to 2 decimals (no rounding)
function trunc2(n: number) {
  return Math.trunc(n * 100) / 100;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { data, error } = await supabaseAdmin
    .from('fills')
    .select('id, filled_at, price_cents_per_liter, total_cost_eur, range_remaining_km, station_name, reset_trip, note')
    .order('filled_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  // Simple overview metrics (from loaded rows)
  const spend = rows.reduce((s, r) => s + Number(r.total_cost_eur || 0), 0);
  const avgEurPerL = rows.length
    ? rows.reduce((s, r) => s + Number(r.price_cents_per_liter) / 100, 0) / rows.length
    : 0;
  const fillsCount = rows.length;

  // Query-driven modal flag
  const q = searchParams?.new;
  const showNew = Array.isArray(q) ? q.includes('1') || q.includes('true') : (q === '1' || q === 'true');

  return (
    <>
      {/* Overview cards */}
      <section className="cardsX">
        <div className="cardX">
          <div className="labelX">Total spend (loaded)</div>
          <div className="valueX">{eur(spend)}</div>
        </div>
        <div className="cardX">
          <div className="labelX">Avg €/L</div>
          <div className="valueX">€{trunc2(avgEurPerL).toFixed(2)}</div>
        </div>
        <div className="cardX">
          <div className="labelX">Fills</div>
          <div className="valueX">{fillsCount}</div>
        </div>
      </section>

      {/* Table */}
      <div className="tableWrapX">
        <table className="tableX">
          <thead>
            <tr>
              <th>Date</th>
              <th className="num">€/L</th>
              <th className="num">Cost</th>
              <th className="num">Liters est.</th>
              <th className="num">Range Remaining</th>
              <th>Garage</th>
              <th>Reset</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const priceCents = Number(r.price_cents_per_liter);
              const eurPerL = priceCents / 100.0;
              const eurPerLTrunc = trunc2(eurPerL);
              const cost = Number(r.total_cost_eur);
              const liters = eurPerL > 0 ? cost / eurPerL : 0;
              const d = new Date(r.filled_at);
              const anomaly = !eurPerL || !cost; // highlight zero-price or zero-cost rows
              const clr = colorFor(r.station_name);
              return (
                <tr key={r.id} className={anomaly ? 'anomaly' : undefined}>
                  <td className="ts">{formatDateHuman(d)}</td>
                  <td className="num">€{eurPerLTrunc.toFixed(2)}</td>
                  <td className="num">{eur(cost)}</td>
                  <td className="num">{liters.toFixed(3)}</td>
                  <td className="num">{r.range_remaining_km ?? '—'}</td>
                  <td>
                    <span className="garage"><span className="dot" style={{backgroundColor: clr}} />{r.station_name ?? '—'}</span>
                  </td>
                  <td>
                    <span className={`chip ${r.reset_trip ? 'yes' : 'no'}`}>
                      {r.reset_trip ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {r.note ? <span className="noteText" title={r.note}>{r.note}</span> : <span className="noteText">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal controlled by query (?new=1) */}
      {showNew && (
        <div className="modalRoot">
          <Link href="/" className="modalBackdrop" aria-label="Close" />
          <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby="newfill-title">
            <div className="modalHeader">
              <h2 id="newfill-title">New Fill</h2>
              <Link href="/" className="btnIcon" aria-label="Close">×</Link>
            </div>
            <NewFillForm />
          </div>
        </div>
      )}
    </>
  );
}