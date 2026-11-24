import { expect, test } from "bun:test";
import type { ColorId } from "../shared/protocol";
import { projectParty } from "../server/view";
import { PartyError, type DeferredActionRequest, type PartyActionContext } from "../server/party";
import type { PartyState, PlayerState } from "../server/model";
import { advanceGameDeadline, applyGameAction } from "../server/game";
import { BUILTIN_QUESTION_PAIRS } from "../server/questions";

const PLAYER_IDS = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
] as const;
const PLAYER_COLORS: readonly ColorId[] = ["coral", "amber", "mint"];
const HOST_ID = PLAYER_IDS[0];

function makeParty(overrides: Partial<PartyState> = {}): PartyState {
  const players: PlayerState[] = PLAYER_IDS.map((id, index) => ({
    id,
    sessionHash: String(index + 1).repeat(64),
    name: `Player ${index + 1}`,
    colorId: PLAYER_COLORS[index]!,
    joinedAt: index,
    connected: true,
    disconnectedAt: null,
  }));
  return {
    id: "00000000-0000-4000-8000-000000000010",
    code: "ABC234",
    version: 1,
    createdAt: 0,
    updatedAt: 0,
    hostId: HOST_ID,
    phase: "lobby",
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "builtin" },
    players,
    customQuestions: [],
    usedQuestionIds: [],
    lastRoundNumber: 0,
    round: null,
    bannedSessionHashes: [],
    notice: null,
    ...overrides,
  };
}

function makeContext(draws: number[] = []): PartyActionContext {
  let nextDraw = 0;
  return {
    now: 1234,
    connectedIds: new Set(PLAYER_IDS),
    randomInt(maxExclusive) {
      const draw = draws[nextDraw++];
      if (draw === undefined || draw < 0 || draw >= maxExclusive) throw new Error("Unexpected deterministic random draw");
      return draw;
    },
  };
}

function startRound(state: PartyState, context: PartyActionContext): void {
  const request: DeferredActionRequest = {
    expectedPhase: "lobby",
    roundId: null,
    action: { type: "start_round" },
  };
  applyGameAction(state, HOST_ID, request, context);
}

function caughtPartyError(run: () => void): PartyError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(PartyError);
    return error as PartyError;
  }
  throw new Error("Expected a party action to fail");
}

test("built-in catalogue contains all 24 exact ordered question pairs", () => {
  const expected = [
    ["How many push-ups can you do in a row?", "Pick a random whole number between 1 and 40."],
    ["How many doughnuts could you eat in one sitting?", "How many slices of pizza could you eat in one sitting?"],
    ["How old were you when you had your first crush?", "How old were you when you got your first phone?"],
    ["How many alarms do you set in the morning?", "How many times do you hit snooze before getting up?"],
    ["How many minutes does it take you to get ready to go out?", "How many minutes do you spend in the shower?"],
    ["How many hours do you usually sleep each night?", "How many hours of screen time do you have each day?"],
    ["How many countries have you visited?", "How many different cities have you lived in?"],
    ["How many cups of coffee do you drink in a week?", "How many cups of tea do you drink in a week?"],
    ["How many seconds can you hold a plank?", "How many seconds can you hold your breath?"],
    ["How many different apps do you open in a day?", "How many messages do you send in a day?"],
    ["How many pets have you had in your life?", "How many houseplants are in your home?"],
    ["How many minutes is your usual commute?", "How many minutes would you wait in line for your favourite food?"],
    ["How old were you when you learned to swim?", "How old were you when you learned to ride a bike?"],
    ["How many browser tabs do you have open right now?", "How many unread emails do you have right now?"],
    ["How many movies do you watch in a month?", "How many TV episodes do you watch in a week?"],
    ["How many days would your ideal holiday last?", "How many days could you go without the internet?"],
    ["How many pairs of shoes do you own?", "How many hats do you own?"],
    ["How many pizza slices would you buy for a small party?", "How many people would you invite to a small party?"],
    ["How many sit-ups can you do in a row?", "How many squats can you do in a row?"],
    ["How many books have you read in the last year?", "How many video games have you finished in the last year?"],
    ["How many minutes do you walk on a typical day?", "How many minutes do you exercise on a typical day?"],
    ["How old were you at your first concert?", "How old were you on your first trip without your parents?"],
    ["How many photos did you take last week?", "How many times do you unlock your phone in a day?"],
    ["How many passwords can you remember without checking?", "How many phone numbers do you know by heart?"],
  ];
  expect(BUILTIN_QUESTION_PAIRS).toEqual(expected.map(([normalQuestion, impostorQuestion], index) => ({
    id: `builtin-${String(index + 1).padStart(2, "0")}`,
    normalQuestion,
    impostorQuestion,
  })));
});

test("custom-only source starts a round from its saved pair", () => {
  const custom = {
    id: "00000000-0000-4000-8000-000000000020",
    normalQuestion: "Favourite fruit?",
    impostorQuestion: "Favourite vegetable?",
  };
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "custom" },
    customQuestions: [custom],
  });

  startRound(state, makeContext([0, 1]));

  expect(state.phase).toBe("answering");
  expect(state.round?.normalQuestion).toBe(custom.normalQuestion);
  expect(state.round?.impostorQuestion).toBe(custom.impostorQuestion);
  expect(state.usedQuestionIds).toEqual([custom.id]);
});

test("custom-only source without pairs fails with NO_QUESTIONS without changing party state", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "custom" },
    usedQuestionIds: ["old-question"],
  });
  const error = caughtPartyError(() => startRound(state, makeContext()));

  expect(error.code).toBe("NO_QUESTIONS");
  expect(error.status).toBe(409);
  expect(state.phase).toBe("lobby");
  expect(state.round).toBeNull();
  expect(state.usedQuestionIds).toEqual(["old-question"]);
});

test("a deterministic round gives one player the alternate prompt without leaking secrets", () => {
  const state = makeParty();
  startRound(state, makeContext([0, 2]));

  const alternate = BUILTIN_QUESTION_PAIRS[0]!.impostorQuestion;
  const assignedQuestions = PLAYER_IDS.map((playerId) => {
    const snapshot = projectParty(state, playerId, new Set(PLAYER_IDS));
    expect(snapshot.round).not.toHaveProperty("impostorQuestion");
    expect(snapshot.round).not.toHaveProperty("impostorId");
    expect(snapshot.round).not.toHaveProperty("votes");
    return snapshot.round!.privateQuestion;
  });

  expect(assignedQuestions.filter((question) => question === alternate)).toHaveLength(1);
  expect(assignedQuestions.filter((question) => question === BUILTIN_QUESTION_PAIRS[0]!.normalQuestion)).toHaveLength(2);
  expect(new Set(assignedQuestions).size).toBe(2);
});

test("custom pair edits are host-only, lobby-only, trimmed, and clear the used bag", () => {
  const state = makeParty({ usedQuestionIds: ["previous"] });
  const request: DeferredActionRequest = {
    expectedPhase: "lobby",
    roundId: null,
    action: { type: "add_question", normalQuestion: "  What is your favourite season?  ", impostorQuestion: "  What is your favourite month?  " },
  };

  applyGameAction(state, HOST_ID, request, makeContext());

  expect(state.customQuestions).toHaveLength(1);
  expect(state.customQuestions[0]).toMatchObject({
    normalQuestion: "What is your favourite season?",
    impostorQuestion: "What is your favourite month?",
  });
  expect(state.customQuestions[0]!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(state.usedQuestionIds).toEqual([]);

  const invalidRequest: DeferredActionRequest = {
    ...request,
    action: { type: "add_question", normalQuestion: " SAME ", impostorQuestion: "same" },
  };
  const error = caughtPartyError(() => applyGameAction(state, HOST_ID, invalidRequest, makeContext()));
  expect(error.code).toBe("VALIDATION_ERROR");
  expect(state.customQuestions).toHaveLength(1);
});
test("custom question pairs are visible only to the host in the lobby", () => {
  const pair = {
    id: "00000000-0000-4000-8000-000000000020",
    normalQuestion: "Favourite fruit?",
    impostorQuestion: "Favourite vegetable?",
  };
  const state = makeParty({ customQuestions: [pair] });

  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS)).customQuestions).toEqual([pair]);
  expect(projectParty(state, PLAYER_IDS[1]!, new Set(PLAYER_IDS))).not.toHaveProperty("customQuestions");

  startRound(state, makeContext([0, 1]));
  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS))).not.toHaveProperty("customQuestions");
  expect(projectParty(state, PLAYER_IDS[1]!, new Set(PLAYER_IDS))).not.toHaveProperty("customQuestions");
});

function actionRequest(state: PartyState, action: DeferredActionRequest["action"]): DeferredActionRequest {
  return {
    expectedPhase: state.phase,
    roundId: state.round?.id ?? null,
    action,
  };
}

function apply(state: PartyState, actorId: string, action: DeferredActionRequest["action"], context = makeContext()): void {
  applyGameAction(state, actorId, actionRequest(state, action), context);
}

function submitAnswers(state: PartyState, context: PartyActionContext): void {
  for (const [index, playerId] of PLAYER_IDS.entries()) {
    apply(state, playerId, { type: "submit_answer", answer: `answer ${index + 1}` }, context);
  }
}

function readyAll(state: PartyState, context: PartyActionContext): void {
  for (const playerId of PLAYER_IDS) {
    apply(state, playerId, { type: "set_ready", ready: true }, context);
  }
}

test("answer submissions mark players ready and preserve answer privacy until the final submission", () => {
  const state = makeParty();
  const context = makeContext([0, 2, 0, 1]);
  startRound(state, context);
  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "answer 1" }, context);
  apply(state, PLAYER_IDS[1], { type: "submit_answer", answer: "answer 2" }, context);
  expect(state.phase).toBe("answering");

  for (const [index, playerId] of PLAYER_IDS.entries()) {
    const snapshot = projectParty(state, playerId, new Set(PLAYER_IDS));
    expect(snapshot.phase).toBe("answering");
    expect(snapshot.round?.myAnswer).toBe(index < 2 ? `answer ${index + 1}` : null);
    expect(snapshot.round).not.toHaveProperty("answers");
    expect(snapshot.players.map((player) => player.isReady)).toEqual([true, true, false]);
  }

  apply(state, PLAYER_IDS[2], { type: "submit_answer", answer: "answer 3" }, context);
  expect(state.phase).toBe("answers");
  expect(state.round?.readyPlayerIds).toEqual([]);

  for (const playerId of PLAYER_IDS) {
    const snapshot = projectParty(state, playerId, new Set(PLAYER_IDS));
    const round = snapshot.round!;
    expect(Object.keys(round).sort()).toEqual([
      "answerDeadlineAt", "answers", "canVote", "id", "isSpicy", "matchRound", "myAnswer", "myRerollVote", "myVote", "number", "participants", "privateQuestion", "questionRevealAt", "rerollThreshold", "rerollVotes", "totalRounds", "voteDeadlineAt",
    ]);
    expect(round.answers).toEqual({
      [PLAYER_IDS[0]]: "answer 1",
      [PLAYER_IDS[1]]: "answer 2",
      [PLAYER_IDS[2]]: "answer 3",
    });
    expect(round).not.toHaveProperty("normalQuestion");
    expect(round).not.toHaveProperty("impostorQuestion");
    expect(round).not.toHaveProperty("impostorId");
    expect(round).not.toHaveProperty("votes");
  }


  readyAll(state, context);
  expect(state.phase).toBe("voting");
  for (const playerId of PLAYER_IDS) {
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(Object.keys(round).sort()).toEqual([
      "answerDeadlineAt", "answers", "canVote", "id", "isSpicy", "matchRound", "myAnswer", "myRerollVote", "myVote", "normalQuestion", "number", "participants", "privateQuestion", "questionRevealAt", "rerollThreshold", "rerollVotes", "totalRounds", "voteDeadlineAt",
    ]);
    expect(round.normalQuestion).toBe(BUILTIN_QUESTION_PAIRS[0]!.normalQuestion);
    expect(round.myVote).toBeNull();
    expect(round).not.toHaveProperty("votes");
    expect(round).not.toHaveProperty("impostorId");
    expect(projectParty(state, playerId, new Set(PLAYER_IDS)).players.every((player) => !player.hasVoted)).toBe(true);
  }

  // PLAYER_IDS[2] is the impostor in this deterministic round.
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[2]!, { type: "vote", targetPlayerId: PLAYER_IDS[0]! }, context)).code).toBe("FORBIDDEN");

  apply(state, PLAYER_IDS[0]!, { type: "vote", targetPlayerId: PLAYER_IDS[1]! }, context);
  expect(projectParty(state, PLAYER_IDS[0]!, new Set(PLAYER_IDS)).round!.myVote).toBe(PLAYER_IDS[1]);
  expect(projectParty(state, PLAYER_IDS[0]!, new Set(PLAYER_IDS)).round!).not.toHaveProperty("votes");
  const nonVoterRound = projectParty(state, PLAYER_IDS[1]!, new Set(PLAYER_IDS)).round!;
  expect(nonVoterRound.myVote).toBeNull();
  expect(nonVoterRound).not.toHaveProperty("votes");

  apply(state, PLAYER_IDS[1]!, { type: "vote", targetPlayerId: PLAYER_IDS[2]! }, context);
  expect(state.phase).toBe("voting");
  expect(state.round?.voteDeadlineAt).toBe(context.now + 5_000);
  expect(advanceGameDeadline(state, { ...context, now: context.now + 4_999 })).toBe(false);
  expect(advanceGameDeadline(state, { ...context, now: context.now + 5_000 })).toBe(true);
  expect(state.phase).toBe("results");
  for (const playerId of PLAYER_IDS) {
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(Object.keys(round).sort()).toEqual([
      "answerDeadlineAt", "answers", "canVote", "id", "impostorId", "impostorQuestion", "isSpicy", "matchRound", "myAnswer", "myRerollVote", "myVote", "normalQuestion",
      "number", "participants", "privateQuestion", "questionRevealAt", "rerollThreshold", "rerollVotes", "roundPoints", "totalRounds", "voteDeadlineAt", "votes",
    ]);
    expect(round.participants.map((participant) => participant.id)).toEqual([...PLAYER_IDS]);
    expect(round.impostorQuestion).toBe(BUILTIN_QUESTION_PAIRS[0]!.impostorQuestion);
    expect(round.impostorId).toBe(PLAYER_IDS[2]);
    expect(round.votes).toEqual({
      [PLAYER_IDS[0]]: PLAYER_IDS[1],
      [PLAYER_IDS[1]]: PLAYER_IDS[2],
    });
  }

  const nextRound = structuredClone(state);
  expect(caughtPartyError(() => apply(nextRound, PLAYER_IDS[1], { type: "next_round" }, context)).code).toBe("FORBIDDEN");
  apply(nextRound, HOST_ID, { type: "next_round" }, context);
  expect(nextRound.phase).toBe("answering");
  expect(nextRound.round?.id).not.toBe(state.round?.id);
  expect(nextRound.round?.number).toBe(2);
  expect(nextRound.round?.answers).toEqual({});
  expect(nextRound.round?.votes).toEqual({});
  expect(nextRound.round?.readyPlayerIds).toEqual([]);
  expect(nextRound.usedQuestionIds).toHaveLength(2);

  expect(caughtPartyError(() => apply(state, PLAYER_IDS[1], { type: "return_to_lobby" }, context)).code).toBe("FORBIDDEN");
  apply(state, HOST_ID, { type: "return_to_lobby" }, context);
  expect(state.phase).toBe("lobby");
  expect(state.round).toBeNull();
});

test("answer submission locks the answer and marks the player ready", () => {
  const state = makeParty();
  const context = makeContext([0, 1]);
  startRound(state, context);

  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "set_ready", ready: true }, context)).code).toBe("NOT_READY");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: " \n " }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\ntwo" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\u2028two" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\u2029two" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "x".repeat(81) }, context)).code).toBe("VALIDATION_ERROR");
  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "x".repeat(80) }, context);
  expect(state.round!.answers[PLAYER_IDS[0]]).toHaveLength(80);
  expect(state.round!.readyPlayerIds).toEqual([PLAYER_IDS[0]]);
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "edited" }, context)).code).toBe("NOT_READY");
  apply(state, PLAYER_IDS[0], { type: "set_ready", ready: false }, context);
  expect(state.round!.readyPlayerIds).toEqual([]);
  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "edited answer" }, context);
  expect(state.round!.answers[PLAYER_IDS[0]]).toBe("edited answer");
  expect(state.round!.readyPlayerIds).toEqual([PLAYER_IDS[0]]);

  apply(state, PLAYER_IDS[1], { type: "submit_answer", answer: "  first answer  " }, context);
  expect(state.round!.answers[PLAYER_IDS[1]]).toBe("first answer");
  expect(state.round!.readyPlayerIds).toEqual([PLAYER_IDS[0], PLAYER_IDS[1]]);
  expect(state.phase).toBe("answering");
});

test("auto reveal observes the exact persisted deadline and still requires the voting gate", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "auto", questionSource: "builtin" },
  });
  const context = makeContext([0, 0, 0, 0]);
  startRound(state, context);
  submitAnswers(state, context);

  expect(state.phase).toBe("answers");
  expect(state.round?.questionRevealAt).toBe(context.now + 8_000);
  expect(caughtPartyError(() => apply(state, HOST_ID, { type: "set_ready", ready: true }, context)).code).toBe("FORBIDDEN");
  expect(advanceGameDeadline(state, { ...context, now: context.now + 7_999 })).toBe(false);
  expect(state.phase).toBe("answers");
  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS)).round).not.toHaveProperty("normalQuestion");
  expect(advanceGameDeadline(state, { ...context, now: context.now + 8_000 })).toBe(true);
  expect(state.phase).toBe("voting");
  expect(state.round?.readyPlayerIds).toEqual([]);
  expect(state.round?.questionRevealAt).toBeNull();
  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS)).round).toHaveProperty("normalQuestion");
});

test("stale requests are rejected before phase authorization and duplicate votes never overwrite", () => {
  const state = makeParty();
  const context = makeContext([0, 0, 0, 0]);
  startRound(state, context);
  const staleError = caughtPartyError(() => applyGameAction(
    state,
    PLAYER_IDS[1]!,
    { expectedPhase: "lobby", roundId: null, action: { type: "return_to_lobby" } },
    context,
  ));
  expect(staleError.code).toBe("STALE_ACTION");

  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "answer 1" }, context);
  apply(state, PLAYER_IDS[1], { type: "submit_answer", answer: "answer 2" }, context);
  const finalAnswerRequest = actionRequest(state, { type: "submit_answer", answer: "answer 3" });
  applyGameAction(state, PLAYER_IDS[2]!, finalAnswerRequest, context);
  expect(state.phase).toBe("answers");
  expect(caughtPartyError(() => applyGameAction(state, PLAYER_IDS[2]!, finalAnswerRequest, context)).code).toBe("STALE_ACTION");
  readyAll(state, context);
  const firstTarget = PLAYER_IDS[2]!;
  const replacementTarget = PLAYER_IDS[0]!;
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "vote", targetPlayerId: firstTarget }, context)).code).toBe("FORBIDDEN");
  apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: firstTarget }, context);
  expect(state.round!.votes[PLAYER_IDS[1]]).toBe(firstTarget);
  apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: replacementTarget }, context);
  expect(state.round!.votes[PLAYER_IDS[1]]).toBe(replacementTarget);
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: PLAYER_IDS[1]! }, context)).code).toBe("INVALID_VOTE");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: "00000000-0000-4000-8000-000000000099" }, context)).code).toBe("INVALID_VOTE");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "set_ready", ready: true }, context)).code).toBe("FORBIDDEN");
});

test("custom question pairs can be edited and deleted without stale bag entries", () => {
  const pair = {
    id: "00000000-0000-4000-8000-000000000020",
    normalQuestion: "Favourite fruit?",
    impostorQuestion: "Favourite vegetable?",
  };
  const state = makeParty({ customQuestions: [pair], usedQuestionIds: [pair.id] });
  const edit = {
    type: "edit_question" as const,
    questionId: pair.id,
    normalQuestion: "  What is your favourite season?  ",
    impostorQuestion: "  What is your favourite month?  ",
  };

  expect(caughtPartyError(() => apply(state, PLAYER_IDS[1]!, edit)).code).toBe("FORBIDDEN");
  expect(state.customQuestions[0]).toEqual(pair);

  apply(state, HOST_ID, edit);
  expect(state.customQuestions[0]).toMatchObject({
    normalQuestion: "What is your favourite season?",
    impostorQuestion: "What is your favourite month?",
  });
  expect(state.usedQuestionIds).toEqual([]);

  state.usedQuestionIds = [pair.id];
  apply(state, HOST_ID, { type: "delete_question", questionId: pair.id });
  expect(state.customQuestions).toEqual([]);
  expect(state.usedQuestionIds).toEqual([]);
  expect(caughtPartyError(() => apply(state, HOST_ID, { type: "delete_question", questionId: pair.id })).code).toBe("VALIDATION_ERROR");
});

test("answer timer deadline advances answering to answers and fills missing answers", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "builtin", answerTimeSeconds: 30 },
  });
  const context = makeContext([0, 0, 0, 0]);
  startRound(state, context);
  expect(state.round?.answerDeadlineAt).toBe(context.now + 30_000);

  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "early answer" }, context);
  expect(advanceGameDeadline(state, { ...context, now: context.now + 31_999 })).toBe(false);
  expect(state.phase).toBe("answering");

  expect(advanceGameDeadline(state, { ...context, now: context.now + 32_000 })).toBe(true);
  expect(state.phase).toBe("answers");
  expect(state.round?.answerDeadlineAt).toBeNull();
  expect(state.round?.answers[PLAYER_IDS[0]]).toBe("early answer");
  expect(state.round?.answers[PLAYER_IDS[1]]).toBe("—");
  expect(state.round?.answers[PLAYER_IDS[2]]).toBe("—");
});

test("normal questions do not repeat across rounds while impostor questions can repeat", () => {
  const customQuestions = [
    { id: "00000000-0000-4000-8000-000000000031", normalQuestion: "Shared normal", impostorQuestion: "Shared impostor" },
    { id: "00000000-0000-4000-8000-000000000032", normalQuestion: "Shared normal", impostorQuestion: "Different impostor" },
    { id: "00000000-0000-4000-8000-000000000033", normalQuestion: "Fresh normal", impostorQuestion: "Shared impostor" },
  ];
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "custom" },
    customQuestions,
  });
  const context = makeContext([0, 0, 0, 0]);
  startRound(state, context);
  expect(state.round?.normalQuestion).toBe("Shared normal");

  apply(state, HOST_ID, { type: "skip_round" }, context);
  expect(state.round?.normalQuestion).toBe("Fresh normal");
  expect(state.round?.impostorQuestion).toBe("Shared impostor");
});

test("scoring awards +1 to crewmates who catch the impostor and +1 to the impostor per fooled crewmate", () => {
  const state = makeParty();
  const context = makeContext([0, 0, 0, 0]);
  startRound(state, context);
  submitAnswers(state, context);
  readyAll(state, context);

  // PLAYER_IDS[0] is the impostor (randomIndex = 0) and cannot vote.
  // PLAYER_IDS[1] votes for impostor (+1 to PLAYER_IDS[1]).
  // PLAYER_IDS[2] votes for PLAYER_IDS[1] (+1 to impostor PLAYER_IDS[0]).
  apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: PLAYER_IDS[0] }, context);
  apply(state, PLAYER_IDS[2], { type: "vote", targetPlayerId: PLAYER_IDS[1] }, context);
  expect(state.round?.voteDeadlineAt).toBe(context.now + 5_000);
  expect(advanceGameDeadline(state, { ...context, now: context.now + 5_000 })).toBe(true);

  expect(state.phase).toBe("results");
  expect(state.round?.roundPoints).toEqual({
    [PLAYER_IDS[0]]: 1,
    [PLAYER_IDS[1]]: 1,
    [PLAYER_IDS[2]]: 0,
  });
  const snapshot = projectParty(state, PLAYER_IDS[0], new Set(PLAYER_IDS));
  expect(snapshot.players.map((p) => p.score)).toEqual([1, 1, 0]);
});

test("roundCount limits match rounds and starting from lobby resets matchRound and scores", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "builtin", roundCount: 2 },
  });
  const context = makeContext([0, 0, 1, 0, 2, 0, 3, 0]);
  startRound(state, context);
  expect(projectParty(state, PLAYER_IDS[0], new Set(PLAYER_IDS)).round?.matchRound).toBe(1);
  expect(projectParty(state, PLAYER_IDS[0], new Set(PLAYER_IDS)).round?.totalRounds).toBe(2);

  submitAnswers(state, context);
  readyAll(state, context);
  apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: PLAYER_IDS[0] }, context);
  apply(state, PLAYER_IDS[2], { type: "vote", targetPlayerId: PLAYER_IDS[0] }, context);
  advanceGameDeadline(state, { ...context, now: context.now + 5_000 });

  apply(state, HOST_ID, { type: "next_round" }, context);
  expect(state.round?.matchRound).toBe(2);
  submitAnswers(state, context);
  readyAll(state, context);
  apply(state, PLAYER_IDS[1], { type: "vote", targetPlayerId: PLAYER_IDS[0] }, context);
  apply(state, PLAYER_IDS[2], { type: "vote", targetPlayerId: PLAYER_IDS[0] }, context);
  advanceGameDeadline(state, { ...context, now: context.now + 5_000 });

  expect(caughtPartyError(() => apply(state, HOST_ID, { type: "next_round" }, context)).code).toBe("FORBIDDEN");
  apply(state, HOST_ID, { type: "return_to_lobby" }, context);
  startRound(state, context);
  expect(state.round?.matchRound).toBe(1);
  expect(state.players.every((player) => (player.score ?? 0) === 0)).toBe(true);
});

test("save_draft preserves typed answers when the answer timer expires without locking in", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "ready", questionSource: "builtin", answerTimeSeconds: 30 },
  });
  const context = makeContext([0, 0]);
  startRound(state, context);

  apply(state, PLAYER_IDS[0], { type: "save_draft", answer: "  draft text  " }, context);
  expect(state.round?.readyPlayerIds).toEqual([]);
  expect(state.round?.answers[PLAYER_IDS[0]]).toBe("draft text");

  expect(advanceGameDeadline(state, { ...context, now: context.now + 32_000 })).toBe(true);
  expect(state.phase).toBe("answers");
  expect(state.round?.answers[PLAYER_IDS[0]]).toBe("draft text");
  expect(state.round?.answers[PLAYER_IDS[1]]).toBe("—");
});

test("vote_reroll requires N-1 votes and keeps the skipped normalQuestion in usedNormalQuestions", () => {
  const state = makeParty();
  const context = makeContext([0, 0, 1, 0]);
  startRound(state, context);
  const firstQuestion = state.round!.normalQuestion;

  apply(state, PLAYER_IDS[0], { type: "vote_reroll" }, context);
  expect(state.round?.rerollVoterIds).toEqual([PLAYER_IDS[0]]);
  expect(state.round?.normalQuestion).toBe(firstQuestion);

  // Toggle off and back on
  apply(state, PLAYER_IDS[0], { type: "vote_reroll" }, context);
  expect(state.round?.rerollVoterIds).toEqual([]);
  apply(state, PLAYER_IDS[0], { type: "vote_reroll" }, context);

  // 2nd vote (N-1 = 2 for 3 players) triggers reroll while keeping firstQuestion tracked
  apply(state, PLAYER_IDS[1], { type: "vote_reroll" }, context);
  expect(state.round?.normalQuestion).not.toBe(firstQuestion);
  expect(state.usedNormalQuestions).toContain(firstQuestion);
  expect(state.round?.rerollVoterIds).toEqual([]);
});
