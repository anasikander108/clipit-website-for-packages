import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ImageOff, ReceiptText, X, ZoomIn, ZoomOut } from "lucide-react";
import { db, errorMessage, notify, SCREENSHOT_BUCKET } from "../../lib/supabase";
import { must, useQuery } from "../../lib/useQuery";
import { date, dateTime, durationLabel, hours, pkr } from "../../lib/format";
import type { PurchaseRequest } from "../../lib/types";
import { matches, TableToolbar, td, th } from "../../components/common";
import { Alert, Button, DetailList, EmptyState, Modal, PageHeader, Spinner, StatusBadge, TextArea } from "../../components/ui";

const SELECT = "*, packages(name, slug, duration_days, daily_hours), profiles!purchase_requests_user_id_fkey(full_name, email, phone)";

export function PaymentRequests() {
  const nav = useNavigate();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const q = useQuery(async () => must(await db().from("purchase_requests").select(SELECT).order("created_at", { ascending: false })) as PurchaseRequest[]);
  const rows = q.data ?? [];
  const count = (s: string) => rows.filter((r) => s === "all" || r.status === s).length;
  const shown = useMemo(
    () => rows.filter((r) => (filter === "all" || r.status === filter) && matches(search, r.profiles?.full_name, r.profiles?.email, r.profiles?.phone, r.transaction_ref)),
    [rows, filter, search],
  );

  return (
    <>
      <PageHeader title="Payment requests" description="Check each transfer against the bank statement before approving it." />
      <div className="card overflow-hidden">
        <TableToolbar search={search} onSearch={setSearch} placeholder="Search name, email, phone or reference" filter={filter} onFilter={setFilter}
          filters={["all", "pending", "approved", "rejected"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1), count: count(v) }))} />
        {q.loading ? <Spinner /> : q.error ? <div className="p-4"><Alert tone="error">{q.error}</Alert></div> : shown.length === 0 ? (
          <EmptyState icon={ReceiptText} title={filter === "pending" && !search ? "No payments waiting for review" : "No matching payment requests"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-paper"><tr>
                {["Customer", "Phone", "Package", "Amount", "Reference", "Submitted", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {shown.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-paper" onClick={() => nav(`/admin/payments/${r.id}`)}>
                    <td className={td}>
                      <Link to={`/admin/payments/${r.id}`} className="font-medium" onClick={(e) => e.stopPropagation()}>{r.profiles?.full_name || "—"}</Link>
                      <p className="text-[12.5px] text-muted">{r.profiles?.email}</p>
                    </td>
                    <td className={td}>{r.profiles?.phone || "—"}</td>
                    <td className={td}>{r.packages?.name}</td>
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
    </>
  );
}

function ScreenshotViewer({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    db().storage.from(SCREENSHOT_BUCKET).createSignedUrl(path, 600).then(({ data, error }) => {
      if (error || !data) setFailed(true);
      else setUrl(data.signedUrl);
    });
  }, [path]);
  if (failed) return <EmptyState icon={ImageOff} title="Screenshot could not be loaded" />;
  if (!url) return <Spinner label="Loading screenshot" />;
  return (
    <>
      <button onClick={() => { setScale(1); setZoomOpen(true); }} className="group relative block w-full overflow-hidden rounded-lg border border-line bg-paper">
        <img src={url} alt="Payment screenshot" className="mx-auto max-h-[420px] object-contain" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-ink/85 px-2.5 py-1 text-[12.5px] text-white"><ZoomIn className="size-3.5" /> Zoom</span>
      </button>
      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title="Payment screenshot" wide>
        <div className="mb-3 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} aria-label="Zoom out"><ZoomOut className="size-4" /></Button>
          <span className="w-14 text-center text-[13px] tabular-nums">{Math.round(scale * 100)}%</span>
          <Button size="sm" variant="secondary" onClick={() => setScale((s) => Math.min(4, s + 0.25))} aria-label="Zoom in"><ZoomIn className="size-4" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setScale(1)}>Reset</Button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[13px] text-muted underline">Open original</a>
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-line bg-paper">
          <img src={url} alt="Payment screenshot, zoomed" style={{ width: `${scale * 100}%`, maxWidth: "none" }} className="block" />
        </div>
      </Modal>
    </>
  );
}

export function PaymentDetail() {
  const { id } = useParams();
  const q = useQuery(async () => must(await db().from("purchase_requests").select(SELECT).eq("id", id ?? "").maybeSingle()) as PurchaseRequest | null, [id]);
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (q.loading) return <Spinner />;
  if (q.error) return <Alert tone="error">{q.error}</Alert>;
  const r = q.data;
  if (!r) return <EmptyState title="Payment request not found" action={<Link to="/admin/payments" className="underline">Back to payments</Link>} />;

  const close = () => { setMode(null); setError(null); };
  async function approve() {
    setBusy(true);
    setError(null);
    const { error } = await db().rpc("admin_approve_purchase", { p_request_id: r!.id, p_admin_note: note, p_instructions: instructions });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    void notify("payment_approved", r!.id);
    close();
    setDone("Payment approved. The subscription is active and the customer has been emailed.");
    q.reload();
  }
  async function reject() {
    if (reason.trim().length < 3) return setError("Please write a reason. The customer will see it.");
    setBusy(true);
    setError(null);
    const { error } = await db().rpc("admin_reject_purchase", { p_request_id: r!.id, p_reason: reason });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    void notify("payment_rejected", r!.id);
    close();
    setDone("Payment rejected. The customer has been emailed and can submit a new request.");
    q.reload();
  }

  return (
    <>
      <Link to="/admin/payments" className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Payment requests</Link>
      <PageHeader title={`${r.packages?.name} payment from ${r.profiles?.full_name || r.profiles?.email}`}
        description={<>Submitted {dateTime(r.created_at)} · <StatusBadge status={r.status} /></>}
        actions={r.status === "pending" ? <>
          <Button variant="secondary" onClick={() => { setReason(""); setMode("reject"); }}><X className="size-4" /> Reject payment</Button>
          <Button variant="teal" onClick={() => { setNote(""); setInstructions(""); setChecked(false); setMode("approve"); }}><Check className="size-4" /> Approve payment</Button>
        </> : undefined} />
      {done && <div className="mb-6"><Alert tone="success">{done}</Alert></div>}
      {r.status === "pending" && !done && (
        <div className="mb-6"><Alert tone="warning" title="Verify before approving">Find this exact amount and reference in the bank statement. The screenshot alone is not proof of payment.</Alert></div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="card p-6">
          <h2 className="mb-4 text-[15px] font-semibold">Payment screenshot</h2>
          <ScreenshotViewer path={r.screenshot_path} />
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-[15px] font-semibold">Payment</h2>
            <DetailList items={[
              ["Amount", pkr(r.amount_pkr)],
              ["Reference", <span className="font-mono text-[13.5px]">{r.transaction_ref}</span>],
              ["Package", `${r.packages?.name} · ${durationLabel(r.packages?.duration_days ?? 0)} · ${hours(r.packages?.daily_hours ?? 0)} a day`],
              ["Submitted", dateTime(r.created_at)],
              ...(r.customer_note ? [["Customer note", r.customer_note] as [string, string]] : []),
              ...(r.reviewed_at ? [["Reviewed", dateTime(r.reviewed_at)] as [string, string]] : []),
              ...(r.admin_note ? [["Admin note", r.admin_note] as [string, string]] : []),
              ...(r.rejection_reason ? [["Rejection reason", r.rejection_reason] as [string, string]] : []),
            ]} />
          </div>
          <div className="card p-6">
            <h2 className="text-[15px] font-semibold">Customer</h2>
            <DetailList items={[["Name", r.profiles?.full_name || "—"], ["Email", r.profiles?.email ?? "—"], ["Phone", r.profiles?.phone || "—"]]} />
            <Link to={`/admin/customers/${r.user_id}`} className="mt-3 inline-block text-[14px] font-medium underline">View customer</Link>
          </div>
        </div>
      </div>

      <Modal open={mode === "approve"} onClose={close} title="Approve payment"
        footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button variant="teal" onClick={approve} loading={busy} disabled={!checked}>Approve and activate</Button></>}>
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <p className="text-[14px] leading-relaxed text-ink-2">
            This starts a {durationLabel(r.packages?.duration_days ?? 0)} {r.packages?.name} subscription today ({date(new Date().toISOString())}), unlocks the download and emails the customer.
          </p>
          <TextArea label="Note to the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Thanks for your payment!" />
          <TextArea label="Download and installation instructions (optional)" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Shown on the customer's dashboard and in the approval email." />
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-paper p-3 text-[14px]">
            <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-teal)]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>I have found {pkr(r.amount_pkr)} with reference <span className="font-mono">{r.transaction_ref}</span> in our bank statement.</span>
          </label>
        </div>
      </Modal>

      <Modal open={mode === "reject"} onClose={close} title="Reject payment"
        footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button variant="danger" onClick={reject} loading={busy}>Reject payment</Button></>}>
        <div className="space-y-4">
          {error && <Alert tone="error">{error}</Alert>}
          <TextArea label="Reason (required, shown to the customer)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We could not find this reference in our bank statement." />
          <p className="text-[13px] text-muted">The customer is emailed and can submit a new payment request.</p>
        </div>
      </Modal>
    </>
  );
}
