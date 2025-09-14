// src/app/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

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

export default async function Home() {
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

  return (
    <div className="dash">
      <header className="topbarX">
        <div className="brandX">Diesel Tracker</div>
        <nav className="navX">
          <Link href="/new" className="btnPrimary">+ Add a fill</Link>
        </nav>
      </header>

      {/* Overview cards */}
      <section className="cardsX">
        <div className="cardX">
          <div className="labelX">Total spend (loaded)</div>
          <div className="valueX">{eur(spend)}</div>
        </div>
        <div className="cardX">
          <div className="labelX">Avg €/L</div>
          <div className="valueX">€{avgEurPerL.toFixed(3)}</div>
        </div>
        <div className="cardX">
          <div className="labelX">Fills</div>
          <div className="valueX">{fillsCount}</div>
        </div>
      </section>

      {/* Toolbar (placeholder for future filters/search) */}
      <div className="toolbarX">
        <div className="spacer" />
        <div className="searchX">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 21l-4.2-4.2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="1.5"/>
          </svg>
          <input placeholder="Search (coming soon)" disabled />
        </div>
      </div>

      <div className="tableWrapX">
        <table className="tableX">
          <thead>
            <tr>
              <th>Date</th>
              <th className="num">Price (c/L)</th>
              <th className="num">€/L</th>
              <th className="num">Cost</th>
              <th className="num">Liters est.</th>
              <th className="num">Range</th>
              <th>Garage</th>
              <th>Reset</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const priceCents = Number(r.price_cents_per_liter);
              const eurPerL = priceCents / 100.0;
              const cost = Number(r.total_cost_eur);
              const liters = eurPerL > 0 ? cost / eurPerL : 0;
              const d = new Date(r.filled_at);
              return (
                <tr key={r.id}>
                  <td className="ts">{d.toLocaleString()}</td>
                  <td className="num">{priceCents.toFixed(1)}</td>
                  <td className="num">€{eurPerL.toFixed(3)}</td>
                  <td className="num">{eur(cost)}</td>
                  <td className="num">{liters.toFixed(3)}</td>
                  <td className="num">{r.range_remaining_km ?? '—'}</td>
                  <td>{r.station_name ?? '—'}</td>
                  <td>
                    <span className={`chip ${r.reset_trip ? 'yes' : 'no'}`}>
                      {r.reset_trip ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {r.note ? <span className="chip note" title={r.note}>{r.note}</span> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Local component styles to keep this file self-contained */}
      <style>{`
        /* widen layout */
        .dash{max-width:1200px;margin:24px auto;padding:0 20px}

        /* topbar */
        .topbarX{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .brandX{font-size:22px;font-weight:700;letter-spacing:.2px}
        .navX a{margin-left:8px}

        /* kpi cards */
        .cardsX{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:14px 0 18px}
        .cardX{border:1px solid #e5e7eb;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05);padding:14px}
        .labelX{font-size:12px;color:#64748b;letter-spacing:.02em;text-transform:uppercase}
        .valueX{font-size:24px;font-weight:600;margin-top:4px}

        /* toolbar */
        .toolbarX{display:flex;align-items:center;justify-content:space-between;margin:6px 0 10px}
        .spacer{flex:1}
        .searchX{display:flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:12px;padding:6px 8px;background:#fff;color:#64748b}
        .searchX input{border:none;outline:none;background:transparent;min-width:220px;color:#64748b}

        /* table */
        .tableWrapX{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05)}
        .tableX{width:100%;border-collapse:separate;border-spacing:0}
        thead th{position:sticky;top:0;background:#f8fafc;color:#64748b;font-weight:600;font-size:12px;letter-spacing:.02em;text-transform:uppercase;padding:12px;border-bottom:1px solid #e5e7eb}
        tbody td{padding:14px 12px;border-top:1px solid #f1f5f9}
        tbody tr:hover{background:#f9fafb}
        .ts{white-space:nowrap}
        .num{text-align:right}

        /* chips */
        .chip{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#0f172a;font-size:12px}
        .chip.yes{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
        .chip.no{background:#f1f5f9;color:#475569}
        .chip.note{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#eef2ff;border-color:#e0e7ff}
      `}</style>
    </div>
  );
}