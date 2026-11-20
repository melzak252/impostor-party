import { Database } from "bun:sqlite";
import { z } from "zod";
import type { PartyState } from "./model";

const ColorIdSchema = z.enum(["coral", "amber", "mint", "cyan", "blue", "violet"]);
const PlayerNameSchema = z.string().min(1).max(80).refine((name) => Array.from(name).length <= 20);
const PartyDocumentSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/),
  version: z.number().int().positive(),
  createdAt: z.number().finite(),
  updatedAt: z.number().finite(),
  hostId: z.string().uuid(),
  phase: z.enum(["lobby", "answering", "answers", "question", "voting", "results"]),
  settings: z.object({
    visibility: z.enum(["private", "public"]),
    questionRevealMode: z.enum(["ready", "auto"]),
    questionSource: z.enum(["builtin", "custom", "mixed"]),
    spicyMode: z.boolean().optional(),
    language: z.enum(["en", "pl", "es", "de", "fr"]).optional(),
  }).strict(),
  players: z.array(z.object({
    id: z.string().uuid(),
    sessionHash: z.string().regex(/^[a-f0-9]{64}$/),
    name: PlayerNameSchema,
    colorId: ColorIdSchema,
    joinedAt: z.number().finite(),
    connected: z.boolean(),
    disconnectedAt: z.number().finite().nullable(),
  }).strict()).min(1).max(6),
  customQuestions: z.array(z.object({
    id: z.string().min(1),
    normalQuestion: z.string().min(1).max(200),
    impostorQuestion: z.string().min(1).max(200),
  }).strict()).max(50),
  usedQuestionIds: z.array(z.string()),
  lastRoundNumber: z.number().int().nonnegative(),
  round: z.object({
    id: z.string().uuid(),
    number: z.number().int().positive(),
    participants: z.array(z.object({
      id: z.string().uuid(),
      name: PlayerNameSchema,
      colorId: ColorIdSchema,
    }).strict()).min(1).max(6),
    normalQuestion: z.string(),
    impostorQuestion: z.string(),
    impostorId: z.string().uuid(),
    answers: z.record(z.string(), z.string()),
    readyPlayerIds: z.array(z.string().uuid()),
    votes: z.record(z.string().uuid(), z.string().uuid()),
    questionRevealAt: z.number().finite().nullable(),
  }).strict().nullable(),
  bannedSessionHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)),
  notice: z.object({ type: z.literal("round_cancelled"), playerName: z.string() }).strict().nullable(),
}).strict().superRefine((state, context) => {
  const playerIds = state.players.map((player) => player.id);
  const sessionHashes = state.players.map((player) => player.sessionHash);
  const colors = state.players.map((player) => player.colorId);
  if (new Set(playerIds).size !== playerIds.length || new Set(sessionHashes).size !== sessionHashes.length || new Set(colors).size !== colors.length) {
    context.addIssue({ code: "custom", message: "Party players must have unique ids, sessions, and colors." });
  }
  if (state.players.some((player) => player.connected ? player.disconnectedAt !== null : player.disconnectedAt === null)) {
    context.addIssue({ code: "custom", message: "Player presence timestamps must match connection state." });
  }
  if (!playerIds.includes(state.hostId)) context.addIssue({ code: "custom", message: "Party host must be a current member." });
  if ((state.phase === "lobby") !== (state.round === null)) {
    context.addIssue({ code: "custom", message: "Lobby parties cannot retain a current round." });
  }
  if (state.round && !state.round.participants.some((player) => player.id === state.round?.impostorId)) {
    context.addIssue({ code: "custom", message: "The impostor must be in the round roster." });
  }
});

export interface SessionRecord { tokenHash: string; expiresAt: number }
export interface MembershipRecord { sessionHash: string; partyId: string; playerId: string }

export class PartyStore {
  readonly db: Database;
  constructor(path: string) {
    this.db = new Database(path, { create: true });
    try {
      this.db.exec("PRAGMA foreign_keys = ON;");
      const versionRow = this.db.query("PRAGMA user_version").get() as { user_version: number } | null;
      const version = Number(versionRow?.user_version ?? 0);
      if (version !== 0 && version !== 1) throw new Error(`Unsupported database schema version ${version}; expected 1`);
      if (version === 0) {
        const existingTable = this.db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1").get() as { name: string } | null;
        if (existingTable) throw new Error(`Database contains table "${existingTable.name}" but has no supported schema version`);
      }
      if (path !== ":memory:") this.db.exec("PRAGMA journal_mode = WAL;");
      this.db.exec(`CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS parties(id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, state_json TEXT NOT NULL, updated_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS memberships(session_hash TEXT PRIMARY KEY REFERENCES sessions(token_hash), party_id TEXT NOT NULL REFERENCES parties(id) ON DELETE CASCADE, player_id TEXT NOT NULL, UNIQUE(party_id, player_id));
        PRAGMA user_version = 1;`);
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  transaction<T>(operation: () => T): T { return this.db.transaction(operation)(); }
  getSession(tokenHash: string): SessionRecord | null {
    const row = this.db.query("SELECT token_hash, expires_at FROM sessions WHERE token_hash = ?").get(tokenHash) as { token_hash: string; expires_at: number } | null;
    return row ? { tokenHash: row.token_hash, expiresAt: row.expires_at } : null;
  }
  putSession(tokenHash: string, expiresAt: number): void {
    this.db.query("INSERT INTO sessions(token_hash,expires_at) VALUES(?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at").run(tokenHash, expiresAt);
  }
  insertSession(tokenHash: string, expiresAt: number): void {
    this.db.query("INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)").run(tokenHash, expiresAt);
  }
  listExpiredSessions(now: number): SessionRecord[] {
    const rows = this.db.query("SELECT token_hash, expires_at FROM sessions WHERE expires_at <= ?").all(now) as Array<{ token_hash: string; expires_at: number }>;
    return rows.map(row => ({ tokenHash: row.token_hash, expiresAt: row.expires_at }));
  }
  deleteSession(tokenHash: string): void { this.db.query("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash); }
  getMembership(sessionHash: string): MembershipRecord | null {
    const row = this.db.query("SELECT session_hash, party_id, player_id FROM memberships WHERE session_hash = ?").get(sessionHash) as { session_hash: string; party_id: string; player_id: string } | null;
    return row ? { sessionHash: row.session_hash, partyId: row.party_id, playerId: row.player_id } : null;
  }
  listMembershipsForParty(partyId: string): MembershipRecord[] {
    const rows = this.db.query("SELECT session_hash, party_id, player_id FROM memberships WHERE party_id = ?").all(partyId) as Array<{ session_hash: string; party_id: string; player_id: string }>;
    return rows.map(row => ({ sessionHash: row.session_hash, partyId: row.party_id, playerId: row.player_id }));
  }
  putMembership(sessionHash: string, partyId: string, playerId: string): void {
    this.db.query("INSERT INTO memberships(session_hash,party_id,player_id) VALUES(?,?,?)").run(sessionHash, partyId, playerId);
  }
  deleteMembership(sessionHash: string): void { this.db.query("DELETE FROM memberships WHERE session_hash = ?").run(sessionHash); }
  deleteParty(id: string): void { this.db.query("DELETE FROM parties WHERE id = ?").run(id); }
  getPartyByCode(code: string): PartyState | null {
    const row = this.db.query("SELECT state_json FROM parties WHERE code = ?").get(code) as { state_json: string } | null;
    if (!row) return null;
    try { return PartyDocumentSchema.parse(JSON.parse(row.state_json)) as PartyState; }
    catch (error) { throw new Error(`Corrupt stored party ${code}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  getPartyById(id: string): PartyState | null {
    const row = this.db.query("SELECT state_json FROM parties WHERE id = ?").get(id) as { state_json: string } | null;
    if (!row) return null;
    try { return PartyDocumentSchema.parse(JSON.parse(row.state_json)) as PartyState; }
    catch (error) { throw new Error(`Corrupt stored party ${id}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  saveParty(state: PartyState): void {
    const validated = PartyDocumentSchema.parse(state);
    const json = JSON.stringify(validated);
    this.db.query("INSERT INTO parties(id,code,state_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET code=excluded.code,state_json=excluded.state_json,updated_at=excluded.updated_at").run(validated.id, validated.code, json, validated.updatedAt);
  }
  listParties(): PartyState[] {
    const rows = this.db.query("SELECT state_json FROM parties").all() as Array<{ state_json: string }>;
    return rows.map(row => { try { return PartyDocumentSchema.parse(JSON.parse(row.state_json)) as PartyState; } catch (error) { throw new Error(`Corrupt stored party: ${error instanceof Error ? error.message : String(error)}`); } });
  }
  close(): void { this.db.close(); }
}
