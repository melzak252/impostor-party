import { randomUUID } from "node:crypto";
import type { QuestionPair } from "../shared/protocol";
import { projectParty } from "./view";
import { PartyError, type DeferredActionRequest, type PartyActionContext } from "./party";
import type { PartyState, RoundState } from "./model";
import { BUILTIN_QUESTION_PAIRS, getBuiltinQuestionPairs } from "./questions";
const MAX_CUSTOM_QUESTIONS = 50;
const MAX_PROMPT_LENGTH = 200;

function validationError(message: string): PartyError {
  return new PartyError("VALIDATION_ERROR", 400, message);
}

function forbidden(message: string): PartyError {
  return new PartyError("FORBIDDEN", 403, message);
}

function requireLobbyHost(state: PartyState, actorId: string): void {
  if (actorId !== state.hostId) throw forbidden("Only the host can manage questions or start a round.");
  if (state.phase !== "lobby") throw forbidden("Questions and rounds can only be changed in the lobby.");
}

function normalizePair(normalQuestion: string, impostorQuestion: string): Omit<QuestionPair, "id"> {
  const normal = normalQuestion.trim();
  const impostor = impostorQuestion.trim();
  const normalLength = Array.from(normal).length;
  const impostorLength = Array.from(impostor).length;
  if (normalLength < 1 || normalLength > MAX_PROMPT_LENGTH || impostorLength < 1 || impostorLength > MAX_PROMPT_LENGTH) {
    throw validationError("Each question must contain between 1 and 200 characters.");
  }
  if (normal.toLowerCase() === impostor.toLowerCase()) {
    throw validationError("The normal and impostor questions must be different.");
  }
  return { normalQuestion: normal, impostorQuestion: impostor };
}

function eligibleQuestions(state: PartyState): readonly QuestionPair[] {
  const builtin = getBuiltinQuestionPairs(
    Boolean(state.settings.spicyMode),
    state.settings.language ?? "en",
    state.settings.enabledTopics,
  );
  switch (state.settings.questionSource) {
    case "builtin":
      return builtin;
    case "custom":
      return state.customQuestions;
    case "mixed":
      return [...builtin, ...state.customQuestions];
  }
}

function randomIndex(context: PartyActionContext, maxExclusive: number): number {
  const selection = context.randomInt(maxExclusive);
  if (!Number.isInteger(selection) || selection < 0 || selection >= maxExclusive) {
    throw new Error("randomInt returned a value outside its requested range");
  }
  return selection;
}

function startRound(state: PartyState, context: PartyActionContext, mode: "start" | "next" | "skip" = "start"): void {
  if (state.players.length < 3 || state.players.length > 6 || state.players.some((player) => !context.connectedIds.has(player.id))) {
    throw new PartyError("NOT_READY", 409, "At least three players must be connected before the host can start a round.");
  }

  const availableQuestions = eligibleQuestions(state);
  if (availableQuestions.length === 0) {
    throw new PartyError("NO_QUESTIONS", 409, "Add a custom question pair or choose a source with available questions.");
  }

  const usedQuestionIds = new Set(state.usedQuestionIds);
  const usedNormalQuestions = new Set(state.usedNormalQuestions ?? []);
  const freshNormalQuestions = availableQuestions.filter((pair) => !usedNormalQuestions.has(pair.normalQuestion));
  const isResettingNormals = freshNormalQuestions.length === 0;
  const normalPool = isResettingNormals ? availableQuestions : freshNormalQuestions;
  const unusedPairsInPool = normalPool.filter((pair) => !usedQuestionIds.has(pair.id));
  const isResettingBag = isResettingNormals || unusedPairsInPool.length === 0;
  const selectionPool = unusedPairsInPool.length > 0 ? unusedPairsInPool : normalPool;
  const selectedPair = selectionPool[randomIndex(context, selectionPool.length)]!;
  const impostor = state.players[randomIndex(context, state.players.length)]!;
  const nextUsedQuestionIds = isResettingBag ? [] : [...state.usedQuestionIds];
  nextUsedQuestionIds.push(selectedPair.id);
  const nextUsedNormalQuestions = isResettingNormals ? [] : [...(state.usedNormalQuestions ?? [])];
  if (!nextUsedNormalQuestions.includes(selectedPair.normalQuestion)) {
    nextUsedNormalQuestions.push(selectedPair.normalQuestion);
  }

  const totalRounds = state.settings.roundCount ?? 5;
  const currentMatchRound = state.round?.matchRound ?? 1;
  const matchRound =
    mode === "start" ? 1 : mode === "next" ? currentMatchRound + 1 : currentMatchRound;
  if (mode === "next" && matchRound > totalRounds) {
    throw forbidden("All rounds in this match are complete. Return to the lobby to play again.");
  }
  if (mode === "start") {
    for (const player of state.players) player.score = 0;
  }

  const friendlyPairIds = state.settings.spicyMode
    ? new Set(
        getBuiltinQuestionPairs(
          false,
          state.settings.language ?? "en",
          state.settings.enabledTopics,
        ).map((pair) => pair.id),
      )
    : null;
  const isSpicy =
    Boolean(state.settings.spicyMode) &&
    state.settings.questionSource !== "custom" &&
    !state.customQuestions.some((custom) => custom.id === selectedPair.id) &&
    friendlyPairIds !== null &&
    !friendlyPairIds.has(selectedPair.id);

  const answerTimeSeconds = state.settings.answerTimeSeconds ?? 60;
  const answerDeadlineAt = answerTimeSeconds > 0 ? context.now + answerTimeSeconds * 1000 : null;
  const number = state.lastRoundNumber + 1;
  state.lastRoundNumber = number;
  state.usedQuestionIds = nextUsedQuestionIds;
  state.usedNormalQuestions = nextUsedNormalQuestions;
  state.round = {
    id: randomUUID(),
    number,
    matchRound,
    isSpicy,
    participants: state.players.map(({ id, name, colorId }) => ({ id, name, colorId })),
    normalQuestion: selectedPair.normalQuestion,
    impostorQuestion: selectedPair.impostorQuestion,
    impostorId: impostor.id,
    answers: {},
    readyPlayerIds: [],
    votes: {},
    answerDeadlineAt,
    questionRevealAt: null,
  };
  state.phase = "answering";
  state.notice = null;
}

function staleAction(state: PartyState, actorId: string, connectedIds: ReadonlySet<string>): PartyError {
  const snapshot = state.players.some((player) => player.id === actorId)
    ? projectParty(state, actorId, connectedIds)
    : undefined;
  return new PartyError("STALE_ACTION", 409, "This action is out of date. Refresh the party and try again.", snapshot);
}

function currentRound(state: PartyState, actorId: string): RoundState {
  const round = state.round;
  if (!round || !round.participants.some((participant) => participant.id === actorId)) {
    throw forbidden("Only players in this round can take this action.");
  }
  return round;
}

const ANSWER_REVEAL_STEP_MS = 2_000;
const AUTO_QUESTION_REVEAL_DELAY_MS = 8_000;

function autoQuestionRevealAt(state: PartyState, round: RoundState, now: number): number | null {
  if (state.settings.questionRevealMode !== "auto") return null;
  return now + round.participants.length * ANSWER_REVEAL_STEP_MS + AUTO_QUESTION_REVEAL_DELAY_MS;
}

function transitionAfterReady(state: PartyState, round: RoundState, context: PartyActionContext): void {
  const allReady = round.participants.every((participant) => round.readyPlayerIds.includes(participant.id));
  if (!allReady) return;
  if (state.phase === "answering" && !round.participants.every((participant) => Object.hasOwn(round.answers, participant.id))) {
    throw new PartyError("NOT_READY", 409, "Every player must submit an answer before revealing answers.");
  }

  round.readyPlayerIds = [];
  if (state.phase === "answering") {
    state.phase = "answers";
    round.answerDeadlineAt = null;
    round.questionRevealAt = autoQuestionRevealAt(state, round, context.now);
    return;
  }
  if (state.phase === "answers") {
    state.phase = "voting";
    round.questionRevealAt = null;
    return;
  }
  if (state.phase === "question") {
    state.phase = "voting";
    round.questionRevealAt = null;
  }
}

function setReady(state: PartyState, actorId: string, ready: boolean, context: PartyActionContext): void {
  const round = currentRound(state, actorId);
  if (state.phase === "answering") {
    if (ready) {
      if (!Object.hasOwn(round.answers, actorId)) {
        throw new PartyError("NOT_READY", 409, "Submit an answer before locking in.");
      }
      if (!round.readyPlayerIds.includes(actorId)) round.readyPlayerIds.push(actorId);
      transitionAfterReady(state, round, context);
    } else {
      round.readyPlayerIds = round.readyPlayerIds.filter((playerId) => playerId !== actorId);
    }
    return;
  }
  if (state.phase === "answers" && state.settings.questionRevealMode !== "ready") {
    throw forbidden("The question is revealed automatically in this phase.");
  }
  if (state.phase !== "answers" && state.phase !== "question") {
    throw forbidden("Readiness cannot be changed in this phase.");
  }
  if (ready) {
    if (!round.readyPlayerIds.includes(actorId)) round.readyPlayerIds.push(actorId);
    transitionAfterReady(state, round, context);
  } else {
    round.readyPlayerIds = round.readyPlayerIds.filter((playerId) => playerId !== actorId);
  }
}

function submitAnswer(state: PartyState, actorId: string, value: string, context: PartyActionContext): void {
  if (state.phase !== "answering") throw forbidden("Answers can only be submitted during the answer stage.");
  const round = currentRound(state, actorId);
  if (round.readyPlayerIds.includes(actorId)) {
    throw new PartyError("NOT_READY", 409, "Your answer has already been submitted.");
  }
  const answer = value.trim();
  const length = Array.from(answer).length;
  if (length < 1 || length > 80 || /[\u000A-\u000D\u0085\u2028\u2029]/.test(answer)) {
    throw validationError("Answer must be a single line containing 1 to 80 characters.");
  }
  round.answers[actorId] = answer;
  round.readyPlayerIds.push(actorId);
  transitionAfterReady(state, round, context);
}

function submitVote(state: PartyState, actorId: string, targetPlayerId: string): void {
  if (state.phase !== "voting") throw forbidden("Votes can only be cast during the voting stage.");
  const round = currentRound(state, actorId);
  if (Object.hasOwn(round.votes, actorId)) {
    throw new PartyError("INVALID_VOTE", 409, "You have already voted this round.");
  }
  const targetIsCurrentParticipant = round.participants.some((participant) =>
    participant.id === targetPlayerId && state.players.some((player) => player.id === targetPlayerId),
  );
  if (targetPlayerId === actorId || !targetIsCurrentParticipant) {
    throw new PartyError("INVALID_VOTE", 409, "Choose another player who is still in this round.");
  }
  round.votes[actorId] = targetPlayerId;
  if (round.participants.every((participant) => Object.hasOwn(round.votes, participant.id))) {
    const roundPoints: Record<string, number> = {};
    for (const participant of round.participants) roundPoints[participant.id] = 0;
    for (const participant of round.participants) {
      if (participant.id === round.impostorId) continue;
      if (round.votes[participant.id] === round.impostorId) {
        roundPoints[participant.id] = (roundPoints[participant.id] ?? 0) + 1;
      } else {
        roundPoints[round.impostorId] = (roundPoints[round.impostorId] ?? 0) + 1;
      }
    }
    for (const player of state.players) {
      const gained = roundPoints[player.id] ?? 0;
      if (gained > 0) player.score = (player.score ?? 0) + gained;
    }
    round.roundPoints = roundPoints;
    state.phase = "results";
    round.readyPlayerIds = [];
    round.questionRevealAt = null;
  }
}

export function applyGameAction(
  state: PartyState,
  actorId: string,
  request: DeferredActionRequest,
  context: PartyActionContext,
): void {
  const action = request.action;
  if (request.expectedPhase !== state.phase || request.roundId !== (state.round?.id ?? null)) {
    throw staleAction(state, actorId, context.connectedIds);
  }
  if (!state.players.some((player) => player.id === actorId)) throw forbidden("You are not a member of this party.");

  switch (action.type) {
    case "add_question": {
      requireLobbyHost(state, actorId);
      if (state.customQuestions.length >= MAX_CUSTOM_QUESTIONS) {
        throw validationError("A party can have at most 50 custom question pairs.");
      }
      const pair = normalizePair(action.normalQuestion, action.impostorQuestion);
      state.customQuestions.push({ id: randomUUID(), ...pair });
      state.usedQuestionIds = [];
      state.usedNormalQuestions = [];
      return;
    }
    case "edit_question": {
      requireLobbyHost(state, actorId);
      const question = state.customQuestions.find((candidate) => candidate.id === action.questionId);
      if (!question) throw validationError("That custom question pair does not exist.");
      const pair = normalizePair(action.normalQuestion, action.impostorQuestion);
      question.normalQuestion = pair.normalQuestion;
      question.impostorQuestion = pair.impostorQuestion;
      state.usedQuestionIds = [];
      state.usedNormalQuestions = [];
      return;
    }
    case "delete_question": {
      requireLobbyHost(state, actorId);
      const questionIndex = state.customQuestions.findIndex((candidate) => candidate.id === action.questionId);
      if (questionIndex < 0) throw validationError("That custom question pair does not exist.");
      state.customQuestions.splice(questionIndex, 1);
      state.usedQuestionIds = [];
      state.usedNormalQuestions = [];
      return;
    }
    case "start_round":
      requireLobbyHost(state, actorId);
      startRound(state, context, "start");
      return;
    case "skip_round":
      if (state.phase === "lobby" || !state.round) throw forbidden("There is no active round to skip.");
      if (actorId !== state.hostId) throw forbidden("Only the host can skip or reroll the round.");
      startRound(state, context, "skip");
      return;
    case "next_round":
      if (state.phase !== "results") throw forbidden("A next round can only start after results.");
      if (actorId !== state.hostId) throw forbidden("Only the host can start the next round.");
      startRound(state, context, "next");
      return;
    case "submit_answer":
      submitAnswer(state, actorId, action.answer, context);
      return;
    case "set_ready":
      setReady(state, actorId, action.ready, context);
      return;
    case "vote":
      submitVote(state, actorId, action.targetPlayerId);
      return;
    case "return_to_lobby":
      if (state.phase !== "results") throw forbidden("Only the host can return a completed round to the lobby.");
      if (actorId !== state.hostId) throw forbidden("Only the host can return the party to the lobby.");
      state.phase = "lobby";
      state.round = null;
      state.notice = null;
      return;
    default:
      throw forbidden("That action is not available in this phase.");
  }
}

export function advanceGameDeadline(state: PartyState, context: PartyActionContext): boolean {
  if (!state.round) return false;
  if (state.phase === "answering") {
    const deadlineAt = state.round.answerDeadlineAt ?? null;
    if (deadlineAt === null || context.now < deadlineAt) return false;
    for (const participant of state.round.participants) {
      if (!Object.hasOwn(state.round.answers, participant.id)) {
        state.round.answers[participant.id] = "—";
      }
    }
    state.round.readyPlayerIds = [];
    state.round.answerDeadlineAt = null;
    state.phase = "answers";
    state.round.questionRevealAt = autoQuestionRevealAt(state, state.round, context.now);
    return true;
  }
  if (state.phase !== "answers" || state.settings.questionRevealMode !== "auto") return false;
  const revealAt = state.round.questionRevealAt;
  if (revealAt === null || context.now < revealAt) return false;
  state.round.readyPlayerIds = [];
  state.round.questionRevealAt = null;
  state.phase = "voting";
  return true;
}
