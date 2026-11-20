import { expect, test } from "bun:test";
import { normalizePartyCode } from "../client/api";

test("party codes normalize case, spaces, and pasted hyphens without accepting excluded letters", () => {
  expect(normalizePartyCode("  abc-234  ")).toBe("ABC234");
  expect(normalizePartyCode("abc 234")).toBe("ABC234");
  expect(normalizePartyCode("ABC1O4")).toBeNull();
  expect(normalizePartyCode("ABC23")).toBeNull();
});
