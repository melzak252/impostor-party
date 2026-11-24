import { Database } from "bun:sqlite";
import { z } from "zod";
import {
  QuestionTopicIdSchema,
  type GameLanguage,
  type QuestionSuggestion,
  type QuestionTopicId,
  type SuggestionStatus,
} from "../shared/protocol";
import type { PartyState } from "./model";

const ColorIdSchema = z.enum(["coral", "amber", "mint", "cyan", "blue", "violet", "rose", "lime"]);
const PlayerNameSchema = z.string().min(1).max(80).refine((name) => Array.from(name).length <= 20);
const PartyDocumentSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/),
  roomName: z.string().min(1).max(32).optional(),
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
    enabledTopics: z.array(QuestionTopicIdSchema).min(1).optional(),
    answerTimeSeconds: z.number().int().min(0).max(300).optional(),
    roundCount: z.number().int().min(1).max(20).optional(),
  }).strict(),
  players: z.array(z.object({
    id: z.string().uuid(),
    sessionHash: z.string().regex(/^[a-f0-9]{64}$/),
    name: PlayerNameSchema,
    colorId: ColorIdSchema,
    joinedAt: z.number().finite(),
    connected: z.boolean(),
    disconnectedAt: z.number().finite().nullable(),
    score: z.number().int().nonnegative().optional(),
  }).strict()).min(1).max(8),
  customQuestions: z.array(z.object({
    id: z.string().min(1),
    normalQuestion: z.string().min(1).max(200),
    impostorQuestion: z.string().min(1).max(200),
  }).strict()).max(50),
  usedQuestionIds: z.array(z.string()),
  usedNormalQuestions: z.array(z.string()).optional(),
  lastRoundNumber: z.number().int().nonnegative(),
  round: z.object({
    id: z.string().uuid(),
    number: z.number().int().positive(),
    matchRound: z.number().int().positive().optional(),
    isSpicy: z.boolean().optional(),
    participants: z.array(z.object({
      id: z.string().uuid(),
      name: PlayerNameSchema,
      colorId: ColorIdSchema,
    }).strict()).min(1).max(8),
    normalQuestion: z.string(),
    impostorQuestion: z.string(),
    impostorId: z.string().uuid(),
    answers: z.record(z.string(), z.string()),
    readyPlayerIds: z.array(z.string().uuid()),
    rerollVoterIds: z.array(z.string().uuid()).optional(),
    votes: z.record(z.string().uuid(), z.string().uuid()),
    answerDeadlineAt: z.number().finite().nullable().optional(),
    questionRevealAt: z.number().finite().nullable(),
    voteDeadlineAt: z.number().finite().nullable().optional(),
    roundPoints: z.record(z.string().uuid(), z.number().int().nonnegative()).optional(),
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
        CREATE TABLE IF NOT EXISTS question_suggestions(
          id TEXT PRIMARY KEY,
          topic TEXT NOT NULL,
          language TEXT NOT NULL,
          spicy INTEGER NOT NULL,
          text TEXT NOT NULL,
          status TEXT NOT NULL,
          session_hash TEXT,
          created_at INTEGER NOT NULL,
          reviewed_at INTEGER
        );
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
  createSuggestion(suggestion: QuestionSuggestion & { sessionHash: string | null }): QuestionSuggestion {
    this.db.query(
      "INSERT INTO question_suggestions(id,topic,language,spicy,text,status,session_hash,created_at,reviewed_at) VALUES(?,?,?,?,?,?,?,?,?)",
    ).run(
      suggestion.id,
      suggestion.topic,
      suggestion.language,
      suggestion.spicy ? 1 : 0,
      suggestion.text,
      suggestion.status,
      suggestion.sessionHash,
      suggestion.createdAt,
      suggestion.reviewedAt,
    );
    return {
      id: suggestion.id,
      topic: suggestion.topic,
      language: suggestion.language,
      spicy: suggestion.spicy,
      text: suggestion.text,
      status: suggestion.status,
      createdAt: suggestion.createdAt,
      reviewedAt: suggestion.reviewedAt,
    };
  }
  hasDuplicateSuggestion(text: string): boolean {
    const row = this.db.query(
      "SELECT 1 FROM question_suggestions WHERE lower(text) = lower(?) AND status IN ('pending', 'approved') LIMIT 1",
    ).get(text);
    return Boolean(row);
  }
  countPendingSuggestions(): number {
    const row = this.db.query("SELECT COUNT(*) AS count FROM question_suggestions WHERE status = 'pending'").get() as { count: number } | null;
    return Number(row?.count ?? 0);
  }
  listSuggestions(status?: SuggestionStatus): QuestionSuggestion[] {
    const sql = status
      ? "SELECT id, topic, language, spicy, text, status, created_at, reviewed_at FROM question_suggestions WHERE status = ? ORDER BY created_at DESC"
      : "SELECT id, topic, language, spicy, text, status, created_at, reviewed_at FROM question_suggestions ORDER BY created_at DESC";
    const rows = (status ? this.db.query(sql).all(status) : this.db.query(sql).all()) as Array<{
      id: string;
      topic: string;
      language: string;
      spicy: number;
      text: string;
      status: string;
      created_at: number;
      reviewed_at: number | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      topic: row.topic as QuestionTopicId,
      language: row.language as GameLanguage,
      spicy: Boolean(row.spicy),
      text: row.text,
      status: row.status as SuggestionStatus,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
    }));
  }
  updateSuggestionStatus(id: string, status: "approved" | "rejected", reviewedAt: number): boolean {
    const result = this.db.query(
      "UPDATE question_suggestions SET status = ?, reviewed_at = ? WHERE id = ?",
    ).run(status, reviewedAt, id);
    return result.changes > 0;
  }
  close(): void { this.db.close(); }
}
