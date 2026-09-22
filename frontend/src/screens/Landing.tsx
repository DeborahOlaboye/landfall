import { c, mono } from "../theme";
import { Chip, Eyebrow } from "../ui";
import { CAPABILITIES, FLOW_STEPS, STATS } from "../data";

export default function Landing({ onGive, onVerify }: { onGive: () => void; onVerify: () => void }) {
  return (
    <div style={{ animation: "lf-in .3s ease both" }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "64px 20px 48px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
        gap: 48, alignItems: "center",
      }}>
        <div>
          <Eyebrow color={c.accent} style={{ fontSize: 11.5, letterSpacing: ".14em", marginBottom: 18 }}>
            Direct giving on Stacks
          </Eyebrow>
          <h1 style={{
            margin: "0 0 20px", fontSize: "clamp(34px,5vw,56px)", lineHeight: 1.04,
            letterSpacing: "-.032em", fontWeight: 600, textWrap: "balance",
          }}>
            The money goes to a person. The settlement{" "}
            <em style={{ fontStyle: "normal", color: c.accent }}>is</em> the receipt.
          </h1>
          <p style={{
            margin: "0 0 28px", fontSize: 17, lineHeight: 1.55, color: c.muted,
            maxWidth: "46ch", textWrap: "pretty",
          }}>
            No charity holds your gift, so there is nothing to audit. Someone who actually
            knows the recipient vouches for them, you pay that person directly in sBTC, and
            Bitcoin remembers it happened.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="lf-dark" onClick={onGive} style={{
              background: c.ink, color: c.surface, borderRadius: 10,
              padding: "13px 22px", fontSize: 14.5, fontWeight: 600,
            }}>Send a gift</button>
            <button className="lf-quiet" onClick={onVerify} style={{
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "13px 22px", fontSize: 14.5, fontWeight: 600,
            }}>Check a receipt</button>
          </div>
        </div>

        <div style={{
          background: c.surface, border: `1px solid ${c.border}`,
          borderRadius: 18, padding: "22px 20px",
        }}>
          <Eyebrow style={{ marginBottom: 16 }}>How a gift moves</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FLOW_STEPS.map((s) => (
              <div key={s.n} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12, alignItems: "start" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", background: c.sunken,
                  border: `1px solid ${c.borderSoft}`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: mono, fontSize: 11.5, color: c.muted,
                }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.5, marginTop: 2, textWrap: "pretty" }}>
                    {s.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.rule}`,
            fontSize: 12.5, color: c.faint, lineHeight: 1.5,
          }}>
            Nothing is escrowed. The contract validates, transfers, records — it never takes custody.
          </div>
        </div>
      </div>

      <div style={{ background: c.dark, color: c.darkText }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", padding: "52px 20px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 34,
        }}>
          {STATS.map((st) => (
            <div key={st.figure}>
              <div style={{
                fontSize: "clamp(30px,4vw,42px)", fontWeight: 600,
                letterSpacing: "-.03em", color: c.peach,
              }}>{st.figure}</div>
              <div style={{
                fontSize: 14, lineHeight: 1.55, color: c.darkSoft,
                marginTop: 8, maxWidth: "34ch", textWrap: "pretty",
              }}>{st.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 20px 72px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 600, letterSpacing: "-.022em" }}>
          Why it is built on Stacks
        </h2>
        <p style={{ margin: "0 0 26px", fontSize: 15, color: c.muted }}>
          Each piece is load-bearing, not decorative.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(272px,1fr))", gap: 12 }}>
          {CAPABILITIES.map((cap) => (
            <div key={cap.name} style={{
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 18,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: c.ink }}>{cap.name}</span>
                {cap.coming && <Chip>{cap.coming}</Chip>}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: c.muted, textWrap: "pretty" }}>
                {cap.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
