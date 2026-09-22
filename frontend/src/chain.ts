// Everything that touches the deployed contracts.
//
// The design ships with sample recipients. Where the live registry has real
// data we use it; where it does not, the samples stand in and are labelled as
// such in the UI, so nothing on screen silently pretends to be on-chain.

import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
  noneCV,
  someCV,
  bufferCV,
  principalCV,
  contractPrincipalCV,
  stringUtf8CV,
  boolCV,
  Cl,
} from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { connect, disconnect, isConnected, getLocalStorage, request } from "@stacks/connect";

export const DEPLOYER =
  (import.meta.env.VITE_DEPLOYER_ADDRESS as string) ??
  "ST3WWPTZFGXKGZ18PKX2YZEJJZCPQNBBWQ3K1ND3H";

export const CORE = "landfall";
export const REGISTRY = "recipient-registry";
export const SBTC = "mock-sbtc";
export const NETWORK = STACKS_TESTNET;

const contractId = (name: string) => `${DEPLOYER}.${name}`;
export const SBTC_ID = contractId(SBTC);

async function readOnly(contract: string, fn: string, args: any[] = []) {
  const cv = await fetchCallReadOnlyFunction({
    contractAddress: DEPLOYER,
    contractName: contract,
    functionName: fn,
    functionArgs: args,
    senderAddress: DEPLOYER,
    network: NETWORK,
  });
  return cvToJSON(cv);
}

// ---------------------------------------------------------------- wallet

export function walletAddress(): string | null {
  if (!isConnected()) return null;
  const data = getLocalStorage();
  return data?.addresses?.stx?.[0]?.address ?? null;
}

export async function connectWallet() {
  await connect();
  return walletAddress();
}

export function disconnectWallet() {
  disconnect();
}

// ----------------------------------------------------------------- reads

export type Receipt = {
  id: number;
  donor: string;
  recipientId: number;
  payout: string;
  amountSats: number;
  asset: string | null;
  stacksHeight: string;
  bitcoinHeight: string;
};

export async function getReceipt(id: number): Promise<Receipt | null> {
  const j = await readOnly(CORE, "verify", [uintCV(id)]);
  if (!j.success) return null;
  const v = j.value.value;
  return {
    id,
    donor: v.donor.value,
    recipientId: Number(v["recipient-id"].value),
    payout: v.payout.value,
    amountSats: Number(v.amount.value),
    asset: v.asset.value ? v.asset.value.value : null,
    stacksHeight: Number(v["stacks-height"].value).toLocaleString("en-US"),
    bitcoinHeight: Number(v["bitcoin-height"].value).toLocaleString("en-US"),
  };
}

export async function getReceiptCount(): Promise<number> {
  const j = await readOnly(CORE, "get-receipt-count");
  return Number(j.value);
}

export type ChainRecipient = {
  id: number;
  payout: string;
  organizer: string;
  profile: string;
  active: boolean;
  receivedSats: number;
};

export async function getRecipient(id: number): Promise<ChainRecipient | null> {
  const j = await readOnly(REGISTRY, "get-recipient", [uintCV(id)]);
  if (!j.value) return null;
  const v = j.value.value;
  const received = await readOnly(CORE, "get-recipient-received", [
    uintCV(id),
    someCV(contractPrincipalCV(DEPLOYER, SBTC)),
  ]);
  return {
    id,
    payout: v.payout.value,
    organizer: v.organizer.value,
    profile: v.profile.value,
    active: v.active.value,
    receivedSats: Number(received.value),
  };
}

export async function getRecipientCount(): Promise<number> {
  const j = await readOnly(REGISTRY, "get-recipient-count");
  return Number(j.value);
}

/** Everything registered on chain, newest id last. */
export async function listRecipients(): Promise<ChainRecipient[]> {
  const n = await getRecipientCount();
  const out: ChainRecipient[] = [];
  for (let i = 1; i <= Math.min(n, 30); i++) {
    const r = await getRecipient(i);
    if (r) out.push(r);
  }
  return out;
}

export async function getOrganizer(principal: string) {
  const j = await readOnly(REGISTRY, "get-organizer", [principalCV(principal)]);
  if (!j.value) return null;
  const v = j.value.value;
  return {
    principal,
    name: v.name.value,
    active: v.active.value,
    registered: Number(v["recipients-registered"].value),
  };
}

export async function getSteward(): Promise<string> {
  const j = await readOnly(REGISTRY, "get-steward");
  return j.value;
}

// ---------------------------------------------------------------- writes

/** Give sBTC. Post-conditions are the next milestone; mode is Allow until then. */
export async function give(recipientId: number, sbtcAmount: string, memo: string) {
  const amount = BigInt(Math.round(Number(sbtcAmount) * 1e8));
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  const memoArg = memo.trim()
    ? someCV(bufferCV(new TextEncoder().encode(memo.trim().slice(0, 34))))
    : noneCV();
  return request("stx_callContract", {
    contract: `${DEPLOYER}.${CORE}` as `${string}.${string}`,
    functionName: "give",
    functionArgs: [
      contractPrincipalCV(DEPLOYER, SBTC),
      uintCV(recipientId),
      uintCV(amount),
      memoArg,
    ],
    network: "testnet",
  });
}

export async function registerRecipient(payout: string, profileHashHex: string) {
  return request("stx_callContract", {
    contract: `${DEPLOYER}.${REGISTRY}` as `${string}.${string}`,
    functionName: "register-recipient",
    functionArgs: [principalCV(payout), Cl.bufferFromHex(profileHashHex.replace(/^0x/, ""))],
    network: "testnet",
  });
}

export async function setRecipientActive(id: number, active: boolean) {
  return request("stx_callContract", {
    contract: `${DEPLOYER}.${REGISTRY}` as `${string}.${string}`,
    functionName: "set-recipient-active",
    functionArgs: [uintCV(id), boolCV(active)],
    network: "testnet",
  });
}

export async function addOrganizer(principal: string, name: string) {
  return request("stx_callContract", {
    contract: `${DEPLOYER}.${REGISTRY}` as `${string}.${string}`,
    functionName: "add-organizer",
    functionArgs: [principalCV(principal), stringUtf8CV(name.slice(0, 64))],
    network: "testnet",
  });
}

export async function setOrganizerActive(principal: string, active: boolean) {
  return request("stx_callContract", {
    contract: `${DEPLOYER}.${REGISTRY}` as `${string}.${string}`,
    functionName: "set-organizer-active",
    functionArgs: [principalCV(principal), boolCV(active)],
    network: "testnet",
  });
}

export const explorerTx = (txid: string) =>
  `https://explorer.hiro.so/txid/${txid}?chain=testnet`;

/** SHA-256 of the organizer's off-chain record. Only this reaches the chain. */
export async function profileHash(details: string, payout: string): Promise<string> {
  const src = new TextEncoder().encode(`${details || "seed"}|${payout || ""}`);
  const digest = await crypto.subtle.digest("SHA-256", src);
  return (
    "0x" +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}
