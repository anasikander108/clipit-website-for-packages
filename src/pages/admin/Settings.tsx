import { useEffect, useState, type FormEvent } from "react";
import { Activity, HardDriveDownload } from "lucide-react";
import { db, errorMessage } from "../../lib/supabase";
import { must, useQuery } from "../../lib/useQuery";
import { useSite } from "../../lib/site";
import { date, dateTime } from "../../lib/format";
import type { ActivityLog, BankSettings, Release, WebsiteSettings } from "../../lib/types";
import { matches, TableToolbar, td, th } from "../../components/common";
import { Alert, Badge, Button, EmptyState, Modal, PageHeader, Spinner, TextArea, TextField } from "../../components/ui";

type Msg = { tone: "success" | "error"; text: string } | null;

/** Generic editor for a singleton settings row (id = 1). */
function useSingleton<T extends object>(table: string, columns: string) {
  const q = useQuery(async () => must(await db().from(table).select(columns).eq("id", 1).single()) as T);
  const [form, setForm] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  useEffect(() => { if (q.data) setForm(q.data); }, [q.data]);
  async function save(e: FormEvent, after?: () => void) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await db().from(table).update(form!).eq("id", 1);
    setBusy(false);
    if (error) return setMsg({ tone: "error", text: errorMessage(error) });
    setMsg({ tone: "success", text: "Saved." });
    after?.();
  }
  const field = (k: keyof T) => ({
    value: String(form?.[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form!, [k]: e.target.value }),
  });
  return { q, form, busy, msg, save, field };
}

export function BankSettingsPage() {
  const s = useSingleton<BankSettings>("bank_settings", "bank_name, account_title, account_number, iban, instructions");
  if (s.q.loading || !s.form) return s.q.error ? <Alert tone="error">{s.q.error}</Alert> : <Spinner />;
  return (
    <>
      <PageHeader title="Bank settings" description="Shown to customers on the payment page." />
      <form onSubmit={(e) => s.save(e)} className="card max-w-2xl space-y-4 p-6">
        {s.msg && <Alert tone={s.msg.tone}>{s.msg.text}</Alert>}
        <TextField label="Bank name" {...s.field("bank_name")} required />
        <TextField label="Account title" {...s.field("account_title")} required />
        <TextField label="Account number" {...s.field("account_number")} required />
        <TextField label="IBAN" {...s.field("iban")} placeholder="PK00 XXXX 0000 0000 0000 0000" />
        <TextArea label="Payment instructions" {...s.field("instructions")} placeholder="e.g. Use your registered email as the transfer remark." />
        <Button type="submit" loading={s.busy}>Save bank settings</Button>
      </form>
    </>
  );
}

export function WebsiteSettingsPage() {
  const { reload } = useSite();
  const s = useSingleton<WebsiteSettings>("website_settings", "product_name, logo_url, support_email, contact_phone, contact_address, announcement");
  if (s.q.loading || !s.form) return s.q.error ? <Alert tone="error">{s.q.error}</Alert> : <Spinner />;
  const logoOk = !s.form.logo_url || /^https:\/\//.test(s.form.logo_url);
  return (
    <>
      <PageHeader title="Website settings" />
      <form onSubmit={(e) => (logoOk ? s.save(e, reload) : e.preventDefault())} className="card max-w-2xl space-y-4 p-6">
        {s.msg && <Alert tone={s.msg.tone}>{s.msg.text}</Alert>}
        <TextField label="Product name" {...s.field("product_name")} required />
        <TextField label="Logo URL" {...s.field("logo_url")} placeholder="https://… (square PNG or SVG)" error={logoOk ? null : "Use an https:// link."} hint="Leave empty to use the default mark." />
        <TextField label="Support email" type="email" {...s.field("support_email")} />
        <TextField label="Contact phone / WhatsApp" {...s.field("contact_phone")} />
        <TextArea label="Contact address" {...s.field("contact_address")} />
        <TextArea label="Website announcement" {...s.field("announcement")} hint="Shown in a bar above the homepage navigation. Leave empty to hide it." />
        <Button type="submit" loading={s.busy}>Save website settings</Button>
      </form>
    </>
  );
}

const EMPTY_RELEASE = { version: "", download_url: "", release_date: new Date().toISOString().slice(0, 10), changelog: "", install_instructions: "" };

export function Releases() {
  const q = useQuery(async () => must(await db().from("software_releases").select("*").order("created_at", { ascending: false })) as Release[]);
  const [editing, setEditing] = useState<(typeof EMPTY_RELEASE & { id?: string; makeCurrent: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setCurrent(id: string) {
    const c = db();
    const off = await c.from("software_releases").update({ is_current: false }).eq("is_current", true).neq("id", id);
    if (off.error) throw off.error;
    const on = await c.from("software_releases").update({ is_current: true }).eq("id", id);
    if (on.error) throw on.error;
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const r = editing!;
    if (!r.version.trim()) return setError("Enter a version number.");
    if (!/^https:\/\/\S+$/.test(r.download_url.trim())) return setError("The download link must start with https://");
    setBusy(true);
    setError(null);
    try {
      const row = { version: r.version.trim(), download_url: r.download_url.trim(), release_date: r.release_date, changelog: r.changelog, install_instructions: r.install_instructions };
      const res = r.id
        ? await db().from("software_releases").update(row).eq("id", r.id).select("id").single()
        : await db().from("software_releases").insert(row).select("id").single();
      if (res.error) throw res.error;
      if (r.makeCurrent) await setCurrent(res.data.id);
      setEditing(null);
      q.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const current = q.data?.find((r) => r.is_current);
  return (
    <>
      <PageHeader title="Software releases" description="Customers with an active subscription see the current release on their download page."
        actions={<Button onClick={() => { setError(null); setEditing({ ...EMPTY_RELEASE, makeCurrent: true }); }}>New release</Button>} />
      {!q.loading && !current && (q.data?.length ?? 0) > 0 && <div className="mb-4"><Alert tone="warning">No release is marked as current, so customers see no download.</Alert></div>}
      <div className="card overflow-hidden">
        {q.loading ? <Spinner /> : q.error ? <div className="p-4"><Alert tone="error">{q.error}</Alert></div> : !q.data?.length ? (
          <EmptyState icon={HardDriveDownload} title="No releases yet" action={<Button onClick={() => setEditing({ ...EMPTY_RELEASE, makeCurrent: true })}>Add the first release</Button>}>
            Add a version with its Google Drive link. Approved customers will see it right away.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-paper"><tr>{["Version", "Released", "Download link", "", ""].map((h, i) => <th key={i} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {q.data.map((r) => (
                  <tr key={r.id}>
                    <td className={`${td} font-medium`}>{r.version} {r.is_current && <Badge tone="teal" className="ml-2">Current</Badge>}</td>
                    <td className={td}>{date(r.release_date)}</td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-[13px]"><a className="underline" href={r.download_url} target="_blank" rel="noopener noreferrer">{r.download_url}</a></td>
                    <td className={td}>{!r.is_current && (
                      <Button size="sm" variant="secondary" onClick={async () => { try { await setCurrent(r.id); q.reload(); } catch (e) { setError(errorMessage(e)); } }}>Make current</Button>
                    )}</td>
                    <td className={`${td} text-right`}>
                      <Button size="sm" variant="ghost" onClick={() => { setError(null); setEditing({ ...r, makeCurrent: r.is_current }); }}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {error && !editing && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Edit ${editing.version}` : "New release"} wide
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button type="submit" form="release-form" loading={busy}>Save release</Button></>}>
        {editing && (
          <form id="release-form" onSubmit={save} className="space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Version" value={editing.version} onChange={(e) => setEditing({ ...editing, version: e.target.value })} placeholder="1.4.0" />
              <TextField label="Release date" type="date" value={editing.release_date} onChange={(e) => setEditing({ ...editing, release_date: e.target.value })} />
            </div>
            <TextField label="Download URL (Google Drive)" value={editing.download_url} onChange={(e) => setEditing({ ...editing, download_url: e.target.value })} placeholder="https://drive.google.com/…"
              hint="Share the file as 'Anyone with the link'. Only approved customers can see this link." />
            <TextArea label="Changelog" value={editing.changelog} onChange={(e) => setEditing({ ...editing, changelog: e.target.value })} />
            <TextArea label="Installation instructions" value={editing.install_instructions} onChange={(e) => setEditing({ ...editing, install_instructions: e.target.value })} />
            <label className="flex items-center gap-2.5 text-[14px]">
              <input type="checkbox" className="size-4 accent-[var(--color-teal)]" checked={editing.makeCurrent} onChange={(e) => setEditing({ ...editing, makeCurrent: e.target.checked })} />
              Make this the current release
            </label>
          </form>
        )}
      </Modal>
    </>
  );
}

const ACTION_LABEL: Record<string, string> = {
  "payment.approved": "Approved a payment",
  "payment.rejected": "Rejected a payment",
  "subscription.extended": "Extended a subscription",
  "subscription.suspended": "Suspended a subscription",
  "subscription.reactivated": "Reactivated a subscription",
  "subscription.package_changed": "Changed a package",
  "customer.note_added": "Added a customer note",
  "release.insert": "Added a release",
  "release.update": "Updated a release",
  "bank_settings.updated": "Updated bank settings",
  "website_settings.updated": "Updated website settings",
};

function describe(l: ActivityLog) {
  const d = l.details as Record<string, string | number>;
  const parts = [d.package && `package ${d.package}`, d.amount_pkr && `Rs. ${Number(d.amount_pkr).toLocaleString("en-PK")}`, d.days && `${d.days} days`,
    d.expires_at && `until ${date(String(d.expires_at))}`, d.reason && `“${d.reason}”`, d.version && `version ${d.version}`].filter(Boolean);
  return parts.join(" · ");
}

export function ActivityLogs() {
  const [search, setSearch] = useState("");
  const q = useQuery(async () => must(await db().from("activity_logs").select("*, profiles(full_name, email)").order("created_at", { ascending: false }).limit(300)) as ActivityLog[]);
  const shown = (q.data ?? []).filter((l) => matches(search, l.action, ACTION_LABEL[l.action], l.profiles?.email, l.profiles?.full_name, describe(l)));
  return (
    <>
      <PageHeader title="Activity logs" description="Every admin action, newest first (last 300)." />
      <div className="card overflow-hidden">
        <TableToolbar search={search} onSearch={setSearch} placeholder="Search actions or admins" />
        {q.loading ? <Spinner /> : q.error ? <div className="p-4"><Alert tone="error">{q.error}</Alert></div> : shown.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-paper"><tr>{["When", "Admin", "Action", "Details"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((l) => (
                  <tr key={l.id}>
                    <td className={td}>{dateTime(l.created_at)}</td>
                    <td className={td}>{l.profiles?.full_name || l.profiles?.email || "System"}</td>
                    <td className={`${td} font-medium`}>{ACTION_LABEL[l.action] ?? l.action}</td>
                    <td className="px-4 py-3 text-[13.5px] text-muted">{describe(l) || "—"}</td>
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
