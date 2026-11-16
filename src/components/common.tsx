import { useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { Database, LogOut, Menu, X } from "lucide-react";
import { isConfigured } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useSite } from "../lib/site";
import { cx } from "../lib/format";
import { Spinner, btn } from "./ui";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  const { site } = useSite();
  return (
    <Link to={to} className={cx("inline-flex items-center gap-2.5 font-semibold tracking-[-0.01em] text-ink", className)}>
      {site.logo_url ? (
        <img src={site.logo_url} alt="" className="size-7 rounded-md object-contain" />
      ) : (
        <span className="grid size-7 place-items-center rounded-md bg-ink" aria-hidden>
          <svg viewBox="0 0 16 16" className="size-3.5"><path d="M5 3.5v9l7.5-4.5z" fill="#fff" /></svg>
        </span>
      )}
      <span className="text-[16px]">{site.product_name}</span>
    </Link>
  );
}

/** Shown instead of auth, checkout and dashboards until Supabase credentials are set. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
      <div className="card w-full max-w-xl p-8">
        <div className="mb-5 grid size-11 place-items-center rounded-lg border border-line bg-paper"><Database className="size-5 text-muted" /></div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Connect Supabase to continue</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          Accounts, payments and dashboards run on Supabase. This site has no Supabase credentials yet, so these pages are switched off rather than pretending to work.
        </p>
        <ol className="mt-6 list-decimal space-y-2.5 pl-5 text-[14px] leading-relaxed text-ink-2">
          <li>Create a Supabase project and run the SQL files in <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12.5px]">website/supabase/migrations</code>.</li>
          <li>Copy <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12.5px]">.env.example</code> to <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12.5px]">.env</code> and fill in the project URL and anon key.</li>
          <li>Restart the dev server or redeploy. The full steps are in <code className="rounded bg-sand px-1.5 py-0.5 font-mono text-[12.5px]">website/README.md</code>.</li>
        </ol>
        <Link to="/" className={btn("secondary", "md", "mt-7")}>Back to the homepage</Link>
      </div>
    </div>
  );
}

export function RequireSupabase({ children }: { children: ReactNode }) {
  return isConfigured ? <>{children}</> : <SetupNotice />;
}

/** Logged-in and email-verified users only. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session, verified } = useAuth();
  const loc = useLocation();
  if (!isConfigured) return <SetupNotice />;
  if (loading) return <div className="min-h-screen"><Spinner /></div>;
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!verified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
}

/** Admins only. The UI check is for navigation; every admin action is re-checked in the database. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth();
  return (
    <RequireAuth>
      {loading ? <Spinner /> : isAdmin ? children : <Navigate to="/dashboard" replace />}
    </RequireAuth>
  );
}

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: ReactNode;
}

/** Sidebar layout shared by the customer and admin dashboards. */
export function Shell({ nav, area, footer }: { nav: NavItem[]; area: string; footer?: ReactNode }) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <Logo to={area === "Admin" ? "/admin" : "/dashboard"} />
        {area === "Admin" && <span className="rounded border border-line px-1.5 py-0.5 text-[11px] font-medium text-muted">Admin</span>}
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => cx(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-[14px] transition-colors",
              isActive ? "bg-sand font-medium text-ink" : "text-muted hover:bg-paper hover:text-ink",
            )}>
            <Icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-line p-3">
        {footer}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-[13px] font-semibold text-ink-2">
            {(profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{profile?.full_name || "Account"}</p>
            <p className="truncate text-[12px] text-muted">{profile?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted hover:bg-paper hover:text-ink">
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-canvas lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-72 border-r border-line bg-canvas">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-sand" aria-label="Open menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          <Logo />
        </header>
        <main key={loc.pathname} className="animate-fade-up mx-auto max-w-[1180px] px-4 py-6 sm:px-8 sm:py-9"><Outlet /></main>
      </div>
    </div>
  );
}

/** Small search + filter bar used above tables. */
export function TableToolbar({ search, onSearch, placeholder, filters, filter, onFilter }: {
  search: string; onSearch: (v: string) => void; placeholder: string;
  filters?: { value: string; label: string; count?: number }[]; filter?: string; onFilter?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
      {filters && onFilter ? (
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button key={f.value} onClick={() => onFilter(f.value)}
              className={cx("h-8 rounded-md px-3 text-[13px] font-medium transition-colors", filter === f.value ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink")}>
              {f.label}{f.count != null && <span className="ml-1.5 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>
      ) : <span />}
      <input className="input h-9 sm:w-72" type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export const th = "px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-[0.04em] text-muted whitespace-nowrap";
export const td = "px-4 py-3 text-[14px] whitespace-nowrap";

/** Case-insensitive match of a query against several fields. */
export const matches = (q: string, ...fields: (string | null | undefined)[]) => {
  const s = q.trim().toLowerCase();
  return !s || fields.some((f) => f?.toLowerCase().includes(s));
};
