import { useMemo, useState } from "react";
import { c, mono, sats, amountLabel, shorten, initialsOf, fromSats } from "../theme";
import { Avatar, Chip, Dot, Eyebrow, Notice, Pending, Row, Segmented, Check } from "../ui";
import { useRecipients, type Recipient } from "../data";
import { give, explorerTx, walletAddress } from "../chain";

type Step = "pick" | "amount" | "confirm" | "done";
const PRESETS = ["0.0005", "0.0025", "0.01"];

export default function Give({
  direction, setDirection, onVerify, connected, onConnect,
}: {
  direction: "A" | "B";
  setDirection: (d: "A" | "B") => void;
  onVerify: () => void;
  connected: boolean;
  onConnect: () => void;
}) {
  const { list, live } = useRecipients();
  const [step, setStep] = useState<Step>("pick");
  const [selectedId, setSelectedId] = useState(list[0]?.id ?? 1);
  const [amount, setAmount] = useState("0.0025");
  const [memo, setMemo] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sel = useMemo(
    () => list.find((r) => r.id === selectedId) ?? list[0],
    [list, selectedId],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((r) => (r.name + r.need + r.organizer).toLowerCase().includes(q)) : list;
  }, [list, query]);

  const done = step === "done" || (direction === "B" && !!txid);

  async function send() {
    if (sending || !sel) return;
    setError(null);
    if (!connected) { onConnect(); return; }
    setSending(true);
    try {
      const res: any = await give(sel.id, amount, memo);
      setTxid(res?.txid ?? res?.txId ?? null);
      setStep("done");
    } catch (e: any) {
      setError(e?.message ?? "The wallet rejected or could not send this transfer.");
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setStep("pick"); setTxid(null); setMemo(""); setAmount("0.0025"); setError(null);
  }

  const sendLabel = sending ? "Waiting on the chain…" : txid ? "Sent" : `Send ${amountLabel(amount)}`;

  const receiptRows = sel ? [
    { k: "Amount", v: amountLabel(amount) },
    { k: "Reached", v: sel.payout },
    { k: "Sent by", v: walletAddress() ? shorten(walletAddress()!, 6, 4) : "your wallet" },
    { k: "Recipient", v: `#${sel.id} · ${sel.name}` },
    { k: "Asset", v: "sbtc-token" },
    { k: "Memo", v: memo || "—" },
  ] : [];

  if (!sel) return null;

  return (
    <div data-screen="give" style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 20px 64px", width: "100%", animation: "lf-in .26s ease both" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, letterSpacing: "-.022em" }}>Send a gift</h2>
          <p style={{ margin: 0, fontSize: 14, color: c.muted }}>
            {live ? "Recipients read live from the registry." : "Registry unreachable — showing sample recipients."}
          </p>
        </div>
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[{ key: "A", label: "A · Step by step" }, { key: "B", label: "B · Ledger" }]}
        />
      </div>

      {error && <div style={{ marginBottom: 16, maxWidth: 520 }}><Notice tone="bad">{error}</Notice></div>}

      {direction === "A" ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "100%", maxWidth: 440, background: c.surface, border: `1px solid ${c.border}`,
            borderRadius: 20, overflow: "hidden", boxShadow: "0 26px 60px -34px rgba(22,20,15,.4)",
          }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${c.rule}`, display: "flex", justifyContent: "space-between" }}>
              <Eyebrow>{{ pick: "Who is this for", amount: "How much", confirm: "Check it over", done: "Receipt" }[step]}</Eyebrow>
              <span style={{ fontFamily: mono, fontSize: 11, color: c.faint }}>
                {{ pick: "1 of 3", amount: "2 of 3", confirm: "3 of 3", done: "done" }[step]}
              </span>
            </div>

            {step === "pick" && (
              <div style={{ padding: "16px 18px 20px" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9, background: c.surfaceAlt,
                  border: `1px solid ${c.borderSoft}`, borderRadius: 11, padding: "10px 12px", marginBottom: 14,
                }}>
                  <div style={{ width: 12, height: 12, border: `1.5px solid ${c.dim}`, borderRadius: "50%", flex: "none" }} />
                  <input
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search a name, place, or organizer"
                    aria-label="Search recipients"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "none", fontSize: 13.5, color: c.ink }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {filtered.map((r) => (
                    <button key={r.id} className="lf-outline"
                      onClick={() => { setSelectedId(r.id); setStep("amount"); setTxid(null); }}
                      disabled={!r.active}
                      style={{
                        display: "grid", gridTemplateColumns: "38px 1fr auto", gap: 12, alignItems: "center",
                        background: c.white, border: `1px solid ${c.borderSoft}`, borderRadius: 14, padding: 12,
                      }}>
                      <Avatar text={initialsOf(r.name)} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.01em" }}>{r.name}</div>
                        <div style={{ fontSize: 12.5, color: c.muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.need}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, minWidth: 0 }}>
                          <Dot on={r.active} size={5} />
                          <span style={{ fontFamily: mono, fontSize: 11, color: c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.organizer}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: mono, fontSize: 10.5, color: c.dim }}>#{r.id}</div>
                        <div style={{ fontFamily: mono, fontSize: 12, marginTop: 4 }}>{fromSats(r.receivedSats)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "amount" && (
              <div style={{ padding: "16px 18px 20px" }}>
                <button className="lf-link" onClick={() => setStep("pick")} style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".06em", color: c.faint, marginBottom: 14 }}>
                  ← CHOOSE SOMEONE ELSE
                </button>
                <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 16, borderBottom: `1px solid ${c.rule}`, marginBottom: 18 }}>
                  <Avatar text={initialsOf(sel.name)} size={42} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>{sel.name}</div>
                    <div style={{ fontFamily: mono, fontSize: 11.5, color: c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sel.payout}</div>
                  </div>
                </div>
                <Eyebrow style={{ marginBottom: 10 }}>Amount in sBTC</Eyebrow>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, borderBottom: `2px solid ${c.ink}`, paddingBottom: 10, marginBottom: 12 }}>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0000" inputMode="decimal" aria-label="Amount in sBTC"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "none", fontFamily: mono, fontSize: 34, fontWeight: 500, letterSpacing: "-.02em", color: c.ink }} />
                  <span style={{ fontFamily: mono, fontSize: 15, color: c.faint }}>sBTC</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, color: c.muted, marginBottom: 16 }}>
                  <span>{sats(amount)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {PRESETS.map((p) => (
                    <button key={p} className="lf-outline" onClick={() => setAmount(p)}
                      style={{ flex: 1, minWidth: 84, background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 9, padding: "9px 6px", textAlign: "center", fontFamily: mono, fontSize: 12.5 }}>
                      {p} sBTC
                    </button>
                  ))}
                </div>
                <Eyebrow style={{ marginBottom: 8 }}>Memo — goes on chain</Eyebrow>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="For the roof. From Ada." maxLength={34} aria-label="Memo"
                  style={{ width: "100%", background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 10, padding: "11px 12px", fontSize: 13.5, color: c.ink, marginBottom: 18 }} />
                <button className="lf-dark" onClick={() => setStep("confirm")} disabled={Number(amount) <= 0}
                  style={{ width: "100%", background: c.ink, color: c.surface, borderRadius: 12, padding: 14, textAlign: "center", fontSize: 14.5, fontWeight: 600 }}>
                  Review the transfer
                </button>
              </div>
            )}

            {step === "confirm" && (
              <div style={{ padding: "16px 18px 20px" }}>
                <button className="lf-link" onClick={() => setStep("amount")} style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".06em", color: c.faint, marginBottom: 14 }}>
                  ← EDIT AMOUNT
                </button>
                <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 18, textWrap: "pretty" }}>
                  You are sending <strong>{amountLabel(amount)}</strong> to <strong>{sel.name}</strong>, vouched for by {sel.organizer}.
                </div>
                <div style={{ background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 13, padding: 14, display: "flex", flexDirection: "column", gap: 11, marginBottom: 14 }}>
                  <Row k="Recipient" v={`#${sel.id} · ${sel.name}`} />
                  <Row k="Lands at" v={sel.payout} />
                  <Row k="Vouched by" v={sel.organizer} />
                  <Row k="Amount" v={sats(amount)} />
                  <Row k="Fee to Landfall" v="0 — there is no tip" />
                </div>
                <div style={{ border: `1px dashed ${c.warnBorder}`, background: c.warnBg, borderRadius: 13, padding: "13px 14px", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: c.warn }}>Post-condition</span>
                    <Chip>Next milestone</Chip>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: c.warnText }}>
                    Your wallet will be asked to enforce that exactly {amountLabel(amount)} leaves your
                    account and nothing else — independent of our contract being correct.
                  </div>
                </div>
                <button className="lf-accent" onClick={send} disabled={sending}
                  style={{ width: "100%", background: c.accent, color: "#FFF8F2", borderRadius: 12, padding: 14, textAlign: "center", fontSize: 14.5, fontWeight: 600 }}>
                  {sending ? <Pending label="Waiting on the chain…" /> : connected ? sendLabel : "Connect a wallet to send"}
                </button>
                <div style={{ textAlign: "center", fontSize: 12, color: c.faint, marginTop: 10 }}>
                  Calls <span style={{ fontFamily: mono }}>landfall::give</span> · no custody, no escrow
                </div>
              </div>
            )}

            {step === "done" && (
              <div style={{ padding: "22px 18px 20px", animation: "lf-in .3s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Check />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.02em", color: c.good }}>It landed.</div>
                    <div style={{ fontSize: 12.5, color: c.muted }}>Broadcast — Nakamoto blocks confirm in seconds.</div>
                  </div>
                </div>
                <div style={{ background: c.white, border: `1px solid ${c.borderSoft}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 11 }}>
                  {receiptRows.map((r) => <Row key={r.k} k={r.k} v={r.v} />)}
                  {txid && <Row k="Transaction" v={<a href={explorerTx(txid)} target="_blank" rel="noreferrer">{shorten(txid, 8, 6)}</a>} />}
                </div>
                <div style={{ fontSize: 12.5, color: c.muted, lineHeight: 1.55, marginTop: 14, textWrap: "pretty" }}>
                  Once confirmed, the receipt records the Bitcoin block it settled under. You can
                  check that against Bitcoin yourself — it stays true even if we disappear.
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
                  <button className="lf-dark" onClick={onVerify} style={{ flex: 1, minWidth: 130, background: c.ink, color: c.surface, borderRadius: 11, padding: 12, textAlign: "center", fontSize: 13.5, fontWeight: 600 }}>
                    Open the receipt
                  </button>
                  <button className="lf-quiet" onClick={reset} style={{ flex: 1, minWidth: 130, background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 11, padding: 12, textAlign: "center", fontSize: 13.5, fontWeight: 600 }}>
                    Give again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, alignItems: "start" }}>
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${c.rule}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Eyebrow>Registry</Eyebrow>
              <span style={{ fontFamily: mono, fontSize: 11, color: c.faint }}>
                {list.filter((r) => r.active).length} payable · {list.length} listed
              </span>
            </div>
            {list.map((r) => (
              <button key={r.id} className="lf-row" onClick={() => { setSelectedId(r.id); setTxid(null); }}
                style={{
                  display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", width: "100%",
                  padding: "13px 16px", borderBottom: `1px solid ${c.hairline}`,
                  background: r.id === selectedId ? c.surfaceAlt : undefined,
                }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: c.dim, flex: "none" }}>#{r.id}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: c.muted, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.organizer}</div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  <div style={{ fontFamily: mono, fontSize: 12 }}>{fromSats(r.receivedSats)}</div>
                  <div style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: c.dim, marginTop: 2 }}>
                    {r.active ? "payable" : "suspended"}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ background: c.dark, color: c.darkText, borderRadius: 16, padding: 20, position: "sticky", top: 76 }}>
            <Eyebrow style={{ marginBottom: 14 }}>landfall::give</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11.5, color: c.darkMuted, marginBottom: 5 }}>recipient-id</div>
                <div style={{ background: c.darkField, border: `1px solid ${c.darkBorder}`, borderRadius: 9, padding: "11px 12px", fontFamily: mono, fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>u{sel.id}</span>
                  <span style={{ color: c.darkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sel.name}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: c.darkMuted, marginBottom: 5 }}>amount</div>
                <div style={{ background: c.darkField, border: `1px solid ${c.darkBorder}`, borderRadius: 9, padding: "9px 12px", display: "flex", alignItems: "baseline", gap: 8 }}>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0025" inputMode="decimal" aria-label="Amount"
                    style={{ flex: 1, minWidth: 0, border: "none", background: "none", fontFamily: mono, fontSize: 20, color: c.darkText }} />
                  <span style={{ fontFamily: mono, fontSize: 12, color: c.darkMuted }}>{sats(amount)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: c.darkMuted, marginBottom: 5 }}>memo</div>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="For the roof. From Ada." maxLength={34} aria-label="Memo"
                  style={{ width: "100%", background: c.darkField, border: `1px solid ${c.darkBorder}`, borderRadius: 9, padding: "11px 12px", fontFamily: mono, fontSize: 12.5, color: c.darkText }} />
              </div>
              <div style={{ border: `1px solid ${c.darkBorder}`, borderRadius: 9, padding: "11px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: mono, fontSize: 11.5, color: c.darkMuted, marginBottom: 6 }}>
                  <span>post-conditions</span><span style={{ color: "#D59A5C" }}>pending</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: "#B8B1A6" }}>
                  Wallet-level guarantee that exactly {amountLabel(amount)} leaves your account. Next milestone.
                </div>
              </div>
              <button className="lf-peach" onClick={send} disabled={sending || !sel.active}
                style={{ background: c.peach, color: c.ink, borderRadius: 10, padding: 13, textAlign: "center", fontSize: 14, fontWeight: 600 }}>
                {sending ? <Pending label="Waiting…" /> : !sel.active ? "Recipient suspended" : connected ? sendLabel : "Connect a wallet"}
              </button>
              {done && (
                <div style={{ borderTop: `1px solid ${c.darkBorder}`, paddingTop: 13, animation: "lf-in .3s ease both" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c.goodSoft, marginBottom: 10 }}>It landed.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {receiptRows.map((r) => <Row key={r.k} k={r.k} v={r.v} dark size={11.5} />)}
                    {txid && <Row k="Transaction" dark size={11.5} v={<a href={explorerTx(txid)} target="_blank" rel="noreferrer" style={{ color: c.peach }}>{shorten(txid, 8, 6)}</a>} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
