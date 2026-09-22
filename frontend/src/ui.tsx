import type { CSSProperties, ReactNode } from "react";
import { c, mono, eyebrow } from "./theme";

/** The mark: a sunset dipping below a horizon. Landfall. */
export function Mark({ size = 17 }: { size?: number }) {
  const s = size;
  return (
    <div style={{ position: "relative", width: s, height: s, overflow: "hidden", flex: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: c.accent }} />
      <div style={{ position: "absolute", left: -2, right: -2, bottom: 0, height: s * 0.29, background: c.bg }} />
      <div style={{ position: "absolute", left: -2, right: -2, bottom: s * 0.29, height: 1.5, background: c.ink }} />
    </div>
  );
}

export function Eyebrow({ children, color, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <div style={{ ...eyebrow(color), ...style }}>{children}</div>;
}

/** label / value row, used in every receipt and confirmation panel */
export function Row({
  k, v, dark = false, size = 12.5,
}: { k: string; v: ReactNode; dark?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline" }}>
      <span style={{ fontSize: size, color: dark ? c.darkMuted : c.muted, flex: "none" }}>{k}</span>
      <span style={{ fontFamily: mono, fontSize: size - 0.5, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 3, background: c.hover, borderRadius: 10, padding: 3 }}>
      {options.map((o) => (
        <button
          key={o.key}
          className="lf-seg"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            color: value === o.key ? c.ink : c.muted, position: "relative",
          }}
        >
          {value === o.key && (
            <span style={{
              position: "absolute", inset: 0, background: c.surface,
              borderRadius: 8, boxShadow: "0 1px 2px rgba(22,20,15,.12)",
            }} />
          )}
          <span style={{ position: "relative" }}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Dot({ on, size = 7 }: { on: boolean; size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      background: on ? c.good : c.idle, display: "inline-block", flex: "none",
    }} />
  );
}

export function Chip({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "neutral" }) {
  const warn = tone === "warn";
  return (
    <span style={{
      fontFamily: mono, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase",
      color: warn ? c.warn : c.muted,
      background: warn ? c.warnChip : c.sunken,
      border: `1px solid ${warn ? c.warnChipBorder : c.borderSoft}`,
      borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

export function Notice({ tone, children }: { tone: "warn" | "bad" | "good"; children: ReactNode }) {
  const map = {
    warn: { bg: c.warnBg, border: c.warnBorder, fg: c.warnText },
    bad: { bg: c.badBg, border: c.badBorder, fg: c.bad },
    good: { bg: c.goodBg, border: c.goodBorder, fg: c.good },
  }[tone];
  return (
    <div style={{
      background: map.bg, border: `1px solid ${map.border}`, borderRadius: 12,
      padding: "13px 15px", fontSize: 13.5, color: map.fg, lineHeight: 1.55,
    }}>{children}</div>
  );
}

export function Check() {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", background: c.goodBg,
      border: `1px solid ${c.goodBorder}`, display: "flex", alignItems: "center",
      justifyContent: "center", flex: "none",
    }}>
      <div style={{
        width: 11, height: 6, borderLeft: `2px solid ${c.good}`, borderBottom: `2px solid ${c.good}`,
        transform: "rotate(-45deg) translate(1px,-2px)",
      }} />
    </div>
  );
}

export function Avatar({ text, size = 38 }: { text: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: c.sunken,
      border: `1px solid ${c.borderSoft}`, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: mono, fontSize: size * 0.32, color: c.muted, flex: "none",
    }}>{text}</div>
  );
}

export function Pending({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span className="lf-spin" aria-hidden />
      {label}
    </span>
  );
}
