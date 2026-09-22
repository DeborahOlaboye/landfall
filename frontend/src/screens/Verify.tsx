import { useEffect, useState } from "react";
import { c, mono, fromSats, shorten } from "../theme";
import { Eyebrow, Notice, Pending, Row, Segmented } from "../ui";
import { getReceipt, type Receipt } from "../chain";
import { DIRECTORY } from "../data";

export default function Verify({
  layout, setLayout,
}: { layout: "A" | "B"; setLayout: (l: "A" | "B") => void }) {
  const [q, setQ] = useState("1");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [looking, setLooking] = useState(false);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function lookup(n = Number(q)) {
    setErr(null); setMissing(false);
    if (!Number.isInteger(n) || n < 1) { setMissing(true); setReceipt(null); return; }
    setLooking(true);
    try {
      const r = await getReceipt(n);
      if (!r) { setMissing(true); setReceipt(null); } else setReceipt(r);
    } catch {
      setErr("Couldn't reach the network. Try again in a moment.");
    } finally {
      setLooking(false);
    }
  }

  // Land on a real receipt so the screen never opens empty.
  useEffect(() => { lookup(1); }, []);

  const who = receipt ? DIRECTORY[receipt.recipientId] : undefined;
  const rows = receipt ? [
    { k: "Amount", v: fromSats(receipt.amountSats) },
    { k: "Reached", v: receipt.payout },
    { k: "Sent by", v: receipt.donor },
    { k: "Recipient", v: `#${receipt.recipientId}${who ? ` · ${who.name}` : ""}` },
    { k: "Asset", v: receipt.asset ? receipt.asset.split(".").pop()! : "STX" },
    { k: "Stacks block", v: receipt.stacksHeight },
    { k: "Bitcoin block", v: receipt.bitcoinHeight },
  ] : [];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 20px 64px", width: "100%", animation: "lf-in .26s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, letterSpacing: "-.022em" }}>Check a receipt</h2>
          <p style={{ margin: 0, fontSize: 14, color: c.muted }}>
            Anyone can call <span style={{ fontFamily: mono }}>verify()</span>. No wallet needed.
          </p>
        </div>
        <Segmented value={layout} onChange={setLayout}
          options={[{ key: "A", label: "A · Paper slip" }, { key: "B", label: "B · Split ledger" }]} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); lookup(); }}
        style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18, maxWidth: 520 }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setMissing(false); }}
          placeholder="Receipt number, e.g. 1" inputMode="numeric" aria-label="Receipt number"
          style={{ flex: 1, minWidth: 180, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 11, padding: "12px 14px", fontFamily: mono, fontSize: 14, color: c.ink }} />
        <button type="submit" className="lf-dark" disabled={looking}
          style={{ background: c.ink, color: c.surface, borderRadius: 11, padding: "12px 22px", fontSize: 14, fontWeight: 600 }}>
          {looking ? <Pending label="Checking…" /> : "Check"}
        </button>
      </form>

      {missing && (
        <div style={{ maxWidth: 520, marginBottom: 18 }}>
          <Notice tone="bad">
            No receipt number {q}. <span style={{ fontFamily: mono, fontSize: 12.5 }}>u204 unknown-receipt</span>
          </Notice>
        </div>
      )}
      {err && <div style={{ maxWidth: 520, marginBottom: 18 }}><Notice tone="bad">{err}</Notice></div>}

      {receipt && layout === "A" && (
        <div style={{
          maxWidth: 560, background: c.surface, border: `1px solid ${c.border}`,
          borderTop: `3px solid ${c.good}`, borderRadius: "4px 4px 16px 16px", padding: 24,
          boxShadow: "0 20px 44px -34px rgba(22,20,15,.5)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", color: c.good }}>It landed.</div>
            <div style={{ fontFamily: mono, fontSize: 12, color: c.faint }}>receipt #{receipt.id}</div>
          </div>
          <div style={{ fontSize: "clamp(28px,5vw,40px)", fontFamily: mono, fontWeight: 500, letterSpacing: "-.03em", marginBottom: 20 }}>
            {fromSats(receipt.amountSats)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13, paddingTop: 16, borderTop: `1px solid ${c.rule}` }}>
            {rows.map((r) => <Row key={r.k} k={r.k} v={r.v} size={13} />)}
          </div>
          <div style={{ marginTop: 18, paddingTop: 15, borderTop: `1px solid ${c.rule}`, fontSize: 13, lineHeight: 1.55, color: c.muted, textWrap: "pretty" }}>
            Settled under Bitcoin block {receipt.bitcoinHeight}. You can confirm this yourself
            against Bitcoin — you do not have to take our word for it, and it stays true if we disappear.
          </div>
        </div>
      )}

      {receipt && layout === "B" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(272px,1fr))", gap: 14, alignItems: "start" }}>
          <div style={{ background: c.dark, color: c.darkText, borderRadius: 16, padding: 22 }}>
            <Eyebrow style={{ marginBottom: 14 }}>Receipt #{receipt.id}</Eyebrow>
            <div style={{ fontFamily: mono, fontSize: "clamp(28px,5vw,40px)", fontWeight: 500, letterSpacing: "-.03em", color: c.goodSoft }}>
              {fromSats(receipt.amountSats)}
            </div>
            <div style={{ fontSize: 14, color: c.darkSoft, marginTop: 10, lineHeight: 1.55, textWrap: "pretty" }}>
              reached {who?.name ?? shorten(receipt.payout)}
              {who ? `, vouched for by ${who.organizer}` : ""}
            </div>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.darkBorder}`, display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: c.faint }}>Stacks block</div>
                <div style={{ fontFamily: mono, fontSize: 16, marginTop: 4 }}>{receipt.stacksHeight}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: c.faint }}>Bitcoin block</div>
                <div style={{ fontFamily: mono, fontSize: 16, marginTop: 4, color: c.peach }}>{receipt.bitcoinHeight}</div>
              </div>
            </div>
          </div>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
            {rows.map((r) => (
              <div key={r.k} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: "12px 16px", borderBottom: `1px solid ${c.hairline}`, alignItems: "baseline" }}>
                <span style={{ fontSize: 12.5, color: c.muted, minWidth: 96 }}>{r.k}</span>
                <span style={{ fontFamily: mono, fontSize: 12.5, textAlign: "right", wordBreak: "break-all" }}>{r.v}</span>
              </div>
            ))}
            <div style={{ padding: "14px 16px", fontSize: 12.5, color: c.muted, lineHeight: 1.55, textWrap: "pretty" }}>
              Verified against the chain, not against us. The claim survives this contract and this
              company disappearing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
