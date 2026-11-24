import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { ColorId, PartySettings, PartySnapshot, PlayerSnapshot } from "../shared/protocol";
import { COLOR_PALETTE } from "../shared/protocol";
import { ApiError, describeApiError } from "./api";
import {
  getStrings,
  LANGUAGE_OPTIONS,
  useLanguage,
  type QuestionTopicId,
  type SupportedLanguage,
} from "./i18n";
import { PlayerFace } from "./PlayerFace";
import { Round } from "./Round";
import { useAudioVolume } from "./sfx";
import { isTtsSupported, useTtsEnabled } from "./tts";
import { useParty, type UsePartyResult } from "./useParty";

type PartySettingsWithLanguage = PartySettings & {
  language?: SupportedLanguage;
  enabledTopics?: QuestionTopicId[];
};

const TOPIC_IDS: ReadonlyArray<QuestionTopicId> = [
  "animals",
  "movies_tv",
  "games",
  "music",
  "friends",
  "superpowers",
  "food_places",
  "everyday",
  "pop_life",
];

function LanguageSelect() {
  const [lang, setLang] = useLanguage();
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(event) => setLang(event.target.value as SupportedLanguage)}
      style={{ width: "auto", minHeight: "34px", padding: "4px 8px", fontSize: "0.8125rem" }}
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SpeakerSvg({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="volume-svg">
      <path
        d="M4 9.5 H8.5 L14 4.5 V19.5 L8.5 14.5 H4 Z"
        fill="currentColor"
        stroke="#1A103D"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M17.5 9 L21.5 15 M21.5 9 L17.5 15"
          fill="none"
          stroke="#FF5A5F"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M17 8.5 Q19.5 12 17 15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M19.5 6 Q23 12 19.5 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function VoiceToggle() {
  const [volume, setVolume] = useAudioVolume();
  const lastVolumeRef = useRef(volume > 0 ? volume : 0.7);
  if (volume > 0) lastVolumeRef.current = volume;
  const muted = volume <= 0;

  const toggleMute = () => {
    if (muted) {
      setVolume(lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.7);
    } else {
      setVolume(0);
    }
  };

  return (
    <div className="volume-popover-wrap">
      <div className="volume-popover" role="group" aria-label="Volume">
        <button
          type="button"
          className="volume-edge-btn"
          aria-label="Mute"
          onClick={() => setVolume(0)}
        >
          <SpeakerSvg muted={true} />
        </button>
        <input
          className="voice-volume-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(volume * 100)}
          aria-label="Volume"
          onChange={(event) => setVolume(Number(event.target.value) / 100)}
        />
        <button
          type="button"
          className="volume-edge-btn"
          aria-label="Max volume"
          onClick={() => setVolume(1)}
        >
          <SpeakerSvg muted={false} />
        </button>
      </div>
      <button
        type="button"
        className={`volume-icon-btn${muted ? " is-muted" : ""}`}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
        aria-pressed={muted}
        onClick={toggleMute}
      >
        <SpeakerSvg muted={muted} />
      </button>
    </div>
  );
}

function TopBar() {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>{t.common.brand}</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span className="eyebrow">{t.lobby.eyebrow}</span>
        <LanguageSelect />
      </div>
    </header>
  );
}

function LoadingPage({ children, role = "status" }: { children: ReactNode; role?: "status" | "alert" }) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  return (
    <main className="app-shell narrow-shell">
      <TopBar />
      <section className="card state-card">
        <p className="eyebrow">{t.common.brand}</p>
        <div className="state-message" role={role}>{children}</div>
      </section>
    </main>
  );
}

function RemovedMessage({ reason }: { reason: "left" | "kicked" | "expired" }) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const message =
    reason === "kicked"
      ? t.lobby.removedKicked
      : reason === "expired"
        ? t.lobby.removedExpired
        : t.lobby.removedLeft;
  return (
    <div className="notice error-notice" role="alert">
      <span>{message} <Link to="/">{t.lobby.goHome}</Link></span>
    </div>
  );
}

function ConnectionStatus({ connected, removed }: { connected: boolean; removed: boolean }) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  if (removed) return <span className="status-pill offline">{t.lobby.seatRemoved}</span>;
  return connected
    ? <span className="status-pill online">{t.lobby.liveAtTable}</span>
    : <span className="status-pill offline">{t.lobby.reconnectingShort}</span>;
}

function InviteLink({ code }: { code: string }) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const [copyFailed, setCopyFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const url = `${window.location.origin}/join/${code}`;

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
      setCopyFailed(true);
      window.setTimeout(() => {
        input.current?.focus();
        input.current?.select();
      }, 0);
    }
  };

  return (
    <div className="invite-box">
      <div className="invite-code-block">
        <div className="invite-code-heading">
          <span className="field-label">{t.lobby.roomCode}</span>
          <button
            className="quiet-button reveal-code-button"
            type="button"
            aria-expanded={showCode}
            aria-controls="party-join-code"
            onClick={() => setShowCode((visible) => !visible)}
          >
            {showCode ? t.lobby.hideCode : t.lobby.showCode}
          </button>
        </div>
        <strong id="party-join-code" className="code-text" hidden={!showCode}>{code}</strong>
      </div>
      <button type="button" className="secondary" onClick={() => void copy()}>
        {copied ? t.lobby.copied : t.lobby.copyInviteLink}
      </button>
      {copyFailed && (
        <label className="fallback-link">
          <span className="field-label">{t.lobby.copyThisLink}</span>
          <input
            ref={input}
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
            aria-label={t.lobby.selectableInviteLink}
          />
        </label>
      )}
    </div>
  );
}

function PlayerTiles({
  players,
  hostId,
  selfId,
  connected,
  busy,
  colorEnabled,
  onColor,
  onKick,
}: {
  players: PlayerSnapshot[];
  hostId: string;
  selfId: string;
  connected: boolean;
  busy: boolean;
  colorEnabled: boolean;
  onColor(colorId: ColorId): void;
  onKick(player: PlayerSnapshot): void;
}) {
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const occupied = new Set(players.map((player) => player.colorId));
  const ownPlayer = players.find((player) => player.id === selfId);
  const tiles = Array.from({ length: 8 }, (_, index) => players[index] ?? null);

  return (
    <div className="player-grid" aria-label={t.lobby.partySeats}>
      {tiles.map((player, index) => {
        if (!player) {
          return (
            <div className="player-tile empty-tile" key={`empty-${index}`}>
              <span className="empty-seat-mark" aria-hidden="true"><span /></span>
              <span className="empty-seat-copy">
                <strong className="empty-seat-number">{t.lobby.seatNumber(String(index + 1).padStart(2, "0"))}</strong>
                <span>{t.lobby.waitingForHomie}</span>
              </span>
            </div>
          );
        }

        const swatch = COLOR_PALETTE.find((color) => color.id === player.colorId)?.swatch ?? "#898d97";
        const isSelf = player.id === selfId;
        const isPlayerHost = player.id === hostId;

        return (
          <article
            className={`player-tile${isSelf ? " self-tile" : ""}`}
            key={player.id}
            style={{ "--player-color": swatch } as CSSProperties}
          >
            <div className="player-tile-heading">
              <PlayerFace size="lg" colorId={player.colorId} isHost={isPlayerHost} offline={!player.connected} mood={isSelf ? "happy" : "default"} />
              <div className="player-names">
                <strong>{player.name}{isSelf ? t.common.youSuffix : ""}</strong>
                <div className="player-tag-row">
                  {isPlayerHost && <span className="host-tag">{t.lobby.hostTag}</span>}
                  {player.score > 0 && <span className="score-tag">{t.lobby.scoreBadge(player.score)}</span>}
                </div>
              </div>
              <div className="player-tile-status">
                <span className={`presence ${player.connected ? "presence-online" : "presence-offline"}`}>
                  {player.connected ? t.common.online : t.common.offline}
                </span>
                {selfId === hostId && !isSelf && (
                  <button
                    className="kick-button"
                    type="button"
                    aria-label={t.lobby.removePlayerAria(player.name)}
                    disabled={!connected || busy}
                    onClick={() => onKick(player)}
                  >
                    {t.lobby.bootPlayer}
                  </button>
                )}
              </div>
            </div>

            {isSelf && ownPlayer && colorEnabled && (
              <div className="color-picker">
                <span className="field-label">{t.lobby.pickYourVibe}</span>
                <div className="swatch-row" role="group" aria-label={t.lobby.chooseYourColour}>
                  {COLOR_PALETTE.map((color) => {
                    const isSelected = color.id === player.colorId;
                    const isOccupied = occupied.has(color.id) && !isSelected;
                    return (
                      <button
                        key={color.id}
                        className={`color-swatch${isSelected ? " selected" : ""}${isOccupied ? " occupied" : ""}`}
                        type="button"
                        style={{ "--swatch": color.swatch } as CSSProperties}
                        aria-label={`${color.name}${isSelected ? `, ${t.lobby.selected}` : isOccupied ? `, ${t.lobby.occupied}` : ""}`}
                        aria-pressed={isSelected}
                        disabled={!connected || busy || isOccupied || isSelected}
                        onClick={() => onColor(color.id)}
                      >
                        <span className="sr-only">{color.name}{isOccupied ? ` ${t.lobby.occupied}` : ""}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="muted small-copy">
                  {t.lobby.selectedColour(COLOR_PALETTE.find((color) => color.id === player.colorId)?.name ?? player.colorId)}
                </span>
              </div>
            )}

          </article>
        );
      })}
    </div>
  );
}

function SettingsPanel({
  settings,
  isHost,
  connected,
  busy,
  onChange,
}: {
  settings: PartySettings;
  isHost: boolean;
  connected: boolean;
  busy: boolean;
  onChange(settings: PartySettings): void;
}) {
  const [lang, setLang] = useLanguage();
  const [ttsEnabled, toggleTts] = useTtsEnabled();
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"general" | "advanced">("general");
  const [draftTopics, setDraftTopics] = useState<QuestionTopicId[] | null>(null);
  const t = getStrings(lang);
  const currentGameLanguage = (settings as PartySettingsWithLanguage).language ?? "en";
  const rawEnabledTopics = (settings as PartySettingsWithLanguage).enabledTopics;
  const savedTopics: QuestionTopicId[] =
    rawEnabledTopics && rawEnabledTopics.length > 0 ? rawEnabledTopics : [...TOPIC_IDS];
  const activeTopics = topicsOpen && draftTopics ? draftTopics : savedTopics;
  const update = (patch: Partial<PartySettingsWithLanguage>) =>
    onChange({ ...settings, ...patch } as PartySettings);

  const openTopicsModal = () => {
    setDraftTopics([...savedTopics]);
    setTopicsOpen(true);
  };

  const closeTopicsModal = () => {
    if (isHost && draftTopics) {
      const changed =
        draftTopics.length !== savedTopics.length ||
        draftTopics.some((id, idx) => id !== savedTopics[idx]);
      if (changed) update({ enabledTopics: draftTopics });
    }
    setTopicsOpen(false);
    setDraftTopics(null);
  };

  const toggleTopic = (topicId: QuestionTopicId) => {
    if (!isHost) return;
    const base = draftTopics ?? savedTopics;
    const isActive = base.includes(topicId);
    if (isActive && base.length <= 1) return;
    const nextTopics = TOPIC_IDS.filter((id) =>
      isActive ? id !== topicId && base.includes(id) : id === topicId || base.includes(id),
    );
    setDraftTopics(nextTopics);
  };

  return (
    <section className="card settings-card">
      <div className="section-heading settings-card-heading">
        <div>
          <p className="eyebrow">{t.lobby.houseRules}</p>
          <h2>{t.lobby.settings}</h2>
        </div>
        <div className="settings-header-controls">
          {!isHost && <span className="sticker-badge sticker-badge--cyan">{t.lobby.hostOnly}</span>}
          <div className="settings-view-switch" role="tablist" aria-label={t.lobby.settings}>
            <button
              type="button"
              role="tab"
              aria-selected={settingsView === "general"}
              className={`settings-view-tab${settingsView === "general" ? " is-active" : ""}`}
              onClick={() => setSettingsView("general")}
            >
              {t.lobby.generalSettings}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={settingsView === "advanced"}
              className={`settings-view-tab${settingsView === "advanced" ? " is-active" : ""}`}
              onClick={() => setSettingsView("advanced")}
            >
              {t.lobby.advancedSettings}
            </button>
          </div>
        </div>
      </div>

      {settingsView === "general" ? (
        <div className="settings-tiles">
          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.visibility}</strong>
              <span className="setting-description">
                {settings.visibility === "private"
                  ? t.lobby.visibilityPrivateDesc
                  : t.lobby.visibilityPublicDesc}
              </span>
            </div>
            <div className="pill-group" role="group" aria-label={t.lobby.visibilityAria}>
              {(["private", "public"] as const).map((mode) => {
                const active = settings.visibility === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`pill-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    disabled={!isHost || !connected || busy}
                    onClick={() => update({ visibility: mode })}
                  >
                    {mode === "private" ? t.lobby.privateLabel : t.lobby.publicLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.answerTime}</strong>
              <span className="setting-description">{t.lobby.answerTimeDesc}</span>
            </div>
            <div className="pill-group pill-group--compact" role="group" aria-label={t.lobby.answerTimeAria}>
              {([30, 45, 60, 90, 120, 0] as const).map((seconds) => {
                const current = settings.answerTimeSeconds ?? 60;
                const active = current === seconds;
                return (
                  <button
                    key={seconds}
                    type="button"
                    className={`pill-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    disabled={!isHost || !connected || busy}
                    onClick={() => update({ answerTimeSeconds: seconds })}
                  >
                    {seconds === 0 ? t.lobby.answerTimeOff : t.lobby.answerTimeSeconds(seconds)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.roundCount}</strong>
              <span className="setting-description">{t.lobby.roundCountDesc}</span>
            </div>
            <div className="pill-group pill-group--compact" role="group" aria-label={t.lobby.roundCountAria}>
              {([3, 5, 7, 10] as const).map((count) => {
                const current = settings.roundCount ?? 5;
                const active = current === count;
                return (
                  <button
                    key={count}
                    type="button"
                    className={`pill-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    disabled={!isHost || !connected || busy}
                    onClick={() => update({ roundCount: count })}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.questionReveal}</strong>
              <span className="setting-description">{t.lobby.questionRevealDesc}</span>
            </div>
            <div className="pill-group" role="group" aria-label={t.lobby.questionRevealAria}>
              {(["ready", "auto"] as const).map((mode) => {
                const active = settings.questionRevealMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`pill-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    disabled={!isHost || !connected || busy}
                    onClick={() => update({ questionRevealMode: mode })}
                  >
                    {mode === "ready" ? t.lobby.everyoneReady : t.lobby.after8Seconds}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.gameLanguage}</strong>
              <span className="setting-description">{t.lobby.gameLanguageDesc}</span>
            </div>
            {isHost ? (
              <select
                aria-label={t.lobby.gameLanguageAria}
                value={currentGameLanguage}
                disabled={!connected || busy}
                onChange={(event) => {
                  const nextLang = event.target.value as SupportedLanguage;
                  update({ language: nextLang });
                  setLang(nextLang);
                }}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="setting-value">
                {LANGUAGE_OPTIONS.find((option) => option.code === currentGameLanguage)?.label ?? "English"}
              </span>
            )}
          </div>

          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.topicsLabel}</strong>
              <span className="setting-description">{t.lobby.topicsDescription}</span>
            </div>
            <button
              type="button"
              className="secondary topics-open-button"
              onClick={openTopicsModal}
            >
              {t.lobby.topicsLabel} ({savedTopics.length}/{TOPIC_IDS.length})
            </button>
          </div>
        </div>
      ) : (
        <div className="settings-tiles">
          <div className="setting-tile">
            <div className="setting-tile-header">
              <strong>{t.lobby.spicyMode}</strong>
              <span className="setting-description">
                {(settings.spicyMode ?? false)
                  ? t.lobby.spicyOnDesc
                  : t.lobby.spicyOffDesc}
              </span>
            </div>
            <div className="pill-group" role="group" aria-label={t.lobby.spicyModeAria}>
              {([false, true] as const).map((spicy) => {
                const active = (settings.spicyMode ?? false) === spicy;
                return (
                  <button
                    key={String(spicy)}
                    type="button"
                    className={`pill-option${active ? " is-active" : ""}${spicy && active ? " is-spicy" : ""}`}
                    aria-pressed={active}
                    disabled={!isHost || !connected || busy}
                    onClick={() => update({ spicyMode: spicy })}
                  >
                    {spicy ? t.lobby.spicyOn : t.lobby.spicyOff}
                  </button>
                );
              })}
            </div>
          </div>

          {isTtsSupported() && (
            <div className="setting-tile">
              <div className="setting-tile-header">
                <strong>{t.lobby.voiceSynthesizer}</strong>
                <span className="setting-description">{t.lobby.voiceSynthesizerDesc}</span>
              </div>
              <div className="pill-group" role="group" aria-label={t.lobby.voiceSynthesizer}>
                {([false, true] as const).map((on) => {
                  const active = ttsEnabled === on;
                  return (
                    <button
                      key={String(on)}
                      type="button"
                      className={`pill-option${active ? " is-active" : ""}`}
                      aria-pressed={active}
                      onClick={() => {
                        if (ttsEnabled !== on) toggleTts();
                      }}
                    >
                      {on ? t.lobby.spicyOn : t.lobby.spicyOff}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {topicsOpen && (
        <div
          className="topics-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t.lobby.topicsLabel}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeTopicsModal();
          }}
        >
          <div className="card topics-modal">
            <div className="topics-modal-header">
              <div>
                <p className="eyebrow">{t.lobby.houseRules}</p>
                <h2>{t.lobby.topicsLabel} <span className="count-badge">{activeTopics.length}/{TOPIC_IDS.length}</span></h2>
              </div>
              <div className="button-row">
                <Link
                  to="/questions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quiet-button link-button"
                >
                  {t.home.questionsButton}
                </Link>
                {isHost && activeTopics.length < TOPIC_IDS.length && (
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() => setDraftTopics([...TOPIC_IDS])}
                  >
                    All
                  </button>
                )}
                <button type="button" className="primary" onClick={closeTopicsModal}>
                  OK
                </button>
              </div>
            </div>
            <p className="muted small-copy">{t.lobby.topicsDescription}</p>
            <div className="topics-modal-grid" role={isHost ? "group" : undefined} aria-label={t.lobby.topicsLabel}>
              {TOPIC_IDS.map((topicId) => {
                const isActive = activeTopics.includes(topicId);
                const isLastActive = isActive && activeTopics.length <= 1;
                return isHost ? (
                  <button
                    key={topicId}
                    type="button"
                    className={`topic-box${isActive ? " is-active" : ""}`}
                    aria-pressed={isActive}
                    disabled={isLastActive}
                    onClick={() => toggleTopic(topicId)}
                  >
                    <span className="topic-box-name">{t.lobby.topics[topicId]}</span>
                    <span className="topic-box-state">{isActive ? "✓" : "-"}</span>
                  </button>
                ) : (
                  <div
                    key={topicId}
                    className={`topic-box is-readonly${isActive ? " is-active" : ""}`}
                  >
                    <span className="topic-box-name">{t.lobby.topics[topicId]}</span>
                    <span className="topic-box-state">{isActive ? "✓" : "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LobbyView({
  snapshot,
  connected,
  busy,
  error,
  act,
  retry,
  clearError,
  removedReason,
}: {
  snapshot: PartySnapshot;
  connected: boolean;
  busy: boolean;
  error: ApiError | null;
  act: UsePartyResult["act"];
  retry: UsePartyResult["retry"];
  clearError(): void;
  removedReason: UsePartyResult["removedReason"];
}) {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const isHost = snapshot.hostId === snapshot.selfId;
  const host = snapshot.players.find((player) => player.id === snapshot.hostId);

  const updateSettings = (settings: PartySettings) => {
    if (!isHost) return;
    clearError();
    void act({ type: "set_settings", settings });
  };

  const changeColor = (colorId: ColorId) => {
    clearError();
    void act({ type: "set_color", colorId });
  };

  const [pendingKick, setPendingKick] = useState<PlayerSnapshot | null>(null);

  const kickPlayer = (player: PlayerSnapshot) => {
    setPendingKick(player);
  };

  const confirmKick = () => {
    if (!pendingKick) return;
    clearError();
    void act({ type: "kick", playerId: pendingKick.id });
    setPendingKick(null);
  };

  const leave = async () => {
    if (busy || !connected) return;
    const result = await act({ type: "leave" });
    if (result && "left" in result) navigate("/");
  };

  const startRound = () => {
    if (!isHost || !connected || busy) return;
    clearError();
    void act({ type: "start_round" });
  };

  const [spawningBots, setSpawningBots] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(snapshot.roomName ?? "");
  const isLocalDev =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(window.location.hostname);

  const spawnTestBots = async () => {
    if (!isHost || !connected || busy || spawningBots) return;
    setSpawningBots(true);
    clearError();
    try {
      await fetch(`/api/dev/parties/${snapshot.code}/bots`, {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      setSpawningBots(false);
    }
  };

  const roundInProgress = snapshot.phase !== "lobby";

  return (
    <main className={`app-shell party-shell ${roundInProgress ? "round-app-shell" : "lobby-app-shell"}`}>
      {roundInProgress ? (
        <header className="round-party-bar">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>{t.common.brand}</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <VoiceToggle />
            <LanguageSelect />
            <ConnectionStatus connected={connected} removed={Boolean(removedReason)} />
          </div>
        </header>
      ) : (
        <>
          <TopBar />
          <section className="party-heading">
            <div>
              <p className="eyebrow">{snapshot.settings.visibility === "private" ? t.lobby.privateRoom : t.lobby.publicRoom}</p>
              {isHost && editingTitle ? (
                <form
                  className="party-title-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    clearError();
                    void act({ type: "set_room_name", roomName: draftTitle });
                    setEditingTitle(false);
                  }}
                >
                  <input
                    autoFocus
                    aria-label="Room name"
                    maxLength={32}
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder={t.lobby.waitingRoom}
                    disabled={!connected || busy}
                  />
                  <button type="submit" className="primary" disabled={!connected || busy}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setDraftTitle(snapshot.roomName ?? "");
                      setEditingTitle(false);
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="party-title-row">
                  <h1 className="party-title">{snapshot.roomName || t.lobby.waitingRoom}</h1>
                  {isHost && (
                    <button
                      type="button"
                      className="party-title-edit-btn"
                      aria-label="Edit room name"
                      disabled={!connected || busy}
                      onClick={() => {
                        setDraftTitle(snapshot.roomName ?? "");
                        setEditingTitle(true);
                      }}
                    >
                      ✎
                    </button>
                  )}
                </div>
              )}
              <p className="party-subtitle">
                {t.lobby.hostedBy(host?.name ?? t.lobby.aPlayer, snapshot.players.length)}
              </p>
            </div>
            <div className="party-heading-actions">
              <InviteLink code={snapshot.code} />
              <ConnectionStatus connected={connected} removed={Boolean(removedReason)} />
            </div>
          </section>
        </>
      )}

      {removedReason && <RemovedMessage reason={removedReason} />}
      {!removedReason && !connected && (
        <div className="notice reconnect-notice" role="status">
          <span>{t.lobby.reconnectingNotice}</span>
          <button className="quiet-button" type="button" disabled={busy} onClick={retry}>
            {t.common.retryConnection}
          </button>
        </div>
      )}
      {error && (
        <div className="notice error-notice floating-error-toast" role="alert">
          <span>{describeApiError(error)}</span>
          <button className="quiet-button" type="button" onClick={clearError} aria-label={t.common.dismissError}>
            {t.common.dismiss}
          </button>
        </div>
      )}
      {snapshot.notice?.type === "round_cancelled" && (
        <div className="notice" role="status">
          {t.lobby.roundCancelled(snapshot.notice.playerName)}
        </div>
      )}

      {roundInProgress ? (
        <Round snapshot={snapshot} connected={connected} busy={busy} act={act} onLeave={() => void leave()} />
      ) : (
        <div className="lobby-layout">
          <section className="card roster-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.lobby.whosAtTable}</p>
                <h2>
                  {t.lobby.squad} <span className="count-badge count-badge-lg">{snapshot.players.length}/8</span>
                </h2>
              </div>
              {isHost && <span className="sticker-badge">{t.lobby.youAreHost}</span>}
            </div>
            <PlayerTiles
              players={snapshot.players}
              hostId={snapshot.hostId}
              selfId={snapshot.selfId}
              connected={connected}
              busy={busy}
              colorEnabled={true}
              onColor={changeColor}
              onKick={kickPlayer}
            />
            <p className="muted small-copy">
              {t.lobby.offlineGraceNote}
            </p>
          </section>

          <aside className="lobby-sidebar">
            <SettingsPanel
              settings={snapshot.settings}
              isHost={isHost}
              connected={connected}
              busy={busy}
              onChange={updateSettings}
            />
            <div className="lobby-actions">
              {isLocalDev && isHost && snapshot.players.length < 4 && (
                <button
                  className="secondary"
                  type="button"
                  disabled={!connected || busy || spawningBots}
                  onClick={() => void spawnTestBots()}
                >
                  {spawningBots ? "Spawning..." : "+3 test bots"}
                </button>
              )}
              {isHost && (
                <button className="primary" type="button" disabled={!connected || busy} onClick={startRound}>
                  {t.lobby.startRound}
                </button>
              )}
              <button className="secondary" type="button" disabled={!connected || busy} onClick={() => void leave()}>
                {t.common.leaveParty}
              </button>
            </div>
          </aside>
        </div>
      )}

      {pendingKick && (
        <div
          className="topics-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={t.lobby.bootPlayer}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPendingKick(null);
          }}
        >
          <div className="card confirm-modal">
            <div className="confirm-modal-header">
              <PlayerFace colorId={pendingKick.colorId} size="md" />
              <p className="confirm-modal-message">{t.lobby.kickConfirm(pendingKick.name)}</p>
            </div>
            <div className="button-row">
              <button type="button" className="secondary" onClick={() => setPendingKick(null)}>
                {t.common.dismiss}
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={!connected || busy}
                onClick={confirmKick}
              >
                {t.lobby.bootPlayer}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="page-footer">
        <Link to="/">{t.common.home}</Link>
        <span>{t.lobby.footerTagline}</span>
      </footer>
    </main>
  );
}

export function PartyPage() {
  const { code: rawCode = "" } = useParams();
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const party = useParty(rawCode);
  const currentPartyCode = party.currentPartyCode !== party.code ? party.currentPartyCode : null;
  const currentParty = useParty(currentPartyCode ?? "");
  const [leavingOther, setLeavingOther] = useState(false);

  if (party.status === "invalid-code") {
    return (
      <main className="app-shell narrow-shell">
        <TopBar />
        <section className="card state-card not-found-card" role="alert">
          <PlayerFace colorId="coral" mood="sus" size="lg" className="not-found-face" />
          <span className="sticker-badge sticker-badge--coral">{t.common.brand}</span>
          <h1 className="page-title">{t.lobby.invalidPartyCode}</h1>
          <div className="button-row">
            <Link className="primary link-button" to="/">{t.lobby.enterCodeFromHome}</Link>
          </div>
        </section>
      </main>
    );
  }
  if (party.status === "loading") return <LoadingPage>{t.lobby.loadingParty}</LoadingPage>;

  if (party.status === "different-party" && currentPartyCode) {
    const leaveCurrent = async () => {
      setLeavingOther(true);
      const result = await currentParty.act({ type: "leave" });
      if (result && "left" in result) party.retry();
      setLeavingOther(false);
    };
    return (
      <main className="app-shell narrow-shell">
        <TopBar />
        <section className="card state-card">
          <span className="sticker-badge sticker-badge--cyan">{t.lobby.oneSeatPerGuest}</span>
          <h1 className="page-title">{t.lobby.alreadyInParty}</h1>
          <p>{t.lobby.alreadyInPartyBody(currentPartyCode)}</p>
          <div className="button-row">
            <Link className="primary link-button" to={`/party/${currentPartyCode}`}>
              {t.join.returnToCurrentParty}
            </Link>
            <button
              className="secondary"
              type="button"
              disabled={leavingOther || currentParty.busy || !currentParty.connected}
              onClick={() => void leaveCurrent()}
            >
              {leavingOther ? t.lobby.leaving : currentParty.connected ? t.join.leaveCurrentParty : t.lobby.reconnectToLeave}
            </button>
            <Link className="quiet-button link-button" to={`/join/${party.code}`}>{t.lobby.joinThisParty}</Link>
          </div>
          {currentParty.error && (
            <div className="notice error-notice" role="alert">{describeApiError(currentParty.error)}</div>
          )}
        </section>
      </main>
    );
  }

  if (party.status === "not-member") {
    return (
      <main className="app-shell narrow-shell">
        <TopBar />
        <section className="card state-card">
          <span className="sticker-badge sticker-badge--coral">{t.lobby.inviteRequired}</span>
          <h1 className="page-title">{t.lobby.notInParty}</h1>
          <p>{t.lobby.notInPartyBody}</p>
          <div className="button-row">
            <Link className="primary link-button" to={`/join/${party.code}`}>{t.lobby.joinParty}</Link>
            <Link className="secondary link-button" to="/">{t.common.backToHome}</Link>
          </div>
        </section>
      </main>
    );
  }

  if (!party.snapshot) {
    return (
      <main className="app-shell narrow-shell">
        <TopBar />
        <section className="card state-card not-found-card" role="alert">
          <PlayerFace colorId="amber" mood="sus" size="lg" className="not-found-face" />
          <span className="sticker-badge sticker-badge--coral">{t.common.brand}</span>
          <h1 className="page-title">{party.error ? describeApiError(party.error) : t.lobby.couldNotLoadParty}</h1>
          <div className="button-row">
            <button className="primary" type="button" onClick={party.retry}>{t.common.tryAgain}</button>
            <Link className="secondary link-button" to="/">{t.common.backToHome}</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <LobbyView
      snapshot={party.snapshot}
      connected={party.connected}
      busy={party.busy}
      error={party.error}
      act={party.act}
      retry={party.retry}
      clearError={party.clearError}
      removedReason={party.removedReason}
    />
  );
}
