import { useEffect, useState } from "react";
import { c, mono, shorten } from "./theme";
import { Mark } from "./ui";
import Landing from "./screens/Landing";
import Give from "./screens/Give";
import Organizer from "./screens/Organizer";
import Steward from "./screens/Steward";
import Verify from "./screens/Verify";
import { connectWallet, disconnectWallet, walletAddress, DEPLOYER } from "./chain";

type Screen = "landing" | "give" | "organizer" | "steward" | "verify";

const NAV: { key: Screen; label: string }[] = [
  { key: "landing", label: "Overview" },
  { key: "give", label: "Give" },
  { key: "organizer", label: "Organizer" },
  { key: "steward", label: "Steward" },
  { key: "verify", label: "Verify" },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [direction, setDirection] = useState<"A" | "B">("A");
  const [layout, setLayout] = useState<"A" | "B">("A");
  const [addr, setAddr] = useState<string | null>(null);

  useEffect(() => { setAddr(walletAddress()); }, []);

  async function toggleWallet() {
    if (addr) { disconnectWallet(); setAddr(null); return; }
    try { setAddr(await connectWallet()); } catch { /* user dismissed */ }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 20, background: "rgba(233,229,222,.93)",
        backdropFilter: "blur(10px)", borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
        }}>
          <button onClick={() => setScreen("landing")}
            style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
            <Mark />
            <span style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>Landfall</span>
          </button>

          <nav style={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
            {NAV.map((n) => (
              <button key={n.key} className="lf-nav" onClick={() => setScreen(n.key)}
                aria-current={screen === n.key ? "page" : undefined}
                style={{
                  position: "relative", padding: "7px 11px 8px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: screen === n.key ? c.ink : c.muted,
                }}>
                <span>{n.label}</span>
                {screen === n.key && (
                  <span style={{ position: "absolute", left: 11, right: 11, bottom: 1, height: 2, background: c.accent, borderRadius: 2 }} />
                )}
              </button>
            ))}
          </nav>

          <button className="lf-outline" onClick={toggleWallet}
            style={{
              flex: "none", display: "flex", alignItems: "center", gap: 8, background: c.surface,
              border: `1px solid ${c.border}`, borderRadius: 999, padding: "6px 13px 6px 10px",
            }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: addr ? c.good : c.idle, display: "inline-block" }} />
            <span style={{ fontFamily: mono, fontSize: 11.5, color: c.ink }}>
              {addr ? shorten(addr, 6, 4) : "Connect wallet"}
            </span>
          </button>
        </div>
      </header>

      {screen === "landing" && <Landing onGive={() => setScreen("give")} onVerify={() => setScreen("verify")} />}
      {screen === "give" && (
        <Give direction={direction} setDirection={setDirection} onVerify={() => setScreen("verify")}
          connected={!!addr} onConnect={toggleWallet} />
      )}
      {screen === "organizer" && <Organizer connected={!!addr} onConnect={toggleWallet} />}
      {screen === "steward" && <Steward connected={!!addr} onConnect={toggleWallet} />}
      {screen === "verify" && <Verify layout={layout} setLayout={setLayout} />}

      <footer style={{ marginTop: "auto", borderTop: `1px solid ${c.border}` }}>
        <div style={{
          maxWidth: 1180, margin: "0 auto", padding: "18px 20px", display: "flex",
          justifyContent: "space-between", gap: 14, flexWrap: "wrap",
          fontFamily: mono, fontSize: 11.5, color: c.faint,
        }}>
          <span>landfall · recipient-registry · testnet</span>
          <a href={`https://explorer.hiro.so/address/${DEPLOYER}?chain=testnet`} target="_blank" rel="noreferrer" style={{ color: c.faint }}>
            4 contracts · 0 errors · 22 passing tests
          </a>
        </div>
      </footer>
    </div>
  );
}
