# Landfall

Direct giving in sBTC, with proof of arrival anchored to Bitcoin.

## The idea

Most giving platforms ask you to trust that money was spent well. Landfall
removes the thing you'd have to trust: there is no intermediary holding the
money. A donor pays a named recipient directly, and the settlement itself is
the receipt.

This matters because the obvious version of "transparent charity" has been
proposed for a decade and almost never ships. The blocker is never the
technology - it's that you end up selling accountability software to the party
being held accountable. Landfall sidesteps it by removing the institution from
the money path entirely. Nothing to audit, because nobody else held the funds.

The asset is sBTC. Bitcoin is what donors already hold and what recipients want
to end up with, so the gift never has to become someone's local currency in
between, and never sits in an intermediary's account waiting to be converted.
Mainnet sBTC is `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`.

Every receipt names the Bitcoin block the disbursement settled under, via Proof
of Transfer. That's what a donor checks - against Bitcoin, not against us, and
it stays true if this contract and the company behind it both disappear.

## The hard problem, and how this handles it

Moving money is easy. Establishing that a recipient is real, eligible and not
duplicated is not - GiveDirectly spends serious money on exactly this and still
publishes an annual fraud report.

Landfall does not invent a verification scheme. It uses the way identification
already works in practice: an **organizer** who genuinely knows the person
vouches for them. A congregation, a hometown association, a school, a clinic.
The organizer's name is attached to every recipient they register, permanently
and publicly, and suspending an organizer suspends their whole roster at once.

Personal details never touch the chain. `profile` is a hash of the record the
organizer holds off-chain, so they can prove later that it hasn't been altered
without publishing anyone's identity.

## Layout

```
contracts/    Clarinet project - Clarity contracts and their tests
frontend/     Vite + React app for checking a receipt
```

### Contracts

| Contract | Role |
|---|---|
| `recipient-registry` | Organizers, recipients, and who vouched for whom |
| `landfall` | Disbursements and receipts |
| `sip-010-trait` | Fungible-token trait, so sBTC is passed in rather than hardcoded |
| `mock-sbtc` | Test-only stand-in for sBTC. Never deployed off a test chain |

Key entry points:

- `landfall::give (token, recipient-id, amount, memo)` - the primary path, sBTC
- `landfall::give-stx (recipient-id, amount, memo)` - fallback for donors without sBTC
- `landfall::verify (receipt-id)` - what landed, where, and under which Bitcoin block
- `recipient-registry::register-recipient (payout, profile)` - organizers only

## Running it

```sh
cd contracts
npm install
clarinet check      # 4 contracts, 0 errors
npm test            # 22 tests
clarinet console    # poke at it interactively
```

```sh
cd frontend
npm install
cp .env.example .env    # set VITE_DEPLOYER_ADDRESS once deployed
npm run dev
```

Six `check_checker` warnings remain: four in `mock-sbtc` (test-only) and two in
`register-recipient`, where the analyzer can't see that
`(unwrap! (map-get? organizers tx-sender))` is the authorization check. Left in
place deliberately rather than suppressed, so the remaining warnings still mean
something.

## Status

Contracts, tests and a frontend skeleton. Nothing deployed to testnet yet.

Deliberately still open:

- **Conditional release.** Paying a named institution against a named
  obligation - school fees being the cleanest case - where the institution
  confirms before funds move. This is where a contract beats a bank transfer
  and it's the feature most worth charging for.
- **Regulatory position.** Charitable-solicitation registration and money
  transmission are unresolved and jurisdiction-specific. Needs a lawyer before
  taking a second dollar, not after.
- **Organizer accountability.** Currently reputational only. A bond, or
  slashing, is the obvious next step once there are organizers worth bonding.
