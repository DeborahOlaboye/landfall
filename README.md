# Landfall

**Direct giving on Stacks. The donor pays a named recipient, and the settlement
is the receipt.**

Built with Clarity, sBTC and BNS. Contracts and tests are working; nothing is
deployed yet.

---

## The problem

People do not trust charities with their money, and they are not wrong to
hesitate. In the 2026 Donor Trust Report, **67.7% of donors say trusting a
charity is essential before they give — and only 18.3% report high trust.**
That gap is the widest documented in any market we looked at.

It is not an abstract worry. In October 2025 GoFundMe was reported to have
created donation pages for **1.4 million US charities without their
permission**, with a default "tip" of around 16.5% routed to GoFundMe. The
sector's own assessment is that there is *"no real-time and transparent process
for tracking where each donation dollar goes."*

Transparency is not just something donors say they want. One study found
transparent nonprofits received **53% more contributions**, and 63% of donors
want to know how their money was used before giving again.

## Why nobody has fixed it

Search for "blockchain donation tracking" and you find a decade of IEEE papers,
conference proceedings and reference architectures — and almost no products with
users. That ratio is the diagnosis: when an idea generates far more papers than
companies, the blocker is not technical.

The blocker is that the usual design **sells accountability software to the
party being held accountable.** Finterra, the first company globally to put
Islamic social finance on a blockchain, ran into religious councils who "had
very little knowledge of blockchain and smart contracts... and were reluctant to
adopt." Charities that spend well do not need the tool; charities that do not,
will not install it.

## What Landfall does differently

**It removes the institution from the money path instead of auditing it.**

A donor pays an identified recipient directly. No charity holds the funds, so
there is nothing to audit — the transfer either happened or it did not, and the
chain says which. "Verification" stops being a report someone writes and becomes
a property of the payment.

This is the model behind GiveDirectly, whose unconditional cash transfers are
among the most rigorously evidenced interventions in development — currently
reaching roughly 120,000 households in Malawi. What does not exist is a version
where an individual donor picks a person and watches the money arrive.

### The hard part is not the money

Moving value is easy. Establishing that a recipient is real, eligible and not
duplicated is not — GiveDirectly spends serious money on exactly this and still
publishes an annual fraud and safeguarding report.

Landfall does not invent a verification scheme. It uses the way identification
already works in practice: an **organizer** who genuinely knows the person
vouches for them. A congregation, a hometown association, a school, a clinic.

- The organizer's identity is attached to every recipient they register,
  permanently and publicly.
- Suspending an organizer suspends their entire roster in one call — the
  registry cascades, so a bad actor cannot be unwound one record at a time.
- Personal details never touch the chain. `profile` is a 32-byte hash of the
  record the organizer holds off-chain, so they can later prove it was not
  altered without publishing anyone's identity.

The organizer's reputation is the collateral. That is a deliberate trade: it
makes the trust assumption explicit and bounded rather than diffuse.

---

## Why Stacks

This could not be built the same way anywhere else, and each piece is load-bearing
rather than decorative.

| Stacks capability | What it does here |
|---|---|
| **Clarity** | Decidable and non-Turing-complete, so the disbursement path can be *statically checked* rather than only tested. The guards are deliberately inlined so Clarinet's analyzer can verify every argument is validated before use — see the note in `landfall.clar`. |
| **sBTC** | The asset donors hold and recipients want. The gift never has to become a local currency in between, and never sits in an intermediary account awaiting conversion. |
| **BNS** | Organizers and institutions are meant to be *named* (`ikejabaptist.btc`), not raw principals. A trust model built on public accountability needs human-readable identity. **Not yet implemented — next milestone.** |
| **Post-conditions** | A donor's wallet can enforce "exactly this amount leaves my account and nothing else" at the protocol level, independent of our contract being correct. **Frontend enforcement pending.** |
| **Proof of Transfer** | Every receipt records the Bitcoin block it settled under, so a donor verifies against Bitcoin rather than against us — and the claim survives this contract and this company disappearing. |
| **Nakamoto** | Fast blocks mean a gift confirms in seconds, not on a ten-minute cadence. A giving app lives or dies on that feeling of "it went through." |

Mainnet sBTC: `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`

---

## Architecture

```
contracts/          Clarinet project
  contracts/
    recipient-registry.clar   organizers, recipients, who vouched for whom
    landfall.clar             disbursements and receipts
    sip-010-trait.clar        FT trait, so sBTC is passed in not hardcoded
    mock-sbtc.clar            test-only stand-in, never deployed off a test chain
  tests/                      22 tests
frontend/           Vite + React receipt checker
```

### Flow

```
steward ──admits──▶ organizer ──vouches for──▶ recipient
                                                   │
donor ──give(sBTC, recipient-id, amount)──────────▶│
                                                   ▼
                                            funds land directly
                                                   │
                                                   ▼
                                    receipt: who, how much, which
                                    Stacks block, which Bitcoin block
```

Nothing is escrowed. The contract validates, transfers, and records — it never
holds custody, which is what makes "there is nothing to audit" true rather than
a slogan.

### Entry points

| Function | Who calls it |
|---|---|
| `landfall::give (token, recipient-id, amount, memo)` | Donor. Primary path, sBTC. |
| `landfall::give-stx (recipient-id, amount, memo)` | Donor without sBTC yet. |
| `landfall::verify (receipt-id)` | Anyone. What landed, where, which Bitcoin block. |
| `recipient-registry::register-recipient (payout, profile)` | Organizer only. |
| `recipient-registry::set-organizer-active (who, active)` | Steward only. Cascades. |

Errors are namespaced: `u1xx` registry, `u2xx` disbursement.

---

## Status

**Working:** both disbursement paths, the registry with its suspension cascade,
receipts with dual-chain heights, per-asset totals, and `verify()`. 4 contracts,
0 errors, 22 passing tests.

**Not yet:**

1. **BNS identity for organizers** — the largest gap. The trust story needs
   names, not principals.
2. **Post-condition enforcement in the frontend** — currently the contract is
   trusted more than it should be.
3. **Conditional release** — paying a named institution against a named
   obligation (school fees is the cleanest case), where the institution confirms
   before funds move. This is where a contract beats a bank transfer, and the
   feature most worth charging for.
4. **Testnet deployment** and a donor-facing flow beyond receipt lookup.

**Open questions we are not pretending to have answered:**

- **Regulatory.** Charitable-solicitation registration is now explicit in
  California (since June 2024) and Hawaii (January 2026), both requiring
  platform registration and written charity consent. Routing to individuals
  instead may raise money-transmission questions. This needs a lawyer before a
  second dollar moves, not after.
- **Recipient identification at scale.** The organizer model works while
  organizers are known. It needs bonding or slashing before it works with
  organizers who are not.
- **Whether donors pay for verification.** The 53% figure is one study. It gets
  tested with real donors before it gets built on.

---

## Running it

```sh
cd contracts
npm install
clarinet check      # 4 contracts, 0 errors
npm test            # 22 tests
clarinet console    # interactive
```

```sh
cd frontend
npm install
cp .env.example .env    # set VITE_DEPLOYER_ADDRESS after deploying
npm run dev
```

### About the remaining warnings

`clarinet check` reports 6 warnings, and they are left in place on purpose:

- **4 in `mock-sbtc`** — test-only contract, never deployed.
- **2 in `recipient-registry`** — the analyzer cannot see that
  `(unwrap! (map-get? organizers tx-sender))` *is* the authorization check.

They are not suppressed, because a suppressed warning stops carrying
information. `landfall.clar` itself is warning-free, and that is only true
because the guards are duplicated inline rather than hoisted into a shared
helper — hoisting them hid the checks from the analyzer and took warnings from
2 to 17. Three duplicated asserts are cheaper than losing static verification on
the money path.
