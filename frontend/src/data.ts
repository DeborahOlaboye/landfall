import { useEffect, useState } from "react";
import { listRecipients, type ChainRecipient } from "./chain";

// Names and circumstances are exactly what the contract keeps OFF chain - only
// a 32-byte hash of this record is published. In production each organizer
// holds their own copy; here it stands in for that store.
export const DIRECTORY: Record<number, { name: string; need: string; organizer: string }> = {
  1: { name: "Adaeze Okonkwo", need: "Roof repair after the storm, Ikeja", organizer: "ikejabaptist.btc" },
  2: { name: "Samuel Oyelaran", need: "Two terms of school fees", organizer: "ikejabaptist.btc" },
  3: { name: "Grace Mwangi", need: "Clinic transport, three months", organizer: "kibera-clinic.btc" },
  4: { name: "Josephine Attah", need: "Restocking the market stall", organizer: "nsukka-union.btc" },
};

export type Recipient = {
  id: number;
  name: string;
  need: string;
  organizer: string;
  payout: string;
  profile: string;
  active: boolean;
  receivedSats: number;
  onChain: boolean;
};

/** Used only when the registry is empty or unreachable, and labelled as such. */
export const SAMPLES: Recipient[] = [
  { id: 1, ...DIRECTORY[1], payout: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR", profile: "0x9f2c…41ab", active: true, receivedSats: 1840000, onChain: false },
  { id: 2, ...DIRECTORY[2], payout: "SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335", profile: "0x1d70…c93e", active: true, receivedSats: 610000, onChain: false },
  { id: 3, ...DIRECTORY[3], payout: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R", profile: "0xb45a…7701", active: true, receivedSats: 3320000, onChain: false },
  { id: 4, ...DIRECTORY[4], payout: "SPQZ4K2W8HMTRK93XQ9B2Y4E1HTZC8N6RDVJ0FM2", profile: "0x30fe…aa19", active: false, receivedSats: 70000, onChain: false },
];

function merge(r: ChainRecipient): Recipient {
  const d = DIRECTORY[r.id];
  return {
    id: r.id,
    name: d?.name ?? `Recipient #${r.id}`,
    need: d?.need ?? "Details held by the organizer, off chain",
    organizer: d?.organizer ?? r.organizer,
    payout: r.payout,
    profile: r.profile,
    active: r.active,
    receivedSats: r.receivedSats,
    onChain: true,
  };
}

export function useRecipients() {
  const [list, setList] = useState<Recipient[]>(SAMPLES);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listRecipients()
      .then((chain) => {
        if (cancelled) return;
        if (chain.length) {
          setList(chain.map(merge));
          setLive(true);
        }
      })
      .catch(() => {
        /* registry unreachable - the samples already stand in */
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { list, live, loading };
}

export const FLOW_STEPS = [
  { n: "1", title: "A steward admits an organizer", body: "A congregation, a hometown association, a clinic — someone with a reputation to lose." },
  { n: "2", title: "The organizer vouches for a person", body: "Their identity is attached to that recipient permanently. Only a 32-byte hash of the record goes on chain." },
  { n: "3", title: "You pay the recipient directly", body: "sBTC moves from your wallet to theirs. No account in between, no conversion, no tip." },
  { n: "4", title: "The receipt is the settlement", body: "Who, how much, which Stacks block, which Bitcoin block. Verifiable by anyone, forever." },
];

export const STATS = [
  { figure: "67.7%", body: "of donors say trusting a charity is essential before they give — while only 18.3% report high trust." },
  { figure: "1.4M", body: "US charities had donation pages created without permission in Oct 2025, with a ~16.5% default tip routed elsewhere." },
  { figure: "53%", body: "more contributions went to transparent nonprofits in one study. Transparency is not a nice-to-have." },
];

export const CAPABILITIES = [
  { name: "Clarity", coming: "", body: "Decidable and non-Turing-complete, so the disbursement path is statically checked, not only tested." },
  { name: "sBTC", coming: "", body: "The asset donors hold and recipients want. The gift never becomes a local currency in between." },
  { name: "Proof of Transfer", coming: "", body: "Every receipt records the Bitcoin block it settled under. You verify against Bitcoin, not against us." },
  { name: "Nakamoto", coming: "", body: "Fast blocks. A gift confirms in seconds — a giving app lives or dies on that feeling of 'it went through'." },
  { name: "BNS", coming: "Next milestone", body: "Organizers named ikejabaptist.btc, not raw principals. Public accountability needs human-readable identity." },
  { name: "Post-conditions", coming: "Pending", body: "The wallet enforces 'exactly this amount leaves, nothing else' — independent of our contract being correct." },
];

export const ORGANIZERS = [
  { handle: "ikejabaptist.btc", line: "Lagos. Admitted Mar 2026 by the steward.", count: 2 },
  { handle: "kibera-clinic.btc", line: "Nairobi. Admitted Apr 2026. Vouches only for patients it treats.", count: 1 },
  { handle: "nsukka-union.btc", line: "Hometown association. Suspended after a duplicate registration.", count: 1 },
];
