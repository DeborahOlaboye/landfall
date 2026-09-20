import { useState } from "react";
import { fetchCallReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import { CONTRACTS, DEPLOYER, formatSbtc } from "./config";

type Landed = {
  amount: string;
  payout: string;
  donor: string;
  recipientId: string;
  bitcoinHeight: string;
  asset: string | null;
};

export default function App() {
  const [receiptId, setReceiptId] = useState("");
  const [result, setResult] = useState<Landed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = DEPLOYER !== "";

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const id = Number(receiptId);
    if (!Number.isInteger(id) || id < 1) {
      setError("Receipt numbers start at 1.");
      return;
    }

    setLoading(true);
    try {
      const cv = await fetchCallReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: CONTRACTS.core,
        functionName: "verify",
        functionArgs: [uintCV(id)],
        senderAddress: DEPLOYER,
        network: STACKS_TESTNET,
      });
      const json = cvToJSON(cv);
      if (!json.success) {
        setError(`No receipt number ${id}.`);
        return;
      }
      const v = json.value.value;
      setResult({
        amount: v.amount.value,
        payout: v.payout.value,
        donor: v.donor.value,
        recipientId: v["recipient-id"].value,
        bitcoinHeight: v["bitcoin-height"].value,
        asset: v.asset.value ? v.asset.value.value : null,
      });
    } catch {
      setError("Couldn't reach the network. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header>
        <h1>Landfall</h1>
        <p className="tagline">
          Every gift goes straight to the person it was meant for. Check any
          receipt below.
        </p>
      </header>

      {!configured && (
        <p className="notice">
          No contract address set yet. Add <code>VITE_DEPLOYER_ADDRESS</code> to
          a <code>.env</code> file once the contracts are deployed to testnet.
        </p>
      )}

      <form onSubmit={check}>
        <label htmlFor="receipt">Receipt number</label>
        <div className="row">
          <input
            id="receipt"
            inputMode="numeric"
            value={receiptId}
            onChange={(e) => setReceiptId(e.target.value)}
            placeholder="1"
            disabled={!configured}
          />
          <button type="submit" disabled={!configured || loading}>
            {loading ? "Checking" : "Check"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="receipt">
          <p className="landed">It landed.</p>
          <dl>
            <div>
              <dt>Amount</dt>
              <dd>
                {result.asset
                  ? `${formatSbtc(BigInt(result.amount))} sBTC`
                  : `${result.amount} uSTX`}
              </dd>
            </div>
            <div>
              <dt>Reached</dt>
              <dd className="mono">{result.payout}</dd>
            </div>
            <div>
              <dt>Sent by</dt>
              <dd className="mono">{result.donor}</dd>
            </div>
            <div>
              <dt>Recipient</dt>
              <dd>#{result.recipientId}</dd>
            </div>
            <div>
              <dt>Bitcoin block</dt>
              <dd className="mono">{result.bitcoinHeight}</dd>
            </div>
          </dl>
          <p className="footnote">
            Settled under Bitcoin block {result.bitcoinHeight}. You can confirm
            this yourself against Bitcoin - you don't have to take our word for
            it, and it stays true if we disappear.
          </p>
        </section>
      )}
    </main>
  );
}
