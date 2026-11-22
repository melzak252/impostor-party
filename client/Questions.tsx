import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  QUESTION_TOPIC_LIST,
  type QuestionSuggestion,
  type QuestionTopicId,
  type SuggestionStatus,
} from "../shared/protocol";
import { getStrings, LANGUAGE_OPTIONS, useLanguage, type SupportedLanguage } from "./i18n";

interface TrackedQuestion {
  id: string;
  pool: string;
  language: string;
  angle: string;
  spicy: boolean;
  text: string;
}

interface QuestionsCatalogResponse {
  version: string;
  totalQuestions: number;
  friendlyCombos: number;
  spicyCombos: number;
  questions: TrackedQuestion[];
}

const POOL_TO_TOPIC: Readonly<Record<string, QuestionTopicId>> = Object.fromEntries(
  QUESTION_TOPIC_LIST.flatMap((topic) => topic.pools.map((pool) => [pool, topic.id])),
);
const PAGE_SIZE = 24;
const ADMIN_TOKEN_KEY = "impostor_admin_token";

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body?.error?.message) return body.error.message;
  } catch {
    // Ignore non-JSON errors
  }
  return `Request failed (${response.status})`;
}

export function QuestionsPage() {
  const [lang, setLang] = useLanguage();
  const t = getStrings(lang);
  const [data, setData] = useState<QuestionsCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<"all" | QuestionTopicId>("all");
  const [language, setLanguage] = useState("all");
  const [pool, setPool] = useState("all");
  const [angle, setAngle] = useState("all");
  const [spicyFilter, setSpicyFilter] = useState<"all" | "friendly" | "spicy">("all");
  const [page, setPage] = useState(1);

  // Suggestion box state
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestTopic, setSuggestTopic] = useState<QuestionTopicId>("friends");
  const [suggestLang, setSuggestLang] = useState<SupportedLanguage>(lang);
  const [suggestSpicy, setSuggestSpicy] = useState(false);
  const [suggestText, setSuggestText] = useState("");
  const [suggestHoneypot, setSuggestHoneypot] = useState("");
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestSuccess, setSuggestSuccess] = useState(false);

  // Admin moderation state
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminToken, setAdminToken] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [adminFilter, setAdminFilter] = useState<"all" | SuggestionStatus>("pending");
  const [adminItems, setAdminItems] = useState<QuestionSuggestion[] | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = (await res.json()) as QuestionsCatalogResponse;
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    setSuggestLang(lang);
  }, [lang]);

  const languages = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.questions.map((q) => q.language))].sort();
  }, [data]);

  const baseFiltered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.questions.filter((q) => {
      if (language !== "all" && q.language !== language) return false;
      if (angle !== "all" && q.angle !== angle) return false;
      if (spicyFilter === "friendly" && q.spicy) return false;
      if (spicyFilter === "spicy" && !q.spicy) return false;
      if (term && !q.text.toLowerCase().includes(term) && !q.id.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [angle, data, language, search, spicyFilter]);

  const topicCounts = useMemo(() => {
    const counts = new Map<QuestionTopicId, number>();
    for (const entry of QUESTION_TOPIC_LIST) counts.set(entry.id, 0);
    for (const q of baseFiltered) {
      const qTopic = POOL_TO_TOPIC[q.pool];
      if (qTopic) counts.set(qTopic, (counts.get(qTopic) ?? 0) + 1);
    }
    return counts;
  }, [baseFiltered]);

  const pools = useMemo(() => {
    const source = topic === "all"
      ? baseFiltered
      : baseFiltered.filter((q) => POOL_TO_TOPIC[q.pool] === topic);
    return [...new Set(source.map((q) => q.pool))].sort();
  }, [baseFiltered, topic]);

  const filtered = useMemo(() => {
    return baseFiltered.filter((q) => {
      if (topic !== "all" && POOL_TO_TOPIC[q.pool] !== topic) return false;
      if (pool !== "all" && q.pool !== pool) return false;
      return true;
    });
  }, [baseFiltered, pool, topic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [currentPage, filtered]);

  useEffect(() => {
    setPage(1);
  }, [angle, language, pool, search, spicyFilter, topic]);

  const handleTopicSelect = (nextTopic: "all" | QuestionTopicId) => {
    setTopic(nextTopic);
    setPool("all");
  };

  const handleSuggestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (suggestBusy) return;
    setSuggestBusy(true);
    setSuggestError(null);
    setSuggestSuccess(false);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: suggestTopic,
          language: suggestLang,
          spicy: suggestSpicy,
          text: suggestText,
          honeypot: suggestHoneypot,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setSuggestText("");
      setSuggestSuccess(true);
    } catch (err: unknown) {
      setSuggestError(err instanceof Error ? err.message : "Failed to submit suggestion");
    } finally {
      setSuggestBusy(false);
    }
  };

  const loadAdminQueue = useCallback(async (tokenOverride?: string, statusOverride?: "all" | SuggestionStatus) => {
    const token = (tokenOverride ?? adminToken).trim();
    const filter = statusOverride ?? adminFilter;
    if (!token) return;
    setAdminBusy(true);
    setAdminError(null);
    try {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      const query = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
      const res = await fetch(`/api/admin/suggestions${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const body = (await res.json()) as { suggestions: QuestionSuggestion[] };
      setAdminItems(body.suggestions);
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setAdminBusy(false);
    }
  }, [adminFilter, adminToken]);

  const handleReviewSuggestion = async (id: string, status: "approved" | "rejected") => {
    const token = adminToken.trim();
    if (!token || adminBusy) return;
    setAdminBusy(true);
    setAdminError(null);
    try {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      await loadAdminQueue(token, adminFilter);
      if (status === "approved") await loadQuestions();
    } catch (err: unknown) {
      setAdminError(err instanceof Error ? err.message : "Failed to update suggestion");
      setAdminBusy(false);
    }
  };

  return (
    <main className="app-shell questions-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>{t.common.brand}</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="primary header-questions-btn"
            onClick={() => {
              setSuggestOpen((open) => !open);
              setSuggestSuccess(false);
              setSuggestError(null);
            }}
          >
            {t.questions.suggestButton}
          </button>
          <select
            aria-label="Language"
            value={lang}
            onChange={(event) => setLang(event.target.value as SupportedLanguage)}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <Link to="/" className="secondary link-button header-questions-btn">{t.questions.backToHome}</Link>
        </div>
      </header>

      {suggestOpen && (
        <section className="card suggest-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.questions.suggestButton}</p>
              <h2>{t.questions.suggestTitle}</h2>
            </div>
            <button type="button" className="quiet-button" onClick={() => setSuggestOpen(false)}>
              {t.common.dismiss}
            </button>
          </div>
          <form className="suggest-form" onSubmit={(e) => void handleSuggestSubmit(e)}>
            <div className="suggest-meta-row">
              <select
                aria-label={t.questions.topicsHeading}
                value={suggestTopic}
                onChange={(e) => setSuggestTopic(e.target.value as QuestionTopicId)}
              >
                {QUESTION_TOPIC_LIST.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {t.lobby.topics[entry.id]}
                  </option>
                ))}
              </select>
              <select
                aria-label="Language"
                value={suggestLang}
                onChange={(e) => setSuggestLang(e.target.value as SupportedLanguage)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="suggest-spicy-toggle">
                <input
                  type="checkbox"
                  checked={suggestSpicy}
                  onChange={(e) => setSuggestSpicy(e.target.checked)}
                />
                <span>{t.questions.suggestSpicy}</span>
              </label>
            </div>
            <input
              type="text"
              className="sr-only-honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={suggestHoneypot}
              onChange={(e) => setSuggestHoneypot(e.target.value)}
            />
            <div className="suggest-input-row">
              <input
                type="text"
                minLength={8}
                maxLength={140}
                required
                placeholder={t.questions.suggestPlaceholder}
                value={suggestText}
                onChange={(e) => setSuggestText(e.target.value)}
              />
              <button type="submit" className="primary" disabled={suggestBusy}>
                {t.questions.suggestSubmit}
              </button>
            </div>
            {suggestError && <p className="error-copy" role="alert">{suggestError}</p>}
            {suggestSuccess && <p className="notice" role="status">{t.questions.suggestSuccess}</p>}
          </form>
        </section>
      )}

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t.questions.eyebrow}</p>
            <h1>{t.questions.title}</h1>
          </div>
          {data && (
            <div className="questions-stats">
              <span className="count-badge">{t.questions.shownCount(filtered.length, data.totalQuestions)}</span>
              <span className="count-badge">{t.questions.friendlyCombos(data.friendlyCombos)}</span>
              <span className="count-badge">{t.questions.spicyCombos(data.spicyCombos)}</span>
            </div>
          )}
        </div>

        {data && (
          <div className="questions-topics-section">
            <span className="eyebrow">{t.questions.topicsHeading} ({QUESTION_TOPIC_LIST.length})</span>
            <div className="questions-topics-grid" role="group" aria-label={t.questions.topicsHeading}>
              <button
                type="button"
                className={`questions-topic-chip${topic === "all" ? " is-active" : ""}`}
                onClick={() => handleTopicSelect("all")}
              >
                <span>{t.questions.allTopics}</span>
                <span className="questions-topic-count">{baseFiltered.length}</span>
              </button>
              {QUESTION_TOPIC_LIST.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`questions-topic-chip${topic === entry.id ? " is-active" : ""}`}
                  onClick={() => handleTopicSelect(entry.id)}
                >
                  <span>{t.lobby.topics[entry.id]}</span>
                  <span className="questions-topic-count">{topicCounts.get(entry.id) ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="questions-toolbar">
          <input
            type="search"
            placeholder={t.questions.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t.questions.searchPlaceholder}
          />
          <select aria-label={t.questions.allLanguages} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="all">{t.questions.allLanguages}</option>
            {languages.map((langCode) => (
              <option key={langCode} value={langCode}>{langCode.toUpperCase()}</option>
            ))}
          </select>
          <select aria-label={t.questions.allPools} value={pool} onChange={(e) => setPool(e.target.value)}>
            <option value="all">{t.questions.allPools}</option>
            {pools.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select aria-label={t.questions.allAngles} value={angle} onChange={(e) => setAngle(e.target.value)}>
            <option value="all">{t.questions.allAngles}</option>
            <option value="pos">pos</option>
            <option value="neg">neg</option>
            <option value="weird">weird</option>
            <option value="classic">classic</option>
            <option value="community">community</option>
          </select>
          <select
            aria-label={t.questions.allSpicy}
            value={spicyFilter}
            onChange={(e) => setSpicyFilter(e.target.value as "all" | "friendly" | "spicy")}
          >
            <option value="all">{t.questions.allSpicy}</option>
            <option value="friendly">{t.questions.friendlyOnly}</option>
            <option value="spicy">{t.questions.spicyOnly}</option>
          </select>
        </div>
      </section>

      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {!data && !error && <p className="muted" role="status">{t.questions.loading}</p>}

      {data && filtered.length === 0 && (
        <p className="muted" role="status">{t.questions.noMatches}</p>
      )}

      {data && filtered.length > 0 && (
        <>
          <ul className="questions-list">
            {pagedQuestions.map((q) => {
              const qTopic = POOL_TO_TOPIC[q.pool];
              return (
                <li key={q.id} className="question-tracker-item">
                  <div className="question-tracker-body">
                    <strong>{q.text}</strong>
                    <div className="muted small-copy">{q.id}</div>
                  </div>
                  <div className="question-tracker-meta">
                    <span className="question-tracker-pill">{q.language.toUpperCase()}</span>
                    {qTopic && <span className="question-tracker-pill">{t.lobby.topics[qTopic]}</span>}
                    <span className="question-tracker-pill">{q.pool}</span>
                    <span className="question-tracker-pill">{q.angle}</span>
                    {q.spicy && <span className="question-tracker-pill is-spicy">18+</span>}
                  </div>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <nav className="questions-pagination" aria-label="Questions pagination">
              <button
                type="button"
                className="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t.questions.prevPage}
              </button>
              <span className="count-badge">{t.questions.pageOf(currentPage, totalPages)}</span>
              <button
                type="button"
                className="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t.questions.nextPage}
              </button>
            </nav>
          )}
        </>
      )}

      <footer className="page-footer">
        <button
          type="button"
          className="quiet-button"
          onClick={() => setAdminOpen((open) => !open)}
        >
          {t.questions.adminButton}
        </button>
      </footer>

      {adminOpen && (
        <section className="card admin-panel">
          <div className="section-heading">
            <h2>{t.questions.adminButton}</h2>
            <select
              aria-label="Status filter"
              value={adminFilter}
              onChange={(e) => {
                const next = e.target.value as "all" | SuggestionStatus;
                setAdminFilter(next);
                if (adminToken.trim()) void loadAdminQueue(adminToken, next);
              }}
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="all">all</option>
            </select>
          </div>
          <form
            className="admin-token-row"
            onSubmit={(e) => {
              e.preventDefault();
              void loadAdminQueue();
            }}
          >
            <input
              type="password"
              placeholder={t.questions.adminTokenPlaceholder}
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
            />
            <button type="submit" className="secondary" disabled={adminBusy || !adminToken.trim()}>
              {t.questions.adminLoad}
            </button>
          </form>
          {adminError && <p className="error-copy" role="alert">{adminError}</p>}
          {adminItems && adminItems.length === 0 && (
            <p className="muted">{t.questions.adminEmpty}</p>
          )}
          {adminItems && adminItems.length > 0 && (
            <ul className="admin-suggestions-list">
              {adminItems.map((item) => (
                <li key={item.id} className="admin-suggestion-row">
                  <div>
                    <strong>{item.text}</strong>
                    <div className="question-tracker-meta" style={{ marginTop: "6px" }}>
                      <span className="question-tracker-pill">{item.language.toUpperCase()}</span>
                      <span className="question-tracker-pill">{t.lobby.topics[item.topic]}</span>
                      <span className="question-tracker-pill">{item.status}</span>
                      {item.spicy && <span className="question-tracker-pill is-spicy">18+</span>}
                    </div>
                  </div>
                  <div className="button-row">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        className="primary"
                        disabled={adminBusy}
                        onClick={() => void handleReviewSuggestion(item.id, "approved")}
                      >
                        {t.questions.adminApprove}
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        className="secondary"
                        disabled={adminBusy}
                        onClick={() => void handleReviewSuggestion(item.id, "rejected")}
                      >
                        {t.questions.adminReject}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
