import { createHash, randomBytes, randomInt as cryptoRandomInt, randomUUID } from "node:crypto";
import {
  COLOR_PALETTE,
  type ActionRequest,
  type GameLanguage,
  type PartyAction,
  type PartySnapshot,
} from "../shared/protocol";
import type { PartyState, PlayerState } from "./model";
import { PartyStore } from "./store";
import { projectParty } from "./view";

const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const RECONNECTION_GRACE_MS = 60 * 1000;
const PARTY_INACTIVITY_MS = 24 * 60 * 60 * 1000;
const REMOVED_SOCKET_CLOSE_DELAY_MS = 1_000;
const MAX_PLAYERS = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ACTIVE_ROUND_PHASES = new Set<PartyState["phase"]>(["answering", "answers", "question", "voting"]);

export type ApiErrorCode =
  | "VALIDATION_ERROR" | "SESSION_REQUIRED" | "NOT_MEMBER" | "FORBIDDEN" | "KICKED"
  | "PARTY_NOT_FOUND" | "PARTY_FULL" | "PARTY_IN_PROGRESS" | "ALREADY_IN_PARTY"
  | "COLOR_TAKEN" | "STALE_ACTION" | "RATE_LIMITED" | "NO_QUESTIONS" | "NOT_READY"
  | "INVALID_VOTE" | "INTERNAL_ERROR";

export class PartyError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly snapshot?: PartySnapshot,
  ) {
    super(message);
    this.name = "PartyError";
  }
}

type MembershipPartyAction =
  | Extract<PartyAction, { type: "set_color" }>
  | Extract<PartyAction, { type: "set_settings" }>
  | Extract<PartyAction, { type: "kick" }>
  | Extract<PartyAction, { type: "leave" }>;
export type DeferredPartyAction = Exclude<PartyAction, MembershipPartyAction>;
export type DeferredActionRequest = Omit<ActionRequest, "action"> & { action: DeferredPartyAction };

export interface PartyActionContext {
  now: number;
  randomInt: (maxExclusive: number) => number;
  connectedIds: ReadonlySet<string>;
}

export type PartyActionHandler = (
  state: PartyState,
  actorId: string,
  request: DeferredActionRequest,
  context: PartyActionContext,
) => void;
export type PhaseDeadlineHandler = (state: PartyState, context: PartyActionContext) => boolean;

export interface PartySocketIdentity {
  partyId: string;
  playerId: string;
  sessionHash: string;
}

export interface PartySocket {
  send(message: string): unknown;
  close(code?: number, reason?: string): unknown;
}

export interface SessionInfo {
  token: string;
  currentPartyCode: string | null;
}

interface PartySocketEvent {
  type: "snapshot";
  snapshot: PartySnapshot;
}

interface RemovedSocketEvent {
  type: "removed";
  reason: "left" | "kicked" | "expired";
}

function apiError(code: ApiErrorCode, status: number, message: string, snapshot?: PartySnapshot): PartyError {
  return new PartyError(code, status, message, snapshot);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizePartyCode(input: string): string {
  const code = input.trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) {
    throw apiError("VALIDATION_ERROR", 400, "Enter a valid six-character party code.");
  }
  return code;
}

export function normalizePlayerName(input: string): string {
  const name = input.trim();
  const characterCount = Array.from(name).length;
  if (characterCount < 1 || characterCount > 20) {
    throw apiError("VALIDATION_ERROR", 400, "Name must be between 1 and 20 characters.");
  }
  return name;
}

function isCodeUniqueCollision(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed: parties\.code/.test(error.message);
}

function isTokenUniqueCollision(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed: sessions\.token_hash/.test(error.message);
}

function sessionRequired(): PartyError {
  return apiError("SESSION_REQUIRED", 401, "Create or resume a guest session first.");
}

function partyNotFound(): PartyError {
  return apiError("PARTY_NOT_FOUND", 404, "Party not found.");
}

function internalMembershipError(): Error {
  return new Error("Party membership index does not match the persisted party state");
}

function playerDeparture(state: PartyState, playerId: string, now: number, updateActivity = true): PlayerState {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Cannot remove a player who is not in the party");

  state.players = state.players.filter((candidate) => candidate.id !== playerId);
  if (ACTIVE_ROUND_PHASES.has(state.phase)) {
    state.phase = "lobby";
    state.round = null;
    state.notice = { type: "round_cancelled", playerName: player.name };
  }

  if (state.hostId === player.id && state.players.length > 0) {
    const nextHost = [...state.players].sort((left, right) => {
      if (left.connected !== right.connected) return left.connected ? -1 : 1;
      const joinedOrder = left.joinedAt - right.joinedAt;
      if (joinedOrder !== 0) return joinedOrder;
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    })[0]!;
    state.hostId = nextHost.id;
  }

  state.version += 1;
  if (updateActivity) state.updatedAt = now;
  return player;
}

export class PartyService {
  private readonly sockets = new Map<string, Map<string, Set<PartySocket>>>();
  private gameActionHandler: PartyActionHandler | null = null;
  private deadlineHandler: PhaseDeadlineHandler | null = null;
  private isStopping = false;
  private isMaintaining = false;

  constructor(
    readonly store: PartyStore,
    private readonly now: () => number = Date.now,
    private readonly randomInt: (maxExclusive: number) => number = cryptoRandomInt,
  ) {
    this.recoverPersistedParties();
  }

  setGameActionHandler(handler: PartyActionHandler | null): void {
    this.gameActionHandler = handler;
  }

  setDeadlineHandler(handler: PhaseDeadlineHandler | null): void {
    this.deadlineHandler = handler;
    if (handler) this.maintenance();
  }

  stop(): void {
    this.isStopping = true;
  }

  createSession(): SessionInfo {
    this.maintenance();
    const now = this.now();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashSessionToken(token);
      try {
        this.store.transaction(() => {
          this.store.insertSession(tokenHash, now + SESSION_LIFETIME_MS);
        });
        return { token, currentPartyCode: null };
      } catch (error) {
        if (isTokenUniqueCollision(error)) continue;
        throw error;
      }
    }
    throw new Error("Unable to generate a unique guest session token");
  }

  resumeSession(token: string): SessionInfo | null {
    this.maintenance();
    const tokenHash = hashSessionToken(token);
    const now = this.now();
    return this.store.transaction(() => {
      const session = this.store.getSession(tokenHash);
      if (!session || session.expiresAt <= now) return null;
      this.store.putSession(tokenHash, now + SESSION_LIFETIME_MS);
      return { token, currentPartyCode: this.currentPartyCode(tokenHash) };
    });
  }
  hasSession(tokenHash: string): boolean {
    this.maintenance();
    const session = this.store.getSession(tokenHash);
    return Boolean(session && session.expiresAt > this.now());
  }

  listPublicParties(): Array<{ code: string; hostName: string; playerCount: number; maxPlayers: number }> {
    this.maintenance();
    return this.store.listParties().flatMap((state) => {
      if (state.settings.visibility !== "public" || state.phase !== "lobby" || state.players.length >= MAX_PLAYERS) return [];
      const host = state.players.find((player) => player.id === state.hostId);
      if (!host || !this.connectedIds(state.id).has(host.id)) return [];
      return [{ code: state.code, hostName: host.name, playerCount: state.players.length, maxPlayers: MAX_PLAYERS }];
    });
  }

  createParty(sessionHash: string, rawName: string, visibility: "private" | "public", language?: GameLanguage): PartySnapshot {
    const name = normalizePlayerName(rawName);
    this.maintenance();
    const now = this.now();

    for (let attempt = 0; attempt < 32; attempt += 1) {
      try {
        const outcome = this.store.transaction(() => {
          this.requireSession(sessionHash, now);
          if (this.store.getMembership(sessionHash)) {
            throw apiError("ALREADY_IN_PARTY", 409, "You are already in a party. Return to it or leave first.");
          }
          const code = this.generateCode();
          if (this.store.getPartyByCode(code)) return { collision: true as const };
          const playerId = randomUUID();
          const player: PlayerState = {
            id: playerId,
            sessionHash,
            name,
            colorId: COLOR_PALETTE[0]!.id,
            joinedAt: now,
            connected: false,
            disconnectedAt: now,
          };
          const state: PartyState = {
            id: randomUUID(),
            code,
            version: 1,
            createdAt: now,
            updatedAt: now,
            hostId: playerId,
            phase: "lobby",
            settings: {
              visibility,
              questionRevealMode: "ready",
              questionSource: "builtin",
              spicyMode: false,
              ...(language ? { language } : {}),
            },
            players: [player],
            customQuestions: [],
            usedQuestionIds: [],
            lastRoundNumber: 0,
            round: null,
            bannedSessionHashes: [],
            notice: null,
          };
          this.store.saveParty(state);
          this.store.putMembership(sessionHash, state.id, playerId);
          return { collision: false as const, partyId: state.id, snapshot: projectParty(state, playerId, this.connectedIds(state.id)) };
        });
        if (outcome.collision) continue;
        this.broadcast(outcome.partyId);
        return outcome.snapshot;
      } catch (error) {
        if (isCodeUniqueCollision(error)) continue;
        throw error;
      }
    }
    throw new Error("Unable to allocate a unique party code");
  }

  joinParty(rawCode: string, sessionHash: string, rawName: string): PartySnapshot {
    const code = normalizePartyCode(rawCode);
    const name = normalizePlayerName(rawName);
    this.maintenance();
    const now = this.now();
    const outcome = this.store.transaction(() => {
      this.requireSession(sessionHash, now);
      const state = this.store.getPartyByCode(code);
      if (!state) throw partyNotFound();

      const membership = this.store.getMembership(sessionHash);
      if (membership) {
        if (membership.partyId !== state.id) {
          throw apiError("ALREADY_IN_PARTY", 409, "You are already in another party. Return to it or leave first.");
        }
        const player = state.players.find((candidate) => candidate.id === membership.playerId && candidate.sessionHash === sessionHash);
        if (!player) throw internalMembershipError();
        return { changed: false as const, partyId: state.id, snapshot: projectParty(state, player.id, this.connectedIds(state.id)) };
      }

      if (state.bannedSessionHashes.includes(sessionHash)) {
        throw apiError("KICKED", 403, "You were removed from this party.");
      }
      if (state.players.some((player) => player.sessionHash === sessionHash)) throw internalMembershipError();
      if (state.phase !== "lobby") throw apiError("PARTY_IN_PROGRESS", 409, "This party is already in progress.");
      if (state.players.length >= MAX_PLAYERS) throw apiError("PARTY_FULL", 409, "This party is full.");

      const occupied = new Set(state.players.map((player) => player.colorId));
      const color = COLOR_PALETTE.find((candidate) => !occupied.has(candidate.id));
      if (!color) throw apiError("PARTY_FULL", 409, "This party has no available player colours.");
      const playerId = randomUUID();
      const player: PlayerState = {
        id: playerId,
        sessionHash,
        name,
        colorId: color.id,
        joinedAt: now,
        connected: false,
        disconnectedAt: now,
      };
      state.players.push(player);
      state.version += 1;
      state.updatedAt = now;
      this.store.putMembership(sessionHash, state.id, playerId);
      this.store.saveParty(state);
      return { changed: true as const, partyId: state.id, snapshot: projectParty(state, playerId, this.connectedIds(state.id)) };
    });

    if (outcome.changed) this.broadcast(outcome.partyId);
    return outcome.snapshot;
  }

  getPartySnapshot(rawCode: string, sessionHash: string): PartySnapshot {
    const code = normalizePartyCode(rawCode);
    this.maintenance();
    const now = this.now();
    return this.store.transaction(() => {
      this.requireSession(sessionHash, now);
      const state = this.store.getPartyByCode(code);
      if (!state) throw partyNotFound();
      const player = this.requireMember(state, sessionHash);
      return projectParty(state, player.id, this.connectedIds(state.id));
    });
  }

  applyAction(rawCode: string, sessionHash: string, request: ActionRequest): { left: true } | { snapshot: PartySnapshot } {
    const code = normalizePartyCode(rawCode);
    this.maintenance();
    const now = this.now();
    const outcome = this.store.transaction(() => {
      this.requireSession(sessionHash, now);
      const state = this.store.getPartyByCode(code);
      if (!state) throw partyNotFound();
      const action = request.action;
      let actor: PlayerState;

      if (action.type === "leave" || action.type === "kick") {
        actor = this.requireMember(state, sessionHash);
      } else {
        const currentRoundId = state.round?.id ?? null;
        if (request.expectedPhase !== state.phase || request.roundId !== currentRoundId) {
          const membership = this.store.getMembership(sessionHash);
          if (membership?.partyId === state.id) {
            const currentMember = state.players.find((player) =>
              player.id === membership.playerId && player.sessionHash === sessionHash,
            );
            if (!currentMember) throw internalMembershipError();
            throw apiError(
              "STALE_ACTION",
              409,
              "This action is out of date. Refresh the party and try again.",
              projectParty(state, currentMember.id, this.connectedIds(state.id)),
            );
          }
          this.requireMember(state, sessionHash);
        }
        actor = this.requireMember(state, sessionHash);
      }
      if (action.type === "leave") {
        this.assertMembershipRow(state, actor);
        this.store.deleteMembership(actor.sessionHash);
        const removed = playerDeparture(state, actor.id, now);
        const deleted = state.players.length === 0;
        if (deleted) this.store.deleteParty(state.id);
        else this.store.saveParty(state);
        return { kind: "removed" as const, partyId: state.id, playerId: removed.id, reason: "left" as const, deleted };
      }

      if (action.type === "kick") {
        if (actor.id !== state.hostId) throw apiError("FORBIDDEN", 403, "Only the host can remove another player.");
        if (action.playerId === actor.id) throw apiError("FORBIDDEN", 403, "The host must leave instead of removing themselves.");
        const target = state.players.find((player) => player.id === action.playerId);
        if (!target) throw apiError("VALIDATION_ERROR", 400, "That player is not in this party.");
        this.assertMembershipRow(state, target);
        if (!state.bannedSessionHashes.includes(target.sessionHash)) state.bannedSessionHashes.push(target.sessionHash);
        this.store.deleteMembership(target.sessionHash);
        const removed = playerDeparture(state, target.id, now);
        const deleted = state.players.length === 0;
        if (deleted) this.store.deleteParty(state.id);
        else this.store.saveParty(state);
        return { kind: "removed" as const, partyId: state.id, playerId: removed.id, reason: "kicked" as const, deleted, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
      }

      if (action.type === "set_color") {
        if (state.phase !== "lobby") throw apiError("FORBIDDEN", 403, "Colours can only be changed in the lobby.");
        const taken = state.players.some((player) => player.id !== actor.id && player.colorId === action.colorId);
        if (taken) throw apiError("COLOR_TAKEN", 409, "That colour is already taken.");
        if (actor.colorId !== action.colorId) {
          actor.colorId = action.colorId;
          state.version += 1;
          state.updatedAt = now;
          this.store.saveParty(state);
          return { kind: "changed" as const, partyId: state.id, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
        }
        return { kind: "unchanged" as const, partyId: state.id, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
      }

      if (action.type === "set_settings") {
        if (actor.id !== state.hostId) throw apiError("FORBIDDEN", 403, "Only the host can change party settings.");
        if (state.phase !== "lobby") throw apiError("FORBIDDEN", 403, "Settings can only be changed in the lobby.");
        const settingsChanged = state.settings.visibility !== action.settings.visibility
          || state.settings.questionRevealMode !== action.settings.questionRevealMode
          || state.settings.questionSource !== action.settings.questionSource
          || (state.settings.spicyMode ?? false) !== (action.settings.spicyMode ?? false)
          || (state.settings.language ?? "en") !== (action.settings.language ?? "en");
        if (settingsChanged) {
          const sourceChanged = state.settings.questionSource !== action.settings.questionSource;
          state.settings = { ...action.settings };
          if (sourceChanged) state.usedQuestionIds = [];
          state.version += 1;
          state.updatedAt = now;
          this.store.saveParty(state);
          return { kind: "changed" as const, partyId: state.id, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
        }
        return { kind: "unchanged" as const, partyId: state.id, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
      }

      if (!this.gameActionHandler) throw apiError("FORBIDDEN", 403, "That party action is not available yet.");
      const deferredRequest: DeferredActionRequest = { expectedPhase: request.expectedPhase, roundId: request.roundId, action };
      this.gameActionHandler(state, actor.id, deferredRequest, this.context(state.id, now));
      state.version += 1;
      state.updatedAt = now;
      this.store.saveParty(state);
      return { kind: "changed" as const, partyId: state.id, snapshot: projectParty(state, actor.id, this.connectedIds(state.id)) };
    });

    if (outcome.kind === "removed") {
      this.removePlayerSockets(outcome.partyId, outcome.playerId, outcome.reason);
      if (!outcome.deleted) this.broadcast(outcome.partyId);
      if (outcome.reason === "left") return { left: true };
      if (outcome.snapshot) return { snapshot: outcome.snapshot };
      throw new Error("A kick removed the acting host");
    }
    if (outcome.kind === "changed") this.broadcast(outcome.partyId);
    return { snapshot: outcome.snapshot };
  }

  async localizeRoundQuestions(
    rawCode: string,
    roundId: string,
    translate: (text: string, lang: GameLanguage) => Promise<string>,
  ): Promise<PartySnapshot | null> {
    const code = normalizePartyCode(rawCode);
    const initial = this.store.getPartyByCode(code);
    if (!initial || !initial.round || initial.round.id !== roundId) return null;
    const lang = initial.settings.language ?? "en";
    if (lang === "en") return null;

    const [normalQuestion, impostorQuestion] = await Promise.all([
      translate(initial.round.normalQuestion, lang),
      translate(initial.round.impostorQuestion, lang),
    ]);

    const outcome = this.store.transaction(() => {
      const state = this.store.getPartyByCode(code);
      if (!state || !state.round || state.round.id !== roundId) return null;
      if (state.round.normalQuestion === normalQuestion && state.round.impostorQuestion === impostorQuestion) {
        return null;
      }
      state.round.normalQuestion = normalQuestion;
      state.round.impostorQuestion = impostorQuestion;
      state.version += 1;
      state.updatedAt = this.now();
      this.store.saveParty(state);
      return {
        partyId: state.id,
        snapshot: projectParty(state, state.hostId, this.connectedIds(state.id)),
      };
    });

    if (!outcome) return null;
    this.broadcast(outcome.partyId);
    return outcome.snapshot;
  }

  authorizeSocket(rawCode: string, sessionHash: string): PartySocketIdentity {
    const code = normalizePartyCode(rawCode);
    this.maintenance();
    const now = this.now();
    return this.store.transaction(() => {
      this.requireSession(sessionHash, now);
      const state = this.store.getPartyByCode(code);
      if (!state) throw partyNotFound();
      const player = this.requireMember(state, sessionHash);
      return { partyId: state.id, playerId: player.id, sessionHash };
    });
  }

  socketOpened(identity: PartySocketIdentity, socket: PartySocket): void {
    if (this.isStopping) {
      socket.close(1001, "Server shutting down");
      return;
    }
    this.maintenance();
    const now = this.now();
    const outcome = this.store.transaction(() => {
      const state = this.store.getPartyById(identity.partyId);
      if (!state) return { accepted: false as const, reason: "expired" as const };
      const session = this.store.getSession(identity.sessionHash);
      if (!session || session.expiresAt <= now) return { accepted: false as const, reason: "expired" as const };
      const membership = this.store.getMembership(identity.sessionHash);
      if (!membership || membership.partyId !== state.id || membership.playerId !== identity.playerId) {
        const reason = state.bannedSessionHashes.includes(identity.sessionHash) ? "kicked" as const : "left" as const;
        return { accepted: false as const, reason };
      }
      const player = state.players.find((candidate) => candidate.id === identity.playerId && candidate.sessionHash === identity.sessionHash);
      if (!player) throw internalMembershipError();
      const changed = !player.connected || player.disconnectedAt !== null;
      if (changed) {
        player.connected = true;
        player.disconnectedAt = null;
        state.version += 1;
        this.store.saveParty(state);
      }
      return { accepted: true as const, changed, state };
    });

    if (!outcome.accepted) {
      this.sendRemoved(socket, outcome.reason);
      socket.close(1008, "Membership is no longer active");
      return;
    }
    this.addSocket(identity.partyId, identity.playerId, socket);
    if (outcome.changed) this.broadcast(identity.partyId);
    else this.sendSnapshot(socket, outcome.state, identity.playerId);
  }

  socketClosed(identity: PartySocketIdentity, socket: PartySocket): void {
    if (this.isStopping) return;
    const playerSockets = this.getSocketSet(identity.partyId, identity.playerId);
    if (!playerSockets || !playerSockets.delete(socket)) return;
    if (playerSockets.size > 0) return;
    this.deleteSocketSet(identity.partyId, identity.playerId);

    const now = this.now();
    const changed = this.store.transaction(() => {
      const state = this.store.getPartyById(identity.partyId);
      if (!state) return false;
      const player = state.players.find((candidate) => candidate.id === identity.playerId && candidate.sessionHash === identity.sessionHash);
      if (!player || !player.connected) return false;
      player.connected = false;
      player.disconnectedAt = now;
      state.version += 1;
      this.store.saveParty(state);
      return true;
    });
    if (changed) this.broadcast(identity.partyId);
  }

  maintenance(): void {
    if (this.isStopping || this.isMaintaining) return;
    this.isMaintaining = true;
    try {
      const now = this.now();
      this.removeExpiredSessions(now);
      this.removeExpiredMembers(now);
      this.pruneInactiveParties(now);
      this.advanceDeadlines(now);
    } finally {
      this.isMaintaining = false;
    }
  }

  private recoverPersistedParties(): void {
    const now = this.now();
    for (const party of this.store.listParties()) {
      this.store.transaction(() => {
        const state = this.store.getPartyById(party.id);
        if (!state) return;
        if (this.store.listMembershipsForParty(state.id).length !== state.players.length) throw internalMembershipError();
        for (const player of state.players) this.assertMembershipRow(state, player);
        for (const player of state.players) {
          player.connected = false;
          player.disconnectedAt = now;
        }
        state.version += 1;
        this.store.saveParty(state);
      });
    }
    this.removeExpiredSessions(now);
    this.pruneInactiveParties(now);
    this.advanceDeadlines(now);
  }

  private removeExpiredSessions(now: number): void {
    for (const candidate of this.store.listExpiredSessions(now)) {
      const outcome = this.store.transaction(() => {
        const session = this.store.getSession(candidate.tokenHash);
        if (!session || session.expiresAt > now) return null;
        const membership = this.store.getMembership(candidate.tokenHash);
        if (!membership) {
          this.store.deleteSession(candidate.tokenHash);
          return null;
        }

        const state = this.store.getPartyById(membership.partyId);
        if (!state) throw internalMembershipError();
        const player = state.players.find((person) => person.id === membership.playerId && person.sessionHash === candidate.tokenHash);
        if (!player) throw internalMembershipError();
        this.assertMembershipRow(state, player);
        this.store.deleteMembership(candidate.tokenHash);
        const removed = playerDeparture(state, player.id, now, false);
        const deleted = state.players.length === 0;
        if (deleted) this.store.deleteParty(state.id);
        else this.store.saveParty(state);
        this.store.deleteSession(candidate.tokenHash);
        return { partyId: state.id, playerId: removed.id, deleted };
      });
      if (!outcome) continue;
      if (outcome.partyId) {
        this.removePlayerSockets(outcome.partyId, outcome.playerId, "expired");
        if (outcome.deleted) this.removePartySockets(outcome.partyId, "expired");
        else this.broadcast(outcome.partyId);
      }
    }
  }

  private removeExpiredMembers(now: number): void {
    for (const party of this.store.listParties()) {
      const outcome = this.store.transaction(() => {
        const state = this.store.getPartyById(party.id);
        if (!state) return null;
        const expired = state.players.filter((player) =>
          !player.connected && player.disconnectedAt !== null && now - player.disconnectedAt >= RECONNECTION_GRACE_MS,
        );
        if (expired.length === 0) return null;
        for (const player of expired) {
          this.assertMembershipRow(state, player);
          this.store.deleteMembership(player.sessionHash);
          playerDeparture(state, player.id, now, false);
        }
        const deleted = state.players.length === 0;
        if (deleted) this.store.deleteParty(state.id);
        else this.store.saveParty(state);
        return { partyId: state.id, playerIds: expired.map((player) => player.id), deleted };
      });
      if (!outcome) continue;
      for (const playerId of outcome.playerIds) this.removePlayerSockets(outcome.partyId, playerId, "expired");
      if (outcome.deleted) this.removePartySockets(outcome.partyId, "expired");
      else this.broadcast(outcome.partyId);
    }
  }

  private pruneInactiveParties(now: number): void {
    for (const party of this.store.listParties()) {
      const deleted = this.store.transaction(() => {
        const state = this.store.getPartyById(party.id);
        if (!state || now - state.updatedAt < PARTY_INACTIVITY_MS) return false;
        this.store.deleteParty(state.id);
        return true;
      });
      if (deleted) this.removePartySockets(party.id, "expired");
    }
  }

  private advanceDeadlines(now: number): void {
    if (!this.deadlineHandler || this.isStopping) return;
    for (const party of this.store.listParties()) {
      const changed = this.store.transaction(() => {
        const state = this.store.getPartyById(party.id);
        if (!state || !this.deadlineHandler) return false;
        if (!this.deadlineHandler(state, this.context(state.id, now))) return false;
        state.version += 1;
        state.updatedAt = now;
        this.store.saveParty(state);
        return true;
      });
      if (changed) this.broadcast(party.id);
    }
  }

  private generateCode(): string {
    let code = "";
    for (let index = 0; index < 6; index += 1) {
      const selection = this.randomInt(CODE_ALPHABET.length);
      if (!Number.isInteger(selection) || selection < 0 || selection >= CODE_ALPHABET.length) {
        throw new Error("randomInt returned a value outside its requested range");
      }
      code += CODE_ALPHABET[selection];
    }
    return code;
  }

  private requireSession(sessionHash: string, now: number): void {
    const session = this.store.getSession(sessionHash);
    if (!session || session.expiresAt <= now) throw sessionRequired();
  }

  private currentPartyCode(sessionHash: string): string | null {
    const membership = this.store.getMembership(sessionHash);
    if (!membership) return null;
    const state = this.store.getPartyById(membership.partyId);
    if (!state) throw internalMembershipError();
    const player = state.players.find((candidate) => candidate.id === membership.playerId && candidate.sessionHash === sessionHash);
    if (!player) throw internalMembershipError();
    return state.code;
  }

  private requireMember(state: PartyState, sessionHash: string): PlayerState {
    const membership = this.store.getMembership(sessionHash);
    if (!membership || membership.partyId !== state.id) {
      if (state.bannedSessionHashes.includes(sessionHash)) throw apiError("KICKED", 403, "You were removed from this party.");
      throw apiError("NOT_MEMBER", 403, "You are not a member of this party.");
    }
    const player = state.players.find((candidate) => candidate.id === membership.playerId && candidate.sessionHash === sessionHash);
    if (!player) throw internalMembershipError();
    return player;
  }

  private assertMembershipRow(state: PartyState, player: PlayerState): void {
    const membership = this.store.getMembership(player.sessionHash);
    if (!membership || membership.partyId !== state.id || membership.playerId !== player.id) throw internalMembershipError();
  }

  private context(partyId: string, now: number): PartyActionContext {
    return { now, randomInt: this.randomInt, connectedIds: this.connectedIds(partyId) };
  }

  private connectedIds(partyId: string): ReadonlySet<string> {
    return new Set(this.sockets.get(partyId)?.keys() ?? []);
  }

  private getSocketSet(partyId: string, playerId: string): Set<PartySocket> | undefined {
    return this.sockets.get(partyId)?.get(playerId);
  }

  private addSocket(partyId: string, playerId: string, socket: PartySocket): void {
    let players = this.sockets.get(partyId);
    if (!players) {
      players = new Map();
      this.sockets.set(partyId, players);
    }
    let playerSockets = players.get(playerId);
    if (!playerSockets) {
      playerSockets = new Set();
      players.set(playerId, playerSockets);
    }
    playerSockets.add(socket);
  }

  private deleteSocketSet(partyId: string, playerId: string): void {
    const players = this.sockets.get(partyId);
    players?.delete(playerId);
    if (players?.size === 0) this.sockets.delete(partyId);
  }

  private removePlayerSockets(partyId: string, playerId: string, reason: RemovedSocketEvent["reason"]): void {
    const playerSockets = this.getSocketSet(partyId, playerId);
    if (!playerSockets) return;
    this.deleteSocketSet(partyId, playerId);
    for (const socket of playerSockets) {
      this.notifyRemoved(socket, reason);
    }
  }

  private removePartySockets(partyId: string, reason: RemovedSocketEvent["reason"]): void {
    const players = this.sockets.get(partyId);
    if (!players) return;
    this.sockets.delete(partyId);
    for (const playerSockets of players.values()) {
      for (const socket of playerSockets) {
        this.notifyRemoved(socket, reason);
      }
    }
  }

  private notifyRemoved(socket: PartySocket, reason: RemovedSocketEvent["reason"]): void {
    this.sendRemoved(socket, reason);
    setTimeout(() => socket.close(1000, reason), REMOVED_SOCKET_CLOSE_DELAY_MS);
  }

  private sendRemoved(socket: PartySocket, reason: RemovedSocketEvent["reason"]): void {
    const event: RemovedSocketEvent = { type: "removed", reason };
    try { socket.send(JSON.stringify(event)); } catch { socket.close(1011, "Unable to send party event"); }
  }

  private sendSnapshot(socket: PartySocket, state: PartyState, viewerId: string): void {
    const event: PartySocketEvent = { type: "snapshot", snapshot: projectParty(state, viewerId, this.connectedIds(state.id)) };
    try { socket.send(JSON.stringify(event)); } catch { socket.close(1011, "Unable to send party snapshot"); }
  }

  private broadcast(partyId: string): void {
    if (this.isStopping) return;
    const players = this.sockets.get(partyId);
    if (!players || players.size === 0) return;
    const state = this.store.getPartyById(partyId);
    if (!state) return;
    const connected = this.connectedIds(partyId);
    for (const [playerId, sockets] of players) {
      const event: PartySocketEvent = { type: "snapshot", snapshot: projectParty(state, playerId, connected) };
      const serialized = JSON.stringify(event);
      for (const socket of sockets) {
        try { socket.send(serialized); } catch { socket.close(1011, "Unable to send party snapshot"); }
      }
    }
  }
}
