# ClipXo website

This folder holds the marketing site, the customer dashboard and the admin dashboard for selling ClipXo subscriptions. It is built with React, TypeScript, Vite, Tailwind and Supabase.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run test:db    # runs the database migration on an in-process Postgres and checks the security rules
```

Without Supabase credentials the homepage still works. Login, checkout and the dashboards show a "Connect Supabase" screen instead of pretending to work.

## How a sale works

1. A visitor picks a plan, registers (name, email, phone, password) and verifies their email.
2. The checkout page shows the bank details from **Admin → Bank settings**. The customer transfers the money, then submits the transaction reference and a screenshot.
   - The screenshot goes to a private storage bucket.
   - The request is saved as **Pending**.
   - A customer can have only one pending request at a time.
3. An admin opens **Payment requests**, checks the transfer against the real bank statement, and approves or rejects it.
   - **Approve:** the subscription starts that day and runs for the package's 30, 90 or 365 days. The download link unlocks and the customer gets an email.
     - If the customer still has an active subscription, the new days are added after its expiry.
   - **Reject:** a reason is required. The customer is emailed and can submit again.
4. When `expires_at` passes, access stops. The login account is never deleted. Admins can extend, suspend, reactivate or change the package.

All of these rules are enforced inside Postgres (RLS and `security definer` functions), not in the browser.

## Setup

### 1. Supabase project
1. Create a project at supabase.com.
2. In **SQL editor**, run `supabase/migrations/20261116000000_init.sql`. If you use the CLI, run `supabase link` and then `supabase db push`.
3. Enable the **pg_cron** extension (Database → Extensions), then run `supabase/migrations/20261116000100_cron.sql`. This marks subscriptions as expired every 5 minutes.
   - Access checks compare against the expiry time directly, so they do not wait for this job.

### 2. Auth settings (Authentication → URL configuration / Providers → Email)
- Site URL: your website, e.g. `https://clipxo.com`.
- Redirect URLs: `https://yourdomain.com/auth/callback` and `https://yourdomain.com/reset-password`. Add the `http://localhost:5173/...` versions for development.
- Keep **Confirm email** switched on.
- For real customers, set up **custom SMTP** (Authentication → Emails → SMTP), for example Brevo (`smtp-relay.brevo.com`, port 587). Supabase's built-in mailer only sends a few emails per hour.

### 3. Website environment
Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...   # Settings → API → anon public key
```

Never put the **service role** key in this file or in any frontend code.

### 4. First admin
Register on the site with your own email and verify it. Then run this in the SQL editor:

```sql
insert into public.admin_users (user_id)
select id from public.profiles where email = 'you@example.com';
```

Log out and back in, and **Admin dashboard** appears in the sidebar at `/admin`. Then fill in:
- **Bank settings**;
- **Website settings** (support email, phone);
- **Software releases**: version and Google Drive link, shared as "Anyone with the link". Only customers with an active subscription can read this link.

### 5. Emails (optional, recommended)
Payment and expiry emails are sent by the two Edge Functions in `supabase/functions`:

```
supabase functions deploy notify
supabase functions deploy subscription-reminders --no-verify-jwt
supabase secrets set BREVO_API_KEY=xkeysib-... EMAIL_FROM="ClipXo <billing@yourdomain.com>" SITE_URL=https://yourdomain.com CRON_SECRET=<long random string>
```

- `notify` sends four emails: registration, payment submitted, approved and rejected. It decides the recipient and the content from the database, so nobody can use it to send arbitrary mail.
- `subscription-reminders` sends "ends in 3 days" and "has ended" emails. To run it daily, follow the commented block at the end of the cron migration.
- Without `BREVO_API_KEY` the functions only log, and nothing else breaks.

### 6. Deploy the website
- Any static host works.
- **Vercel:** import the `website` folder and set the two `VITE_` variables. `vercel.json` already adds the single-page-app rewrite.
- **Netlify:** `public/_redirects` does the same job.

## For the desktop app (next project)

The app signs in with the same Supabase account (email and password) and then calls these database functions with the user's token:

| Function | Returns |
|---|---|
| `get_entitlement()` | `active`, `package_name`, `expires_at`, `daily_seconds`, `used_seconds_today`, `remaining_seconds_today`, `daily_exports`, `exports_today`, `remaining_exports_today`, `resets_at` |
| `reserve_processing(p_seconds, p_label)` | `{ ok: true, remaining_seconds_today }`, or `{ ok: false, reason: 'daily_limit', remaining_seconds_today, message }` |
| `reserve_export(p_label)` | `{ ok: true, remaining_exports_today }`, or `{ ok: false, reason: 'daily_export_limit' }` |

- Daily limits reset at midnight Asia/Karachi.
- `reserve_processing` books the video's length before processing starts, and serialises calls per user so two windows can't both pass the check.
- If a 2.5-hour video is booked with 2 hours left, the app gets `ok: false` and `remaining_seconds_today: 7200` and can tell the user.

## Structure

```
src/
  lib/                supabase client, auth + site settings contexts, formatting, types
  components/         ui kit, layout shell + route guards, charts, landing sections
  pages/public        landing, terms, privacy
  pages/auth          login, register, verify email, callback, forgot/reset password
  pages/checkout      payment instructions + submission, confirmation
  pages/dashboard     customer area
  pages/admin         admin area
supabase/
  migrations/         schema, RLS, functions, storage bucket, cron
  functions/          notify, subscription-reminders (Edge Functions, Deno)
  tests/db.test.mjs   migration + security checks on PGlite
```
