-- ClipXo website: tables, row-level security and the business functions.
-- Every rule that matters (who can approve, when access expires, daily limits) is enforced here,
-- not in the browser.

-- ---------------------------------------------------------------- types
create type public.purchase_status as enum ('pending', 'approved', 'rejected');
create type public.subscription_status as enum ('active', 'expired', 'suspended', 'replaced');
create type public.usage_kind as enum ('process', 'export');

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (length(full_name) <= 120),
  email text not null,
  phone text not null default '' check (length(phone) <= 30),
  welcome_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  price_pkr integer not null check (price_pkr > 0),
  duration_days integer not null check (duration_days > 0),
  daily_hours numeric(5, 2) not null check (daily_hours > 0),
  daily_exports integer not null check (daily_exports >= 0),
  web_access boolean not null default false,
  features text[] not null default '{}',
  recommended boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id),
  amount_pkr integer not null,
  transaction_ref text not null check (length(btrim(transaction_ref)) between 3 and 100),
  screenshot_path text not null,
  customer_note text not null default '' check (length(customer_note) <= 1000),
  status public.purchase_status not null default 'pending',
  admin_note text,
  install_instructions text,
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- one open request per customer (stops double submissions), and a bank reference can't be reused
create unique index purchase_requests_one_pending on public.purchase_requests (user_id) where status = 'pending';
create unique index purchase_requests_ref_unique on public.purchase_requests (lower(btrim(transaction_ref))) where status <> 'rejected';
create index purchase_requests_status_idx on public.purchase_requests (status, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  package_id uuid not null references public.packages (id),
  purchase_request_id uuid references public.purchase_requests (id),
  status public.subscription_status not null default 'active',
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  daily_hours numeric(5, 2) not null,
  daily_exports integer not null,
  web_access boolean not null default false,
  instructions text,
  reminder_sent_at timestamptz,
  expired_notice_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);
-- at most one live (active or suspended) subscription per customer
create unique index subscriptions_one_live on public.subscriptions (user_id) where status in ('active', 'suspended');
create index subscriptions_expiry_idx on public.subscriptions (status, expires_at);

create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  kind public.usage_kind not null,
  seconds integer not null default 0 check (seconds >= 0),
  label text not null default '' check (length(label) <= 200),
  usage_date date not null,
  created_at timestamptz not null default now()
);
create index usage_logs_user_day on public.usage_logs (user_id, usage_date);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id),
  note text not null check (length(btrim(note)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.software_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  download_url text not null check (download_url ~ '^https://'),
  release_date date not null default current_date,
  changelog text not null default '',
  install_instructions text not null default '',
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index software_releases_one_current on public.software_releases (is_current) where is_current;

create table public.bank_settings (
  id integer primary key default 1 check (id = 1),
  bank_name text not null default '',
  account_title text not null default '',
  account_number text not null default '',
  iban text not null default '',
  instructions text not null default '',
  updated_at timestamptz not null default now()
);

create table public.website_settings (
  id integer primary key default 1 check (id = 1),
  product_name text not null default 'ClipXo',
  logo_url text not null default '',
  support_email text not null default '',
  contact_phone text not null default '',
  contact_address text not null default '',
  announcement text not null default '',
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null default '',
  target_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);

-- ---------------------------------------------------------------- seed data
insert into public.packages (slug, name, tagline, price_pkr, duration_days, daily_hours, daily_exports, web_access, recommended, sort_order, features) values
  ('starter', 'Starter', 'For creators trying ClipXo on their own channel.', 2099, 30, 5, 3, false, false, 1,
   array['Desktop software', 'AI moment detection', 'Automatic transcription', 'Short clip generation', '5 hours of video a day', 'One month of access']),
  ('business', 'Business', 'For agencies and teams publishing every day.', 49500, 365, 20, 3, true, false, 3,
   array['Desktop software', 'Web application access', '20 hours of video a day', 'One year of access', 'Priority support', 'Business-level access']),
  ('pro', 'Pro', 'For channels that publish shorts every week.', 5199, 90, 7, 3, false, true, 2,
   array['Everything in Starter', 'Desktop software', '7 hours of video a day', 'Three months of access', 'Priority customer support']);

insert into public.bank_settings (id) values (1);
insert into public.website_settings (id) values (1);

-- ---------------------------------------------------------------- helpers
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select uid is not null and exists (select 1 from public.admin_users where user_id = uid);
$$;

create or replace function public.karachi_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Karachi')::date;
$$;

-- the subscription that currently grants access, or null
create or replace function public.live_subscription(uid uuid)
returns public.subscriptions language sql stable security definer set search_path = public as $$
  select * from public.subscriptions
  where user_id = uid and status = 'active' and starts_at <= now() and expires_at > now()
  order by expires_at desc limit 1;
$$;

create or replace function public.has_active_subscription(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select (public.live_subscription(uid)).id is not null;
$$;

create or replace function public.log_activity(p_action text, p_target_type text, p_target_id uuid, p_details jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.activity_logs (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'));
$$;

create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can do this.' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------- triggers
-- new auth user -> profile (name and phone come from the sign-up form's metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
          left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profiles.email equal to the verified auth email
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- a customer's purchase request: owner, amount and status are decided here, not by the browser
create or replace function public.prepare_purchase_request()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare
  pkg public.packages;
begin
  if auth.uid() is null then
    raise exception 'Please log in first.' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'Please verify your email address first.' using errcode = '42501';
  end if;
  select * into pkg from public.packages where id = new.package_id and is_active;
  if pkg.id is null then
    raise exception 'This package is not available.';
  end if;
  if new.screenshot_path is null or split_part(new.screenshot_path, '/', 1) <> auth.uid()::text
     or not exists (select 1 from storage.objects where bucket_id = 'payment-screenshots' and name = new.screenshot_path) then
    raise exception 'Please upload the payment screenshot again.';
  end if;
  new.user_id := auth.uid();
  new.amount_pkr := pkg.price_pkr;
  new.transaction_ref := btrim(new.transaction_ref);
  new.status := 'pending';
  new.admin_note := null;
  new.install_instructions := null;
  new.rejection_reason := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.created_at := now();
  return new;
end;
$$;
create trigger before_purchase_request_insert before insert on public.purchase_requests
  for each row execute function public.prepare_purchase_request();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger subscriptions_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger bank_settings_touch before update on public.bank_settings for each row execute function public.touch_updated_at();
create trigger website_settings_touch before update on public.website_settings for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- row-level security
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.packages enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.admin_notes enable row level security;
alter table public.software_releases enable row level security;
alter table public.bank_settings enable row level security;
alter table public.website_settings enable row level security;
alter table public.activity_logs enable row level security;

-- profiles: read your own; change only your phone (column grant below)
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (phone) on public.profiles to authenticated;

-- admin_users: you may see whether you are an admin; nobody writes through the API
create policy admin_users_select on public.admin_users for select to authenticated using (user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.admin_users from anon, authenticated;

-- packages: public catalogue, admin edits
create policy packages_select on public.packages for select to anon, authenticated using (is_active or public.is_admin());
create policy packages_admin_write on public.packages for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- purchase requests: customers read their own and insert (trigger fixes the fields); review is RPC-only
create policy purchase_select on public.purchase_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy purchase_insert on public.purchase_requests for insert to authenticated with check (user_id = auth.uid());
revoke update, delete on public.purchase_requests from anon, authenticated;

-- subscriptions and usage: read-only through the API; changed only by the functions below
create policy subscriptions_select on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.subscriptions from anon, authenticated;
create policy usage_select on public.usage_logs for select to authenticated using (user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.usage_logs from anon, authenticated;

-- admin-only tables
create policy admin_notes_admin on public.admin_notes for all to authenticated using (public.is_admin()) with check (public.is_admin() and admin_id = auth.uid());
create policy activity_select on public.activity_logs for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.activity_logs from anon, authenticated;

-- releases: the download link is only readable with a live subscription
create policy releases_select on public.software_releases for select to authenticated using (public.is_admin() or public.has_active_subscription());
create policy releases_admin_write on public.software_releases for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings: bank details for logged-in customers, website settings for everyone; admin edits
create policy bank_select on public.bank_settings for select to authenticated using (true);
create policy bank_admin_update on public.bank_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy website_select on public.website_settings for select to anon, authenticated using (true);
create policy website_admin_update on public.website_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- storage (private payment screenshots)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-screenshots', 'payment-screenshots', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy screenshots_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
create policy screenshots_select on storage.objects for select to authenticated
  using (bucket_id = 'payment-screenshots' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------- admin functions
create or replace function public.admin_approve_purchase(p_request_id uuid, p_admin_note text default null, p_instructions text default null)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  req public.purchase_requests;
  pkg public.packages;
  prev public.subscriptions;
  base timestamptz;
  sub public.subscriptions;
begin
  perform public.require_admin();
  select * into req from public.purchase_requests where id = p_request_id for update;
  if req.id is null then raise exception 'Payment request not found.'; end if;
  if req.status <> 'pending' then raise exception 'This request was already %.', req.status; end if;
  select * into pkg from public.packages where id = req.package_id;

  -- close out anything that has run out, then extend on top of a still-running subscription
  update public.subscriptions set status = 'expired'
    where user_id = req.user_id and status in ('active', 'suspended') and expires_at <= now();
  select * into prev from public.subscriptions
    where user_id = req.user_id and status in ('active', 'suspended') for update;
  base := greatest(now(), coalesce(case when prev.status = 'active' then prev.expires_at end, now()));
  if prev.id is not null then
    update public.subscriptions set status = 'replaced' where id = prev.id;
  end if;

  insert into public.subscriptions (user_id, package_id, purchase_request_id, status, starts_at, expires_at,
                                    daily_hours, daily_exports, web_access, instructions)
  values (req.user_id, pkg.id, req.id, 'active', now(), base + make_interval(days => pkg.duration_days),
          pkg.daily_hours, pkg.daily_exports, pkg.web_access, nullif(btrim(coalesce(p_instructions, '')), ''))
  returning * into sub;

  update public.purchase_requests
    set status = 'approved', admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
        install_instructions = sub.instructions, reviewed_by = auth.uid(), reviewed_at = now()
    where id = req.id;

  perform public.log_activity('payment.approved', 'purchase_request', req.id,
    jsonb_build_object('user_id', req.user_id, 'package', pkg.slug, 'amount_pkr', req.amount_pkr, 'expires_at', sub.expires_at));
  return sub;
end;
$$;

create or replace function public.admin_reject_purchase(p_request_id uuid, p_reason text)
returns public.purchase_requests language plpgsql security definer set search_path = public as $$
declare
  req public.purchase_requests;
begin
  perform public.require_admin();
  if length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Please give a reason for the rejection.'; end if;
  select * into req from public.purchase_requests where id = p_request_id for update;
  if req.id is null then raise exception 'Payment request not found.'; end if;
  if req.status <> 'pending' then raise exception 'This request was already %.', req.status; end if;
  update public.purchase_requests
    set status = 'rejected', rejection_reason = btrim(p_reason), reviewed_by = auth.uid(), reviewed_at = now()
    where id = req.id returning * into req;
  perform public.log_activity('payment.rejected', 'purchase_request', req.id,
    jsonb_build_object('user_id', req.user_id, 'reason', req.rejection_reason));
  return req;
end;
$$;

create or replace function public.admin_extend_subscription(p_subscription_id uuid, p_days integer)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions;
begin
  perform public.require_admin();
  if p_days is null or p_days < 1 or p_days > 3650 then raise exception 'Days must be between 1 and 3650.'; end if;
  select * into sub from public.subscriptions where id = p_subscription_id for update;
  if sub.id is null then raise exception 'Subscription not found.'; end if;
  if sub.status = 'replaced' then raise exception 'This subscription was replaced by a newer one.'; end if;
  if sub.status = 'expired' and exists (select 1 from public.subscriptions where user_id = sub.user_id and status in ('active', 'suspended')) then
    raise exception 'This customer already has a newer subscription. Extend that one.';
  end if;
  update public.subscriptions
    set expires_at = greatest(expires_at, now()) + make_interval(days => p_days),
        status = case when status = 'expired' then 'active' else status end,
        reminder_sent_at = null, expired_notice_sent_at = null
    where id = sub.id returning * into sub;
  perform public.log_activity('subscription.extended', 'subscription', sub.id,
    jsonb_build_object('user_id', sub.user_id, 'days', p_days, 'expires_at', sub.expires_at));
  return sub;
end;
$$;

create or replace function public.admin_set_subscription_status(p_subscription_id uuid, p_status public.subscription_status)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions;
begin
  perform public.require_admin();
  if p_status not in ('active', 'suspended') then raise exception 'Only suspend or reactivate here.'; end if;
  select * into sub from public.subscriptions where id = p_subscription_id for update;
  if sub.id is null then raise exception 'Subscription not found.'; end if;
  if sub.status not in ('active', 'suspended') then raise exception 'Only a live subscription can be suspended or reactivated.'; end if;
  if p_status = 'active' and sub.expires_at <= now() then raise exception 'This subscription has run out. Extend it instead.'; end if;
  update public.subscriptions set status = p_status where id = sub.id returning * into sub;
  perform public.log_activity(case when p_status = 'active' then 'subscription.reactivated' else 'subscription.suspended' end,
    'subscription', sub.id, jsonb_build_object('user_id', sub.user_id));
  return sub;
end;
$$;

create or replace function public.admin_change_package(p_subscription_id uuid, p_package_id uuid)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions;
  pkg public.packages;
begin
  perform public.require_admin();
  select * into pkg from public.packages where id = p_package_id;
  if pkg.id is null then raise exception 'Package not found.'; end if;
  update public.subscriptions
    set package_id = pkg.id, daily_hours = pkg.daily_hours, daily_exports = pkg.daily_exports, web_access = pkg.web_access
    where id = p_subscription_id and status in ('active', 'suspended') returning * into sub;
  if sub.id is null then raise exception 'Only a live subscription can change package.'; end if;
  perform public.log_activity('subscription.package_changed', 'subscription', sub.id,
    jsonb_build_object('user_id', sub.user_id, 'package', pkg.slug));
  return sub;
end;
$$;

create or replace function public.admin_add_note(p_user_id uuid, p_note text)
returns public.admin_notes language plpgsql security definer set search_path = public as $$
declare
  n public.admin_notes;
begin
  perform public.require_admin();
  insert into public.admin_notes (user_id, admin_id, note) values (p_user_id, auth.uid(), btrim(p_note)) returning * into n;
  perform public.log_activity('customer.note_added', 'profile', p_user_id, '{}');
  return n;
end;
$$;

-- admin edits of releases and settings are logged too
create or replace function public.log_settings_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'software_releases' then
    perform public.log_activity('release.' || lower(tg_op), 'software_release', new.id, jsonb_build_object('version', new.version));
  else
    perform public.log_activity(tg_table_name || '.updated', tg_table_name, null, '{}');
  end if;
  return new;
end;
$$;
create trigger releases_logged after insert or update on public.software_releases for each row execute function public.log_settings_change();
create trigger bank_logged after update on public.bank_settings for each row execute function public.log_settings_change();
create trigger website_logged after update on public.website_settings for each row execute function public.log_settings_change();

-- ---------------------------------------------------------------- expiry (run by pg_cron, see the second migration)
create or replace function public.expire_subscriptions()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  update public.subscriptions set status = 'expired'
    where status in ('active', 'suspended') and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------- functions the desktop app calls
-- What the logged-in user may do right now. Usage days reset at midnight in Asia/Karachi.
create or replace function public.get_entitlement()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  sub public.subscriptions;
  pkg public.packages;
  used_s bigint;
  exports_n bigint;
begin
  if auth.uid() is null then raise exception 'Please log in first.' using errcode = '42501'; end if;
  sub := public.live_subscription(auth.uid());
  if sub.id is null then
    return jsonb_build_object('active', false,
      'status', coalesce((select case when s.status in ('active', 'suspended') and s.expires_at <= now() then 'expired' else s.status::text end
                          from public.subscriptions s where s.user_id = auth.uid() order by s.created_at desc limit 1), 'none'));
  end if;
  select * into pkg from public.packages where id = sub.package_id;
  select coalesce(sum(seconds) filter (where kind = 'process'), 0), count(*) filter (where kind = 'export')
    into used_s, exports_n
    from public.usage_logs where user_id = auth.uid() and usage_date = public.karachi_today();
  return jsonb_build_object(
    'active', true, 'status', 'active',
    'package', pkg.slug, 'package_name', pkg.name,
    'starts_at', sub.starts_at, 'expires_at', sub.expires_at,
    'web_access', sub.web_access,
    'daily_seconds', (sub.daily_hours * 3600)::bigint,
    'used_seconds_today', used_s,
    'remaining_seconds_today', greatest(0, (sub.daily_hours * 3600)::bigint - used_s),
    'daily_exports', sub.daily_exports,
    'exports_today', exports_n,
    'remaining_exports_today', greatest(0, sub.daily_exports - exports_n),
    'resets_at', ((public.karachi_today() + 1)::timestamp at time zone 'Asia/Karachi'));
end;
$$;

-- Book p_seconds of video processing for today. Refuses (ok=false) with what is left.
create or replace function public.reserve_processing(p_seconds integer, p_label text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions;
  limit_s bigint;
  used_s bigint;
begin
  if auth.uid() is null then raise exception 'Please log in first.' using errcode = '42501'; end if;
  if p_seconds is null or p_seconds < 1 or p_seconds > 86400 then raise exception 'Video length must be between 1 second and 24 hours.'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;   -- one booking at a time per user
  sub := public.live_subscription(auth.uid());
  if sub.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_subscription', 'message', 'You have no active subscription.');
  end if;
  limit_s := (sub.daily_hours * 3600)::bigint;
  select coalesce(sum(seconds), 0) into used_s from public.usage_logs
    where user_id = auth.uid() and kind = 'process' and usage_date = public.karachi_today();
  if used_s + p_seconds > limit_s then
    return jsonb_build_object('ok', false, 'reason', 'daily_limit',
      'remaining_seconds_today', greatest(0, limit_s - used_s), 'requested_seconds', p_seconds, 'daily_seconds', limit_s,
      'message', 'This video is longer than what is left of your daily limit.');
  end if;
  insert into public.usage_logs (user_id, subscription_id, kind, seconds, label, usage_date)
  values (auth.uid(), sub.id, 'process', p_seconds, left(coalesce(p_label, ''), 200), public.karachi_today());
  return jsonb_build_object('ok', true, 'remaining_seconds_today', limit_s - used_s - p_seconds, 'daily_seconds', limit_s);
end;
$$;

-- Book one export for today.
create or replace function public.reserve_export(p_label text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sub public.subscriptions;
  used_n bigint;
begin
  if auth.uid() is null then raise exception 'Please log in first.' using errcode = '42501'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  sub := public.live_subscription(auth.uid());
  if sub.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_subscription', 'message', 'You have no active subscription.');
  end if;
  select count(*) into used_n from public.usage_logs
    where user_id = auth.uid() and kind = 'export' and usage_date = public.karachi_today();
  if used_n >= sub.daily_exports then
    return jsonb_build_object('ok', false, 'reason', 'daily_export_limit', 'remaining_exports_today', 0,
      'daily_exports', sub.daily_exports, 'message', 'You have used all of today''s exports.');
  end if;
  insert into public.usage_logs (user_id, subscription_id, kind, seconds, label, usage_date)
  values (auth.uid(), sub.id, 'export', 0, left(coalesce(p_label, ''), 200), public.karachi_today());
  return jsonb_build_object('ok', true, 'remaining_exports_today', sub.daily_exports - used_n - 1, 'daily_exports', sub.daily_exports);
end;
$$;

-- ---------------------------------------------------------------- function permissions
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin(uuid), public.has_active_subscription(uuid), public.karachi_today(),
  public.get_entitlement(), public.reserve_processing(integer, text), public.reserve_export(text),
  public.admin_approve_purchase(uuid, text, text), public.admin_reject_purchase(uuid, text),
  public.admin_extend_subscription(uuid, integer), public.admin_set_subscription_status(uuid, public.subscription_status),
  public.admin_change_package(uuid, uuid), public.admin_add_note(uuid, text)
  to authenticated;
grant execute on function public.is_admin(uuid) to anon;   -- used by the public packages policy; false for visitors
-- internal helpers stay callable by policies/triggers (they run as the owner) but not through the API
revoke execute on function public.live_subscription(uuid), public.log_activity(text, text, uuid, jsonb),
  public.expire_subscriptions(), public.require_admin() from authenticated;
