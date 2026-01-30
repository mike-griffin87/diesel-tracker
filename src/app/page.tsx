// src/app/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { NewFillForm } from './new/page';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

function ymd(dateISO: string) {
  const d = new Date(dateISO);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
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

// --- Server actions: Delete & Update ---
async function deleteFill(id: string) {
  'use server';
  await supabaseAdmin.from('fills').delete().eq('id', id);
  revalidatePath('/');
  redirect('/');
}

function parseNum(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? '')
    .trim()
    .replace('€','')
    .replace(/\s+/g,'')
    .replace(',','.')
    .replace(/[^0-9.\-]/g,'');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function noonFromYMD(ymd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  // Noon UTC to avoid DST edges
  return new Date(`${ymd}T12:00:00.000Z`).toISOString();
}

async function updateFill(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const date = String(formData.get('date') ?? '');
  const priceCL = parseNum(formData.get('price')) ?? 0;    // c/L
  const cost = parseNum(formData.get('cost')) ?? 0;        // €
  const range = formData.get('range');
  const station = String(formData.get('station') ?? '').trim() || null;
  const reset = String(formData.get('reset') ?? 'false').toLowerCase();
  const note = String(formData.get('note') ?? '').trim() || null;

  const filled_at = noonFromYMD(date);
  const price_cents_per_liter = Math.round((priceCL + Number.EPSILON) * 10) / 10; // 1dp
  const total_cost_eur = Math.round((cost + Number.EPSILON) * 100) / 100;         // 2dp
  const range_remaining_km = range ? Number(range) : null;
  const reset_trip = reset === 'true' || reset === 'yes';

  if (!id || !filled_at || !Number.isFinite(price_cents_per_liter) || !Number.isFinite(total_cost_eur)) {
    revalidatePath('/');
    redirect('/');
  }

  const { error } = await supabaseAdmin
    .from('fills')
    .update({
      filled_at,
      price_cents_per_liter,
      total_cost_eur,
      range_remaining_km,
      station_name: station,
      reset_trip,
      note,
    })
    .eq('id', id);

  // Ignore unique-conflict silently; just refresh list
  if (error && (error as { code?: string }).code !== '23505') {
    console.error('Update error', error);
  }
  revalidatePath('/');
  redirect('/');
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Year filter: 2025, 2024, or all
  const yearParamRaw = Array.isArray(params?.year)
    ? (params?.year[0] as string)
    : (params?.year as string | undefined);
  let year: '2025' | '2024' | 'all' = 'all';
  if (yearParamRaw === '2025' || yearParamRaw === '2024') year = yearParamRaw;

  let query = supabaseAdmin
    .from('fills')
    .select('id, filled_at, price_cents_per_liter, total_cost_eur, range_remaining_km, station_name, reset_trip, note')
    .order('filled_at', { ascending: false })
    .limit(100);

  if (year !== 'all') {
    const y = Number(year);
    const startISO = new Date(Date.UTC(y, 0, 1)).toISOString();
    const endISO = new Date(Date.UTC(y + 1, 0, 1)).toISOString();
    query = query.gte('filled_at', startISO).lt('filled_at', endISO);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];

  // For the edit modal: a station list from existing data (keeps it simple)
  const stations = Array.from(new Set(rows.map(r => r.station_name).filter(Boolean) as string[])).sort();
  // Fallback baseline (keeps UX consistent if empty)
  const BASE_STATIONS = ['Kylemore Road','Kinnegad Plaza','Circle K Kinnegad','Circle K Nass Road','Emo Tullamore','Circle K Citywest','Applegreen Enfield','Emo Kinnegad','Top Oil Enfield'];
  const stationOptions = Array.from(new Set([...BASE_STATIONS, ...stations])).sort();

  // Simple overview metrics (from loaded rows)
  const spend = rows.reduce((s, r) => s + Number(r.total_cost_eur || 0), 0);
  const avgEurPerL = rows.length
    ? rows.reduce((s, r) => s + Number(r.price_cents_per_liter) / 100, 0) / rows.length
    : 0;
  const fillsCount = rows.length;

  // Query-driven modals
  const qNew = params?.new;
  const showNew = Array.isArray(qNew) ? qNew.includes('1') || qNew.includes('true') : (qNew === '1' || qNew === 'true');

  const editIdRaw = params?.edit;
  const editId = Array.isArray(editIdRaw) ? editIdRaw[0] : editIdRaw;
  const editRow = rows.find(r => r.id === editId);
  const showEdit = Boolean(editRow);

  // Delete confirmation modal state
  const delIdRaw = params?.delete;
  const delId = Array.isArray(delIdRaw) ? delIdRaw[0] : delIdRaw;
  const delRow = rows.find(r => r.id === delId);
  const showDelete = Boolean(delRow);

  const yearQuery = year !== 'all' ? `year=${year}&` : '';

  return (
    <>
      {/* Year filter */}
      <div className="toolbarYear">
        <div className="yearSeg">
          <Link href="/?year=2025" className={year === '2025' ? 'active' : ''}>2025</Link>
          <Link href="/?year=2024" className={year === '2024' ? 'active' : ''}>2024</Link>
          <Link href="/?year=all" className={year === 'all' ? 'active' : ''}>All</Link>
        </div>
      </div>
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
              <th className="actions">Actions</th>
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
              const clr = colorFor(r.station_name);
              return (
                <tr key={r.id}>
                  <td className="ts">{formatDateHuman(d)}</td>
                  <td className="num">{(!eurPerL || eurPerL === 0) ? (<span className="anomalyText">€{eurPerLTrunc.toFixed(2)}</span>) : (<>€{eurPerLTrunc.toFixed(2)}</>)}
                  </td>
                  <td className="num">{(!cost || cost === 0) ? (<span className="anomalyText">{eur(cost)}</span>) : eur(cost)}</td>
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
                  <td className="actions">
                    <div className="rowActions">
                      <Link href={`/?${yearQuery}edit=${r.id}`} className="btnPill">Edit</Link>
                      <Link href={`/?${yearQuery}delete=${r.id}`} className="btnPill">Delete</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete modal controlled by query (?delete=<id>) */}
      {showDelete && delRow && (
        <div className="modalRoot">
          <Link href={`/?${yearQuery.slice(0,-1)}`} className="modalBackdrop" aria-label="Close" />
          <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby="deletefill-title">
            <div className="modalHeader">
              <h2 id="deletefill-title">Delete Fill</h2>
              <Link href={`/?${yearQuery.slice(0,-1)}`} className="btnIcon" aria-label="Close">×</Link>
            </div>
            <p style={{margin:'4px 0 12px 0'}}>
              Are you sure you want to delete the fill on <strong>{formatDateHuman(new Date(delRow.filled_at))}</strong>
              {delRow.station_name ? <> at <strong>{delRow.station_name}</strong></> : null}?
            </p>
            <div className="actionsRow">
              <Link href={`/?${yearQuery.slice(0,-1)}`} className="btn btnSecondary">Cancel</Link>
              <form action={deleteFill.bind(null, delRow.id)}>
                <button type="submit" className="btn btnDanger">Delete</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New modal controlled by query (?new=1) */}
      {showNew && (
        <div className="modalRoot">
          <Link href={`/?${yearQuery.slice(0,-1)}`} className="modalBackdrop" aria-label="Close" />
          <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby="newfill-title">
            <div className="modalHeader">
              <h2 id="newfill-title">New Fill</h2>
              <Link href={`/?${yearQuery.slice(0,-1)}`} className="btnIcon" aria-label="Close">×</Link>
            </div>
            <NewFillForm />
          </div>
        </div>
      )}

      {/* Edit modal controlled by query (?edit=<id>) */}
      {showEdit && editRow && (
        <div className="modalRoot">
          <Link href={`/?${yearQuery.slice(0,-1)}`} className="modalBackdrop" aria-label="Close" />
          <div className="modalCard" role="dialog" aria-modal="true" aria-labelledby="editfill-title">
            <div className="modalHeader">
              <h2 id="editfill-title">Edit Fill</h2>
              <Link href={`/?${yearQuery.slice(0,-1)}`} className="btnIcon" aria-label="Close">×</Link>
            </div>

            <form action={updateFill} className="formGrid">
              <input type="hidden" name="id" value={editRow.id} />

              <label className="field" htmlFor="date">
                <span className="label">Date</span>
                <input id="date" className="input" type="date" name="date" defaultValue={ymd(editRow.filled_at)} required />
              </label>

              <label className="field">
                <span className="label">Price (c/L)</span>
                <input className="input" name="price" inputMode="decimal" defaultValue={String(editRow.price_cents_per_liter)} required />
              </label>

              <label className="field">
                <span className="label">Cost (€)</span>
                <input className="input" name="cost" inputMode="decimal" defaultValue={String(editRow.total_cost_eur)} required />
              </label>

              <label className="field">
                <span className="label">Range Remaining (km)</span>
                <input className="input" name="range" inputMode="numeric" defaultValue={editRow.range_remaining_km ?? ''} />
              </label>

              <label className="field">
                <span className="label">Garage</span>
                <select className="input" name="station" defaultValue={editRow.station_name ?? ''} required>
                  <option value="" disabled>Select garage</option>
                  {stationOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="label">Reset Clock</span>
                <div className="seg">
                  <input type="radio" id="edit-reset-no" name="reset" value="false" defaultChecked={!editRow.reset_trip} />
                  <label htmlFor="edit-reset-no">No</label>
                  <input type="radio" id="edit-reset-yes" name="reset" value="true" defaultChecked={editRow.reset_trip} />
                  <label htmlFor="edit-reset-yes">Yes</label>
                </div>
              </label>

              <label className="field">
                <span className="label">Note (optional)</span>
                <textarea className="input" name="note" rows={3} defaultValue={editRow.note ?? ''} />
              </label>

              <div className="actions">
                <button type="submit" className="btn btnPrimary">Save</button>
              </div>

              <style>{`
                .formGrid{display:grid;gap:12px}
                .field{display:flex;flex-direction:column;gap:6px}
                .label{font-size:12px;color:#444;font-weight:600}
                .input{padding:10px 12px;border:2px solid var(--line);background:var(--surface);border-radius:var(--radius);color:var(--fg)}
                .input:focus{outline:none;box-shadow:0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent)}
                .seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:center;background:var(--surface);border:2px solid var(--line);border-radius:var(--radius);padding:4px;width:100%}
                .seg input{position:absolute;opacity:0;pointer-events:none}
                .seg label{display:flex;align-items:center;justify-content:center;padding:10px;border-radius:10px;cursor:pointer;color:var(--muted);width:100%}
                .seg input:checked + label{background:var(--surface-2);color:var(--fg);border:1px solid var(--line)}
                .actions{margin-top:8px}
                .actions .btn{display:block;width:100%;text-align:center}
              `}</style>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .anomalyText{color:#b91c1c;font-weight:700}
        .toolbarYear{display:flex;justify-content:flex-end;margin-bottom:8px}
        .yearSeg{display:inline-grid;grid-auto-flow:column;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:4px}
        .yearSeg a{padding:6px 10px;border-radius:10px;text-decoration:none;color:var(--muted)}
        .yearSeg a.active{background:var(--surface-2);color:var(--fg);border:1px solid var(--line)}
        .rowActions{display:inline-grid;grid-auto-flow:column;gap:8px;align-items:center}
        .btnText{background:none;border:none;padding:0;margin:0;color:var(--fg);text-decoration:underline;cursor:pointer}
        .btnText.danger{color:#b91c1c}
        th.actions, td.actions{text-align:right;white-space:nowrap}
        .rowActions{display:inline-grid;grid-auto-flow:column;gap:8px;align-items:center}
        .btnPill{display:inline-block;padding:6px 10px;border:1px solid var(--line);background:var(--surface);border-radius:999px;color:var(--fg);text-decoration:none;line-height:1}
        .btnPill:hover{background:var(--surface-2)}
        .actionsRow{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
        .btn.btnSecondary{background:var(--surface);border:1px solid var(--line);color:var(--fg)}
        .btn.btnDanger{background:#b91c1c;color:#fff;border:1px solid #991b1b}
        .btn.btnDanger:hover{background:#991b1b}
      `}</style>
    </>
  );
}