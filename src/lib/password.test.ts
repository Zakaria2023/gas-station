import { describe, expect, it } from "vitest";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";

describe("passwords", () => {
  it("accepts the password it hashed and nothing else", async () => {
    const stored = await hashPassword("سر-123");
    expect(stored.startsWith("scrypt$16384$8$1$")).toBe(true);
    expect(await verifyPassword("سر-123", stored)).toBe(true);
    expect(await verifyPassword("سر-124", stored)).toBe(false);
  });

  it("salts every hash, so the same password never looks the same twice", async () => {
    expect(await hashPassword("admin")).not.toBe(await hashPassword("admin"));
  });

  it("refuses a hash it cannot read rather than throwing", async () => {
    expect(await verifyPassword("admin", "plain-text")).toBe(false);
    expect(await verifyPassword("admin", DUMMY_HASH)).toBe(false);
  });
});
