import type { PartySnapshot, RoundSnapshot } from "../shared/protocol";
import type { PartyState } from "./model";

export function projectParty(state: PartyState, viewerId: string, connectedIds: ReadonlySet<string>): PartySnapshot {
  const viewer = state.players.find((player) => player.id === viewerId);
  if (!viewer) throw new Error("Cannot project a party snapshot for a nonmember");

  const snapshot: PartySnapshot = {
    code: state.code,
    version: state.version,
    phase: state.phase,
    hostId: state.hostId,
    selfId: viewer.id,
    settings: { ...state.settings },
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      colorId: player.colorId,
      connected: connectedIds.has(player.id),
      hasAnswered: Boolean(state.round && Object.hasOwn(state.round.answers, player.id)),
      isReady: Boolean(state.round?.readyPlayerIds.includes(player.id)),
      hasVoted: Boolean(state.round && Object.hasOwn(state.round.votes, player.id)),
    })),
    round: null,
    notice: state.notice ? { ...state.notice } : null,
  };

  if (state.phase === "lobby" && viewer.id === state.hostId) {
    snapshot.customQuestions = state.customQuestions.map((pair) => ({ ...pair }));
  }

  const round = state.round;
  if (!round) return snapshot;

  const roundSnapshot: RoundSnapshot = {
    id: round.id,
    number: round.number,
    participants: round.participants.map((participant) => ({ ...participant })),
    privateQuestion: viewer.id === round.impostorId ? round.impostorQuestion : round.normalQuestion,
    myAnswer: Object.hasOwn(round.answers, viewer.id) ? round.answers[viewer.id]! : null,
    myVote: Object.hasOwn(round.votes, viewer.id) ? round.votes[viewer.id]! : null,
    questionRevealAt: round.questionRevealAt,
  };

  if (state.phase === "answers" || state.phase === "question" || state.phase === "voting" || state.phase === "results") {
    roundSnapshot.answers = { ...round.answers };
  }
  if (state.phase === "question" || state.phase === "voting" || state.phase === "results") {
    roundSnapshot.normalQuestion = round.normalQuestion;
  }
  if (state.phase === "results") {
    roundSnapshot.impostorQuestion = round.impostorQuestion;
    roundSnapshot.impostorId = round.impostorId;
    roundSnapshot.votes = { ...round.votes };
  }

  snapshot.round = roundSnapshot;
  return snapshot;
}
