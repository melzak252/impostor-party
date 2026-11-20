import { z } from "zod";
import {
  ActionRequestSchema,
  ColorIdSchema,
  PartySettingsSchema,
  PhaseSchema,
  QuestionPairSchema,
  type ActionRequest,
  type GameLanguage,
  type PartyAction,
  type PartySettings,
  type PartySnapshot,
  type Phase,
} from "../shared/protocol";

export interface SessionResponse {
  currentPartyCode: string | null;
}

export interface PublicParty {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: 6;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly snapshot?: PartySnapshot,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const partyCodes = /^[A-HJ-NP-Z2-9]{6}$/;

export function normalizePartyCode(value: string): string | null {
  const code = value.trim().toUpperCase().replace(/[\s-]+/g, "");
  return partyCodes.test(code) ? code : null;
}

const PlayerSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  colorId: ColorIdSchema,
  connected: z.boolean(),
  hasAnswered: z.boolean(),
  isReady: z.boolean(),
  hasVoted: z.boolean(),
}).strict();
const RoundParticipantSchema = z.object({ id: z.string(), name: z.string(), colorId: ColorIdSchema }).strict();
const RoundSnapshotSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  participants: z.array(RoundParticipantSchema),
  privateQuestion: z.string(),
  myAnswer: z.string().nullable(),
  myVote: z.string().nullable(),
  questionRevealAt: z.number().nullable(),
  answers: z.record(z.string(), z.string()).optional(),
  normalQuestion: z.string().optional(),
  impostorQuestion: z.string().optional(),
  impostorId: z.string().optional(),
  votes: z.record(z.string(), z.string()).optional(),
}).strict();
const PartySnapshotSchema = z.object({
  code: z.string(),
  version: z.number().int().nonnegative(),
  phase: PhaseSchema,
  hostId: z.string(),
  selfId: z.string(),
  settings: PartySettingsSchema,
  players: z.array(PlayerSnapshotSchema),
  round: RoundSnapshotSchema.nullable(),
  notice: z.object({ type: z.literal("round_cancelled"), playerName: z.string() }).strict().nullable(),
  customQuestions: z.array(QuestionPairSchema).optional(),
}).strict();
const SnapshotResponseSchema = z.object({ snapshot: PartySnapshotSchema }).strict();
const ErrorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }).strict(),
  snapshot: PartySnapshotSchema.optional(),
}).strict();
const SessionResponseSchema = z.object({ currentPartyCode: z.string().nullable() }).strict();
const PublicPartyListSchema = z.object({
  parties: z.array(z.object({
    code: z.string(),
    hostName: z.string(),
    playerCount: z.number().int().nonnegative(),
    maxPlayers: z.literal(6),
  }).strict()),
}).strict();

export function isPartySnapshot(value: unknown): value is PartySnapshot {
  return PartySnapshotSchema.safeParse(value).success;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError("NETWORK_ERROR", "Unable to reach the party server. Check your connection and try again.", 0);
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "same-origin",
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch (error) {
    throw toApiError(error);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("INTERNAL_ERROR", "The server returned an unreadable response.", response.status);
  }

  if (!response.ok) {
    const parsed = ErrorResponseSchema.safeParse(payload);
    if (!parsed.success) throw new ApiError("INTERNAL_ERROR", "The server returned an invalid error response.", response.status);
    throw new ApiError(parsed.data.error.code, parsed.data.error.message, response.status, parsed.data.snapshot);
  }
  return payload;
}

function requireSnapshot(payload: unknown): PartySnapshot {
  const parsed = SnapshotResponseSchema.safeParse(payload);
  if (parsed.success) return parsed.data.snapshot;
  throw new ApiError("INTERNAL_ERROR", "The server returned an invalid party snapshot.", 500);
}

export async function createSession(): Promise<SessionResponse> {
  const payload = await request("/api/session", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const parsed = SessionResponseSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError("INTERNAL_ERROR", "The server returned an invalid guest session.", 500);
  return parsed.data;
}

export async function listParties(): Promise<PublicParty[]> {
  const payload = await request("/api/parties");
  const parsed = PublicPartyListSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError("INTERNAL_ERROR", "The server returned an invalid party list.", 500);
  return parsed.data.parties;
}

export async function createParty(name: string, visibility: "private" | "public", language?: GameLanguage): Promise<PartySnapshot> {
  const payload = await request("/api/parties", {
    method: "POST",
    body: JSON.stringify({ name, visibility, ...(language ? { language } : {}) }),
  });
  return requireSnapshot(payload);
}

export async function joinParty(code: string, name: string): Promise<PartySnapshot> {
  const normalizedCode = normalizePartyCode(code);
  if (!normalizedCode) throw new ApiError("VALIDATION_ERROR", "Enter a valid six-character party code.", 400);
  const payload = await request(`/api/parties/${normalizedCode}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return requireSnapshot(payload);
}

export async function getParty(code: string): Promise<PartySnapshot> {
  const normalizedCode = normalizePartyCode(code);
  if (!normalizedCode) throw new ApiError("VALIDATION_ERROR", "Enter a valid six-character party code.", 400);
  const payload = await request(`/api/parties/${normalizedCode}`);
  return requireSnapshot(payload);
}

const LeftResponseSchema = z.object({ left: z.literal(true) }).strict();

export async function sendAction(code: string, action: PartyAction, phase: Phase, roundId: string | null): Promise<{ snapshot: PartySnapshot } | { left: true }> {
  const normalizedCode = normalizePartyCode(code);
  if (!normalizedCode) throw new ApiError("VALIDATION_ERROR", "Enter a valid six-character party code.", 400);
  const parsedRequest = ActionRequestSchema.safeParse({ expectedPhase: phase, roundId, action });
  if (!parsedRequest.success) throw new ApiError("VALIDATION_ERROR", "This party action is not valid.", 400);
  const requestBody: ActionRequest = parsedRequest.data;
  const payload = await request(`/api/parties/${normalizedCode}/actions`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  if (LeftResponseSchema.safeParse(payload).success) return { left: true };
  return { snapshot: requireSnapshot(payload) };
}

export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (${error.code})`;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function asApiError(error: unknown): ApiError {
  return toApiError(error);
}

export type { PartyAction, PartySettings, PartySnapshot };
