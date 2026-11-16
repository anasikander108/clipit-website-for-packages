import type { Package } from "./types";

/**
 * Shown on the public pricing section ONLY while Supabase is not configured, so the marketing page
 * still renders during setup. Checkout always reads the packages table; nothing is sold from here.
 */
export const FALLBACK_PACKAGES: Package[] = [
  {
    id: "starter", slug: "starter", name: "Starter", tagline: "For creators trying ClipXo on their own channel.",
    price_pkr: 2099, duration_days: 30, daily_hours: 5, daily_exports: 3, web_access: false, recommended: false, sort_order: 1, is_active: true,
    features: ["Desktop software", "AI moment detection", "Automatic transcription", "Short clip generation", "5 hours of video a day", "One month of access"],
  },
  {
    id: "pro", slug: "pro", name: "Pro", tagline: "For channels that publish shorts every week.",
    price_pkr: 5199, duration_days: 90, daily_hours: 7, daily_exports: 3, web_access: false, recommended: true, sort_order: 2, is_active: true,
    features: ["Everything in Starter", "Desktop software", "7 hours of video a day", "Three months of access", "Priority customer support"],
  },
  {
    id: "business", slug: "business", name: "Business", tagline: "For agencies and teams publishing every day.",
    price_pkr: 49500, duration_days: 365, daily_hours: 20, daily_exports: 3, web_access: true, recommended: false, sort_order: 3, is_active: true,
    features: ["Desktop software", "Web application access", "20 hours of video a day", "One year of access", "Priority support", "Business-level access"],
  },
];
