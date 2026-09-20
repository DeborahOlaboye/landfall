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
