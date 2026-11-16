import { useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { AlertCircle, Check, CheckCircle2, Copy, Info, Loader2, X } from "lucide-react";
import { cx } from "../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "teal";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-white text-night hover:bg-[#e9e7ff] border border-white",
  secondary: "bg-transparent text-ink border border-line-strong hover:border-lilac/50 hover:bg-white/[0.04]",
  ghost: "text-ink-2 hover:bg-white/[0.06] border border-transparent",
  danger: "bg-red-soft text-red border border-red/40 hover:bg-red/20",
  teal: "bg-violet text-white hover:bg-teal-dark border border-violet",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-[14px] gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
};

export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  cx(
    "inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );

export function Button({
  variant = "primary", size = "md", loading, className, children, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={btn(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...rest} />;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">{label}</label>
      {children}
      {error ? <p className="text-[12.5px] text-red">{error}</p> : hint ? <p className="text-[12.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Labelled text input with its own id. */
export function TextField({ label, hint, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <input id={id} className="input" {...props} />
    </Field>
  );
}

export function TextArea({ label, hint, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode; error?: string | null }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <textarea id={id} className="input" {...props} />
    </Field>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-muted" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}…
    </div>
  );
}

type Tone = "neutral" | "teal" | "amber" | "red" | "ink";
const TONES: Record<Tone, string> = {
  neutral: "bg-sand text-ink-2 border-line",
  teal: "bg-teal-soft text-teal-dark border-teal/20",
  amber: "bg-amber-soft text-amber border-amber/20",
  red: "bg-red-soft text-red border-red/20",
  ink: "bg-white text-night border-white",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-5", TONES[tone], className)}>
      {children}
    </span>
  );
}

const STATUS: Record<string, [Tone, string]> = {
  pending: ["amber", "Pending"],
  approved: ["teal", "Approved"],
  rejected: ["red", "Rejected"],
  active: ["teal", "Active"],
  expired: ["neutral", "Expired"],
  suspended: ["red", "Suspended"],
  replaced: ["neutral", "Replaced"],
  none: ["neutral", "No subscription"],
};

export function StatusBadge({ status }: { status: string }) {
  const [tone, label] = STATUS[status] ?? ["neutral", status];
  return (
    <Badge tone={tone}>
      <span className={cx("size-1.5 rounded-full", tone === "teal" ? "bg-teal" : tone === "amber" ? "bg-amber" : tone === "red" ? "bg-red" : "bg-faint")} />
      {label}
    </Badge>
  );
}

export function Alert({ tone = "info", title, children, action }: { tone?: "info" | "success" | "warning" | "error"; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const styles = {
    info: ["bg-paper border-line text-ink-2", Info],
    success: ["bg-teal-soft border-teal/20 text-teal-dark", CheckCircle2],
    warning: ["bg-amber-soft border-amber/20 text-amber", AlertCircle],
    error: ["bg-red-soft border-red/20 text-red", AlertCircle],
  } as const;
  const [cls, Icon] = styles[tone];
  return (
    <div className={cx("flex gap-3 rounded-lg border px-4 py-3 text-[14px]", cls)} role={tone === "error" ? "alert" : "status"}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx("leading-relaxed", title ? "mt-0.5 opacity-90" : "")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#01010d]/70 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cx("animate-fade-up flex max-h-[92vh] w-full flex-col rounded-t-xl border border-line bg-canvas shadow-[var(--shadow-pop)] sm:rounded-xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-sand hover:text-ink" aria-label="Close"><X className="size-4" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation dialog for destructive or important actions. */
export function Confirm({ open, title, body, confirmLabel, danger, busy, onConfirm, onClose }: {
  open: boolean; title: string; body: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
      </>}>
      <div className="text-[14px] leading-relaxed text-ink-2">{body}</div>
    </Modal>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch { /* clipboard blocked: the value is still visible to copy by hand */ }
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-transparent px-2.5 text-[12.5px] font-medium text-ink-2 hover:bg-white/[0.06]"
      aria-label={`${label}: ${value}`}
    >
      {done ? <Check className="size-3.5 text-teal" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : label}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && <div className="mb-4 grid size-11 place-items-center rounded-lg border border-line bg-paper text-muted"><Icon className="size-5" /></div>}
      <p className="text-[15px] font-medium">{title}</p>
      {children && <div className="mt-1.5 max-w-md text-[14px] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em]">{value}</p>
      {hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}

/** Label/value rows for detail panels. */
export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 py-2.5 text-[14px]">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={cx("h-full rounded-full transition-[width]", pct >= 90 ? "bg-clay" : "bg-teal")} style={{ width: `${pct}%` }} />
    </div>
  );
}
