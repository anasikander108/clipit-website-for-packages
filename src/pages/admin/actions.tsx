import { useState } from "react";
import { db, errorMessage } from "../../lib/supabase";
import { usePackages } from "../../lib/packages";
import { date, hours } from "../../lib/format";
import type { Subscription } from "../../lib/types";
import { Alert, Button, Confirm, Field, Modal, TextField } from "../../components/ui";

type Sub = Pick<Subscription, "id" | "expires_at" | "status" | "package_id"> & { packages?: { name: string } | null };

/** Extend / suspend / reactivate / change package. Every action is an admin-checked database function. */
export function useSubscriptionActions(onDone: () => void) {
  const [extend, setExtend] = useState<Sub | null>(null);
  const [toggle, setToggle] = useState<{ sub: Sub; to: "active" | "suspended" } | null>(null);
  const [change, setChange] = useState<Sub | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => PromiseLike<{ error: unknown }>, close: () => void) {
    setBusy(true);
    setError(null);
    const { error } = await fn();
    setBusy(false);
    if (error) return setError(errorMessage(error));
    close();
    onDone();
  }

  const modals = (
    <>
      <ExtendModal sub={extend} busy={busy} error={error} onClose={() => { setExtend(null); setError(null); }}
        onSubmit={(days) => run(() => db().rpc("admin_extend_subscription", { p_subscription_id: extend!.id, p_days: days }), () => setExtend(null))} />
      <Confirm open={!!toggle} busy={busy} danger={toggle?.to === "suspended"}
        title={toggle?.to === "suspended" ? "Suspend this subscription?" : "Reactivate this subscription?"}
        confirmLabel={toggle?.to === "suspended" ? "Suspend" : "Reactivate"}
        onClose={() => { setToggle(null); setError(null); }}
        onConfirm={() => run(() => db().rpc("admin_set_subscription_status", { p_subscription_id: toggle!.sub.id, p_status: toggle!.to }), () => setToggle(null))}
        body={<>
          {error && <div className="mb-3"><Alert tone="error">{error}</Alert></div>}
          {toggle?.to === "suspended"
            ? "The customer immediately loses access to the software and the download. Their login account and expiry date are kept, so you can reactivate them later."
            : `Access is restored until ${date(toggle?.sub.expires_at)}.`}
        </>} />
      <ChangePackageModal sub={change} busy={busy} error={error} onClose={() => { setChange(null); setError(null); }}
        onSubmit={(pkgId) => run(() => db().rpc("admin_change_package", { p_subscription_id: change!.id, p_package_id: pkgId }), () => setChange(null))} />
    </>
  );
  return {
    modals,
    extend: (s: Sub) => setExtend(s),
    suspend: (s: Sub) => setToggle({ sub: s, to: "suspended" }),
    reactivate: (s: Sub) => setToggle({ sub: s, to: "active" }),
    changePackage: (s: Sub) => setChange(s),
  };
}

function ExtendModal({ sub, busy, error, onClose, onSubmit }: { sub: Sub | null; busy: boolean; error: string | null; onClose: () => void; onSubmit: (days: number) => void }) {
  const [days, setDays] = useState("30");
  const n = Number(days);
  const valid = Number.isInteger(n) && n >= 1 && n <= 3650;
  return (
    <Modal open={!!sub} onClose={onClose} title="Extend subscription"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={() => onSubmit(n)} loading={busy} disabled={!valid}>Extend by {valid ? n : "…"} days</Button></>}>
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-[14px] text-ink-2">Currently {sub?.status === "expired" ? "expired since" : "expires on"} <strong>{date(sub?.expires_at)}</strong>. Days are added to the later of today and the current expiry date.</p>
        <TextField label="Days to add" type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} />
        <div className="flex gap-2">{[7, 30, 90, 365].map((d) => <Button key={d} size="sm" variant="secondary" onClick={() => setDays(String(d))}>{d} days</Button>)}</div>
      </div>
    </Modal>
  );
}

function ChangePackageModal({ sub, busy, error, onClose, onSubmit }: { sub: Sub | null; busy: boolean; error: string | null; onClose: () => void; onSubmit: (id: string) => void }) {
  const { data } = usePackages();
  const [pick, setPick] = useState("");
  const chosen = pick || sub?.package_id || "";
  return (
    <Modal open={!!sub} onClose={onClose} title="Change package"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={() => onSubmit(chosen)} loading={busy} disabled={!chosen || chosen === sub?.package_id}>Change package</Button></>}>
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-[14px] text-ink-2">The daily limits switch to the new package straight away. The start and expiry dates stay the same.</p>
        <Field label="Package">
          <select className="input" value={chosen} onChange={(e) => setPick(e.target.value)}>
            {(data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({hours(p.daily_hours)} a day)</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
