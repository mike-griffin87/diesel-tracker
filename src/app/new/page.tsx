// src/app/new/page.tsx
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Database } from '../../types/supabase';

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

async function createFill(formData: FormData) {
  'use server';
  const dtStr = String(formData.get('dt') ?? '');
  const price = num(formData.get('price'));
  const cost = num(formData.get('cost'));
  const range = intOrNull(formData.get('range'));
  const stationRaw = String(formData.get('station') ?? '').trim();
  const station = stationRaw ? stationRaw : null;
  const reset = String(formData.get('reset') ?? '') === 'on';

  const dt = dtStr ? new Date(dtStr) : null;
  if (!dt || !isFinite(price) || price <= 0 || !isFinite(cost) || cost <= 0) {
    throw new Error('Invalid date, price, or cost.');
  }

  const payload: FillInsert = {
    filled_at: dt.toISOString(),
    price_cents_per_liter: price,
    total_cost_eur: cost,
    range_remaining_km: range,
    station_name: station,
    reset_trip: reset,
  };

  const { error } = await supabaseAdmin.from('fills').insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}

export default function NewFill() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div style={{ maxWidth: 560, margin: '24px auto', padding: '0 16px' }}>
      <h1>New Fill</h1>
      <p>Price in <b>cents/L</b> (e.g., 169.9). Cost in €.</p>

      <form action={createFill} style={{ display: 'grid', gap: 12 }}>
        <label>
          <div>Date &amp; time</div>
          <input type="datetime-local" name="dt" defaultValue={local} required />
        </label>

        <label>
          <div>Price (c/L)</div>
          <input name="price" inputMode="decimal" placeholder="169.9" required />
        </label>

        <label>
          <div>Cost (€)</div>
          <input name="cost" inputMode="decimal" placeholder="70.00" required />
        </label>

        <label>
          <div>Range Remaining (km)</div>
          <input name="range" inputMode="numeric" placeholder="95" />
        </label>

        <label>
          <div>Garage</div>
          <input name="station" placeholder="Emo Kinnegad" />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="reset" /> Reset Clock
        </label>

        <button type="submit">Save</button>
      </form>
    </div>
  );
}