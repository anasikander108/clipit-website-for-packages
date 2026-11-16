import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.50.0";
import type { Brand } from "./email.ts";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Service-role client. Lives only inside Edge Functions; it is never sent to the browser.
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

export async function loadBrand(db: SupabaseClient): Promise<Brand> {
  const { data } = await db.from("website_settings").select("product_name, support_email").eq("id", 1).maybeSingle();
  return {
    product: data?.product_name || "Clipit",
    supportEmail: data?.support_email || "",
    siteUrl: Deno.env.get("SITE_URL") || "",
  };
}
