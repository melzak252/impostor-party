import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ApiError,
  createParty,
  createSession,
  describeApiError,
  joinParty,
  listParties,
  normalizePartyCode,
  type PublicParty,
  type SessionResponse,
} from "./api";
import { useParty } from "./useParty";
import { PlayerFace } from "./PlayerFace";
import { getStrings, LANGUAGE_OPTIONS, useLanguage, type SupportedLanguage, type TranslationStrings } from "./i18n";

function validName(value: string, t: TranslationStrings): string | null {
  const name = value.trim();
  if (!name) return t.home.enterName;
  if (name.length > 20) return t.home.nameMaxLength;
  return null;
}

function Header() {
  const [lang, setLang] = useLanguage();
  const t = getStrings(lang);

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>{t.common.brand}</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span className="eyebrow">{t.home.eyebrow}</span>
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
      </div>
    </header>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [parties, setParties] = useState<PublicParty[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const currentParty = useParty(session?.currentPartyCode ?? "");

  useEffect(() => {
    let active = true;
    setSessionLoading(true);
    setSessionError(null);
    void createSession().then((value) => {
      if (active) {
        setSession(value);
        setMessage(null);
      }
    }).catch((error: unknown) => {
      if (active) setSessionError(describeApiError(error));
    }).finally(() => {
      if (active) setSessionLoading(false);
    });
    return () => { active = false; };
  }, [sessionRetry]);

  useEffect(() => {
    if (!currentParty.removedReason) return;
    setSession({ currentPartyCode: null });
    setMessage(currentParty.removedReason === "kicked"
      ? t.home.removedKicked
      : currentParty.removedReason === "expired"
        ? t.home.removedExpired
        : t.home.removedLeft);
  }, [currentParty.removedReason, t]);

  const refreshParties = useCallback(async () => {
    try {
      setParties(await listParties());
      setListError(null);
    } catch (error) {
      setListError(describeApiError(error));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const refresh = () => {
      if (active && document.visibilityState === "visible") void refreshParties();
    };
    void refreshParties();
    const timer = window.setInterval(refresh, 5_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refreshParties, session]);

  const reloadSession = useCallback(() => setSessionRetry((attempt) => attempt + 1), []);

  const requireName = (): string | null => {
    const validation = validName(name, t);
    if (validation) {
      setMessage(validation);
      return null;
    }
    setMessage(null);
    return name.trim();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const playerName = requireName();
    if (!playerName || !session || sessionLoading || session.currentPartyCode || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const snapshot = await createParty(playerName, visibility, lang);
      navigate(`/party/${snapshot.code}`);
    } catch (error) {
      setMessage(describeApiError(error));
      if (error instanceof ApiError && error.code === "ALREADY_IN_PARTY") reloadSession();
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (codeValue: string) => {
    const playerName = requireName();
    const code = normalizePartyCode(codeValue);
    if (!code) {
      setMessage(t.home.invalidCode);
      return;
    }
    if (!playerName || !session || sessionLoading || session.currentPartyCode || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const snapshot = await joinParty(code, playerName);
      navigate(`/party/${snapshot.code}`);
    } catch (error) {
      setMessage(describeApiError(error));
      if (error instanceof ApiError && error.code === "ALREADY_IN_PARTY") reloadSession();
    } finally {
      setBusy(false);
    }
  };

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = normalizePartyCode(inviteCode);
    if (!code) {
      setMessage(t.home.invalidCode);
      return;
    }
    setMessage(null);
    navigate(`/join/${code}`);
  };

  const handleLeave = async () => {
    const currentCode = session?.currentPartyCode;
    if (!currentCode || busy || !currentParty.connected) return;
    setBusy(true);
    const result = await currentParty.act({ type: "leave" });
    if (result && "left" in result) setSession({ currentPartyCode: null });
    setBusy(false);
  };

  const currentCode = session?.currentPartyCode;
  const cannotJoin = sessionLoading || !session || Boolean(currentCode) || busy;

  return (
    <main className="app-shell home-shell">
      <Header />

      {sessionError && (
        <div className="notice error-notice" role="alert">
          <span>{sessionError}</span>
          <button className="quiet-button" type="button" onClick={reloadSession}>{t.common.tryAgain}</button>
        </div>
      )}

      {currentCode && (
        <section className="card return-card">
          <div>
            <p className="eyebrow">{t.home.seatSaved}</p>
            <h2>{t.home.partyTitle(currentCode)}</h2>
            <p>{t.home.returnCardCopy}</p>
            <p className={`status-pill ${currentParty.connected ? "online" : "offline"}`} role="status">
              {currentParty.connected ? t.home.partyConnected : t.home.partyReconnecting}
            </p>
            {currentParty.error && <p className="error-copy" role="alert">{describeApiError(currentParty.error)}</p>}
          </div>
          <div className="button-row">
            <Link className="primary link-button" to={`/party/${currentCode}`}>{t.home.returnToParty}</Link>
            {!currentParty.connected && !currentParty.removedReason && (
              <button className="quiet-button" type="button" disabled={currentParty.busy} onClick={currentParty.retry}>
                {t.common.retryConnection}
              </button>
            )}
            <button
              className="secondary"
              type="button"
              disabled={busy || currentParty.busy || !currentParty.connected}
              onClick={() => void handleLeave()}
            >
              {t.common.leaveParty}
            </button>
          </div>
        </section>
      )}

      <section className="hero home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">{t.home.heroEyebrow}</p>
          <h1>{t.home.heroTitleLine1}<br /><span>{t.home.heroTitleLine2}</span></h1>
          <p>{t.home.heroBody}</p>
          <div className="hero-facts">
            <span><strong>3–6</strong> {t.home.factHomies}</span>
            <span><strong>1</strong> {t.home.factOddPrompt}</span>
            <span><strong>0</strong> {t.home.factChill}</span>
          </div>
        </div>

        <div className="home-table" aria-label={t.home.demoAriaLabel}>
          <div className="home-table-heading">
            <span>{t.home.demoHeading}</span>
            <span>{t.home.demoSusCount}</span>
          </div>
          <div className="home-prompt-pair">
            <article className="home-prompt-card home-prompt-card--shared">
              <div className="home-prompt-meta">
                <span>{t.home.demoMostHomies}</span>
                <span>01</span>
              </div>
              <PlayerFace colorId="blue" mood="happy" size="lg" className="home-demo-face" />
              <p>{t.home.demoExampleNormal}</p>
              <span className="home-prompt-stamp">{t.home.demoNormalStamp}</span>
            </article>
            <article className="home-prompt-card home-prompt-card--odd">
              <div className="home-prompt-meta">
                <span>{t.home.demoTheImpostor}</span>
                <span>02</span>
              </div>
              <PlayerFace colorId="coral" mood="sus" size="lg" className="home-demo-face" />
              <p>{t.home.demoExampleSus}</p>
              <span className="home-prompt-stamp">{t.home.demoSusStamp}</span>
            </article>
          </div>
          <div className="home-table-footer">
            <span className="home-question-seal" aria-hidden="true">?</span>
            <span>{t.home.demoFooter}</span>
          </div>
        </div>
      </section>

      <div className="home-grid">
        <section className="card form-card create-room-card">
          <div className="form-card-heading">
            <div>
              <p className="eyebrow">{t.home.createEyebrow}</p>
              <h2>{t.home.createTitle}</h2>
            </div>
            <span className="sticker-badge sticker-badge--mint">{t.home.hostBadge}</span>
          </div>
          <form onSubmit={(event) => void handleCreate(event)}>
            <div className="form-fields-row">
              <div className="field-stack">
                <label className="field-label" htmlFor="home-name">{t.home.yourNickname}</label>
                <input
                  id="home-name"
                  autoComplete="nickname"
                  maxLength={20}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.home.nicknamePlaceholder}
                  disabled={busy}
                />
              </div>
              <div className="field-stack">
                <label className="field-label" htmlFor="party-visibility">{t.home.whoCanFindIt}</label>
                <select
                  id="party-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as "private" | "public")}
                  disabled={busy}
                >
                  <option value="private">{t.home.visibilityPrivateOption}</option>
                  <option value="public">{t.home.visibilityPublicOption}</option>
                </select>
              </div>
            </div>
            <button
              className="primary full-button"
              type="submit"
              disabled={!session || sessionLoading || Boolean(currentCode) || busy || Boolean(validName(name, t))}
            >
              {busy ? t.home.creatingRoom : t.home.createButton}
            </button>
          </form>
        </section>

        <section className="card form-card join-room-card">
          <div className="form-card-heading">
            <div>
              <p className="eyebrow">{t.home.joinEyebrow}</p>
              <h2>{t.home.joinTitle}</h2>
            </div>
            <span className="sticker-badge sticker-badge--cyan">{t.home.sixChars}</span>
          </div>
          <p>{t.home.joinCopy}</p>
          <form className="join-form" onSubmit={handleCodeSubmit}>
            <div className="field-stack">
              <label className="field-label" htmlFor="invite-code">{t.home.partyCode}</label>
              <input
                id="invite-code"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ABC234"
                disabled={busy}
              />
            </div>
            <button className="secondary" type="submit" disabled={busy}>{t.home.letMeIn}</button>
          </form>
        </section>
      </div>

      <section className="card public-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.home.publicEyebrow}</p>
            <h2>{t.home.publicTitle}</h2>
          </div>
          <div className="button-row">
            <span className="count-badge">{t.home.liveCount(parties.length)}</span>
            <button className="quiet-button" type="button" onClick={() => void refreshParties()} disabled={listLoading}>
              {t.home.refresh}
            </button>
          </div>
        </div>
        {sessionLoading && <p className="muted" role="status">{t.home.gettingSeatReady}</p>}
        {!sessionLoading && !sessionError && listLoading && parties.length === 0 && (
          <p className="muted" role="status">{t.home.scoutingLobbies}</p>
        )}
        {listError && (
          <div className="notice error-notice" role="alert">
            <span>{t.home.couldNotLoadParties(listError)}</span>
            <button className="quiet-button" type="button" onClick={() => void refreshParties()}>{t.common.retry}</button>
          </div>
        )}
        {!listLoading && !listError && parties.length === 0 && (
          <p className="muted">{t.home.noPublicParties}</p>
        )}
        {parties.length > 0 && (
          <ul className="party-list">
            {parties.map((party) => (
              <li className="public-party" key={party.code}>
                <div>
                  <strong>{t.home.hostRoom(party.hostName)}</strong>
                  <span>{t.home.roomMeta(party.code, party.playerCount, party.maxPlayers)}</span>
                </div>
                {currentCode === party.code
                  ? <Link className="secondary link-button" to={`/party/${party.code}`}>{t.home.returnShort}</Link>
                  : (
                    <button
                      className="primary"
                      type="button"
                      onClick={() => void handleJoin(party.code)}
                      disabled={cannotJoin}
                    >
                      {currentCode ? t.home.leavePartyFirst : t.home.join}
                    </button>
                  )}
              </li>
            ))}
          </ul>
        )}
        <p className="muted small-copy">{t.home.publicDisclaimer}</p>
      </section>

      {message && <div className="notice error-notice page-message" role="alert">{message}</div>}
      <footer className="page-footer">
        <span>{t.home.footerLeft}</span>
        <span>{t.home.footerRight}</span>
      </footer>
    </main>
  );
}

export function JoinPage() {
  const { code: rawCode = "" } = useParams();
  const navigate = useNavigate();
  const [lang] = useLanguage();
  const t = getStrings(lang);
  const code = normalizePartyCode(rawCode);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const currentParty = useParty(session?.currentPartyCode ?? "");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void createSession().then((value) => {
      if (active) {
        setSession(value);
        setMessage(null);
      }
    }).catch((cause: unknown) => {
      if (active) setError(describeApiError(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!currentParty.removedReason) return;
    setSession({ currentPartyCode: null });
    setMessage(currentParty.removedReason === "kicked"
      ? t.home.removedKicked
      : currentParty.removedReason === "expired"
        ? t.home.removedExpired
        : t.home.removedLeft);
  }, [currentParty.removedReason, t]);

  const handleLeaveCurrent = async () => {
    if (!session?.currentPartyCode || busy || !currentParty.connected) return;
    setBusy(true);
    setMessage(null);
    const result = await currentParty.act({ type: "leave" });
    if (result && "left" in result) setSession({ currentPartyCode: null });
    setBusy(false);
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validName(name, t);
    if (validation) {
      setMessage(validation);
      return;
    }
    if (!code || !session || session.currentPartyCode || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const snapshot = await joinParty(code, name.trim());
      navigate(`/party/${snapshot.code}`);
    } catch (cause) {
      setMessage(describeApiError(cause));
      if (cause instanceof ApiError && cause.code === "ALREADY_IN_PARTY") setRetry((number) => number + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell narrow-shell">
      <Header />
      <section className="card invitation-card">
        <span className="sticker-badge sticker-badge--coral">{t.join.inviteDrop}</span>
        <h1 className="page-title">{t.join.pullUpTitle}</h1>
        {code
          ? <p>{t.join.roomCodeLabel} <strong className="code-text">{code}</strong></p>
          : <div className="notice error-notice" role="alert">{t.join.invalidInviteCode}</div>}
        {loading && <p className="muted" role="status">{t.home.gettingSeatReady}</p>}
        {error && (
          <div className="notice error-notice" role="alert">
            <span>{error}</span>
            <button className="quiet-button" type="button" onClick={() => setRetry((number) => number + 1)}>{t.common.tryAgain}</button>
          </div>
        )}
        {!loading && session?.currentPartyCode === code && code && (
          <div className="notice success-notice">
            <span>{t.join.alreadySeatInParty}</span>
            <Link className="secondary link-button" to={`/party/${code}`}>{t.home.returnToParty}</Link>
          </div>
        )}
        {!loading && session?.currentPartyCode && session.currentPartyCode !== code && (
          <div className="notice">
            <span>
              {t.join.alreadyInOtherParty(session.currentPartyCode)}{" "}
              {currentParty.connected ? t.join.connectedDot : t.join.reconnectingPaused}
            </span>
            <div className="button-row">
              <Link className="secondary link-button" to={`/party/${session.currentPartyCode}`}>{t.join.returnToCurrentParty}</Link>
              {!currentParty.connected && !currentParty.removedReason && (
                <button className="quiet-button" type="button" disabled={currentParty.busy} onClick={currentParty.retry}>
                  {t.common.retryConnection}
                </button>
              )}
              <button
                className="secondary"
                type="button"
                disabled={busy || currentParty.busy || !currentParty.connected}
                onClick={() => void handleLeaveCurrent()}
              >
                {t.join.leaveCurrentParty}
              </button>
            </div>
          </div>
        )}
        {currentParty.error && session?.currentPartyCode && session.currentPartyCode !== code && (
          <div className="notice error-notice" role="alert">{describeApiError(currentParty.error)}</div>
        )}
        {code && !loading && !error && session?.currentPartyCode !== code && !session?.currentPartyCode && (
          <form className="join-form" onSubmit={(event) => void handleJoin(event)}>
            <label className="field-label" htmlFor="join-name">{t.home.yourNickname}</label>
            <input
              id="join-name"
              autoComplete="nickname"
              maxLength={20}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.join.joinNicknamePlaceholder}
              disabled={busy}
            />
            <p className="muted small-copy">{t.join.joinSeatNote}</p>
            <button className="primary full-button" type="submit" disabled={busy || !session}>
              {busy ? t.join.joining : t.home.letMeIn}
            </button>
          </form>
        )}
        {message && <div className="notice error-notice" role="alert">{message}</div>}
        <Link className="text-link" to="/">{t.common.backToHome}</Link>
      </section>
    </main>
  );
}
