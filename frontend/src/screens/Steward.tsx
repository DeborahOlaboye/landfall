import { useState } from "react";
import { c, mono } from "../theme";
import { Dot, Notice, Pending } from "../ui";
import { ORGANIZERS } from "../data";

export default function Steward({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  const [active, setActive] = useState<Record<string, boolean>>({
    "ikejabaptist.btc": true,
    "kibera-clinic.btc": true,
    "nsukka-union.btc": false,
  });
  const [cascadeFor, setCascadeFor] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cascadeCount = cascadeFor
    ? ORGANIZERS.find((o) => o.handle === cascadeFor)?.count ?? 0
    : 0;

  function admit() {
    setErr(null);
    if (!connected) { onConnect(); return; }
    if (!newOrg.trim()) return;
    // Admitting on chain needs the steward key; surfaced here rather than
    // pretending the click did something.
    setErr("Admitting an organizer must be signed by the steward account that deployed the registry.");
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 20px 64px", width: "100%", animation: "lf-in .26s ease both" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, letterSpacing: "-.022em" }}>Organizers</h2>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: c.muted, maxWidth: "60ch", textWrap: "pretty" }}>
        Suspending an organizer suspends their whole roster in one call. The registry cascades,
        so a bad actor cannot be unwound one record at a time.
      </p>

      {err && <div style={{ marginBottom: 14, maxWidth: 560 }}><Notice tone="bad">{err}</Notice></div>}

      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
        {ORGANIZERS.map((o) => {
          const on = active[o.handle];
          return (
            <div key={o.handle} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, padding: "15px 16px", borderBottom: `1px solid ${c.hairline}`, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <Dot on={on} />
                  <span style={{ fontFamily: mono, fontSize: 13.5, fontWeight: 500 }}>{o.handle}</span>
                  <span style={{
                    fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: c.muted,
                    background: c.sunken, border: `1px solid ${c.borderSoft}`, borderRadius: 5, padding: "2px 7px",
                  }}>{on ? "active" : "suspended"}</span>
                </div>
                <div style={{ fontSize: 13, color: c.muted, marginTop: 5, textWrap: "pretty" }}>{o.line}</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ fontFamily: mono, fontSize: 13 }}>{o.count} recipient{o.count === 1 ? "" : "s"}</div>
                <button className="lf-link"
                  onClick={() => on ? setCascadeFor(o.handle) : setActive((s) => ({ ...s, [o.handle]: true }))}
                  style={{ fontSize: 11.5, letterSpacing: ".05em", textTransform: "uppercase", color: c.accent, marginTop: 5 }}>
                  {on ? "Suspend — cascades" : "Reinstate"}
                </button>
              </div>
            </div>
          );
        })}
        <div style={{ padding: "15px 16px", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
          <input value={newOrg} onChange={(e) => setNewOrg(e.target.value)} placeholder="ST3K… or hometown.btc" aria-label="New organizer"
            style={{ flex: 1, minWidth: 200, background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 10, padding: "11px 12px", fontFamily: mono, fontSize: 12.5 }} />
          <button className="lf-dark" onClick={admit} disabled={busy}
            style={{ background: c.ink, color: c.surface, borderRadius: 10, padding: "11px 18px", fontSize: 13.5, fontWeight: 600 }}>
            {busy ? <Pending label="Admitting…" /> : "Admit organizer"}
          </button>
        </div>
      </div>

      {cascadeFor && (
        <div style={{ marginTop: 14, background: c.warnBg, border: `1px solid ${c.warnBorder}`, borderRadius: 14, padding: 16, animation: "lf-in .2s ease both" }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: c.warn, marginBottom: 6 }}>
            Suspend {cascadeFor} and everyone they vouched for?
          </div>
          <div style={{ fontSize: 13, color: c.warnText, lineHeight: 1.55, marginBottom: 13, textWrap: "pretty" }}>
            {cascadeCount} recipient{cascadeCount === 1 ? "" : "s"} stop being payable immediately, in
            one call. Receipts already written stay valid — this only stops future gifts.
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button className="lf-warn" onClick={() => { setActive((s) => ({ ...s, [cascadeFor]: false })); setCascadeFor(null); }}
              style={{ background: c.warn, color: "#FFF8F2", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>
              Yes, cascade it
            </button>
            <button className="lf-warn-quiet" onClick={() => setCascadeFor(null)}
              style={{ background: c.warnChip, border: `1px solid ${c.warnBorder}`, borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: c.warnText }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, fontFamily: mono, fontSize: 11.5, color: c.faint }}>
        errors: u1xx registry · u2xx disbursement
      </div>
    </div>
  );
}
