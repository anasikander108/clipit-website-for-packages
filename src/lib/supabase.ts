import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env;
// VITE_* from .env, or the NEXT_PUBLIC_* names Supabase's Vercel integration sets
const url = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const anonKey = (env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;

/** True when the site has real Supabase credentials. Without them we show a setup screen instead of fake auth. */
export const isConfigured = Boolean(url && anonKey && /^https:\/\//.test(url));

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/** The client for code that only runs behind <RequireSupabase>. */
export function db(): SupabaseClient {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export const SCREENSHOT_BUCKET = "payment-screenshots";

/** Readable message from a Supabase/Postgres error. */
export function errorMessage(e: unknown): string {
  if (!e) return "Something went wrong. Please try again.";
  const m = typeof e === "string" ? e : ((e as { message?: string }).message ?? "");
  if (/one_pending/i.test(m)) return "You already have a payment waiting for review. We will email you once it is checked.";
  if (/ref_unique/i.test(m)) return "This transaction reference has already been submitted.";
  if (/failed to fetch|networkerror/i.test(m)) return "Could not reach the server. Check your internet connection and try again.";
  return m || "Something went wrong. Please try again.";
}

/** Best-effort transactional email; the Edge Function decides what to send from the database. */
export async function notify(event: "welcome" | "payment_submitted" | "payment_approved" | "payment_rejected", id?: string) {
  try {
    await db().functions.invoke("notify", { body: { event, id } });
  } catch {
    /* the status is already saved; email is best effort */
  }
}
