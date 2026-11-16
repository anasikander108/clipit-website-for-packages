export interface Package {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price_pkr: number;
  duration_days: number;
  daily_hours: number;
  daily_exports: number;
  web_access: boolean;
  features: string[];
  recommended: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export type PurchaseStatus = "pending" | "approved" | "rejected";
export type SubscriptionStatus = "active" | "expired" | "suspended" | "replaced";

type Who = Pick<Profile, "full_name" | "email" | "phone">;

export interface PurchaseRequest {
  id: string;
  user_id: string;
  package_id: string;
  amount_pkr: number;
  transaction_ref: string;
  screenshot_path: string;
  customer_note: string;
  status: PurchaseStatus;
  admin_note: string | null;
  install_instructions: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  packages?: Pick<Package, "name" | "slug" | "duration_days" | "daily_hours">;
  profiles?: Who;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  purchase_request_id: string | null;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  daily_hours: number;
  daily_exports: number;
  web_access: boolean;
  instructions: string | null;
  created_at: string;
  packages?: Pick<Package, "name" | "slug">;
  profiles?: Who;
}

export interface UsageLog {
  id: string;
  kind: "process" | "export";
  seconds: number;
  label: string;
  usage_date: string;
  created_at: string;
}

export interface Release {
  id: string;
  version: string;
  download_url: string;
  release_date: string;
  changelog: string;
  install_instructions: string;
  is_current: boolean;
  created_at: string;
}

export interface BankSettings {
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  instructions: string;
}

export interface WebsiteSettings {
  product_name: string;
  logo_url: string;
  support_email: string;
  contact_phone: string;
  contact_address: string;
  announcement: string;
}

/** Shape returned by the get_entitlement() database function. */
export interface Entitlement {
  active: boolean;
  status: string;
  package_name?: string;
  daily_seconds?: number;
  used_seconds_today?: number;
  remaining_seconds_today?: number;
  daily_exports?: number;
  exports_today?: number;
  remaining_exports_today?: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
}

export interface AdminNote {
  id: string;
  note: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "email"> | null;
}
