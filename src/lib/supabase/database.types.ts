/**
 * Esquema tipado de la base de datos.
 * Regenéralo cuando cambien las tablas:
 *   npx supabase gen types typescript --project-id <tu-project-id> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          status: "active" | "paused" | "draft";
          trigger: "webhook" | "schedule" | "manual";
          steps: Json;
          runs_today: number;
          runs_total: number;
          success_rate: number;
          avg_duration_ms: number;
          last_run_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string;
          status?: "active" | "paused" | "draft";
          trigger?: "webhook" | "schedule" | "manual";
          steps?: Json;
          runs_today?: number;
          runs_total?: number;
          success_rate?: number;
          avg_duration_ms?: number;
          last_run_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workflows"]["Insert"]>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          owner_id: string;
          workflow_id: string;
          endpoint: string;
          method: "POST" | "PUT" | "PATCH" | "GET";
          status: "success" | "failed" | "pending";
          status_code: number | null;
          duration_ms: number;
          attempts: number;
          payload: Json;
          error_message: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          workflow_id: string;
          endpoint: string;
          method?: "POST" | "PUT" | "PATCH" | "GET";
          status?: "success" | "failed" | "pending";
          status_code?: number | null;
          duration_ms?: number;
          attempts?: number;
          payload?: Json;
          error_message?: string | null;
          received_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          prefix: string;
          hashed_secret: string;
          scope: "read" | "write" | "full";
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          prefix: string;
          hashed_secret: string;
          scope?: "read" | "write" | "full";
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      workflow_status: "active" | "paused" | "draft";
      event_status: "success" | "failed" | "pending";
    };
    CompositeTypes: Record<never, never>;
  };
}