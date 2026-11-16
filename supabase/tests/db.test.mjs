// Runs the migration on a real Postgres (PGlite, in-process) with minimal Supabase stubs and checks
// the security rules and business functions. Run with: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const MIG = process.argv[2] ?? new URL("../migrations/20261116000000_init.sql", import.meta.url);
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`); };

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  create schema auth; grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage; grant usage on schema storage to anon, authenticated;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant all on storage.objects to authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant execute on function storage.foldername(text) to authenticated;
`);
const sql = readFileSync(MIG, "utf8");
try {
  await db.exec(sql);
} catch (e) {
  const pos = Number(e.position) || 0;
  const line = sql.slice(0, pos).split("\n").length;
  console.log(`MIGRATION ERROR: ${e.message} (line ${line}) ${e.where ?? ""}`);
  process.exit(1);
}
ok("migration applies", true);

const A = "aaaaaaaa-0000-0000-0000-000000000001", B = "bbbbbbbb-0000-0000-0000-000000000002", C = "cccccccc-0000-0000-0000-000000000003";
await db.exec(`
  insert into auth.users values ('${A}', 'a@x.pk', now(), '{"full_name":"Ali Khan","phone":"03001234567"}');
  insert into auth.users values ('${B}', 'b@x.pk', null, '{"full_name":"Bilal"}');
  insert into auth.users values ('${C}', 'admin@x.pk', now(), '{"full_name":"Admin"}');
  insert into public.admin_users values ('${C}');
`);

/** run SQL as a role/user in a transaction; returns rows or {error} */
async function as(uid, sql, params = []) {
  try {
    await db.exec("begin");
    await db.exec(uid ? "set local role authenticated" : "set local role anon");
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    const r = await db.query(sql, params);
    await db.exec("commit");
    return r.rows;
  } catch (e) {
    await db.exec("rollback");
    return { error: e.message };
  }
}
const one = async (uid, sql, p) => { const r = await as(uid, sql, p); return r.error ? r : r[0]; };
const pkg = async (slug) => (await db.query(`select * from packages where slug = $1`, [slug])).rows[0];
const starter = await pkg("starter"), pro = await pkg("pro");

const prof = await one(A, `select full_name, phone, email from profiles where id = '${A}'`);
ok("profile created from sign-up metadata", prof.full_name === "Ali Khan" && prof.phone === "03001234567" && prof.email === "a@x.pk");
ok("visitors see 3 packages", (await as(null, "select slug from packages")).length === 3);
ok("customer cannot read another profile", (await as(A, `select id from profiles where id = '${B}'`)).length === 0);
ok("customer cannot see admin list", (await as(A, `select * from admin_users`)).length === 0);

const upA = await as(A, `insert into storage.objects (bucket_id, name) values ('payment-screenshots', '${A}/one.png') returning name`);
ok("customer uploads to own folder", !upA.error, upA.error);
const upBad = await as(A, `insert into storage.objects (bucket_id, name) values ('payment-screenshots', '${B}/x.png')`);
ok("customer cannot upload to another folder", !!upBad.error);

const forged = await one(A, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path, status, admin_note)
  values ('${A}', '${starter.id}', 1, ' FT123 ', '${A}/one.png', 'approved', 'hacked') returning status, amount_pkr, transaction_ref, admin_note, user_id`);
ok("purchase insert: status/amount forced by server", forged.status === "pending" && forged.amount_pkr === 2099 && forged.transaction_ref === "FT123" && forged.admin_note === null, JSON.stringify(forged));
const dup = await one(A, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${A}', '${starter.id}', 0, 'FT999', '${A}/one.png')`);
ok("second pending request refused", /one_pending/.test(dup.error ?? ""), dup.error);
await db.exec(`insert into auth.users values ('dddddddd-0000-0000-0000-000000000004', 'd@x.pk', now(), '{}')`);
const D = "dddddddd-0000-0000-0000-000000000004";
const missing = await one(D, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${D}', '${starter.id}', 0, 'FT555', '${D}/nothere.png')`);
ok("request without an uploaded screenshot refused", /screenshot/i.test(missing.error ?? ""), missing.error);
await as(D, `insert into storage.objects (bucket_id, name) values ('payment-screenshots', '${D}/s.png')`);
const reused = await one(D, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${D}', '${starter.id}', 0, 'ft123', '${D}/s.png')`);
ok("reused transaction reference refused", /ref_unique/.test(reused.error ?? ""), reused.error);
await db.exec(`insert into storage.objects (bucket_id, name) values ('payment-screenshots', '${B}/b.png')`);
const unverified = await one(B, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${B}', '${starter.id}', 0, 'FT777', '${B}/b.png')`);
ok("unverified email cannot buy", /verify/i.test(unverified.error ?? ""), unverified.error);

const req = (await db.query(`select id from purchase_requests where user_id = '${A}'`)).rows[0].id;
const upd = await one(A, `update purchase_requests set status = 'approved' where id = '${req}'`);
ok("customer cannot update own request", !!upd.error, upd.error);
const selfApprove = await one(A, `select admin_approve_purchase('${req}', null, null)`);
ok("customer cannot call approve", /Only an admin/.test(selfApprove.error ?? ""), selfApprove.error);
const subIns = await one(A, `insert into subscriptions (user_id, package_id, starts_at, expires_at, daily_hours, daily_exports) values ('${A}', '${starter.id}', now(), now() + interval '1 year', 99, 99)`);
ok("customer cannot insert a subscription", !!subIns.error);
const usageIns = await one(A, `insert into usage_logs (user_id, subscription_id, kind, seconds, usage_date) values ('${A}', gen_random_uuid(), 'process', 0, current_date)`);
ok("customer cannot write usage logs", !!usageIns.error);

await db.exec(`insert into software_releases (version, download_url, is_current) values ('1.0.0', 'https://drive.google.com/x', true)`);
ok("no download link before approval", (await as(A, "select * from software_releases")).length === 0);

const ent0 = await one(A, "select get_entitlement() e");
ok("entitlement inactive before approval", ent0.e.active === false && ent0.e.status === "none", JSON.stringify(ent0.e));

const appr = await one(C, `select * from admin_approve_purchase('${req}', 'Thanks', 'Install it')`);
const days = (new Date(appr.expires_at) - new Date(appr.starts_at)) / 86400000;
ok("admin approves: 30-day subscription from today", !appr.error && Math.round(days) === 30 && appr.instructions === "Install it", appr.error ?? `days=${days}`);
const again = await one(C, `select admin_approve_purchase('${req}', null, null)`);
ok("approving twice refused", /already approved/.test(again.error ?? ""), again.error);
ok("download link visible after approval", (await as(A, "select * from software_releases")).length === 1);
ok("unapproved user still cannot see link", (await as(B, "select * from software_releases")).length === 0);

const e1 = (await one(A, "select get_entitlement() e")).e;
ok("entitlement: 5 h/day, 3 exports", e1.active && e1.daily_seconds === 18000 && e1.daily_exports === 3 && e1.remaining_seconds_today === 18000, JSON.stringify(e1));
const r1 = (await one(A, "select reserve_processing(7200, 'v1') r")).r;
const r2 = (await one(A, "select reserve_processing(3600, 'v2') r")).r;
const r3 = (await one(A, "select reserve_processing(9000, 'v3') r")).r;
ok("2 h + 1 h booked", r1.ok && r2.ok && r2.remaining_seconds_today === 7200, JSON.stringify(r2));
ok("2.5 h refused with 2 h left", r3.ok === false && r3.reason === "daily_limit" && r3.remaining_seconds_today === 7200, JSON.stringify(r3));
const r4 = (await one(A, "select reserve_processing(7200, 'v4') r")).r;
ok("exactly the remaining 2 h allowed", r4.ok === true && r4.remaining_seconds_today === 0, JSON.stringify(r4));
const ex = [];
for (let i = 0; i < 4; i++) ex.push((await one(A, "select reserve_export('clip') r")).r);
ok("3 exports allowed, 4th refused", ex[0].ok && ex[2].ok && ex[2].remaining_exports_today === 0 && ex[3].ok === false, JSON.stringify(ex[3]));
const bNo = (await one(B, "select reserve_processing(60) r")).r;
ok("no subscription: processing refused", bNo.ok === false && bNo.reason === "no_subscription");

const ph = await one(A, `update profiles set phone = '03111111111' where id = '${A}' returning phone`);
ok("customer can change phone", ph.phone === "03111111111", ph.error);
const nm = await one(A, `update profiles set full_name = 'X' where id = '${A}'`);
ok("customer cannot change name/email", !!nm.error);

// renewal while active: days stack on the current expiry
await as(A, `insert into storage.objects (bucket_id, name) values ('payment-screenshots', '${A}/two.png')`);
const req2 = await one(A, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${A}', '${pro.id}', 0, 'FT200', '${A}/two.png') returning id`);
const firstExp = new Date(appr.expires_at);
const appr2 = await one(C, `select * from admin_approve_purchase('${req2.id}', null, null)`);
const stacked = Math.round((new Date(appr2.expires_at) - firstExp) / 86400000);
const old = (await db.query(`select status from subscriptions where id = '${appr.id}'`)).rows[0];
ok("renewal adds 90 days after current expiry", stacked === 90 && old.status === "replaced", `stacked=${stacked} old=${old.status}`);
ok("limits follow the new package (7 h)", (await one(A, "select get_entitlement() e")).e.daily_seconds === 25200);

// suspend / reactivate / expire / extend
const sus = await one(C, `select status from admin_set_subscription_status('${appr2.id}', 'suspended')`);
ok("admin suspends", sus.status === "suspended");
ok("suspended: no access", (await one(A, "select get_entitlement() e")).e.active === false && (await as(A, "select * from software_releases")).length === 0);
await one(C, `select admin_set_subscription_status('${appr2.id}', 'active')`);
ok("reactivated: access back", (await one(A, "select get_entitlement() e")).e.active === true);
await db.exec(`update subscriptions set starts_at = now() - interval '200 days', expires_at = now() - interval '1 minute' where id = '${appr2.id}'`);
ok("past expiry: access gone even before cron", (await one(A, "select get_entitlement() e")).e.active === false);
const n = (await db.query("select expire_subscriptions() n")).rows[0].n;
ok("expire_subscriptions marks it expired", n === 1 && (await db.query(`select status from subscriptions where id = '${appr2.id}'`)).rows[0].status === "expired");
ok("expired: login account kept", (await db.query(`select 1 from auth.users where id = '${A}'`)).rows.length === 1);
const custExpire = await one(A, "select expire_subscriptions()");
ok("customer cannot call expire_subscriptions", !!custExpire.error);
const reac = await one(C, `select admin_set_subscription_status('${appr2.id}', 'active')`);
ok("cannot reactivate an expired one", !!reac.error);
const ext = await one(C, `select * from admin_extend_subscription('${appr2.id}', 10)`);
ok("extend revives expired subscription for 10 days", ext.status === "active" && Math.round((new Date(ext.expires_at) - Date.now()) / 86400000) === 10, ext.error);
const chg = await one(C, `select daily_hours h from admin_change_package('${appr2.id}', '${starter.id}')`);
ok("change package updates limits", Number(chg.h) === 5, chg.error);

// reject flow
const reqD = await one(D, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${D}', '${starter.id}', 0, 'FT300', '${D}/s.png') returning id`);
const noReason = await one(C, `select admin_reject_purchase('${reqD.id}', '  ')`);
ok("reject needs a reason", !!noReason.error);
const rej = await one(C, `select status from admin_reject_purchase('${reqD.id}', 'Not in statement')`);
ok("admin rejects", rej.status === "rejected");
const retry = await one(D, `insert into purchase_requests (user_id, package_id, amount_pkr, transaction_ref, screenshot_path) values ('${D}', '${starter.id}', 0, 'FT300', '${D}/s.png') returning status`);
ok("after rejection, customer can resubmit (even same ref)", retry.status === "pending", retry.error);

// screenshots: owner + admin can read, others can't
ok("admin reads any screenshot", (await as(C, `select name from storage.objects where name = '${A}/one.png'`)).length === 1);
ok("other customer cannot read screenshot", (await as(D, `select name from storage.objects where name = '${A}/one.png'`)).length === 0);

// activity + settings
const logs = (await as(C, "select action from activity_logs")).map((r) => r.action);
ok("admin actions are logged", logs.includes("payment.approved") && logs.includes("payment.rejected") && logs.includes("subscription.extended"), logs.join(","));
ok("customer cannot read activity", (await as(A, "select * from activity_logs")).length === 0);
const bankA = await one(A, "update bank_settings set bank_name = 'evil' where id = 1 returning bank_name");
ok("customer cannot edit bank settings", bankA === undefined || !!bankA.error || bankA.bank_name !== "evil");
const bankC = await one(C, "update bank_settings set bank_name = 'Meezan' where id = 1 returning bank_name");
ok("admin edits bank settings", bankC.bank_name === "Meezan");
ok("visitors read website settings", (await as(null, "select product_name from website_settings")).length === 1);
ok("visitors cannot read bank settings", (await as(null, "select * from bank_settings")).error !== undefined || (await as(null, "select * from bank_settings")).length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
