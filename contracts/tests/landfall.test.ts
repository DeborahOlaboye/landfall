import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const organizer = accounts.get("wallet_1")!;
const donor = accounts.get("wallet_2")!;
const recipient = accounts.get("wallet_3")!;
const stranger = accounts.get("wallet_4")!;

const REGISTRY = "recipient-registry";
const CORE = "landfall";

// A 32-byte hash standing in for the off-chain profile the organizer holds.
const PROFILE = Cl.bufferFromHex("a".repeat(64));

// Registry errors
const ERR_NOT_STEWARD = 100;
const ERR_NOT_ORGANIZER = 101;
const ERR_ORGANIZER_EXISTS = 102;
const ERR_NOT_OWNING_ORGANIZER = 105;
const ERR_ORGANIZER_SUSPENDED = 106;

// Core errors
const ERR_UNKNOWN_RECIPIENT = 200;
const ERR_NOT_PAYABLE = 201;
const ERR_ZERO_AMOUNT = 202;
const ERR_SELF_GIFT = 205;

/** Admit an organizer and register one recipient. Returns the recipient id. */
function seed() {
  simnet.callPublicFn(
    REGISTRY,
    "add-organizer",
    [Cl.principal(organizer), Cl.stringUtf8("Ikeja Baptist")],
    deployer,
  );
  const reg = simnet.callPublicFn(
    REGISTRY,
    "register-recipient",
    [Cl.principal(recipient), PROFILE],
    organizer,
  );
  expect(reg.result).toBeOk(Cl.uint(1));
  return 1;
}

describe("recipient-registry: who may vouch", () => {
  it("lets the steward admit an organizer", () => {
    const { result } = simnet.callPublicFn(
      REGISTRY,
      "add-organizer",
      [Cl.principal(organizer), Cl.stringUtf8("Ikeja Baptist")],
      deployer,
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("refuses an organizer admitted by anyone but the steward", () => {
    const { result } = simnet.callPublicFn(
      REGISTRY,
      "add-organizer",
      [Cl.principal(stranger), Cl.stringUtf8("Not Authorised")],
      stranger,
    );
    expect(result).toBeErr(Cl.uint(ERR_NOT_STEWARD));
  });

  it("refuses a duplicate organizer", () => {
    simnet.callPublicFn(
      REGISTRY,
      "add-organizer",
      [Cl.principal(organizer), Cl.stringUtf8("Ikeja Baptist")],
      deployer,
    );
    const { result } = simnet.callPublicFn(
      REGISTRY,
      "add-organizer",
      [Cl.principal(organizer), Cl.stringUtf8("Duplicate")],
      deployer,
    );
    expect(result).toBeErr(Cl.uint(ERR_ORGANIZER_EXISTS));
  });
});

describe("recipient-registry: vouching for people", () => {
  it("lets an active organizer register a recipient", () => {
    seed();
    const { result } = simnet.callReadOnlyFn(
      REGISTRY,
      "is-payable",
      [Cl.uint(1)],
      donor,
    );
    expect(result).toBeBool(true);
  });

  it("records which organizer vouched, permanently", () => {
    seed();
    const { result } = simnet.callReadOnlyFn(
      REGISTRY,
      "get-recipient",
      [Cl.uint(1)],
      donor,
    );
    const r = (result as any).value.value;
    expect(r.payout).toStrictEqual(Cl.principal(recipient));
    expect(r.organizer).toStrictEqual(Cl.principal(organizer));
    expect(r.profile).toStrictEqual(PROFILE);
    expect(r.active).toStrictEqual(Cl.bool(true));
    expect(Number((r["registered-at"] as any).value)).toBeGreaterThan(0);
  });

  it("refuses registration from someone who is not an organizer", () => {
    const { result } = simnet.callPublicFn(
      REGISTRY,
      "register-recipient",
      [Cl.principal(recipient), PROFILE],
      stranger,
    );
    expect(result).toBeErr(Cl.uint(ERR_NOT_ORGANIZER));
  });

  it("refuses registration from a suspended organizer", () => {
    seed();
    simnet.callPublicFn(
      REGISTRY,
      "set-organizer-active",
      [Cl.principal(organizer), Cl.bool(false)],
      deployer,
    );
    const { result } = simnet.callPublicFn(
      REGISTRY,
      "register-recipient",
      [Cl.principal(stranger), PROFILE],
      organizer,
    );
    expect(result).toBeErr(Cl.uint(ERR_ORGANIZER_SUSPENDED));
  });

  it("lets only the vouching organizer change the payout address", () => {
    seed();
    const bad = simnet.callPublicFn(
      REGISTRY,
      "update-payout",
      [Cl.uint(1), Cl.principal(stranger)],
      stranger,
    );
    expect(bad.result).toBeErr(Cl.uint(ERR_NOT_OWNING_ORGANIZER));

    const good = simnet.callPublicFn(
      REGISTRY,
      "update-payout",
      [Cl.uint(1), Cl.principal(stranger)],
      organizer,
    );
    expect(good.result).toBeOk(Cl.bool(true));
  });
});

describe("landfall: money that lands", () => {
  beforeEach(() => {
    seed();
  });

  it("moves STX to the recipient and writes a receipt", () => {
    const before = simnet.getAssetsMap().get("STX")?.get(recipient) ?? 0n;

    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(1_000_000), Cl.none()],
      donor,
    );
    expect(result).toBeOk(Cl.uint(1));

    const after = simnet.getAssetsMap().get("STX")?.get(recipient) ?? 0n;
    expect(after - before).toBe(1_000_000n);
  });

  it("writes a receipt a donor can check for themselves", () => {
    simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(500_000), Cl.none()],
      donor,
    );
    const { result } = simnet.callReadOnlyFn(
      CORE,
      "get-receipt",
      [Cl.uint(1)],
      donor,
    );
    const receipt = (result as any).value.value;
    expect(receipt.donor).toStrictEqual(Cl.principal(donor));
    expect(receipt.payout).toStrictEqual(Cl.principal(recipient));
    expect(receipt.amount).toStrictEqual(Cl.uint(500_000));
    expect(receipt.asset).toStrictEqual(Cl.none());
    // The block it landed in - checkable later without trusting us.
    expect(Number((receipt["stacks-height"] as any).value)).toBeGreaterThan(0);
  });

  it("accumulates totals for the recipient and the donor", () => {
    simnet.callPublicFn(CORE, "give", [Cl.uint(1), Cl.uint(300), Cl.none()], donor);
    simnet.callPublicFn(CORE, "give", [Cl.uint(1), Cl.uint(700), Cl.none()], donor);

    const received = simnet.callReadOnlyFn(
      CORE,
      "get-recipient-received",
      [Cl.uint(1), Cl.none()],
      donor,
    );
    expect(received.result).toBeUint(1000);

    const given = simnet.callReadOnlyFn(
      CORE,
      "get-donor-given",
      [Cl.principal(donor), Cl.none()],
      donor,
    );
    expect(given.result).toBeUint(1000);
  });

  it("verify() restates what happened", () => {
    simnet.callPublicFn(CORE, "give", [Cl.uint(1), Cl.uint(42), Cl.none()], donor);
    const { result } = simnet.callReadOnlyFn(CORE, "verify", [Cl.uint(1)], stranger);
    const v = (result as any).value.value;
    expect(v.landed).toStrictEqual(Cl.bool(true));
    expect(v.amount).toStrictEqual(Cl.uint(42));
  });

  it("refuses an unknown recipient", () => {
    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(999), Cl.uint(100), Cl.none()],
      donor,
    );
    expect(result).toBeErr(Cl.uint(ERR_UNKNOWN_RECIPIENT));
  });

  it("refuses a zero amount", () => {
    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(0), Cl.none()],
      donor,
    );
    expect(result).toBeErr(Cl.uint(ERR_ZERO_AMOUNT));
  });

  it("refuses giving to yourself", () => {
    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(100), Cl.none()],
      recipient,
    );
    expect(result).toBeErr(Cl.uint(ERR_SELF_GIFT));
  });

  it("refuses a recipient the organizer has deactivated", () => {
    simnet.callPublicFn(
      REGISTRY,
      "set-recipient-active",
      [Cl.uint(1), Cl.bool(false)],
      organizer,
    );
    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(100), Cl.none()],
      donor,
    );
    expect(result).toBeErr(Cl.uint(ERR_NOT_PAYABLE));
  });

  it("stops payouts to everyone an organizer vouched for when that organizer is suspended", () => {
    // The point of tying recipients to an organizer: suspending the organizer
    // suspends their whole roster, without touching each record.
    simnet.callPublicFn(
      REGISTRY,
      "set-organizer-active",
      [Cl.principal(organizer), Cl.bool(false)],
      deployer,
    );
    const { result } = simnet.callPublicFn(
      CORE,
      "give",
      [Cl.uint(1), Cl.uint(100), Cl.none()],
      donor,
    );
    expect(result).toBeErr(Cl.uint(ERR_NOT_PAYABLE));
  });

  it("leaves no receipt behind when a gift is refused", () => {
    simnet.callPublicFn(CORE, "give", [Cl.uint(1), Cl.uint(0), Cl.none()], donor);
    const { result } = simnet.callReadOnlyFn(CORE, "get-receipt-count", [], donor);
    expect(result).toBeUint(0);
  });
});
