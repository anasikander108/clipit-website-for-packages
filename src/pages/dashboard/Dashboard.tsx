import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard, Download, ExternalLink, HardDriveDownload, LayoutDashboard, LifeBuoy, Lock, Mail, Receipt, Settings, Shield,
} from "lucide-react";
import { db, errorMessage, notify } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useSite } from "../../lib/site";
import { date, dateTime, daysLeft, duration, hours, pkr } from "../../lib/format";
import { Shell, td, th, type NavItem } from "../../components/common";
import {
  Alert, Button, DetailList, EmptyState, LinkButton, PageHeader, Progress, Spinner, Stat, StatusBadge, TextField, btn,
} from "../../components/ui";
import { CustomerDataProvider, useCustomer, type CustomerData } from "./data";

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/subscription", label: "My subscription", icon: CreditCard },
  { to: "/dashboard/download", label: "Download software", icon: HardDriveDownload },
  { to: "/dashboard/payments", label: "Payment history", icon: Receipt },
  { to: "/dashboard/settings", label: "Account settings", icon: Settings },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export function DashboardLayout() {
  const { isAdmin } = useAuth();
  return (
    <CustomerDataProvider>
      <Shell nav={NAV} area="Customer" footer={isAdmin ? (
        <Link to="/admin" className="mb-1 flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted hover:bg-paper hover:text-ink"><Shield className="size-4" /> Admin dashboard</Link>
      ) : null} />
    </CustomerDataProvider>
  );
}

/** Loading / error wrapper for every customer page. */
function WithData({ children }: { children: (d: CustomerData, reload: () => void) => ReactNode }) {
  const q = useCustomer();
  if (q.loading && !q.data) return <Spinner />;
  if (q.error) return <Alert tone="error" action={<Button size="sm" variant="secondary" onClick={q.reload}>Retry</Button>}>{q.error}</Alert>;
  return <>{children(q.data!, q.reload)}</>;
}

/** The one-line answer to "where do I stand?", shown at the top of Overview. */
function StatusPanel({ d }: { d: CustomerData }) {
  const { sub, status, pending, latest } = d;
  if (status === "active" && sub) {
    return (
      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5"><StatusBadge status="active" /><span className="text-[14px] text-muted">{sub.packages?.name} plan</span></div>
          <p className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">{daysLeft(sub.expires_at)} days remaining</p>
          <p className="mt-1 text-[14px] text-muted">Active until {date(sub.expires_at)}</p>
        </div>
        <LinkButton to="/dashboard/download" size="lg"><Download className="size-4" /> Download software</LinkButton>
      </div>
    );
  }
  if (pending) {
    return (
      <Alert tone="warning" title="Your payment is being verified">
        We received your {pending.packages?.name} payment of {pkr(pending.amount_pkr)} (reference {pending.transaction_ref}) on {dateTime(pending.created_at)}.
        Our team checks it against our bank records and will activate your subscription shortly. The download appears here once it is approved.
      </Alert>
    );
  }
  if (status === "suspended") {
    return <Alert tone="error" title="Your subscription is suspended">Access to the software is paused. Please contact support to resolve this.</Alert>;
  }
  if (latest?.status === "rejected" && status !== "expired") {
    return (
      <Alert tone="error" title="We could not approve your last payment"
        action={<LinkButton size="sm" variant="secondary" to={`/checkout/${latest.packages?.slug ?? "starter"}`}>Submit new payment</LinkButton>}>
        Reason: {latest.rejection_reason || "The payment could not be matched with our bank records."}
      </Alert>
    );
  }
  if (status === "expired" && sub) {
    return (
      <Alert tone="info" title={`Your ${sub.packages?.name} plan ended on ${date(sub.expires_at)}`}
        action={<LinkButton size="sm" to={`/checkout/${sub.packages?.slug ?? "starter"}`}>Renew</LinkButton>}>
        Your account and history are kept. Renew to keep processing videos.
      </Alert>
    );
  }
  return (
    <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[17px] font-semibold">You don't have a subscription yet</p>
        <p className="mt-1 text-[14px] text-muted">Choose a plan and pay by bank transfer to get the software.</p>
      </div>
      <a href="/#pricing" className={btn("primary")}>See plans</a>
    </div>
  );
}

function UsageCard({ d }: { d: CustomerData }) {
  const e = d.entitlement;
  if (!e?.active) return null;
  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Today's usage</h2>
        <span className="text-[12.5px] text-muted">Resets at midnight, Pakistan time</span>
      </div>
      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex justify-between text-[14px]"><span className="text-muted">Video processed</span><span className="font-medium">{duration(e.used_seconds_today)} of {duration(e.daily_seconds)}</span></div>
          <Progress value={e.used_seconds_today ?? 0} max={e.daily_seconds ?? 0} />
          <p className="mt-2 text-[13px] text-muted">{duration(e.remaining_seconds_today)} left today</p>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-[14px]"><span className="text-muted">Exports</span><span className="font-medium">{e.exports_today} of {e.daily_exports}</span></div>
          <Progress value={e.exports_today ?? 0} max={e.daily_exports ?? 0} />
          <p className="mt-2 text-[13px] text-muted">{e.remaining_exports_today} left today</p>
        </div>
      </div>
    </div>
  );
}

export function Overview() {
  const { profile } = useAuth();
  useEffect(() => void notify("welcome"), []); // sends once per account; the function ignores repeats
  return (
    <WithData>
      {(d) => (
        <>
          <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] || "there"}`} description="Your subscription, usage and downloads in one place." />
          <div className="space-y-6">
            <StatusPanel d={d} />
            {d.status === "active" && d.sub && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Package" value={d.sub.packages?.name ?? "—"} />
                  <Stat label="Started" value={date(d.sub.starts_at)} />
                  <Stat label="Expires" value={date(d.sub.expires_at)} hint={`${daysLeft(d.sub.expires_at)} days remaining`} />
                  <Stat label="Daily limit" value={hours(d.sub.daily_hours)} hint={`${d.sub.daily_exports} exports a day`} />
                </div>
                <UsageCard d={d} />
                {(d.sub.instructions || d.release) && (
                  <div className="card p-6">
                    <h2 className="text-[15px] font-semibold">From our team</h2>
                    {d.sub.instructions && <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{d.sub.instructions}</p>}
                    {d.release && <p className="mt-3 text-[14px] text-muted">Current version: <span className="font-medium text-ink">{d.release.version}</span>, released {date(d.release.release_date)}</p>}
                  </div>
                )}
              </>
            )}
            {d.status === "active" && d.pending && (
              <Alert tone="info" title="Renewal under review">Your {d.pending.packages?.name} payment is being verified. Its days will be added after your current expiry.</Alert>
            )}
          </div>
        </>
      )}
    </WithData>
  );
}

export function MySubscription() {
  return (
    <WithData>
      {(d) => (
        <>
          <PageHeader title="My subscription" />
          {!d.sub ? (
            <div className="card"><EmptyState icon={CreditCard} title="No subscription yet" action={<a href="/#pricing" className={btn("primary")}>See plans</a>}>
              {d.pending ? "Your payment is being verified. Your subscription appears here once it is approved." : "Your subscription details will appear here after your first payment is approved."}
            </EmptyState></div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
              <div className="card p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[17px] font-semibold">{d.sub.packages?.name}</h2>
                  <StatusBadge status={d.pending && d.status !== "active" ? "pending" : d.status} />
                </div>
                <DetailList items={[
                  ["Status", d.status === "active" ? "Active" : d.status === "expired" ? "Expired" : d.status === "suspended" ? "Suspended" : d.status],
                  ["Start date", date(d.sub.starts_at)],
                  ["Expiry date", date(d.sub.expires_at)],
                  ["Days remaining", d.status === "active" ? String(daysLeft(d.sub.expires_at)) : "0"],
                  ["Daily processing limit", hours(d.sub.daily_hours)],
                  ["Daily exports", String(d.sub.daily_exports)],
                  ["Web application", d.sub.web_access ? "Included" : "Not included"],
                ]} />
              </div>
              <div className="space-y-4">
                <UsageCard d={d} />
                <UsageHistory />
                {d.status !== "active" && d.sub.packages && (
                  <LinkButton to={`/checkout/${d.sub.packages.slug}`} className="w-full">Renew {d.sub.packages.name}</LinkButton>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </WithData>
  );
}

/** Totals for the last 30 days, from the customer's own usage logs. */
function UsageHistory() {
  const [rows, setRows] = useState<{ seconds: number; exports: number; days: number } | null>(null);
  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    db().from("usage_logs").select("kind, seconds, usage_date").gte("usage_date", since).then(({ data }) => {
      const list = (data ?? []) as { kind: string; seconds: number; usage_date: string }[];
      setRows({
        seconds: list.filter((r) => r.kind === "process").reduce((s, r) => s + r.seconds, 0),
        exports: list.filter((r) => r.kind === "export").length,
        days: new Set(list.map((r) => r.usage_date)).size,
      });
    });
  }, []);
  return (
    <div className="card p-6">
      <h2 className="text-[15px] font-semibold">Last 30 days</h2>
      {!rows ? <p className="mt-3 text-[14px] text-muted">Loading…</p> : (
        <DetailList items={[["Video processed", duration(rows.seconds)], ["Exports", String(rows.exports)], ["Active days", String(rows.days)]]} />
      )}
    </div>
  );
}

export function DownloadPage() {
  return (
    <WithData>
      {(d) => (
        <>
          <PageHeader title="Download software" description="The ClipXo desktop application for Windows 10 and 11 (64-bit)." />
          {d.status !== "active" || !d.release ? (
            <div className="card">
              <EmptyState icon={Lock} title={d.status === "active" ? "The download is being prepared" : "The download unlocks after your payment is approved"}
                action={d.status === "active" ? undefined : d.pending ? <LinkButton to="/dashboard" variant="secondary">View payment status</LinkButton> : <a href="/#pricing" className={btn("primary")}>See plans</a>}>
                {d.status === "active"
                  ? "Our team has not published a release yet. Please check back soon or contact support."
                  : d.status === "suspended"
                    ? "Your subscription is suspended. Please contact support."
                    : d.pending
                      ? "We are verifying your payment. As soon as it is approved, the download button appears here and we email you."
                      : "Buy a plan and submit your payment. Once our team approves it, you can download the software here."}
              </EmptyState>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] text-muted">Latest version</p>
                      <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">ClipXo {d.release.version}</p>
                      <p className="mt-1 text-[13.5px] text-muted">Released {date(d.release.release_date)}</p>
                    </div>
                    <a href={d.release.download_url} target="_blank" rel="noopener noreferrer" className={btn("primary", "lg")}>
                      <Download className="size-4" /> Download for Windows <ExternalLink className="size-3.5 opacity-60" />
                    </a>
                  </div>
                </div>
                {d.release.install_instructions && (
                  <div className="card p-6">
                    <h2 className="text-[15px] font-semibold">Installation</h2>
                    <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{d.release.install_instructions}</p>
                  </div>
                )}
                {d.release.changelog && (
                  <div className="card p-6">
                    <h2 className="text-[15px] font-semibold">What's new in {d.release.version}</h2>
                    <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{d.release.changelog}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {d.sub?.instructions && (
                  <div className="card p-6">
                    <h2 className="text-[15px] font-semibold">Notes for you</h2>
                    <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{d.sub.instructions}</p>
                  </div>
                )}
                <div className="card p-6 text-[14px] leading-relaxed text-ink-2">
                  <h2 className="text-[15px] font-semibold text-ink">Signing in to the app</h2>
                  <p className="mt-2">Open ClipXo and sign in with the same email and password you use on this website. The app picks up your plan and daily limits automatically.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </WithData>
  );
}

export function PaymentHistory() {
  return (
    <WithData>
      {(d) => (
        <>
          <PageHeader title="Payment history" description="Every payment request you have submitted." />
          <div className="card overflow-hidden">
            {d.requests.length === 0 ? (
              <EmptyState icon={Receipt} title="No payments yet" action={<a href="/#pricing" className={btn("primary")}>See plans</a>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-line bg-paper"><tr>
                    {["Package", "Amount", "Reference", "Submitted", "Status", "Response"].map((h) => <th key={h} className={th}>{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {d.requests.map((r) => (
                      <tr key={r.id}>
                        <td className={`${td} font-medium`}>{r.packages?.name}</td>
                        <td className={td}>{pkr(r.amount_pkr)}</td>
                        <td className={`${td} font-mono text-[13px]`}>{r.transaction_ref}</td>
                        <td className={td}>{dateTime(r.created_at)}</td>
                        <td className={td}><StatusBadge status={r.status} /></td>
                        <td className="max-w-[320px] px-4 py-3 text-[14px] text-ink-2">
                          {r.status === "rejected" ? r.rejection_reason : r.status === "approved" ? (r.admin_note || `Approved ${date(r.reviewed_at)}`) : "Waiting for review"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {d.latest?.status === "rejected" && !d.pending && d.status !== "active" && (
            <div className="mt-4"><LinkButton to={`/checkout/${d.latest.packages?.slug ?? "starter"}`}>Submit a new payment</LinkButton></div>
          )}
        </>
      )}
    </WithData>
  );
}

export function AccountSettings() {
  const { profile, session, refreshProfile } = useAuth();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  return (
    <>
      <PageHeader title="Account settings" />
      <div className="grid max-w-3xl gap-6">
        <form className="card space-y-4 p-6" onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          if (!/^\+?[0-9][0-9\s-]{8,15}$/.test(phone.trim())) return setMsg({ tone: "error", text: "Please enter a valid phone number." });
          setBusy(true);
          const { error } = await db().from("profiles").update({ phone: phone.trim() }).eq("id", profile!.id);
          setBusy(false);
          if (error) return setMsg({ tone: "error", text: errorMessage(error) });
          await refreshProfile();
          setMsg({ tone: "success", text: "Phone number updated." });
        }}>
          <h2 className="text-[15px] font-semibold">Profile</h2>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <TextField label="Full name" value={profile?.full_name ?? ""} disabled hint="Contact support to change your name." />
          <TextField label="Email address" value={session?.user.email ?? ""} disabled hint={<span className="inline-flex items-center gap-1"><Mail className="size-3.5" /> Verified. Your email is your permanent account identity.</span>} />
          <TextField label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" loading={busy}>Save phone number</Button>
        </form>

        <form className="card space-y-4 p-6" onSubmit={async (e) => {
          e.preventDefault();
          setPwMsg(null);
          if (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/[0-9]/.test(pw.next)) return setPwMsg({ tone: "error", text: "Use at least 8 characters with letters and numbers." });
          if (pw.next !== pw.confirm) return setPwMsg({ tone: "error", text: "The new passwords do not match." });
          setPwBusy(true);
          // confirm the current password before changing it
          const check = await db().auth.signInWithPassword({ email: session!.user.email!, password: pw.current });
          if (check.error) {
            setPwBusy(false);
            return setPwMsg({ tone: "error", text: "Your current password is not correct." });
          }
          const { error } = await db().auth.updateUser({ password: pw.next });
          setPwBusy(false);
          if (error) return setPwMsg({ tone: "error", text: errorMessage(error) });
          setPw({ current: "", next: "", confirm: "" });
          setPwMsg({ tone: "success", text: "Password changed." });
        }}>
          <h2 className="text-[15px] font-semibold">Change password</h2>
          {pwMsg && <Alert tone={pwMsg.tone}>{pwMsg.text}</Alert>}
          <TextField label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <TextField label="New password" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <TextField label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          <Button type="submit" loading={pwBusy}>Change password</Button>
        </form>
      </div>
    </>
  );
}

export function Support() {
  const { site } = useSite();
  const { profile } = useAuth();
  return (
    <>
      <PageHeader title="Support" description="We usually reply within one working day. Pro and Business customers are answered first." />
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div className="card p-6">
          <Mail className="size-5 text-muted" strokeWidth={1.75} />
          <h2 className="mt-4 text-[15px] font-semibold">Email</h2>
          {site.support_email ? (
            <>
              <p className="mt-1 text-[14px] text-muted">Write from {profile?.email} so we can find your account.</p>
              <a className={btn("secondary", "md", "mt-4")} href={`mailto:${site.support_email}?subject=${encodeURIComponent("Support request")}`}>{site.support_email}</a>
            </>
          ) : <p className="mt-1 text-[14px] text-muted">The support address will be published here soon.</p>}
        </div>
        <div className="card p-6">
          <LifeBuoy className="size-5 text-muted" strokeWidth={1.75} />
          <h2 className="mt-4 text-[15px] font-semibold">Phone / WhatsApp</h2>
          <p className="mt-1 text-[14px] text-muted">{site.contact_phone || "Not available yet."}</p>
          {site.contact_address && <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{site.contact_address}</p>}
        </div>
      </div>
      <div className="card mt-4 max-w-3xl p-6 text-[14px] leading-relaxed text-ink-2">
        <h2 className="text-[15px] font-semibold text-ink">Before you write</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Payment questions: include your transaction reference.</li>
          <li>Software problems: include the ClipXo version and what you were doing when it happened.</li>
          <li>Limit questions: daily allowances reset at midnight Pakistan time.</li>
        </ul>
      </div>
    </>
  );
}
