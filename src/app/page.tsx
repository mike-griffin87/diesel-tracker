// src/app/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

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
      <div className="topbar">
        <h1>Diesel Tracker</h1>
        <Link href="/new" className="btnPrimary">+ Add a fill</Link>
      </div>

      {/* Overview cards (placeholder-friendly) */}
      <section className="cards">
        <div className="card">
          <div className="label">Total spend (loaded)</div>
          <div className="value">{eur(spend)}</div>
        </div>
        <div className="card">
          <div className="label">Avg €/L</div>
          <div className="value">€{avgEurPerL.toFixed(3)}</div>
        </div>
        <div className="card">
          <div className="label">Fills</div>
          <div className="value">{fillsCount}</div>
        </div>
      </section>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Price (c/L)</th>
              <th>€/L</th>
              <th>Cost</th>
              <th>Liters est.</th>
              <th>Range</th>
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
                  <td>{priceCents.toFixed(1)}</td>
                  <td>€{eurPerL.toFixed(3)}</td>
                  <td>{eur(cost)}</td>
                  <td>{liters.toFixed(3)}</td>
                  <td>{r.range_remaining_km ?? '—'}</td>
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
        .dash{max-width:960px;margin:24px auto;padding:0 16px}
        .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .topbar h1{margin:0;font-size:22px;letter-spacing:.2px}
        .btnPrimary{display:inline-block;padding:10px 14px;border-radius:12px;background:#111827;color:#fff;text-decoration:none;border:1px solid #111827}
        .btnPrimary:hover{opacity:.92}

        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:12px 0 20px}
        .card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05);padding:12px 14px}
        .label{font-size:12px;color:#64748b;letter-spacing:.02em;text-transform:uppercase}
        .value{font-size:22px;font-weight:600;margin-top:4px}

        .tableWrap{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05)}
        .table{width:100%;border-collapse:separate;border-spacing:0}
        thead th{position:sticky;top:0;background:#f8fafc;color:#64748b;font-weight:600;font-size:12px;letter-spacing:.02em;text-transform:uppercase;padding:12px;border-bottom:1px solid #e5e7eb}
        tbody td{padding:14px 12px;border-top:1px solid #f1f5f9}
        tbody tr:hover{background:#f9fafb}
        .ts{white-space:nowrap}

        .chip{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#0f172a;font-size:12px}
        .chip.yes{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
        .chip.no{background:#f1f5f9;color:#475569}
        .chip.note{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#eef2ff;border-color:#e0e7ff}
      `}</style>
    </div>
  );
}