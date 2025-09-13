// src/app/page.tsx
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function Home() {
  const { data, error } = await supabaseAdmin
    .from('fills')
    .select('id, filled_at, price_cents_per_liter, total_cost_eur, range_remaining_km, station_name, reset_trip')
    .order('filled_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  return (
    <div style={{maxWidth: 760, margin: '24px auto', padding: '0 16px'}}>
      <h1>Diesel Tracker</h1>
      <p><a href="/new">+ Add a fill</a></p>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Date</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Price (c/L)</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>€/L</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Cost</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Liters est.</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Range</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Garage</th>
            <th style={{textAlign:'left', borderBottom:'1px solid #e5e7eb', padding:'8px'}}>Reset</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const eurPerL = r.price_cents_per_liter / 100.0;
            const liters = r.total_cost_eur / eurPerL;
            return (
              <tr key={r.id}>
                <td style={{padding:'8px'}}>{new Date(r.filled_at).toLocaleString()}</td>
                <td style={{padding:'8px'}}>{r.price_cents_per_liter.toFixed(1)}</td>
                <td style={{padding:'8px'}}>€{eurPerL.toFixed(3)}</td>
                <td style={{padding:'8px'}}>€{r.total_cost_eur.toFixed(2)}</td>
                <td style={{padding:'8px'}}>{liters.toFixed(3)}</td>
                <td style={{padding:'8px'}}>{r.range_remaining_km ?? '—'}</td>
                <td style={{padding:'8px'}}>{r.station_name ?? '—'}</td>
                <td style={{padding:'8px'}}>{r.reset_trip ? 'Yes' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}