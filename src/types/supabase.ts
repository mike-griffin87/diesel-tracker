export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      fills: {
        Row: {
          id: string;
          filled_at: string; // timestamptz as ISO string
          price_cents_per_liter: number;
          total_cost_eur: number;
          range_remaining_km: number | null;
          station_name: string | null;
          reset_trip: boolean;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          filled_at: string;
          price_cents_per_liter: number;
          total_cost_eur: number;
          range_remaining_km?: number | null;
          station_name?: string | null;
          reset_trip?: boolean;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          filled_at?: string;
          price_cents_per_liter?: number;
          total_cost_eur?: number;
          range_remaining_km?: number | null;
          station_name?: string | null;
          reset_trip?: boolean;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};