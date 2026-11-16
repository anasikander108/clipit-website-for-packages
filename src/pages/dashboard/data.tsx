import { createContext, useContext, type ReactNode } from "react";
import { db } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { must, useQuery } from "../../lib/useQuery";
import { effectiveStatus, type EffectiveStatus } from "../../lib/format";
import type { Entitlement, PurchaseRequest, Release, Subscription } from "../../lib/types";

export interface CustomerData {
  sub: Subscription | null;
  status: EffectiveStatus;
  requests: PurchaseRequest[];
  pending: PurchaseRequest | null;
  latest: PurchaseRequest | null;
  entitlement: Entitlement | null;
  release: Release | null;
}

async function loadCustomer(uid: string): Promise<CustomerData> {
  const client = db();
  const [sub, reqs, ent, rel] = await Promise.all([
    client.from("subscriptions").select("*, packages(name, slug)").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    client.from("purchase_requests").select("*, packages(name, slug, duration_days, daily_hours)").eq("user_id", uid).order("created_at", { ascending: false }),
    client.rpc("get_entitlement"),
    // RLS returns the current release only to customers with a live subscription
    client.from("software_releases").select("*").eq("is_current", true).maybeSingle(),
  ]);
  const s = must(sub) as Subscription | null;
  const requests = (must(reqs) as PurchaseRequest[]) ?? [];
  return {
    sub: s,
    status: effectiveStatus(s),
    requests,
    pending: requests.find((r) => r.status === "pending") ?? null,
    latest: requests[0] ?? null,
    entitlement: (must(ent) as Entitlement) ?? null,
    release: (must(rel) as Release | null) ?? null,
  };
}

const Ctx = createContext<(ReturnType<typeof useQuery<CustomerData>>) | null>(null);

export function CustomerDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const q = useQuery(() => loadCustomer(session!.user.id), [session?.user.id]);
  return <Ctx.Provider value={q}>{children}</Ctx.Provider>;
}

export function useCustomer() {
  const q = useContext(Ctx);
  if (!q) throw new Error("useCustomer outside CustomerDataProvider");
  return q;
}
