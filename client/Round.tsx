import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { COLOR_PALETTE, type PartySnapshot } from "../shared/protocol";
import { sendAction, type PartyAction } from "./api";
import { getStrings, useLanguage } from "./i18n";
import type { UsePartyResult } from "./useParty";
import { PlayerFace } from "./PlayerFace";
import {
  playCardFlipSound,
  playCardSpinSound,
  playCountdownTick,
  playResultsRevealSound,
  playVoteSound,
} from "./sfx";
import { pitchForParticipantIndex, speakText, stopSpeaking, useTtsEnabled } from "./tts";

type ActiveRound = NonNullable<PartySnapshot["round"]>;
type RoundParticipant = ActiveRound["participants"][number];
const QUESTION_DRAW_DURATION_MS = 1_200;
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

      const minSize = 12;
      const maxSize = Math.max(minSize, Math.min(32, Math.floor(availHeight * 0.55)));
      let low = minSize;
      let high = maxSize;
      let best = minSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = `${mid}px`;
        const w = textEl.scrollWidth;
        const h = textEl.scrollHeight;
        if (w > 0 && h > 0 && w <= availWidth && h <= availHeight) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      textEl.style.fontSize = `${best}px`;
    };

    fit();
    const rafId = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(() => fit()) : 0;

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => fit()) : null;
    observer?.observe(box);
    void document.fonts?.ready.then(() => fit());

    return () => {
      cancelled = true;
      if (rafId && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(rafId);
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

function SpicyFlames() {
  return (
    <div className="spicy-flames" aria-hidden="true">
      {["tl", "tr", "bl", "br"].map((pos) => (
        <svg key={pos} className={`spicy-flame spicy-flame--${pos}`} viewBox="0 0 24 28" width="22" height="26">
          <path
            d="M12 2 C14 7 19 9 19 16 C19 21 15.8 25 12 25 C8.2 25 5 21 5 16 C5 12 7.5 9.5 8.5 7.5 C9.2 9.5 10.5 10 11 8 C11.5 6 11.5 4 12 2 Z"
            fill="#FF5A5F"
            stroke="#1A103D"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 12 C13.5 15 15 16.5 15 19 C15 21.2 13.7 22.8 12 22.8 C10.3 22.8 9 21.2 9 19 C9 16.8 10.5 15 12 12 Z"
            fill="#FFD43B"
          />
        </svg>
      ))}
    </div>
  );
}

function QuestionCard({
  round,
  revealed,
  countdownLabel,
}: {
  round: ActiveRound;
  revealed: boolean;
  countdownLabel?: string | null;
}) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  return (
    <section className="card round-question-card" aria-label={t.round.sharedQuestionAria}>
      <p className="eyebrow">{t.round.theRealQuestion}</p>
      <div className={`round-question-flip${revealed ? " is-revealed" : ""}`}>
        <div className="round-question-face round-question-back" aria-hidden={revealed}>
          {!revealed && (
            <div className="round-question-back-inner">
              <span className="round-question-mark">?</span>
              {countdownLabel && (
                <p className="round-question-countdown" role="status" aria-live="polite">
                  {countdownLabel}
                </p>
              )}
            </div>
          )}
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
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [questionDrawnRoundId, setQuestionDrawnRoundId] = useState<string | null>(null);
  const [resultsSettledRoundId, setResultsSettledRoundId] = useState<string | null>(null);
  const [answerReveal, setAnswerReveal] = useState({
    roundId: null as string | null,
    count: 0,
    stepRemainder: 0,
  });
  const answerDraft =
    answerState.roundId === (round?.id ?? null) ? answerState.value : round?.myAnswer ?? "";

  const meIsReady = snapshot.players.find((player) => player.id === snapshot.selfId)?.isReady ?? false;
  const autoSubmittedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    if (!round || snapshot.phase !== "results") {
      setResultsSettledRoundId(null);
      return;
    }
    playResultsRevealSound();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setResultsSettledRoundId(round.id);
      return;
    }
    setResultsSettledRoundId(null);
    const timer = window.setTimeout(() => setResultsSettledRoundId(round.id), 550);
    return () => window.clearTimeout(timer);
  }, [round?.id, snapshot.phase]);

  useEffect(() => {
    const answerDeadline = snapshot.phase === "answering" ? round?.answerDeadlineAt : null;
    const revealAt =
      snapshot.phase === "answers" && snapshot.settings.questionRevealMode === "auto"
        ? round?.questionRevealAt
        : null;
    const voteDeadline = snapshot.phase === "voting" ? round?.voteDeadlineAt : null;
    const activeDeadline = answerDeadline ?? revealAt ?? voteDeadline;
    if (activeDeadline === null || activeDeadline === undefined) {
      return;
    }
    const updateCountdown = () => setCountdownNow(Date.now());
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(timer);
  }, [round?.id, round?.answerDeadlineAt, round?.questionRevealAt, round?.voteDeadlineAt, snapshot.phase, snapshot.settings.questionRevealMode]);

  useEffect(() => {
    if (!round || snapshot.phase !== "answering") {
      setQuestionDrawnRoundId(null);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setQuestionDrawnRoundId(round.id);
      return;
    }
    setQuestionDrawnRoundId(null);
    playCardSpinSound();
    const timer = window.setTimeout(() => {
      setQuestionDrawnRoundId(round.id);
      playCardFlipSound();
    }, QUESTION_DRAW_DURATION_MS);
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

    if ((snapshot.phase === "question" || snapshot.phase === "voting") && round.normalQuestion) {
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
    (participant) => playerById.get(participant.id)?.isReady,
  ).length;
  const readyCount = roster.filter(
    (participant) => playerById.get(participant.id)?.isReady,
  ).length;
  const totalVoters = Math.max(1, roster.length - 1);
  const votedCount =
    snapshot.phase === "results"
      ? Object.keys(round.votes ?? {}).length
      : roster.filter((participant) => playerById.get(participant.id)?.hasVoted).length;
  const isReady = me?.isReady ?? false;
  const answerSeconds =
    round.answerDeadlineAt === null || round.answerDeadlineAt === undefined
      ? null
      : Math.max(0, Math.ceil((round.answerDeadlineAt - countdownNow) / 1_000));
  const revealSeconds =
    round.questionRevealAt === null
      ? null
      : Math.max(0, Math.ceil((round.questionRevealAt - countdownNow) / 1_000));
  const voteSeconds =
    round.voteDeadlineAt === null || round.voteDeadlineAt === undefined
      ? null
      : Math.max(0, Math.ceil((round.voteDeadlineAt - countdownNow) / 1_000));
  const lastTickSecondRef = useRef<number | null>(null);
  const answerTimeUrgent =
    snapshot.phase === "answering" &&
    answerSeconds !== null &&
    answerSeconds >= 0 &&
    answerSeconds <= 10;

  useEffect(() => {
    if (!answerTimeUrgent || meIsReady || answerSeconds === null) {
      lastTickSecondRef.current = null;
      return;
    }
    if (lastTickSecondRef.current === answerSeconds) return;
    lastTickSecondRef.current = answerSeconds;
    playCountdownTick(answerSeconds <= 3);
  }, [answerSeconds, answerTimeUrgent, meIsReady]);

  useEffect(() => {
    if (
      !round ||
      snapshot.phase !== "answering" ||
      meIsReady ||
      !connected ||
      answerSeconds === null ||
      answerSeconds > 0 ||
      autoSubmittedRoundRef.current === round.id
    ) {
      return;
    }
    const trimmed = answerDraft.trim();
    if (!trimmed || trimmed.length > 80 || /[\u000A-\u000D\u0085\u2028\u2029]/.test(trimmed)) {
      return;
    }
    autoSubmittedRoundRef.current = round.id;
    void sendAction(snapshot.code, { type: "save_draft", answer: trimmed }, "answering", round.id).catch(() => {});
  }, [answerDraft, answerSeconds, connected, meIsReady, round?.id, snapshot.code, snapshot.phase]);

  const progressLabel =
    snapshot.phase === "answering"
      ? answerSeconds !== null
        ? `${t.round.lockedInProgress(answeredCount, roster.length)} · ${t.round.answerTimerLeft(answerSeconds)}`
        : t.round.lockedInProgress(answeredCount, roster.length)
      : snapshot.phase === "answers"
        ? snapshot.settings.questionRevealMode === "auto"
          ? revealSeconds === null
            ? t.round.lockedInProgress(answeredCount, roster.length)
            : t.round.questionInProgress(revealSeconds)
          : t.round.readyProgress(readyCount, roster.length)
        : snapshot.phase === "question"
          ? t.round.readyProgress(readyCount, roster.length)
          : voteSeconds !== null
            ? t.round.votesLockIn(voteSeconds)
            : t.round.votedProgress(votedCount, totalVoters);
  const readinessLabel = snapshot.phase === "answers" ? t.round.revealQuestion : t.round.readyToVote;

  const lastRevealSoundRef = useRef<string | null>(null);
  useEffect(() => {
    if (!round) return;
    if (snapshot.phase === "answers" && answerReveal.roundId === round.id && answerReveal.count > 0) {
      const key = `${round.id}:flip:${answerReveal.count}`;
      if (lastRevealSoundRef.current !== key) {
        lastRevealSoundRef.current = key;
        playCardFlipSound();
      }
      return;
    }
    if (snapshot.phase === "voting") {
      const key = `${round.id}:question-flip`;
      if (lastRevealSoundRef.current !== key) {
        lastRevealSoundRef.current = key;
        playCardFlipSound();
      }
    }
  }, [answerReveal.count, answerReveal.roundId, round, snapshot.phase]);

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answerDraft.trim() || !connected || busy || isReady || answerSeconds === 0) {
      return;
    }
    const action: PartyAction = { type: "submit_answer", answer: answerDraft };
    void act(action);
  };

  const answerProgress = (participantId: string): string | null => {
    const player = playerById.get(participantId);
    if (snapshot.phase === "answering") {
      return player?.isReady ? t.round.answerSubmitted : t.round.waiting;
    }
    return null;
  };

  const toggleReady = () => {
    if (!connected || busy) return;
    void act({ type: "set_ready", ready: !isReady });
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
            {t.round.roundLabel(round.matchRound, phaseName)} ({round.matchRound}/{round.totalRounds})
          </p>
          <h2>{phaseName}</h2>
        </div>
        <span className={`count-badge${answerTimeUrgent || voteSeconds !== null ? " is-urgent" : ""}`} aria-live="polite">
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
                  mood={player?.isReady ? "happy" : "default"}
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
            }${round.isSpicy ? " is-spicy-card" : ""}`}
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
              {round.isSpicy && (
                <>
                  <SpicyFlames />
                  <span className="spicy-question-tag">{t.round.spicyQuestionBadge}</span>
                </>
              )}
              <h2>{round.privateQuestion}</h2>
            </div>
          </div>
          <form className={`answer-form${answerTimeUrgent && !isReady ? " is-urgent" : ""}`} onSubmit={submitAnswer}>
            <label className="field-label" htmlFor="round-answer">
              {t.round.yourAnswer}
            </label>
            <input
              id="round-answer"
              type="text"
              value={answerDraft}
              maxLength={80}
              autoComplete="off"
              disabled={!connected || busy || isReady || answerSeconds === 0}
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
                answerSeconds === 0 ||
                !answerDraft.trim()
              }
            >
              {isReady ? t.round.answerLocked : t.round.submitAnswer}
            </button>
            {isReady && (
              <div className="answer-locked-actions">
                <p className="muted small-copy" role="status">
                  {t.round.answerLockedStatus}
                </p>
                <button
                  className="secondary"
                  type="button"
                  disabled={!connected || busy}
                  onClick={toggleReady}
                >
                  {t.round.editAnswer}
                </button>
              </div>
            )}
          </form>
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

            {snapshot.phase === "results" ? (
              <section className="card round-question-card round-questions-box" aria-label={t.round.sharedQuestionAria}>
                <div className="round-question-part">
                  <p className="eyebrow">{t.round.theRealQuestion}</p>
                  <h2>{round.normalQuestion}</h2>
                </div>
                <div className="round-impostor-reveal-part is-revealing" aria-label={t.round.impostorsQuestionAria}>
                  <p className="eyebrow">{t.round.impostorsQuestion}</p>
                  <p className="round-impostor-question-text">{round.impostorQuestion}</p>
                </div>
              </section>
            ) : (
              <QuestionCard
                round={round}
                revealed={snapshot.phase !== "answers"}
                countdownLabel={
                  snapshot.phase === "answers" && snapshot.settings.questionRevealMode === "auto"
                    ? revealSeconds === null
                      ? t.round.autoFlipNote
                      : revealSeconds === 0
                        ? t.round.flippingNow
                        : t.round.realQuestionDropsIn(revealSeconds)
                    : null
                }
              />
            )}

            {snapshot.phase === "results" && (() => {
              const settled = resultsSettledRoundId === round.id;
              const withScores = roster.map((participant, index) => {
                const totalScore = playerById.get(participant.id)?.score ?? 0;
                const gained = round.roundPoints?.[participant.id] ?? 0;
                const prevScore = Math.max(0, totalScore - gained);
                return { participant, index, totalScore, gained, prevScore };
              });
              const prevSorted = [...withScores].sort((a, b) => b.prevScore - a.prevScore || a.index - b.index);
              const nextSorted = [...withScores].sort((a, b) => b.totalScore - a.totalScore || a.index - b.index);
              const prevRankById = new Map(prevSorted.map((entry, rank) => [entry.participant.id, rank]));
              const activeRows = settled ? nextSorted : prevSorted;
              return (
                <section className={`card round-leaderboard-card${settled ? " is-settled" : ""}`} aria-label={t.round.leaderboard}>
                  <p className="eyebrow">{t.round.leaderboard}</p>
                  <ol className="round-leaderboard-list">
                    {activeRows.map((entry, newRank) => {
                      const prevRank = prevRankById.get(entry.participant.id) ?? newRank;
                      const rankShift = settled ? prevRank - newRank : 0;
                      const displayedScore = settled ? entry.totalScore : entry.prevScore;
                      return (
                        <li
                          key={entry.participant.id}
                          className={`round-leaderboard-row${settled && entry.gained > 0 ? " is-gained" : ""}${rankShift > 0 ? " is-climbed" : ""}`}
                          style={playerColor(entry.participant.colorId)}
                        >
                          <span className="round-leaderboard-player">
                            <span className="round-leaderboard-rank">#{newRank + 1}</span>
                            <PlayerFace colorId={entry.participant.colorId} isHost={entry.participant.id === snapshot.hostId} size="sm" />
                            <strong>{entry.participant.name}{entry.participant.id === snapshot.selfId ? t.common.youSuffix : ""}</strong>
                            {rankShift > 0 && <span className="round-rank-shift">↑{rankShift}</span>}
                          </span>
                          <span className="round-leaderboard-scores">
                            {settled && entry.gained > 0 && (
                              <span className="round-points-gained">{t.round.pointsEarned(entry.gained)}</span>
                            )}
                            <span className="round-points-total">{t.lobby.scoreBadge(displayedScore)}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })()}

          </div>

          <section className="card round-answer-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{boardEyebrow}</p>
                <h2>{boardTitle}</h2>
              </div>
            </div>
            {snapshot.phase === "voting" && (
              <p className="muted small-copy">
                {round.canVote ? t.round.votingInstruction : t.round.impostorCantVote}
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
              selectedVote={snapshot.phase === "voting" ? round.myVote : undefined}
              voteDisabled={!connected || busy || !round.canVote || voteSeconds === 0}
              onVoteSelect={
                snapshot.phase === "voting" && round.canVote && voteSeconds !== 0
                  ? (targetPlayerId) => {
                      playVoteSound();
                      void act({ type: "vote", targetPlayerId });
                    }
                  : undefined
              }
              impostorId={snapshot.phase === "results" ? round.impostorId : undefined}
              votersByTarget={votersByTarget}
            />
          </section>
        </div>
      )}

      <div className="round-actions">
        {snapshot.phase === "answering" && (
          <button
            className={round.myRerollVote ? "primary" : "secondary"}
            type="button"
            disabled={!connected || busy}
            onClick={() => void act({ type: "vote_reroll" })}
          >
            {round.myRerollVote
              ? t.round.rerollVoted(round.rerollVotes, round.rerollThreshold)
              : t.round.rerollVote(round.rerollVotes, round.rerollThreshold)}
          </button>
        )}
        {snapshot.phase === "answers" && snapshot.settings.questionRevealMode === "ready" && (
          <button
            className={isReady ? "secondary" : "primary"}
            type="button"
            disabled={!connected || busy || answerReveal.count < roster.length}
            onClick={toggleReady}
          >
            {isReady ? t.round.notReady : readinessLabel}
          </button>
        )}
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
            {round.matchRound < round.totalRounds && (
              <button
                className="primary"
                type="button"
                disabled={
                  !connected ||
                  busy ||
                  snapshot.players.length < 3 ||
                  snapshot.players.length > 8 ||
                  snapshot.players.some((player) => !player.connected)
                }
                onClick={() => void act({ type: "next_round" })}
              >
                {t.round.nextRound}
              </button>
            )}
            <button
              className={round.matchRound >= round.totalRounds ? "primary" : "secondary"}
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
