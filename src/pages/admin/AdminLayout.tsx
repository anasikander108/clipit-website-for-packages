import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, Banknote, CreditCard, Globe, HardDriveDownload, LayoutDashboard, ReceiptText, User, Users,
} from "lucide-react";
import { db } from "../../lib/supabase";
import { must, useQuery } from "../../lib/useQuery";
import { effectiveStatus, pkr } from "../../lib/format";
import { Shell, type NavItem } from "../../components/common";
import { Alert, Button, PageHeader, Spinner, Stat } from "../../components/ui";
import { BarChart, lastMonths, monthKey, ShareBars } from "../../components/charts";

export function AdminLayout() {
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    const load = () => db().from("purchase_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
      .then(({ count }) => setPending(count ?? 0));
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);
  const nav: NavItem[] = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/payments", label: "Payment requests", icon: ReceiptText,
      badge: pending ? <span className="rounded bg-amber-soft px-1.5 text-[12px] font-medium text-amber">{pending}</span> : null },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { to: "/admin/releases", label: "Software releases", icon: HardDriveDownload },
    { to: "/admin/bank", label: "Bank settings", icon: Banknote },
    { to: "/admin/settings", label: "Website settings", icon: Globe },
    { to: "/admin/activity", label: "Activity logs", icon: Activity },
  ];
  return (
    <Shell nav={nav} area="Admin" footer={
      <Link to="/dashboard" className="mb-1 flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted hover:bg-paper hover:text-ink"><User className="size-4" /> Customer view</Link>
    } />
  );
}

export function AdminOverview() {
  const q = useQuery(async () => {
    const c = db();
    const [profiles, admins, subs, reqs] = await Promise.all([
      c.from("profiles").select("id, created_at"),
      c.from("admin_users").select("user_id"),
      c.from("subscriptions").select("status, expires_at, packages(name)"),
      c.from("purchase_requests").select("status, amount_pkr, reviewed_at"),
    ]);
    const adminIds = new Set((must(admins) as { user_id: string }[]).map((a) => a.user_id));
    return {
      customers: (must(profiles) as { id: string; created_at: string }[]).filter((p) => !adminIds.has(p.id)),
      subs: must(subs) as unknown as { status: "active" | "expired" | "suspended" | "replaced"; expires_at: string; packages: { name: string } | null }[],
      reqs: must(reqs) as { status: string; amount_pkr: number; reviewed_at: string | null }[],
    };
  });

  if (q.loading) return <Spinner />;
  if (q.error) return <Alert tone="error" action={<Button size="sm" variant="secondary" onClick={q.reload}>Retry</Button>}>{q.error}</Alert>;
  const { customers, subs, reqs } = q.data!;
  const eff = subs.map((s) => ({ ...s, eff: effectiveStatus(s) }));
  const approved = reqs.filter((r) => r.status === "approved");
  const months = lastMonths(6);
  const revenue = months.map((m) => ({ label: m.label, value: approved.filter((r) => r.reviewed_at && monthKey(r.reviewed_at) === m.key).reduce((s, r) => s + r.amount_pkr, 0) }));
  const signups = months.map((m) => ({ label: m.label, value: customers.filter((c) => monthKey(c.created_at) === m.key).length }));
  const live = eff.filter((s) => s.eff === "active");
  const byPackage = Object.entries(live.reduce<Record<string, number>>((acc, s) => {
    const n = s.packages?.name ?? "Unknown";
    acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {})).map(([label, value]) => ({ label, value }));
  const compact = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

  return (
    <>
      <PageHeader title="Overview" description="All figures are live from the database." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Registered customers" value={customers.length} />
        <Stat label="Active subscriptions" value={live.length} />
        <Stat label="Pending payment requests" value={reqs.filter((r) => r.status === "pending").length} hint={<Link className="underline" to="/admin/payments">Review payments</Link>} />
        <Stat label="Expired subscriptions" value={eff.filter((s) => s.eff === "expired").length} />
        <Stat label="Suspended accounts" value={eff.filter((s) => s.eff === "suspended").length} />
        <Stat label="Total approved revenue" value={pkr(approved.reduce((s, r) => s + r.amount_pkr, 0))} hint={`${approved.length} approved payments`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-[15px] font-semibold">Revenue, last 6 months</h2>
          <p className="text-[13px] text-muted">By approval date, PKR</p>
          <div className="mt-5"><BarChart data={revenue} format={compact} /></div>
        </div>
        <div className="card p-6">
          <h2 className="text-[15px] font-semibold">New customers, last 6 months</h2>
          <p className="text-[13px] text-muted">By registration date</p>
          <div className="mt-5"><BarChart data={signups} color="var(--color-ink)" /></div>
        </div>
      </div>
      <div className="card mt-6 p-6">
        <h2 className="text-[15px] font-semibold">Active subscriptions by package</h2>
        <div className="mt-5">{byPackage.length ? <ShareBars data={byPackage} /> : <p className="text-[14px] text-muted">No active subscriptions yet.</p>}</div>
      </div>
    </>
  );
}
