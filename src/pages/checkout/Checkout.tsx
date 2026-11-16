import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ImageUp, ShieldCheck } from "lucide-react";
import { db, errorMessage, notify, SCREENSHOT_BUCKET } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { must, useQuery } from "../../lib/useQuery";
import { PACKAGE_COLUMNS } from "../../lib/packages";
import { cx, date, durationLabel, effectiveStatus, pkr } from "../../lib/format";
import type { BankSettings, Package, PurchaseRequest, Subscription } from "../../lib/types";
import { Logo } from "../../components/common";
import { Alert, Button, CopyButton, LinkButton, Spinner, TextArea, TextField } from "../../components/ui";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function CheckoutFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-canvas">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <Link to="/dashboard" className="text-[14px] text-muted hover:text-ink">Dashboard</Link>
        </div>
      </header>
      <main className="container-x max-w-5xl py-8 sm:py-12">{children}</main>
    </div>
  );
}

export function Checkout() {
  const { slug } = useParams();
  const { session } = useAuth();
  const nav = useNavigate();
  const uid = session!.user.id;

  const q = useQuery(async () => {
    const client = db();
    const [pkg, bank, pending, sub] = await Promise.all([
      client.from("packages").select(PACKAGE_COLUMNS).eq("slug", slug ?? "").eq("is_active", true).maybeSingle(),
      client.from("bank_settings").select("bank_name, account_title, account_number, iban, instructions").eq("id", 1).maybeSingle(),
      client.from("purchase_requests").select("id, created_at, packages(name)").eq("user_id", uid).eq("status", "pending").maybeSingle(),
      client.from("subscriptions").select("status, expires_at, packages(name)").eq("user_id", uid).in("status", ["active", "suspended"]).maybeSingle(),
    ]);
    return {
      pkg: must(pkg) as Package | null,
      bank: must(bank) as BankSettings | null,
      pending: must(pending) as unknown as Pick<PurchaseRequest, "id" | "created_at" | "packages"> | null,
      sub: must(sub) as unknown as Pick<Subscription, "status" | "expires_at" | "packages"> | null,
    };
  }, [slug, uid]);

  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false); // guards double clicks before React re-renders

  if (q.loading) return <CheckoutFrame><Spinner /></CheckoutFrame>;
  if (q.error) return <CheckoutFrame><Alert tone="error" action={<Button size="sm" variant="secondary" onClick={q.reload}>Retry</Button>}>{q.error}</Alert></CheckoutFrame>;
  const { pkg, bank, pending, sub } = q.data!;
  if (!pkg) return <Navigate to="/#pricing" replace />;

  if (pending) {
    return (
      <CheckoutFrame>
        <div className="card mx-auto max-w-xl p-8">
          <Alert tone="warning" title="A payment is already waiting for review">
            You submitted a payment for {pending.packages?.name} on {date(pending.created_at)}. We will email you as soon as it is checked. You can submit another request after that.
          </Alert>
          <LinkButton to="/dashboard" className="mt-6">Go to dashboard</LinkButton>
        </div>
      </CheckoutFrame>
    );
  }

  const bankReady = Boolean(bank && bank.account_number.trim() && bank.bank_name.trim());
  const liveSub = sub && effectiveStatus(sub) !== "expired" ? sub : null;

  function pick(f: File | null) {
    setFileError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (!f) return;
    if (!TYPES[f.type]) return setFileError("Please choose a PNG, JPG or WebP image.");
    if (f.size > MAX_BYTES) return setFileError("The image must be 5 MB or smaller.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitted.current) return;
    setError(null);
    if (ref.trim().length < 3) return setError("Please enter the transaction ID or reference number from your bank.");
    if (!file) return setFileError("Please upload a screenshot of the transfer.");
    submitted.current = true;
    setBusy(true);
    try {
      const client = db();
      const path = `${uid}/${crypto.randomUUID()}.${TYPES[file.type]}`;
      const up = await client.storage.from(SCREENSHOT_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const ins = await client.from("purchase_requests")
        .insert({ user_id: uid, package_id: pkg!.id, amount_pkr: pkg!.price_pkr, transaction_ref: ref.trim(), screenshot_path: path, customer_note: note.trim() })
        .select("id").single();
      if (ins.error) throw ins.error;
      void notify("payment_submitted", ins.data.id);
      nav("/checkout/submitted", { replace: true, state: { pkg: pkg!.name, amount: pkg!.price_pkr, ref: ref.trim() } });
    } catch (err) {
      submitted.current = false;
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <CheckoutFrame>
      <Link to="/#pricing" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-muted hover:text-ink"><ArrowLeft className="size-4" /> Plans</Link>
      <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Complete your payment</h1>
      <p className="mt-1.5 text-[15px] text-muted">Transfer the amount below, then send us the reference and a screenshot.</p>

      {liveSub && (
        <div className="mt-6">
          <Alert tone="info" title={`You already have ${liveSub.packages?.name} until ${date(liveSub.expires_at)}`}>
            If this payment is approved, the new {durationLabel(pkg.duration_days)} are added after your current expiry date.
          </Alert>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-[16px] font-semibold">1. Transfer to our bank account</h2>
            {!bankReady ? (
              <div className="mt-4"><Alert tone="warning" title="Bank details are not available yet">Please check back shortly or contact support.</Alert></div>
            ) : (
              <>
                <dl className="mt-5 divide-y divide-line rounded-lg border border-line">
                  {([
                    ["Bank", bank!.bank_name, false],
                    ["Account title", bank!.account_title, false],
                    ["Account number", bank!.account_number, true],
                    ["IBAN", bank!.iban, true],
                    ["Amount", pkr(pkg.price_pkr), false],
                  ] as [string, string, boolean][]).filter(([, v]) => v.trim()).map(([k, v, copy]) => (
                    <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <dt className="text-[12.5px] text-muted">{k}</dt>
                        <dd className={cx("mt-0.5 break-all text-[15px] font-medium", copy && "font-mono text-[14.5px]")}>{v}</dd>
                      </div>
                      {copy && <CopyButton value={v.replace(/\s+/g, "")} />}
                    </div>
                  ))}
                </dl>
                {bank!.instructions.trim() && <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{bank!.instructions}</p>}
              </>
            )}
          </section>

          <form onSubmit={submit} className="card space-y-5 p-6" noValidate>
            <h2 className="text-[16px] font-semibold">2. Submit your payment details</h2>
            {error && <Alert tone="error">{error}</Alert>}
            <TextField label="Transaction ID / reference number" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={100}
              placeholder="e.g. FT2611160012345" hint="Shown on your bank or mobile app receipt." disabled={!bankReady} />
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Payment screenshot</p>
              <label className={cx(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-7 text-center transition-colors",
                fileError ? "border-red bg-red-soft/40" : "border-line-strong bg-paper hover:border-ink/40",
                !bankReady && "pointer-events-none opacity-50",
              )}>
                {preview ? (
                  <img src={preview} alt="Selected payment screenshot" className="max-h-56 rounded-md border border-line object-contain" />
                ) : (
                  <ImageUp className="size-6 text-muted" strokeWidth={1.75} />
                )}
                <span className="text-[14px] font-medium">{file ? file.name : "Choose an image"}</span>
                <span className="text-[12.5px] text-muted">PNG, JPG or WebP, up to 5 MB</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              </label>
              {fileError && <p className="text-[12.5px] text-red">{fileError}</p>}
            </div>
            <TextArea label="Additional information (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
              placeholder="Anything that helps us find your transfer, e.g. the sender's name." disabled={!bankReady} />
            <Button type="submit" size="lg" loading={busy} disabled={!bankReady} className="w-full">Submit payment for review</Button>
          </form>
        </div>

        <aside className="card p-6 lg:sticky lg:top-6">
          <p className="eyebrow">Order summary</p>
          <div className="mt-4 flex items-baseline justify-between">
            <h2 className="text-[20px] font-semibold">{pkg.name}</h2>
            <span className="text-[13px] text-muted">{durationLabel(pkg.duration_days)}</span>
          </div>
          <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[14px]">
            {pkg.features.map((f) => (
              <li key={f} className="flex gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" /><span className="text-ink-2">{f}</span></li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-[14px] text-muted">Amount payable</span>
            <span className="text-[24px] font-semibold tracking-[-0.02em]">{pkr(pkg.price_pkr)}</span>
          </div>
          <p className="mt-5 flex gap-2.5 rounded-lg bg-paper p-3 text-[13px] leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-2" />
            We check every transfer against our bank records by hand. Your plan starts on the day it is approved.
          </p>
        </aside>
      </div>
    </CheckoutFrame>
  );
}

export function CheckoutSubmitted() {
  const state = useLocation().state as { pkg: string; amount: number; ref: string } | null;
  return (
    <CheckoutFrame>
      <div className="card animate-fade-up mx-auto max-w-xl p-8 text-center sm:p-10">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-teal-soft"><CheckCircle2 className="size-6 text-teal" /></div>
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em]">Payment submitted</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Your payment request has been submitted successfully. Our team will verify your payment and activate your subscription shortly.
        </p>
        {state && (
          <dl className="mt-6 divide-y divide-line rounded-lg border border-line text-left text-[14px]">
            {[["Package", state.pkg], ["Amount", pkr(state.amount)], ["Reference", state.ref], ["Status", "Pending review"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        )}
        <LinkButton to="/dashboard" className="mt-7">Go to dashboard</LinkButton>
      </div>
    </CheckoutFrame>
  );
}
