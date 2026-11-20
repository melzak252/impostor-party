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
import { useParty, type UsePartyResult } from "./useParty";

type PartySettingsWithLanguage = PartySettings & {
  language?: SupportedLanguage;
  enabledTopics?: QuestionTopicId[];
};

const TOPIC_IDS: ReadonlyArray<QuestionTopicId> = [
  "animals",
  "movies_tv",
  "actors",
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
      <p className="muted small-copy">{t.lobby.inviteNote}</p>
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
  const tiles = Array.from({ length: 6 }, (_, index) => players[index] ?? null);

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
                {isPlayerHost && <span className="host-tag">{t.lobby.hostTag}</span>}
              </div>
              <span className={`presence ${player.connected ? "presence-online" : "presence-offline"}`}>
                {player.connected ? t.common.online : t.common.offline}
              </span>
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

            {!isSelf && !isPlayerHost && <span className="player-role-note">{t.lobby.squadMember}</span>}

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
  const t = getStrings(lang);
  const currentGameLanguage = (settings as PartySettingsWithLanguage).language ?? "en";
  const rawEnabledTopics = (settings as PartySettingsWithLanguage).enabledTopics;
  const activeTopics: QuestionTopicId[] =
    rawEnabledTopics && rawEnabledTopics.length > 0 ? rawEnabledTopics : [...TOPIC_IDS];
  const update = (patch: Partial<PartySettingsWithLanguage>) =>
    onChange({ ...settings, ...patch } as PartySettings);
  const toggleTopic = (topicId: QuestionTopicId) => {
    const isActive = activeTopics.includes(topicId);
    if (isActive && activeTopics.length <= 1) return;
    const nextTopics = TOPIC_IDS.filter((id) =>
      isActive ? id !== topicId && activeTopics.includes(id) : id === topicId || activeTopics.includes(id),
    );
    update({ enabledTopics: nextTopics });
  };

  return (
    <section className="card settings-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.lobby.houseRules}</p>
          <h2>{t.lobby.settings}</h2>
        </div>
        {!isHost && <span className="sticker-badge sticker-badge--cyan">{t.lobby.hostOnly}</span>}
      </div>
      <div className="settings-grid">
        <div className="setting-row">
          <div>
            <strong>{t.lobby.visibility}</strong>
            <span className="setting-description">
              {settings.visibility === "private"
                ? t.lobby.visibilityPrivateDesc
                : t.lobby.visibilityPublicDesc}
            </span>
          </div>
          {isHost ? (
            <select
              aria-label={t.lobby.visibilityAria}
              value={settings.visibility}
              disabled={!connected || busy}
              onChange={(event) => update({ visibility: event.target.value as PartySettings["visibility"] })}
            >
              <option value="private">{t.lobby.privateLabel}</option>
              <option value="public">{t.lobby.publicLabel}</option>
            </select>
          ) : (
            <span className="setting-value">{settings.visibility === "private" ? t.lobby.privateLabel : t.lobby.publicLabel}</span>
          )}
        </div>

        <div className="setting-row">
          <div>
            <strong>{t.lobby.questionReveal}</strong>
            <span className="setting-description">{t.lobby.questionRevealDesc}</span>
          </div>
          {isHost ? (
            <select
              aria-label={t.lobby.questionRevealAria}
              value={settings.questionRevealMode}
              disabled={!connected || busy}
              onChange={(event) =>
                update({ questionRevealMode: event.target.value as PartySettings["questionRevealMode"] })
              }
            >
              <option value="ready">{t.lobby.everyoneReady}</option>
              <option value="auto">{t.lobby.after8Seconds}</option>
            </select>
          ) : (
            <span className="setting-value">
              {settings.questionRevealMode === "ready" ? t.lobby.everyoneReady : t.lobby.after8Seconds}
            </span>
          )}
        </div>

        <div className="setting-row">
          <div>
            <strong>{t.lobby.spicyMode}</strong>
            <span className="setting-description">
              {(settings.spicyMode ?? false)
                ? t.lobby.spicyOnDesc
                : t.lobby.spicyOffDesc}
            </span>
          </div>
          {isHost ? (
            <select
              aria-label={t.lobby.spicyModeAria}
              value={(settings.spicyMode ?? false) ? "on" : "off"}
              disabled={!connected || busy}
              onChange={(event) => update({ spicyMode: event.target.value === "on" })}
            >
              <option value="off">{t.lobby.spicyOff}</option>
              <option value="on">{t.lobby.spicyOn}</option>
            </select>
          ) : (
            <span className="setting-value">
              {(settings.spicyMode ?? false) ? t.lobby.spicyOn : t.lobby.spicyOff}
            </span>
          )}
        </div>

        <div className="setting-row">
          <div>
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

        <div className="setting-row setting-row-topics">
          <div>
            <strong>{t.lobby.topicsLabel}</strong>
            <span className="setting-description">{t.lobby.topicsDescription}</span>
          </div>
          <div className="topic-chips" role={isHost ? "group" : undefined} aria-label={t.lobby.topicsLabel}>
            {TOPIC_IDS.map((topicId) => {
              const isActive = activeTopics.includes(topicId);
              const isLastActive = isActive && activeTopics.length <= 1;
              return isHost ? (
                <button
                  key={topicId}
                  type="button"
                  className={`topic-chip${isActive ? " is-active" : ""}`}
                  aria-pressed={isActive}
                  disabled={!connected || busy || isLastActive}
                  onClick={() => toggleTopic(topicId)}
                >
                  {t.lobby.topics[topicId]}
                </button>
              ) : (
                <span
                  key={topicId}
                  className={`topic-chip is-readonly${isActive ? " is-active" : ""}`}
                >
                  {t.lobby.topics[topicId]}
                </span>
              );
            })}
          </div>
        </div>
      </div>
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

  const kickPlayer = (player: PlayerSnapshot) => {
    if (!window.confirm(t.lobby.kickConfirm(player.name))) return;
    clearError();
    void act({ type: "kick", playerId: player.id });
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
              <h1 className="party-title">{t.lobby.waitingRoom}</h1>
              <p className="party-subtitle">
                {t.lobby.hostedBy(host?.name ?? t.lobby.aPlayer, snapshot.players.length)}
              </p>
            </div>
            <ConnectionStatus connected={connected} removed={Boolean(removedReason)} />
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
        <div className="notice error-notice" role="alert">
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
                  {t.lobby.squad} <span className="count-badge count-badge-lg">{snapshot.players.length}/6</span>
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
            <InviteLink code={snapshot.code} />
            <SettingsPanel
              settings={snapshot.settings}
              isHost={isHost}
              connected={connected}
              busy={busy}
              onChange={updateSettings}
            />
            <div className="lobby-actions">
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
      <LoadingPage role="alert">
        {t.lobby.invalidPartyCode} <Link to="/">{t.lobby.enterCodeFromHome}</Link>
      </LoadingPage>
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
          <p className="eyebrow">{t.lobby.oneSeatPerGuest}</p>
          <h1 className="page-title">{t.lobby.alreadyInParty}</h1>
          <p>{t.lobby.alreadyInPartyBody(currentPartyCode)}</p>
          <div className="button-row">
            <Link className="secondary link-button" to={`/party/${currentPartyCode}`}>
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
          </div>
          {currentParty.error && (
            <div className="notice error-notice" role="alert">{describeApiError(currentParty.error)}</div>
          )}
          <Link className="text-link" to={`/join/${party.code}`}>{t.lobby.joinThisParty}</Link>
        </section>
      </main>
    );
  }

  if (party.status === "not-member") {
    return (
      <main className="app-shell narrow-shell">
        <TopBar />
        <section className="card state-card">
          <p className="eyebrow">{t.lobby.inviteRequired}</p>
          <h1 className="page-title">{t.lobby.notInParty}</h1>
          <p>{t.lobby.notInPartyBody}</p>
          <Link className="primary link-button" to={`/join/${party.code}`}>{t.lobby.joinParty}</Link>
          <Link className="text-link" to="/">{t.common.backToHome}</Link>
        </section>
      </main>
    );
  }

  if (!party.snapshot) {
    return (
      <LoadingPage role="alert">
        <span>{party.error ? describeApiError(party.error) : t.lobby.couldNotLoadParty}</span>
        <button className="secondary" type="button" onClick={party.retry}>{t.common.tryAgain}</button>
        <Link to="/">{t.common.backToHome}</Link>
      </LoadingPage>
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
