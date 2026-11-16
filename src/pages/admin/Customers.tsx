import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Users } from "lucide-react";
import { db, errorMessage } from "../../lib/supabase";
import { must, useQuery } from "../../lib/useQuery";
import { date, dateTime, daysLeft, duration, effectiveStatus, hours, pkr } from "../../lib/format";
import type { AdminNote, Profile, PurchaseRequest, Subscription, UsageLog } from "../../lib/types";
import { matches, TableToolbar, td, th } from "../../components/common";
import { Alert, Button, DetailList, EmptyState, PageHeader, Spinner, StatusBadge, TextArea } from "../../components/ui";
import { useSubscriptionActions } from "./actions";

const SUB_SELECT = "*, packages(name, slug), profiles!subscriptions_user_id_fkey(full_name, email, phone)";

/** Newest non-replaced subscription per user. */
function latestByUser(subs: Subscription[]) {
  const m = new Map<string, Subscription>();
  for (const s of subs) if (s.status !== "replaced" && !m.has(s.user_id)) m.set(s.user_id, s);
  return m;
}

export function Customers() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const q = useQuery(async () => {
    const c = db();
    const [profiles, subs, admins] = await Promise.all([
      c.from("profiles").select("id, full_name, email, phone, created_at").order("created_at", { ascending: false }),
      c.from("subscriptions").select("*, packages(name, slug)").order("created_at", { ascending: false }),
      c.from("admin_users").select("user_id"),
    ]);
    const adminIds = new Set((must(admins) as { user_id: string }[]).map((a) => a.user_id));
    const latest = latestByUser(must(subs) as Subscription[]);
    return (must(profiles) as Profile[]).filter((p) => !adminIds.has(p.id)).map((p) => {
      const sub = latest.get(p.id) ?? null;
      return { ...p, sub, status: effectiveStatus(sub) };
    });
  });
  const rows = q.data ?? [];
  const shown = useMemo(() => rows.filter((r) => (filter === "all" || r.status === filter) && matches(search, r.full_name, r.email, r.phone)), [rows, filter, search]);
  const count = (s: string) => rows.filter((r) => s === "all" || r.status === s).length;

  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} registered customers`} />
      <div className="card overflow-hidden">
        <TableToolbar search={search} onSearch={setSearch} placeholder="Search name, email or phone" filter={filter} onFilter={setFilter}
          filters={[["all", "All"], ["active", "Active"], ["expired", "Expired"], ["suspended", "Suspended"], ["none", "No plan"]].map(([v, l]) => ({ value: v, label: l, count: count(v) }))} />
        {q.loading ? <Spinner /> : q.error ? <div className="p-4"><Alert tone="error">{q.error}</Alert></div> : shown.length === 0 ? (
          <EmptyState icon={Users} title="No matching customers" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-paper"><tr>
                {["Customer", "Phone", "Package", "Status", "Start", "Expiry", "Days left"].map((h) => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-paper" onClick={() => nav(`/admin/customers/${r.id}`)}>
                    <td className={td}>
                      <Link to={`/admin/customers/${r.id}`} className="font-medium" onClick={(e) => e.stopPropagation()}>{r.full_name || "—"}</Link>
                      <p className="text-[12.5px] text-muted">{r.email}</p>
                    </td>
                    <td className={td}>{r.phone || "—"}</td>
                    <td className={td}>{r.sub?.packages?.name ?? "—"}</td>
                    <td className={td}><StatusBadge status={r.status} /></td>
                    <td className={td}>{date(r.sub?.starts_at)}</td>
                    <td className={td}>{date(r.sub?.expires_at)}</td>
                    <td className={`${td} tabular-nums`}>{r.status === "active" ? daysLeft(r.sub?.expires_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function CustomerDetail() {
  const { id = "" } = useParams();
  const q = useQuery(async () => {
    const c = db();
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const [profile, subs, reqs, usage, notes] = await Promise.all([
      c.from("profiles").select("id, full_name, email, phone, created_at").eq("id", id).maybeSingle(),
      c.from("subscriptions").select("*, packages(name, slug)").eq("user_id", id).order("created_at", { ascending: false }),
      c.from("purchase_requests").select("*, packages(name, slug)").eq("user_id", id).order("created_at", { ascending: false }),
      c.from("usage_logs").select("*").eq("user_id", id).gte("usage_date", since).order("created_at", { ascending: false }),
      c.from("admin_notes").select("id, note, created_at, profiles!admin_notes_admin_id_fkey(full_name, email)").eq("user_id", id).order("created_at", { ascending: false }),
    ]);
    return {
      profile: must(profile) as Profile | null,
      subs: must(subs) as Subscription[],
      reqs: must(reqs) as PurchaseRequest[],
      usage: must(usage) as UsageLog[],
      notes: must(notes) as unknown as AdminNote[],
    };
  }, [id]);
  const actions = useSubscriptionActions(() => q.reload());
  const [note, setNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  if (q.loading && !q.data) return <Spinner />;
  if (q.error) return <Alert tone="error">{q.error}</Alert>;
  const { profile, subs, reqs, usage, notes } = q.data!;
  if (!profile) return <EmptyState title="Customer not found" action={<Link to="/admin/customers" className="underline">Back to customers</Link>} />;
  const sub = latestByUser(subs).get(profile.id) ?? null;
  const status = effectiveStatus(sub);
  const days = Object.entries(usage.reduce<Record<string, { s: number; e: number }>>((acc, u) => {
    const d = (acc[u.usage_date] ??= { s: 0, e: 0 });
    if (u.kind === "process") d.s += u.seconds; else d.e += 1;
    return acc;
  }, {}));

  return (
    <>
      <Link to="/admin/customers" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Customers</Link>
      <PageHeader title={profile.full_name || profile.email} description={`Customer since ${date(profile.created_at)}`} />
      {actions.modals}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Subscription</h2>
              <StatusBadge status={status} />
            </div>
            {!sub ? <p className="py-3 text-[14px] text-muted">No subscription yet.</p> : (
              <>
                <DetailList items={[
                  ["Package", sub.packages?.name ?? "—"],
                  ["Start date", dateTime(sub.starts_at)],
                  ["Expiry date", dateTime(sub.expires_at)],
                  ["Days remaining", status === "active" ? String(daysLeft(sub.expires_at)) : "0"],
                  ["Daily limit", `${hours(sub.daily_hours)} · ${sub.daily_exports} exports`],
                  ["Web access", sub.web_access ? "Yes" : "No"],
                ]} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => actions.extend(sub)}>Extend</Button>
                  {status === "active" && <Button size="sm" variant="secondary" onClick={() => actions.suspend(sub)}>Suspend</Button>}
                  {status === "suspended" && <Button size="sm" variant="secondary" onClick={() => actions.reactivate(sub)}>Reactivate</Button>}
                  {(status === "active" || status === "suspended") && <Button size="sm" variant="secondary" onClick={() => actions.changePackage(sub)}>Change package</Button>}
                </div>
              </>
            )}
          </div>

          <div className="card overflow-hidden">
            <h2 className="border-b border-line px-6 py-4 text-[15px] font-semibold">Payment history</h2>
            {reqs.length === 0 ? <p className="px-6 py-5 text-[14px] text-muted">No payments.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-line bg-paper"><tr>{["Package", "Amount", "Reference", "Submitted", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-line">
                    {reqs.map((r) => (
                      <tr key={r.id}>
                        <td className={td}><Link className="font-medium underline-offset-4 hover:underline" to={`/admin/payments/${r.id}`}>{r.packages?.name}</Link></td>
                        <td className={td}>{pkr(r.amount_pkr)}</td>
                        <td className={`${td} font-mono text-[13px]`}>{r.transaction_ref}</td>
                        <td className={td}>{dateTime(r.created_at)}</td>
                        <td className={td}><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <h2 className="border-b border-line px-6 py-4 text-[15px] font-semibold">Usage, last 30 days</h2>
            {days.length === 0 ? <p className="px-6 py-5 text-[14px] text-muted">No usage recorded.</p> : (
              <table className="w-full">
                <thead className="border-b border-line bg-paper"><tr>{["Day", "Video processed", "Exports"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {days.map(([d, v]) => (
                    <tr key={d}><td className={td}>{date(`${d}T12:00:00+05:00`)}</td><td className={td}>{duration(v.s)}</td><td className={td}>{v.e}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-[15px] font-semibold">Contact</h2>
            <DetailList items={[["Email", profile.email], ["Phone", profile.phone || "—"]]} />
          </div>
          <div className="card p-6">
            <h2 className="text-[15px] font-semibold">Admin notes</h2>
            <p className="text-[12.5px] text-muted">Only admins can see these.</p>
            <form className="mt-4 space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              if (!note.trim()) return;
              setNoteBusy(true);
              setNoteError(null);
              const { error } = await db().rpc("admin_add_note", { p_user_id: profile.id, p_note: note });
              setNoteBusy(false);
              if (error) return setNoteError(errorMessage(error));
              setNote("");
              q.reload();
            }}>
              {noteError && <Alert tone="error">{noteError}</Alert>}
              <TextArea label="New note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
              <Button size="sm" type="submit" loading={noteBusy} disabled={!note.trim()}>Add note</Button>
            </form>
            <ul className="mt-5 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-line bg-paper p-3">
                  <p className="whitespace-pre-line text-[14px]">{n.note}</p>
                  <p className="mt-1.5 text-[12px] text-muted">{n.profiles?.full_name || n.profiles?.email} · {dateTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export function Subscriptions() {
  const nav = useNavigate();
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const q = useQuery(async () => must(await db().from("subscriptions").select(SUB_SELECT).neq("status", "replaced").order("expires_at", { ascending: true })) as Subscription[]);
  const actions = useSubscriptionActions(() => q.reload());
  const rows = (q.data ?? []).map((s) => ({ ...s, eff: effectiveStatus(s) }));
  const soon = (s: (typeof rows)[number]) => s.eff === "active" && daysLeft(s.expires_at) <= 7;
  const pass = (s: (typeof rows)[number], f: string) => f === "all" || (f === "upcoming" ? soon(s) : s.eff === f);
  const shown = rows.filter((s) => pass(s, filter) && matches(search, s.profiles?.full_name, s.profiles?.email, s.profiles?.phone));

  return (
    <>
      <PageHeader title="Subscriptions" description="Subscriptions end automatically at their expiry time. Login accounts are never removed." />
      {actions.modals}
      <div className="card overflow-hidden">
        <TableToolbar search={search} onSearch={setSearch} placeholder="Search customer" filter={filter} onFilter={setFilter}
          filters={[["active", "Active"], ["upcoming", "Expiring in 7 days"], ["expired", "Expired"], ["suspended", "Suspended"], ["all", "All"]].map(([v, l]) => ({ value: v, label: l, count: rows.filter((s) => pass(s, v)).length }))} />
        {q.loading ? <Spinner /> : q.error ? <div className="p-4"><Alert tone="error">{q.error}</Alert></div> : shown.length === 0 ? (
          <EmptyState icon={CreditCard} title="No matching subscriptions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-paper"><tr>
                {["Customer", "Package", "Status", "Start", "Expiry", "Days left", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((s) => (
                  <tr key={s.id} className="hover:bg-paper">
                    <td className={`${td} cursor-pointer`} onClick={() => nav(`/admin/customers/${s.user_id}`)}>
                      <p className="font-medium">{s.profiles?.full_name || "—"}</p>
                      <p className="text-[12.5px] text-muted">{s.profiles?.email}</p>
                    </td>
                    <td className={td}>{s.packages?.name}</td>
                    <td className={td}><StatusBadge status={s.eff} /></td>
                    <td className={td}>{date(s.starts_at)}</td>
                    <td className={td}>{date(s.expires_at)}{soon(s) && <span className="ml-2 text-[12px] font-medium text-amber">soon</span>}</td>
                    <td className={`${td} tabular-nums`}>{s.eff === "active" ? daysLeft(s.expires_at) : "—"}</td>
                    <td className={`${td} text-right`}><Button size="sm" variant="secondary" onClick={() => actions.extend(s)}>Extend</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
