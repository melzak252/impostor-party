import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { COLOR_PALETTE, type PartySnapshot } from "../shared/protocol";
import type { PartyAction } from "./api";
import { getStrings, useLanguage } from "./i18n";
import type { UsePartyResult } from "./useParty";
import { PlayerFace } from "./PlayerFace";
import { pitchForParticipantIndex, speakText, stopSpeaking, useTtsEnabled } from "./tts";

type ActiveRound = NonNullable<PartySnapshot["round"]>;
type RoundParticipant = ActiveRound["participants"][number];
const QUESTION_DRAW_DURATION_MS = 1_600;
const ANSWER_REVEAL_STEP_MS = 2_000;
const ANSWER_REVEAL_STEP_SECONDS = ANSWER_REVEAL_STEP_MS / 1_000;

function playerColor(colorId: RoundParticipant["colorId"]): CSSProperties {
  const swatch = COLOR_PALETTE.find((color) => color.id === colorId)?.swatch ?? "#898d97";
  return { "--player-color": swatch } as CSSProperties;
}

function FittedAnswerText({ text }: { text: string }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const textEl = textRef.current;
    if (!box || !textEl) return;

    let cancelled = false;

    const fit = () => {
      if (cancelled) return;
      const styles = getComputedStyle(box);
      const padX =
        (Number.parseFloat(styles.paddingLeft) || 0) +
        (Number.parseFloat(styles.paddingRight) || 0);
      const padY =
        (Number.parseFloat(styles.paddingTop) || 0) +
        (Number.parseFloat(styles.paddingBottom) || 0);
      const availWidth = box.clientWidth - padX;
      const availHeight = box.clientHeight - padY;
      if (availWidth <= 0 || availHeight <= 0) return;

      const minSize = 11;
      const maxSize = Math.max(minSize, Math.min(120, Math.floor(availHeight * 0.9)));
      let low = minSize;
      let high = maxSize;
      let best = minSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = `${mid}px`;
        if (textEl.scrollWidth <= availWidth + 1 && textEl.scrollHeight <= availHeight + 1) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      textEl.style.fontSize = `${best}px`;
    };

    fit();

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fit()) : null;
    observer?.observe(box);
    void document.fonts?.ready.then(() => fit());

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [text]);

  return (
    <span className="round-answer-value" ref={boxRef}>
      <span className="round-answer-value-text" ref={textRef}>
        {text}
      </span>
    </span>
  );
}

function AnswerList({
  round,
  selfId,
  hostId,
  reveal = false,
  revealedCount = 0,
  revealStepRemainder = 0,
  statusForPlayer,
  selectedVote,
  voteDisabled = false,
  onVoteSelect,
  impostorId,
  votersByTarget,
}: {
  round: ActiveRound;
  selfId: string;
  hostId: string;
  reveal?: boolean;
  revealedCount?: number;
  revealStepRemainder?: number;
  statusForPlayer?: (participantId: string) => string | null;
  selectedVote?: string | null;
  voteDisabled?: boolean;
  onVoteSelect?: (participantId: string) => void;
  impostorId?: string | null;
  votersByTarget?: ReadonlyMap<string, readonly RoundParticipant[]>;
}) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  return (
    <ol className="round-answer-board">
      {round.participants.map((participant, index) => {
        const selected = selectedVote === participant.id;
        const isImpostor = Boolean(impostorId && participant.id === impostorId);
        const voters = votersByTarget?.get(participant.id);
        const isRevealed = !reveal || index < revealedCount;
        const flipCountdown = Math.max(
          1,
          (index - revealedCount + 1) * ANSWER_REVEAL_STEP_SECONDS - revealStepRemainder,
        );
        const faceMood = selected || isImpostor ? "sus" : "default";
        const status = statusForPlayer?.(participant.id);
        const answerCard = (
          <>
            <span className="round-answer-player">
              <PlayerFace
                colorId={participant.colorId}
                isHost={participant.id === hostId}
                mood={faceMood}
                size="lg"
              />
              <span className="round-answer-nick">
                <strong>{participant.name}</strong>
                {participant.id === selfId ? t.common.youSuffix : ""}
              </span>
              {isImpostor && <span className="impostor-badge">{t.round.impostorBadge}</span>}
            </span>
            <FittedAnswerText text={round.answers?.[participant.id] ?? t.round.answerUnavailable} />
            {status && <span className="round-answer-status">{status}</span>}
          </>
        );
        return (
          <li
            className={`round-answer-item${reveal ? " answer-card-reveal" : ""}${
              onVoteSelect ? " round-answer-vote-option" : ""
            }${selected ? " selected" : ""}${isImpostor ? " is-impostor" : ""}`}
            key={participant.id}
            style={playerColor(participant.colorId)}
          >
            {reveal ? (
              <div className={`round-answer-flip${isRevealed ? " is-revealed" : ""}`}>
                <div className="round-answer-face round-answer-back" aria-hidden={isRevealed}>
                  <span className="round-answer-player">
                    <PlayerFace
                      colorId={participant.colorId}
                      isHost={participant.id === hostId}
                      size="lg"
                    />
                    <span className="round-answer-nick">
                      <strong>{participant.name}</strong>
                      {participant.id === selfId ? t.common.youSuffix : ""}
                    </span>
                  </span>
                  <strong className="round-answer-countdown">{flipCountdown}</strong>
                  <span>{t.round.flipsIn(flipCountdown)}</span>
                </div>
                <div className="round-answer-face round-answer-front" aria-hidden={!isRevealed}>
                  {answerCard}
                </div>
              </div>
            ) : onVoteSelect ? (
              <button
                className="round-answer-select"
                type="button"
                aria-pressed={selected}
                disabled={voteDisabled || participant.id === selfId}
                onClick={() => onVoteSelect(participant.id)}
              >
                {answerCard}
              </button>
            ) : (
              answerCard
            )}
            {votersByTarget && (
              <div className="round-answer-votes">
                {voters?.length ? (
                  <ul className="round-answer-voters" aria-label={t.round.votedForAria(participant.name)}>
                    {voters.map((voter, voterIndex) => (
                      <li
                        className="round-voter-chip"
                        key={voter.id}
                        title={t.round.votedForTitle(voter.name, participant.name)}
                        style={{
                          ...playerColor(voter.colorId),
                          animationDelay: `${voterIndex * 140}ms`,
                        }}
                      >
                        <PlayerFace
                          colorId={voter.colorId}
                          isHost={voter.id === hostId}
                          size="sm"
                        />
                        <span className="round-voter-chip-name">{voter.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="round-no-votes">{t.round.noVotes}</span>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function QuestionCard({ round, revealed }: { round: ActiveRound; revealed: boolean }) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  return (
    <section className="card round-question-card" aria-label={t.round.sharedQuestionAria}>
      <p className="eyebrow">{t.round.theRealQuestion}</p>
      <div className={`round-question-flip${revealed ? " is-revealed" : ""}`}>
        <div className="round-question-face round-question-back" aria-hidden={revealed}>
          {!revealed && <span className="round-question-mark">?</span>}
        </div>
        <div className="round-question-face round-question-front" aria-hidden={!revealed}>
          <h2 className="round-question-text">{round.normalQuestion}</h2>
        </div>
      </div>
    </section>
  );
}

export function Round({
  snapshot,
  connected,
  busy,
  act,
  onLeave,
}: {
  snapshot: PartySnapshot;
  connected: boolean;
  busy: boolean;
  act: UsePartyResult["act"];
  onLeave(): void;
}) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const [ttsEnabled] = useTtsEnabled();
  const lastSpokenKeyRef = useRef<string | null>(null);
  const round = snapshot.round;
  const speechLang = snapshot.settings.language ?? lang;
  const [answerState, setAnswerState] = useState(() => ({
    roundId: round?.id ?? null,
    value: round?.myAnswer ?? "",
  }));
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [questionDrawnRoundId, setQuestionDrawnRoundId] = useState<string | null>(null);
  const [answerReveal, setAnswerReveal] = useState({
    roundId: null as string | null,
    count: 0,
    stepRemainder: 0,
  });
  const answerDraft =
    answerState.roundId === (round?.id ?? null) ? answerState.value : round?.myAnswer ?? "";

  useEffect(() => {
    setSelectedVote(null);
  }, [round?.id, snapshot.phase]);

  useEffect(() => {
    const revealAt = round?.questionRevealAt;
    if (
      snapshot.phase !== "answers" ||
      snapshot.settings.questionRevealMode !== "auto" ||
      revealAt === null ||
      revealAt === undefined
    ) {
      return;
    }
    const updateCountdown = () => setCountdownNow(Date.now());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(timer);
  }, [round?.id, round?.questionRevealAt, snapshot.phase, snapshot.settings.questionRevealMode]);

  useEffect(() => {
    if (!round || snapshot.phase !== "answering") {
      setQuestionDrawnRoundId(null);
      return;
    }

    setQuestionDrawnRoundId(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setQuestionDrawnRoundId(round.id);
      return;
    }

    const timer = window.setTimeout(
      () => setQuestionDrawnRoundId(round.id),
      QUESTION_DRAW_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [round?.id, snapshot.phase]);

  useEffect(() => {
    if (!round || snapshot.phase !== "answers") {
      setAnswerReveal({ roundId: round?.id ?? null, count: 0, stepRemainder: 0 });
      return;
    }

    const total = round.participants.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnswerReveal({ roundId: round.id, count: total, stepRemainder: 0 });
      return;
    }

    let elapsedSeconds = 0;
    setAnswerReveal({ roundId: round.id, count: 0, stepRemainder: 0 });
    const timer = window.setInterval(() => {
      elapsedSeconds += 1;
      const count = Math.min(total, Math.floor(elapsedSeconds / ANSWER_REVEAL_STEP_SECONDS));
      const stepRemainder = elapsedSeconds % ANSWER_REVEAL_STEP_SECONDS;
      setAnswerReveal({ roundId: round.id, count, stepRemainder });
      if (count >= total) window.clearInterval(timer);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [round?.id, round?.participants.length, snapshot.phase]);

  useEffect(() => {
    if (!ttsEnabled) {
      stopSpeaking();
    }
  }, [ttsEnabled]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (!ttsEnabled || !round) return;

    if (
      snapshot.phase === "answers" &&
      answerReveal.roundId === round.id &&
      answerReveal.count > 0
    ) {
      const revealedIndex = answerReveal.count - 1;
      const participant = round.participants[revealedIndex];
      const answerText = participant ? round.answers?.[participant.id] : undefined;
      const key = `${round.id}:answer:${revealedIndex}`;
      if (answerText && lastSpokenKeyRef.current !== key) {
        lastSpokenKeyRef.current = key;
        speakText(answerText, speechLang, {
          pitch: pitchForParticipantIndex(revealedIndex),
        });
      }
      return;
    }

    if (snapshot.phase === "question" && round.normalQuestion) {
      const key = `${round.id}:question`;
      if (lastSpokenKeyRef.current !== key) {
        lastSpokenKeyRef.current = key;
        speakText(round.normalQuestion, speechLang, {
          interrupt: true,
          pitch: 1.02,
        });
      }
    }
  }, [
    answerReveal.count,
    answerReveal.roundId,
    round,
    snapshot.phase,
    speechLang,
    ttsEnabled,
  ]);

  if (!round || snapshot.phase === "lobby") {
    return (
      <>
        <section className="card round-card">
          <p className="eyebrow">{t.round.roundUnavailable}</p>
          <h2>{t.round.noActiveRound}</h2>
          <p>{t.round.noActiveRoundBody}</p>
        </section>
        <div className="round-actions">
          <button
            className="secondary"
            type="button"
            disabled={!connected || busy}
            onClick={onLeave}
          >
            {t.common.leaveParty}
          </button>
        </div>
      </>
    );
  }

  const roster = round.participants;
  const playerById = new Map(snapshot.players.map((player) => [player.id, player]));
  const me = playerById.get(snapshot.selfId);
  const answeredCount = roster.filter(
    (participant) => playerById.get(participant.id)?.hasAnswered,
  ).length;
  const readyCount = roster.filter(
    (participant) => playerById.get(participant.id)?.isReady,
  ).length;
  const votedCount =
    snapshot.phase === "results"
      ? Object.keys(round.votes ?? {}).length
      : roster.filter((participant) => playerById.get(participant.id)?.hasVoted).length;
  const isReady = me?.isReady ?? false;
  const revealSeconds =
    round.questionRevealAt === null
      ? null
      : Math.max(0, Math.ceil((round.questionRevealAt - countdownNow) / 1_000));
  const progressLabel =
    snapshot.phase === "answering"
      ? t.round.lockedInProgress(answeredCount, roster.length)
      : snapshot.phase === "answers"
        ? snapshot.settings.questionRevealMode === "auto"
          ? revealSeconds === null
            ? t.round.lockedInProgress(answeredCount, roster.length)
            : t.round.questionInProgress(revealSeconds)
          : t.round.readyProgress(readyCount, roster.length)
        : snapshot.phase === "question"
          ? t.round.readyProgress(readyCount, roster.length)
          : t.round.votedProgress(votedCount, roster.length);
  const readinessLabel = snapshot.phase === "answers" ? t.round.revealQuestion : t.round.readyToVote;

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answerDraft.trim() || !connected || busy || isReady || questionDrawnRoundId !== round.id) {
      return;
    }
    const action: PartyAction = { type: "submit_answer", answer: answerDraft };
    void act(action);
  };

  const answerProgress = (participantId: string): string | null => {
    const player = playerById.get(participantId);
    if (snapshot.phase === "answering") {
      return player?.hasAnswered ? t.round.answerSubmitted : t.round.waiting;
    }
    return null;
  };

  const toggleReady = () => {
    if (!connected || busy) return;
    void act({ type: "set_ready", ready: !isReady });
  };

  const confirmVote = () => {
    if (!selectedVote || !connected || busy || round.myVote !== null) return;
    void act({ type: "vote", targetPlayerId: selectedVote });
  };

  const leaveButton = (
    <button className="secondary" type="button" disabled={!connected || busy} onClick={onLeave}>
      {t.common.leaveParty}
    </button>
  );

  const isBoardPhase =
    snapshot.phase === "answers" ||
    snapshot.phase === "question" ||
    snapshot.phase === "voting" ||
    snapshot.phase === "results";

  const votes = round.votes ?? {};
  const participantsById = new Map(roster.map((participant) => [participant.id, participant]));
  const impostor =
    snapshot.phase === "results" ? participantsById.get(round.impostorId ?? "") : undefined;
  const votersByTarget =
    snapshot.phase === "results"
      ? (() => {
          const map = new Map<string, RoundParticipant[]>();
          for (const participant of roster) map.set(participant.id, []);
          for (const voter of roster) {
            const targetId = votes[voter.id];
            if (targetId) map.get(targetId)?.push(voter);
          }
          return map;
        })()
      : undefined;
  const caughtIn4K = (() => {
    if (snapshot.phase !== "results" || !impostor) return false;
    const totals = new Map(roster.map((participant) => [participant.id, 0]));
    for (const targetId of Object.values(votes)) {
      totals.set(targetId, (totals.get(targetId) ?? 0) + 1);
    }
    const maxVotes = Math.max(0, ...totals.values());
    return maxVotes > 0 && (totals.get(impostor.id) ?? 0) === maxVotes;
  })();

  const phaseName = t.round.phases[snapshot.phase];
  const boardEyebrow =
    snapshot.phase === "answers"
      ? t.round.eyebrowAnswers
      : snapshot.phase === "question"
        ? t.round.eyebrowQuestion
        : snapshot.phase === "voting"
          ? t.round.eyebrowVoting
          : t.round.eyebrowResults;
  const boardTitle =
    snapshot.phase === "voting"
      ? t.round.titleVoting
      : snapshot.phase === "results"
        ? t.round.titleResults
        : t.round.titleDefault;

  return (
    <div className={`round-stage round-stage-${snapshot.phase}`}>
      <section className="card round-heading-card">
        <div>
          <p className="eyebrow">
            {t.round.roundLabel(round.number, phaseName)}
          </p>
          <h2>{phaseName}</h2>
        </div>
        <span className="count-badge" aria-live="polite">
          {progressLabel}
        </span>
      </section>

      {snapshot.phase === "answering" && (
        <ul className="round-progress-strip" aria-label={t.round.answerProgressAria}>
          {roster.map((participant, index) => {
            const player = playerById.get(participant.id);
            return (
              <li
                key={participant.id}
                style={{ ...playerColor(participant.colorId), "--progress-index": index } as CSSProperties}
              >
                <PlayerFace
                  colorId={participant.colorId}
                  isHost={participant.id === snapshot.hostId}
                  offline={player ? !player.connected : false}
                  mood={player?.hasAnswered ? "happy" : "default"}
                  size="lg"
                />
                <span className="round-progress-copy">
                  <strong>
                    {participant.name}
                    {participant.id === snapshot.selfId ? t.common.youSuffix : ""}
                  </strong>
                  <span className="round-progress-status">{answerProgress(participant.id)}</span>
                </span>
                <span className="round-progress-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {snapshot.phase === "answering" && (
        <section className="card private-question-card">
          <p className="eyebrow">{t.round.eyesOnly}</p>
          <div
            className={`private-question-flip${
              questionDrawnRoundId === round.id ? " is-drawn" : " is-shuffling"
            }`}
          >
            <div
              className="private-question-face private-question-back"
              aria-hidden={questionDrawnRoundId === round.id}
            >
              {questionDrawnRoundId !== round.id && (
                <span className="mystery-face" aria-hidden="true">
                  <span className="mystery-eye mystery-eye--left" />
                  <span className="mystery-eye mystery-eye--right" />
                  <span className="mystery-mouth" />
                  <span className="mystery-question-mark">?</span>
                </span>
              )}
            </div>
            <div
              className="private-question-face private-question-front"
              aria-hidden={questionDrawnRoundId !== round.id}
            >
              <h2>{round.privateQuestion}</h2>
            </div>
          </div>
          <p className="question-draw-status" role="status" aria-live="polite">
            {questionDrawnRoundId === round.id
              ? t.round.promptLive
              : t.round.shufflingCard}
          </p>
          <form className="answer-form" onSubmit={submitAnswer}>
            <label className="field-label" htmlFor="round-answer">
              {t.round.yourAnswer}
            </label>
            <input
              id="round-answer"
              type="text"
              value={answerDraft}
              maxLength={80}
              autoComplete="off"
              disabled={!connected || busy || isReady || questionDrawnRoundId !== round.id}
              onChange={(event) => setAnswerState({ roundId: round.id, value: event.target.value })}
              placeholder={t.round.answerPlaceholder}
              aria-describedby="answer-help"
            />
            <span id="answer-help" className="muted small-copy">
              {t.round.answerHelp}
            </span>
            <button
              className="primary"
              type="submit"
              disabled={
                !connected ||
                busy ||
                isReady ||
                questionDrawnRoundId !== round.id ||
                !answerDraft.trim()
              }
            >
              {isReady ? t.round.answerLocked : t.round.submitAnswer}
            </button>
          </form>
          {isReady && (
            <p className="muted small-copy" role="status">
              {t.round.answerLockedStatus}
            </p>
          )}
        </section>
      )}

      {snapshot.phase === "answering" && (
        <p className="round-progress-note">
          {t.round.answersHiddenNote}
        </p>
      )}

      {isBoardPhase && (
        <div className="round-board-layout">
          <div className="round-question-column">
            {snapshot.phase === "results" && (
              <div className="round-impostor-banner" role="status">
                {impostor && (
                  <PlayerFace
                    colorId={impostor.colorId}
                    isHost={impostor.id === snapshot.hostId}
                    mood="sus"
                    size="sm"
                  />
                )}
                <div className="round-impostor-banner-copy">
                  <span className="eyebrow">
                    {caughtIn4K && impostor ? t.round.caughtIn4K : t.round.caseClosed}
                  </span>
                  <strong>
                    {impostor ? t.round.impostorWas(impostor.name) : t.round.impostorNotIdentified}
                  </strong>
                </div>
              </div>
            )}

            <QuestionCard round={round} revealed={snapshot.phase !== "answers"} />

            {snapshot.phase === "results" && (
              <section
                className="card round-impostor-question-card"
                aria-label={t.round.impostorsQuestionAria}
              >
                <p className="eyebrow">{t.round.impostorsQuestion}</p>
                <p className="round-impostor-question-text">{round.impostorQuestion}</p>
              </section>
            )}

            {snapshot.phase === "answers" &&
              (snapshot.settings.questionRevealMode === "auto" ? (
                <div className="card round-auto-countdown" role="status" aria-live="polite">
                  <strong>
                    {revealSeconds === null
                      ? t.round.autoFlipNote
                      : revealSeconds === 0
                        ? t.round.flippingNow
                        : t.round.realQuestionDropsIn(revealSeconds)}
                  </strong>
                  <span>{t.round.noButtonNeeded}</span>
                </div>
              ) : (
                <div className="card ready-control round-gate-control">
                  <p>
                    {answerReveal.count < roster.length
                      ? t.round.cardsFlipping
                      : isReady
                        ? t.round.readyForRealQuestion
                        : t.round.flipTogetherPrompt}
                  </p>
                  <button
                    className={isReady ? "secondary" : "primary"}
                    type="button"
                    disabled={!connected || busy || answerReveal.count < roster.length}
                    onClick={toggleReady}
                  >
                    {isReady ? t.round.notReady : readinessLabel}
                  </button>
                </div>
              ))}

            {snapshot.phase === "question" && (
              <div className="card ready-control round-gate-control">
                <p>
                  {isReady
                    ? t.round.lockedInForVoting
                    : t.round.roastAnswersPrompt}
                </p>
                <button
                  className={isReady ? "secondary" : "primary"}
                  type="button"
                  disabled={!connected || busy}
                  onClick={toggleReady}
                >
                  {isReady ? t.round.notReady : readinessLabel}
                </button>
              </div>
            )}

            {snapshot.phase === "voting" && (
              <div className="card round-vote-bar">
                {round.myVote !== null ? (
                  <div className="round-locked-vote" role="status">
                    <strong>{t.round.voteLockedIn}</strong>
                    <span>
                      {t.round.taggedAsSus(
                        roster.find((participant) => participant.id === round.myVote)?.name ??
                          t.round.yourSelectedPlayer,
                      )}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="round-vote-bar-status">
                      {selectedVote
                        ? t.round.selectedAsSus(
                            roster.find((participant) => participant.id === selectedVote)?.name ??
                              t.round.playerGeneric,
                          )
                        : t.round.tapAnswerToPick}
                    </p>
                    <button
                      className="primary round-confirm-vote"
                      type="button"
                      disabled={!connected || busy || !selectedVote}
                      onClick={confirmVote}
                    >
                      {t.round.lockInVote}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <section className="card round-answer-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{boardEyebrow}</p>
                <h2>{boardTitle}</h2>
              </div>
            </div>
            {snapshot.phase === "answers" && (
              <div className="answer-reveal-timer" role="status" aria-live="polite">
                <span>
                  {answerReveal.count >= roster.length
                    ? t.round.allCardsFlipped
                    : t.round.flippingCardOf(answerReveal.count + 1, roster.length)}
                </span>
                <span>
                  {answerReveal.count >= roster.length
                    ? t.round.readyForRealQ
                    : t.round.oneCardPerSec}
                </span>
              </div>
            )}
            {snapshot.phase === "voting" && (
              <p className="muted small-copy">
                {t.round.votingInstruction}
              </p>
            )}
            <AnswerList
              round={round}
              selfId={snapshot.selfId}
              hostId={snapshot.hostId}
              reveal={snapshot.phase === "answers"}
              revealedCount={
                snapshot.phase === "answers" && answerReveal.roundId === round.id
                  ? answerReveal.count
                  : roster.length
              }
              revealStepRemainder={
                snapshot.phase === "answers" && answerReveal.roundId === round.id
                  ? answerReveal.stepRemainder
                  : 0
              }
              statusForPlayer={answerProgress}
              selectedVote={snapshot.phase === "voting" ? selectedVote : undefined}
              voteDisabled={!connected || busy || round.myVote !== null}
              onVoteSelect={snapshot.phase === "voting" ? setSelectedVote : undefined}
              impostorId={snapshot.phase === "results" ? round.impostorId : undefined}
              votersByTarget={votersByTarget}
            />
          </section>
        </div>
      )}

      <div className="round-actions">
        {snapshot.selfId === snapshot.hostId && snapshot.phase !== "results" && (
          <button
            className="secondary"
            type="button"
            disabled={!connected || busy}
            onClick={() => void act({ type: "skip_round" })}
          >
            {t.round.skipRerollRound}
          </button>
        )}
        {snapshot.phase === "results" && snapshot.selfId === snapshot.hostId && (
          <>
            <button
              className="primary"
              type="button"
              disabled={
                !connected ||
                busy ||
                snapshot.players.length < 3 ||
                snapshot.players.length > 6 ||
                snapshot.players.some((player) => !player.connected)
              }
              onClick={() => void act({ type: "next_round" })}
            >
              {t.round.nextRound}
            </button>
            <button
              className="secondary"
              type="button"
              disabled={!connected || busy}
              onClick={() => void act({ type: "return_to_lobby" })}
            >
              {t.round.backToLobby}
            </button>
          </>
        )}
        {leaveButton}
      </div>
    </div>
  );
}
