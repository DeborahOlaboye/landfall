// Where the contracts live. Fill in the deployer address once Landfall is on
// testnet; until then this points at nothing and the UI says so.
export const NETWORK = "testnet" as const;

export const DEPLOYER = import.meta.env.VITE_DEPLOYER_ADDRESS ?? "";

export const CONTRACTS = {
  core: "landfall",
  registry: "recipient-registry",
} as const;

// Mainnet sBTC. The contract takes the token as a trait, so this is the only
// place the address is named.
export const SBTC_MAINNET =
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

export const SBTC_DECIMALS = 8;

/** Sats to a human sBTC string, without floating point drift. */
export function formatSbtc(sats: bigint | number): string {
  const n = BigInt(sats);
  const whole = n / 100_000_000n;
  const frac = (n % 100_000_000n).toString().padStart(SBTC_DECIMALS, "0");
  return `${whole}.${frac}`;
}
