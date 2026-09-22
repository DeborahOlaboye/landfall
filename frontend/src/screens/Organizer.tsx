import { useEffect, useState } from "react";
import { c, mono, fromSats, shorten } from "../theme";
import { Chip, Dot, Eyebrow, Notice, Pending } from "../ui";
import { useRecipients } from "../data";
import { profileHash, registerRecipient, setRecipientActive, explorerTx } from "../chain";

export default function Organizer({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  const { list, live } = useRecipients();
  const [payout, setPayout] = useState("");
  const [details, setDetails] = useState("");
  const [hash, setHash] = useState("0x…");
  const [busy, setBusy] = useState(false);
  const [txid, setTxid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    profileHash(details, payout).then(setHash).catch(() => setHash("0x…"));
  }, [details, payout]);

  const roster = list.filter((r) => r.organizer === "ikejabaptist.btc" || !live);

  async function register() {
    setErr(null);
    if (!connected) { onConnect(); return; }
    if (!/^S[TPM][0-9A-Z]{20,}$/.test(payout.trim())) {
      setErr("That does not look like a Stacks principal. It should start with ST or SP.");
      return;
    }
    setBusy(true);
    try {
      const res: any = await registerRecipient(payout.trim(), hash);
      setTxid(res?.txid ?? res?.txId ?? null);
      setPayout(""); setDetails("");
    } catch (e: any) {
      setErr(e?.message ?? "The wallet rejected or could not send this registration.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: number, active: boolean) {
    setErr(null);
    if (!connected) { onConnect(); return; }
    try {
      await setRecipientActive(id, !active);
    } catch (e: any) {
      setErr(e?.message ?? "Could not change that recipient.");
    }
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 20px 64px", width: "100%", animation: "lf-in .26s ease both" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600, letterSpacing: "-.022em" }}>
            Ikeja Baptist — roster
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: c.muted }}>
            Your name is attached to every person here, permanently and publicly.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 11, padding: "9px 13px", flexWrap: "wrap" }}>
          <Dot on />
          <span style={{ fontFamily: mono, fontSize: 12 }}>ikejabaptist.btc</span>
          <Chip>BNS soon</Chip>
        </div>
      </div>

      {err && <div style={{ marginBottom: 16, maxWidth: 560 }}><Notice tone="bad">{err}</Notice></div>}
      {txid && (
        <div style={{ marginBottom: 16, maxWidth: 560 }}>
          <Notice tone="good">
            Registration broadcast.{" "}
            <a href={explorerTx(txid)} target="_blank" rel="noreferrer">{shorten(txid, 8, 6)}</a>
          </Notice>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, alignItems: "start" }}>
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 16px",
            borderBottom: `1px solid ${c.rule}`, fontFamily: mono, fontSize: 10.5,
            letterSpacing: ".1em", textTransform: "uppercase", color: c.faint,
          }}>
            <span>Recipient</span><span>Received / state</span>
          </div>
          {roster.map((r) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "13px 16px", borderBottom: `1px solid ${c.hairline}`, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: c.dim }}>#{r.id}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>{r.name}</span>
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: c.faint, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  profile {r.profile.startsWith("0x") ? shorten(r.profile, 6, 4) : `0x${shorten(r.profile, 4, 4)}`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: mono, fontSize: 12.5 }}>{fromSats(r.receivedSats)}</div>
                <button className="lf-link" onClick={() => toggle(r.id, r.active)}
                  style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: c.accent, marginTop: 4 }}>
                  {r.active ? "Pause" : "Make payable"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 18 }}>
          <Eyebrow style={{ marginBottom: 14 }}>register-recipient</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 6 }}>Payout principal</div>
              <input value={payout} onChange={(e) => setPayout(e.target.value)} placeholder="ST2CY5V…RK9AG" aria-label="Payout principal"
                style={{ width: "100%", background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 10, padding: "11px 12px", fontFamily: mono, fontSize: 12.5, color: c.ink }} />
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: c.muted, marginBottom: 6 }}>Their details — stays on your machine</div>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                placeholder="Name, ID document reference, how you know them" aria-label="Recipient details"
                style={{ width: "100%", background: c.surfaceAlt, border: `1px solid ${c.borderSoft}`, borderRadius: 10, padding: "11px 12px", fontSize: 13, color: c.ink, resize: "vertical" }} />
            </div>
            <div style={{ background: c.sunken, border: `1px solid ${c.borderSoft}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11.5, color: c.muted, marginBottom: 6 }}>
                What actually goes on chain — a 32-byte SHA-256 hash
              </div>
              <div style={{ fontFamily: mono, fontSize: 11.5, wordBreak: "break-all", color: c.ink }}>{hash}</div>
            </div>
            <button className="lf-dark" onClick={register} disabled={busy}
              style={{ background: c.ink, color: c.surface, borderRadius: 11, padding: 13, textAlign: "center", fontSize: 14, fontWeight: 600 }}>
              {busy ? <Pending label="Registering…" /> : connected ? "Register recipient" : "Connect a wallet"}
            </button>
            <div style={{ fontSize: 12, color: c.faint, lineHeight: 1.5 }}>
              If your record is ever questioned you can prove it was not altered, without
              publishing anyone's identity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
