import type { ColorId, PartySettings, Phase } from "../shared/protocol";

export interface PlayerState { id: string; sessionHash: string; name: string; colorId: ColorId; joinedAt: number; connected: boolean; disconnectedAt: number | null; score?: number }
export interface RoundState {
  id: string; number: number; matchRound?: number; isSpicy?: boolean; participants: Array<{ id: string; name: string; colorId: ColorId }>;
  normalQuestion: string; impostorQuestion: string; impostorId: string; answers: Record<string, string>;
  readyPlayerIds: string[]; rerollVoterIds?: string[]; votes: Record<string, string>; answerDeadlineAt?: number | null; questionRevealAt: number | null; voteDeadlineAt?: number | null;
  roundPoints?: Record<string, number>;
}
export interface PartyState {
  id: string; code: string; roomName?: string; version: number; createdAt: number; updatedAt: number; hostId: string; phase: Phase;
  settings: PartySettings; players: PlayerState[]; customQuestions: Array<{ id: string; normalQuestion: string; impostorQuestion: string }>;
  usedQuestionIds: string[]; usedNormalQuestions?: string[]; lastRoundNumber: number; round: RoundState | null;
  bannedSessionHashes: string[]; notice: { type: "round_cancelled"; playerName: string } | null;
}
