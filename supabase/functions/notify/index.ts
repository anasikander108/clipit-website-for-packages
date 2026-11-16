// POST { event, id? } with the user's JWT. The function decides the recipient and the content from
// the database, so a caller can't send arbitrary mail: customers may only trigger mail about their
// own fresh records, and only admins may trigger approval/rejection mail.
import { adminClient, cors, json, loadBrand } from "../_shared/context.ts";
import { karachiDate, pkr, sendEmail, type Email } from "../_shared/email.ts";

const FRESH_MS = 15 * 60 * 1000;
const fresh = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < FRESH_MS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const db = adminClient();
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await db.auth.getUser(token);
  const caller = auth?.user;
  if (!caller) return json({ error: "Please log in." }, 401);

  let body: { event?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid body." }, 400);
  }
  const brand = await loadBrand(db);
  const site = brand.siteUrl;

  if (body.event === "welcome") {
    // atomically flip the flag so the welcome mail goes out once
    const { data: p } = await db.from("profiles").update({ welcome_sent: true })
      .eq("id", caller.id).eq("welcome_sent", false).select("full_name, email").maybeSingle();
    if (!p) return json({ ok: true, skipped: "already sent" });
    const r = await sendEmail(brand, {
      to: p.email,
      subject: `Welcome to ${brand.product}`,
      heading: `Welcome, ${p.full_name || "there"}`,
      paragraphs: [
        `Your ${brand.product} account is ready and your email address is verified.`,
        "Choose a package and send your bank payment. Once our team confirms it, your dashboard will show the download link for the desktop software.",
      ],
      button: { label: "Choose a package", url: `${site}/#pricing` },
    });
    return json({ ok: true, ...r });
  }

  if (!body.id) return json({ error: "Missing id." }, 400);
  const { data: pr } = await db.from("purchase_requests")
    .select("id, user_id, status, amount_pkr, transaction_ref, created_at, reviewed_at, admin_note, install_instructions, rejection_reason, packages(name, slug, duration_days), profiles!purchase_requests_user_id_fkey(full_name, email)")
    .eq("id", body.id).maybeSingle();
  if (!pr) return json({ error: "Not found." }, 404);
  // deno-lint-ignore no-explicit-any
  const pkg = pr.packages as any, who = pr.profiles as any;
  let email: Email | null = null;

  if (body.event === "payment_submitted") {
    if (pr.user_id !== caller.id || pr.status !== "pending" || !fresh(pr.created_at)) return json({ error: "Not allowed." }, 403);
    email = {
      to: who.email,
      subject: "We received your payment details",
      heading: "Payment submitted",
      paragraphs: [
        "Thank you. Your payment request has been submitted successfully. Our team will verify your payment against our bank records and activate your subscription shortly.",
        "You will get another email as soon as it is approved.",
      ],
      details: [["Package", pkg.name], ["Amount", pkr(pr.amount_pkr)], ["Transaction reference", pr.transaction_ref]],
      button: { label: "View status", url: `${site}/dashboard` },
    };
  } else if (body.event === "payment_approved" || body.event === "payment_rejected") {
    const { data: isAdmin } = await db.from("admin_users").select("user_id").eq("user_id", caller.id).maybeSingle();
    if (!isAdmin) return json({ error: "Not allowed." }, 403);
    const want = body.event === "payment_approved" ? "approved" : "rejected";
    if (pr.status !== want || !fresh(pr.reviewed_at)) return json({ error: "Request is not in that state." }, 409);
    if (want === "approved") {
      const { data: sub } = await db.from("subscriptions").select("starts_at, expires_at, daily_hours")
        .eq("purchase_request_id", pr.id).maybeSingle();
      email = {
        to: who.email,
        subject: `Your ${pkg.name} subscription is active`,
        heading: "Payment approved",
        paragraphs: [
          `Good news, ${who.full_name || "there"}: we have confirmed your payment and your ${pkg.name} subscription is now active.`,
          "You can download the desktop software from your dashboard.",
          ...(pr.admin_note ? [`Note from our team: ${pr.admin_note}`] : []),
          ...(pr.install_instructions ? [`Instructions: ${pr.install_instructions}`] : []),
        ],
        details: sub ? [["Package", pkg.name], ["Active from", karachiDate(sub.starts_at)], ["Expires on", karachiDate(sub.expires_at)], ["Daily limit", `${Number(sub.daily_hours)} hours of video`]] : [["Package", pkg.name]],
        button: { label: "Download the software", url: `${site}/dashboard/download` },
      };
    } else {
      email = {
        to: who.email,
        subject: "We could not confirm your payment",
        heading: "Payment not approved",
        paragraphs: [
          "We checked your payment request but could not match it with our bank records.",
          `Reason: ${pr.rejection_reason ?? ""}`,
          "You can submit a new payment request from your dashboard at any time.",
        ],
        details: [["Package", pkg.name], ["Amount", pkr(pr.amount_pkr)], ["Transaction reference", pr.transaction_ref]],
        button: { label: "Submit again", url: `${site}/checkout/${pkg.slug}` },
      };
    }
  } else {
    return json({ error: "Unknown event." }, 400);
  }

  const r = await sendEmail(brand, email);
  return json({ ok: true, ...r });
});
