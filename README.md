# Landfall

**Direct giving on Stacks. The donor pays a named recipient, and the settlement
is the receipt.**

Built with Clarity and sBTC. Live on Stacks testnet at
`ST3WWPTZFGXKGZ18PKX2YZEJJZCPQNBBWQ3K1ND3H`. Anyone can call `verify(u1)` on
`.landfall` and read a real receipt, no wallet needed.

## The problem

People do not trust charities with their money, and they are not wrong to
hesitate. In the 2026 Donor Trust Report, **67.7% of donors say trusting a
charity is essential before they give and only 18.3% report high trust.**
That gap is the widest documented in any market we looked at.

It is not an abstract worry. In October 2025 GoFundMe was reported to have
created donation pages for **1.4 million US charities without their
permission**, with a default "tip" of around 16.5% routed to GoFundMe. The
sector's own assessment is that there is *"no real-time and transparent process
for tracking where each donation dollar goes."*

Transparency is not just something donors say they want. One study found
transparent nonprofits received **53% more contributions**, and 63% of donors
want to know how their money was used before giving again.

## What Landfall does differently

**It removes the institution from the money path instead of auditing it.**

A donor pays an identified recipient directly. No charity holds the funds, so
there is nothing to audit, the transfer either happened or it did not, and the
chain says which. "Verification" stops being a report someone writes and becomes
a property of the payment.

### The hard part is not the money

Moving value is easy. Establishing that a recipient is real, eligible and not
duplicated is not. Landfall does not invent a verification scheme. It uses the way identification
already works in practice: an **organizer** who genuinely knows the person
vouches for them. A congregation, a hometown association, a school, a clinic.

- The organizer's identity is attached to every recipient they register,
  permanently and publicly.
- Suspending an organizer suspends their entire roster in one call, the
  registry cascades, so a bad actor cannot be unwound one record at a time.
- Personal details never touch the chain. `profile` is a 32-byte hash of the
  record the organizer holds off-chain, so they can later prove it was not
  altered without publishing anyone's identity.

The organizer's reputation is the collateral. That is a deliberate trade: it
makes the trust assumption explicit and bounded rather than diffuse.


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

Nothing is escrowed. The contract validates, transfers, and records, it never
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

## The app

```
contracts/    Clarinet project, the Clarity contracts and their tests
frontend/     Vite and React, five screens
```

Five screens: an overview, the donor give flow in two directions, the organizer
roster with off-chain record hashing, the steward console with the suspension
cascade, and receipt verification in two layouts.

Verification reads live from the deployed contract. Receipt #1 is a real 25,000
sat gift, not a mock. Recipients come from the registry where it has data and
fall back to labelled samples where it does not. Names and circumstances stay
off chain by design, only their hash is published.

```sh
cd contracts && npm install && clarinet check && npm test
cd frontend  && npm install && npm run dev
```

## Status

**Working:** four contracts deployed and exercised end to end on testnet. An
organizer admitted, a recipient registered, an sBTC gift settled into receipt
number 1. Both disbursement paths, the registry with its suspension cascade,
receipts with dual-chain heights, per-asset totals, and `verify()`. 0 errors,
22 passing tests, and a frontend reading the live contract.

**Not yet:** BNS identity for organizers, post-condition enforcement in the
wallet, and conditional release against a named obligation. Mainnet stays gated
behind a multisig steward and an audit, and the test-only `mock-sbtc` is never
deployed past a test chain.

