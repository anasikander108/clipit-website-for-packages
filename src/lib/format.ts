import type { Subscription } from "./types";

const DAY = 86_400_000;
const TZ = "Asia/Karachi";

export const pkr = (n: number) => `Rs. ${Number(n).toLocaleString("en-PK")}`;

export const date = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }) : "—";

export const dateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

/** Whole days left until expiry (0 once it has passed). */
export const daysLeft = (iso?: string | null) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY)) : 0);

/** 9000 -> "2 h 30 min" */
export function duration(seconds?: number | null) {
  const s = Math.max(0, Math.round(seconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export const hours = (n: number) => `${Number(n)} ${Number(n) === 1 ? "hour" : "hours"}`;

export type EffectiveStatus = "active" | "expired" | "suspended" | "replaced" | "none";

/** What a person should see: an "active" row past its expiry is expired, whether or not the cron job has run. */
export function effectiveStatus(sub?: Pick<Subscription, "status" | "expires_at"> | null): EffectiveStatus {
  if (!sub) return "none";
  if ((sub.status === "active" || sub.status === "suspended") && new Date(sub.expires_at).getTime() <= Date.now()) return "expired";
  return sub.status;
}

export const durationLabel = (days: number) =>
  days % 365 === 0
    ? `${days / 365} year${days > 365 ? "s" : ""}`
    : days % 30 === 0
      ? `${days / 30} month${days > 30 ? "s" : ""}`
      : `${days} days`;

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
