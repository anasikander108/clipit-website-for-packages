import { supabase } from "./supabase";
import { FALLBACK_PACKAGES } from "./fallback";
import { useQuery, must } from "./useQuery";
import type { Package } from "./types";

const COLUMNS = "id, slug, name, tagline, price_pkr, duration_days, daily_hours, daily_exports, web_access, features, recommended, sort_order, is_active";

/** Active packages from the database (or the display-only fallback while Supabase is not set up). */
export function usePackages() {
  return useQuery<Package[]>(async () => {
    if (!supabase) return FALLBACK_PACKAGES;
    return must(await supabase.from("packages").select(COLUMNS).eq("is_active", true).order("sort_order"));
  });
}

export const PACKAGE_COLUMNS = COLUMNS;
