import { expect, test } from "bun:test";
import { ActionRequestSchema } from "../shared/protocol";

test("action requests reject unknown actions, enums, and extra object keys", () => {
  expect(ActionRequestSchema.safeParse({ expectedPhase: "lobby", roundId: null, action: { type: "made_up" } }).success).toBe(false);
  expect(ActionRequestSchema.safeParse({ expectedPhase: "lobby", roundId: null, extra: true, action: { type: "start_round" } }).success).toBe(false);
  expect(ActionRequestSchema.safeParse({ expectedPhase: "lobby", roundId: null, action: { type: "set_color", colorId: "chartreuse" } }).success).toBe(false);
  expect(ActionRequestSchema.safeParse({ expectedPhase: "lobby", roundId: null, action: { type: "start_round", hidden: true } }).success).toBe(false);
});
