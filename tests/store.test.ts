import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PartyState } from "../server/model";
import { PartyStore } from "../server/store";

test("party documents survive store close and reopen", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-store-"));
  const path = join(directory, "party.sqlite");
  const state: PartyState = {
    id: "00000000-0000-4000-8000-000000000001", code: "ABC234", version: 3, createdAt: 100, updatedAt: 200, hostId: "00000000-0000-4000-8000-000000000002", phase: "lobby",
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "builtin" },
    players: [{ id: "00000000-0000-4000-8000-000000000002", sessionHash: "a".repeat(64), name: "Host", colorId: "coral", joinedAt: 100, connected: true, disconnectedAt: null }],
    customQuestions: [], usedQuestionIds: [], lastRoundNumber: 0, round: null, bannedSessionHashes: [], notice: null,
  };
  try {
    const first = new PartyStore(path);
    first.saveParty(state);
    first.close();
    const reopened = new PartyStore(path);
    expect(reopened.getPartyByCode("ABC234")).toEqual(state);
    reopened.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("an unsupported database version is rejected without resetting it", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-version-"));
  const path = join(directory, "party.sqlite");
  try {
    const raw = new Database(path);
    raw.exec("PRAGMA user_version = 27");
    raw.close();
    expect(() => new PartyStore(path)).toThrow("Unsupported database schema version 27");
    const unchanged = new Database(path);
    const versionRow = unchanged.query("PRAGMA user_version").get() as { user_version: number };
    expect(versionRow.user_version).toBe(27);
    unchanged.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("corrupt party JSON reports an error and remains preserved", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-corrupt-"));
  const path = join(directory, "party.sqlite");
  try {
    const store = new PartyStore(path);
    const corruptJson = "{not valid json";
    store.db.query("INSERT INTO parties(id,code,state_json,updated_at) VALUES(?,?,?,?)").run(
      "00000000-0000-4000-8000-000000000001",
      "ABC234",
      corruptJson,
      100,
    );
    store.close();
    const reopened = new PartyStore(path);
    expect(() => reopened.getPartyByCode("ABC234")).toThrow("Corrupt stored party ABC234");
    reopened.close();
    const raw = new Database(path);
    const row = raw.query("SELECT state_json FROM parties WHERE code = ?").get("ABC234") as { state_json: string };
    expect(row.state_json).toBe(corruptJson);
    raw.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a version-zero database with existing tables is rejected intact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "impostor-unversioned-"));
  const path = join(directory, "party.sqlite");
  let openedStore: PartyStore | undefined;
  try {
    const raw = new Database(path);
    raw.exec("CREATE TABLE unrelated(value TEXT); PRAGMA user_version = 0;");
    raw.close();
    expect(() => {
      openedStore = new PartyStore(path);
    }).toThrow();
    openedStore?.close();
    const unchanged = new Database(path);
    const versionRow = unchanged.query("PRAGMA user_version").get() as { user_version: number };
    const tableRow = unchanged.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'unrelated'").get();
    expect(versionRow.user_version).toBe(0);
    expect(tableRow).toBeTruthy();
    unchanged.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
