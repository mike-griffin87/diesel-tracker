// lib/supabaseAdmin.ts
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
if (!serviceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

// Singleton (avoids re-creating during dev HMR)
const globalForSupabase = globalThis as unknown as {
  supabaseAdmin?: SupabaseClient<Database>;
};

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ??
  createClient<Database>(url, serviceKey, { auth: { persistSession: false } });

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}