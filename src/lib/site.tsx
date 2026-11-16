import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { WebsiteSettings } from "./types";

const DEFAULTS: WebsiteSettings = {
  product_name: "Clipit",
  logo_url: "",
  support_email: "",
  contact_phone: "",
  contact_address: "",
  announcement: "",
};

const SiteContext = createContext<{ site: WebsiteSettings; reload: () => void }>({ site: DEFAULTS, reload: () => {} });

/** Public website settings (product name, contact, announcement), editable by admins. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState(DEFAULTS);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    supabase
      ?.from("website_settings")
      .select("product_name, logo_url, support_email, contact_phone, contact_address, announcement")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => data && setSite({ ...DEFAULTS, ...data, product_name: data.product_name || DEFAULTS.product_name }));
  }, [tick]);
  useEffect(() => {
    document.title = `${site.product_name}: long videos into shorts`;
  }, [site.product_name]);
  return <SiteContext.Provider value={{ site, reload: () => setTick((t) => t + 1) }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
