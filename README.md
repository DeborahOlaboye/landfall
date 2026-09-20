# Landfall

Direct giving with proof of arrival, on Stacks.

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

Every disbursement is recorded on chain at the block it landed in. That's the
part a donor can check independently, years later, without trusting that this
contract or the company behind it still exists.

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

## Contracts

| Contract | Role |
|---|---|
| `recipient-registry` | Organizers, recipients, and who vouched for whom |
| `landfall` | Disbursements in STX or any SIP-010 token, and the receipts |
| `sip-010-trait` | Standard fungible-token trait, so any SIP-010 asset works |

Key entry points:

- `landfall::give (recipient-id, amount, memo)` - send STX, get a receipt id
- `landfall::give-token (token, recipient-id, amount, memo)` - same with a SIP-010 token
- `landfall::verify (receipt-id)` - restate what happened and in which block
- `recipient-registry::register-recipient (payout, profile)` - organizers only

## Running it

```sh
clarinet check      # 3 contracts, 0 errors
npm install
npm test            # 18 tests
clarinet console    # poke at it interactively
```

Two `check_checker` warnings remain on `register-recipient`. They're expected:
the analyzer can't see that `(unwrap! (map-get? organizers tx-sender))` is the
authorization check. Left in place deliberately rather than suppressed.

## Status

Contracts and tests only. No frontend, no deployment, nothing on testnet yet.

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
