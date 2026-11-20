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
      "answers", "id", "myAnswer", "myVote", "number", "participants", "privateQuestion", "questionRevealAt",
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
  expect(state.phase).toBe("question");
  for (const playerId of PLAYER_IDS) {
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(Object.keys(round).sort()).toEqual([
      "answers", "id", "myAnswer", "myVote", "normalQuestion", "number", "participants", "privateQuestion", "questionRevealAt",
    ]);
    expect(round.normalQuestion).toBe(BUILTIN_QUESTION_PAIRS[0]!.normalQuestion);
    expect(Object.keys(round.answers ?? {})).toHaveLength(3);
    expect(round).not.toHaveProperty("impostorQuestion");
    expect(round).not.toHaveProperty("impostorId");
    expect(round).not.toHaveProperty("votes");
  }
  readyAll(state, context);
  expect(state.phase).toBe("voting");
  for (const playerId of PLAYER_IDS) {
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(Object.keys(round).sort()).toEqual([
      "answers", "id", "myAnswer", "myVote", "normalQuestion", "number", "participants", "privateQuestion", "questionRevealAt",
    ]);
    expect(round.normalQuestion).toBe(BUILTIN_QUESTION_PAIRS[0]!.normalQuestion);
    expect(round.myVote).toBeNull();
    expect(round).not.toHaveProperty("votes");
    expect(round).not.toHaveProperty("impostorId");
    expect(projectParty(state, playerId, new Set(PLAYER_IDS)).players.every((player) => !player.hasVoted)).toBe(true);
  }

  const targets = [PLAYER_IDS[1]!, PLAYER_IDS[2]!, PLAYER_IDS[0]!];
  for (let index = 0; index < PLAYER_IDS.length - 1; index += 1) {
    const playerId = PLAYER_IDS[index]!;
    apply(state, playerId, { type: "vote", targetPlayerId: targets[index]! }, context);
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(round.myVote).toBe(targets[index]);
    expect(round).not.toHaveProperty("votes");
  }
  const nonVoterRound = projectParty(state, PLAYER_IDS[2]!, new Set(PLAYER_IDS)).round!;
  expect(nonVoterRound.myVote).toBeNull();
  expect(nonVoterRound).not.toHaveProperty("votes");
  const finalVoteRequest = actionRequest(state, { type: "vote", targetPlayerId: targets[2]! });
  applyGameAction(state, PLAYER_IDS[2]!, finalVoteRequest, context);
  expect(caughtPartyError(() => applyGameAction(state, PLAYER_IDS[2]!, finalVoteRequest, context)).code).toBe("STALE_ACTION");
  expect(state.phase).toBe("results");
  for (const playerId of PLAYER_IDS) {
    const round = projectParty(state, playerId, new Set(PLAYER_IDS)).round!;
    expect(Object.keys(round).sort()).toEqual([
      "answers", "id", "impostorId", "impostorQuestion", "myAnswer", "myVote", "normalQuestion",
      "number", "participants", "privateQuestion", "questionRevealAt", "votes",
    ]);
    expect(round.participants.map((participant) => participant.id)).toEqual([...PLAYER_IDS]);
    expect(round.impostorQuestion).toBe(BUILTIN_QUESTION_PAIRS[0]!.impostorQuestion);
    expect(round.impostorId).toBe(PLAYER_IDS[2]);
    expect(round.votes).toEqual({
      [PLAYER_IDS[0]]: PLAYER_IDS[1],
      [PLAYER_IDS[1]]: PLAYER_IDS[2],
      [PLAYER_IDS[2]]: PLAYER_IDS[0],
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

  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "set_ready", ready: true }, context)).code).toBe("FORBIDDEN");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: " \n " }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\ntwo" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\u2028two" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "one\u2029two" }, context)).code).toBe("VALIDATION_ERROR");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "x".repeat(81) }, context)).code).toBe("VALIDATION_ERROR");
  apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "x".repeat(80) }, context);
  expect(state.round!.answers[PLAYER_IDS[0]]).toHaveLength(80);
  expect(state.round!.readyPlayerIds).toEqual([PLAYER_IDS[0]]);
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "set_ready", ready: false }, context)).code).toBe("FORBIDDEN");
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "submit_answer", answer: "edited" }, context)).code).toBe("NOT_READY");

  apply(state, PLAYER_IDS[1], { type: "submit_answer", answer: "  first answer  " }, context);
  expect(state.round!.answers[PLAYER_IDS[1]]).toBe("first answer");
  expect(state.round!.readyPlayerIds).toEqual([PLAYER_IDS[0], PLAYER_IDS[1]]);
  expect(state.phase).toBe("answering");
});

test("auto reveal observes the exact persisted deadline and still requires the voting gate", () => {
  const state = makeParty({
    settings: { visibility: "private", questionRevealMode: "auto", questionSource: "builtin" },
  });
  const context = makeContext([0, 0]);
  startRound(state, context);
  submitAnswers(state, context);

  expect(state.phase).toBe("answers");
  expect(state.round?.questionRevealAt).toBe(context.now + 8_000);
  expect(caughtPartyError(() => apply(state, HOST_ID, { type: "set_ready", ready: true }, context)).code).toBe("FORBIDDEN");
  expect(advanceGameDeadline(state, { ...context, now: context.now + 7_999 })).toBe(false);
  expect(state.phase).toBe("answers");
  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS)).round).not.toHaveProperty("normalQuestion");
  expect(advanceGameDeadline(state, { ...context, now: context.now + 8_000 })).toBe(true);
  expect(state.phase).toBe("question");
  expect(state.round?.readyPlayerIds).toEqual([]);
  expect(projectParty(state, HOST_ID, new Set(PLAYER_IDS)).round).toHaveProperty("normalQuestion");

  readyAll(state, context);
  expect(state.phase).toBe("voting");
  expect(state.round?.questionRevealAt).toBeNull();
});

test("stale requests are rejected before phase authorization and duplicate votes never overwrite", () => {
  const state = makeParty();
  const context = makeContext([0, 0]);
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
  readyAll(state, context);
  const firstTarget = PLAYER_IDS[1]!;
  const replacementTarget = PLAYER_IDS[2]!;
  apply(state, PLAYER_IDS[0], { type: "vote", targetPlayerId: firstTarget }, context);
  expect(caughtPartyError(() => apply(state, PLAYER_IDS[0], { type: "vote", targetPlayerId: replacementTarget }, context)).code).toBe("INVALID_VOTE");
  expect(state.round!.votes[PLAYER_IDS[0]]).toBe(firstTarget);
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
