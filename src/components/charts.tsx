// Small dependency-free SVG charts for the admin overview.

export interface Point {
  label: string;
  value: number;
}

export function BarChart({ data, format = (v) => String(v), color = "var(--color-teal)" }: { data: Point[]; format?: (v: number) => string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 560, H = 200, pad = 28, gap = 10;
  const bw = (W - pad * 2 - gap * (data.length - 1)) / Math.max(1, data.length);
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(", ")}>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} x2={W - pad} y1={H - t * (H - 20)} y2={H - t * (H - 20)} stroke="var(--color-line)" strokeDasharray={t ? "3 4" : undefined} />
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 20);
        const x = pad + i * (bw + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={H - h} width={bw} height={Math.max(h, d.value ? 2 : 0)} rx={3} fill={color}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
            {d.value > 0 && <text x={x + bw / 2} y={H - h - 6} textAnchor="middle" fontSize="11" fill="var(--color-muted)">{format(d.value)}</text>}
            <text x={x + bw / 2} y={H + 17} textAnchor="middle" fontSize="11.5" fill="var(--color-muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal share bars (e.g. subscriptions per package). */
export function ShareBars({ data }: { data: Point[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = ["var(--color-ink)", "var(--color-teal)", "var(--color-clay)", "var(--color-faint)"];
  return (
    <div className="space-y-4">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-sand">
        {data.map((d, i) => d.value > 0 && <div key={d.label} style={{ width: `${(d.value / total) * 100}%`, background: colors[i % colors.length] }} />)}
      </div>
      <ul className="space-y-2.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5 text-[14px]">
            <span className="size-2.5 rounded-sm" style={{ background: colors[i % colors.length] }} />
            <span className="flex-1">{d.label}</span>
            <span className="font-medium tabular-nums">{d.value}</span>
            <span className="w-12 text-right text-muted tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Last n months as "Jan", "Feb" … with their YYYY-MM keys (Karachi time). */
export function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15));
    out.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short" }) });
  }
  return out;
}

export const monthKey = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).slice(0, 7);
