// Called once a day by pg_cron (see migrations/…_cron.sql) with the x-cron-secret header.
// Sends "expires in 3 days" and "has expired" emails, each once per subscription.
import { adminClient, json, loadBrand } from "../_shared/context.ts";
import { karachiDate, sendEmail } from "../_shared/email.ts";

const DAY = 86_400_000;

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ error: "Forbidden" }, 403);

  const db = adminClient();
  await db.rpc("expire_subscriptions");
  const brand = await loadBrand(db);
  const now = Date.now();
  let reminded = 0, expired = 0;

  const { data: soon } = await db.from("subscriptions")
    .select("id, expires_at, packages(name, slug), profiles!subscriptions_user_id_fkey(full_name, email)")
    .eq("status", "active").is("reminder_sent_at", null)
    .gt("expires_at", new Date(now).toISOString()).lte("expires_at", new Date(now + 3 * DAY).toISOString());
  for (const s of soon ?? []) {
    // deno-lint-ignore no-explicit-any
    const p = s.profiles as any, pkg = s.packages as any;
    await sendEmail(brand, {
      to: p.email,
      subject: `Your ${brand.product} subscription ends on ${karachiDate(s.expires_at)}`,
      heading: "Your subscription ends soon",
      paragraphs: [
        `Hi ${p.full_name || "there"}, your ${pkg.name} subscription ends on ${karachiDate(s.expires_at)}.`,
        "Renew before then to keep processing videos without a break. Days from a renewal are added on top of your current expiry date.",
      ],
      button: { label: "Renew", url: `${brand.siteUrl}/checkout/${pkg.slug}` },
    });
    await db.from("subscriptions").update({ reminder_sent_at: new Date().toISOString() }).eq("id", s.id);
    reminded++;
  }

  const { data: ended } = await db.from("subscriptions")
    .select("id, expires_at, packages(name, slug), profiles!subscriptions_user_id_fkey(full_name, email)")
    .eq("status", "expired").is("expired_notice_sent_at", null)
    .gt("expires_at", new Date(now - 7 * DAY).toISOString());
  for (const s of ended ?? []) {
    // deno-lint-ignore no-explicit-any
    const p = s.profiles as any, pkg = s.packages as any;
    await sendEmail(brand, {
      to: p.email,
      subject: `Your ${brand.product} subscription has ended`,
      heading: "Your subscription has ended",
      paragraphs: [
        `Hi ${p.full_name || "there"}, your ${pkg.name} subscription ended on ${karachiDate(s.expires_at)}. The desktop software will no longer process new videos.`,
        "Your account and payment history are kept. Renew any time to continue.",
      ],
      button: { label: "Renew", url: `${brand.siteUrl}/checkout/${pkg.slug}` },
    });
    await db.from("subscriptions").update({ expired_notice_sent_at: new Date().toISOString() }).eq("id", s.id);
    expired++;
  }

  return json({ ok: true, reminded, expired });
});
