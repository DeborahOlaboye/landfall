// Design tokens lifted from Landfall.dc.html so screens never hardcode a hex.
export const c = {
  bg: "#E9E5DE",
  ink: "#16140F",
  accent: "#A8501F",
  surface: "#FBFAF8",
  surfaceAlt: "#F3EFE8",
  sunken: "#F1ECE4",
  border: "#D6D0C6",
  borderSoft: "#E0DAD0",
  hairline: "#EFEAE2",
  rule: "#E6E0D7",
  muted: "#5C564D",
  faint: "#8D8579",
  dim: "#9A938A",
  hover: "#DFDAD1",
  white: "#FFFFFF",

  // dark panels
  dark: "#16140F",
  darkText: "#F4F1EC",
  darkMuted: "#9C958A",
  darkBorder: "#3A352B",
  darkField: "#221F18",
  darkSoft: "#C8C2B8",
  peach: "#E7A07A",

  // semantic
  good: "#2F6B4A",
  goodSoft: "#8FC9A6",
  goodBg: "#E4EFE7",
  goodBorder: "#C3DCCB",
  warn: "#8A5A12",
  warnBg: "#FBF4E7",
  warnBorder: "#E0C79B",
  warnChip: "#F6ECD9",
  warnChipBorder: "#E7D6B6",
  warnText: "#7A6B4E",
  bad: "#8C3A2C",
  badBg: "#F7E7E4",
  badBorder: "#E0B8B0",
  idle: "#B5AEA2",
} as const;

export const mono = "'IBM Plex Mono',ui-monospace,Menlo,monospace";

/** Uppercase micro-label used throughout the design. */
export const eyebrow = (color: string = c.faint): React.CSSProperties => ({
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color,
});

export const card: React.CSSProperties = {
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: 16,
};

export const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "26px 20px 64px",
  width: "100%",
  animation: "lf-in .26s ease both",
};

export const btnDark: React.CSSProperties = {
  background: c.ink,
  color: c.surface,
  borderRadius: 11,
  padding: 13,
  textAlign: "center",
  fontSize: 14,
  fontWeight: 600,
};

export const btnQuiet: React.CSSProperties = {
  background: c.surfaceAlt,
  border: `1px solid ${c.borderSoft}`,
  borderRadius: 11,
  padding: 13,
  textAlign: "center",
  fontSize: 14,
  fontWeight: 600,
};

export const field: React.CSSProperties = {
  width: "100%",
  background: c.surfaceAlt,
  border: `1px solid ${c.borderSoft}`,
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 13.5,
  color: c.ink,
};

/** 0.0025 -> "250,000 sats" */
export function sats(a: string | number): string {
  const n = Number(a);
  if (!isFinite(n) || n <= 0) return "0 sats";
  return Math.round(n * 1e8).toLocaleString("en-US") + " sats";
}

/** 25000 sats -> "0.00025 sBTC" */
export function fromSats(v: bigint | number): string {
  const n = Number(v) / 1e8;
  return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, ".0") + " sBTC";
}

export function amountLabel(a: string | number): string {
  return (Number(a) || 0).toFixed(8).replace(/0+$/, "").replace(/\.$/, ".0") + " sBTC";
}

export const shorten = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 2 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

export const initialsOf = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 3);
