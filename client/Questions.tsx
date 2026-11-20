import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

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

export function QuestionsPage() {
  const [data, setData] = useState<QuestionsCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [pool, setPool] = useState("all");
  const [angle, setAngle] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/questions")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        return (await res.json()) as QuestionsCatalogResponse;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load questions");
      });
    return () => {
      active = false;
    };
  }, []);

  const pools = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.questions.map((q) => q.pool))].sort();
  }, [data]);

  const languages = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.questions.map((q) => q.language))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.questions.filter((q) => {
      if (language !== "all" && q.language !== language) return false;
      if (pool !== "all" && q.pool !== pool) return false;
      if (angle !== "all" && q.angle !== angle) return false;
      if (term && !q.text.toLowerCase().includes(term) && !q.id.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [angle, data, language, pool, search]);

  return (
    <main className="app-shell questions-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Impostor Party</span>
        </Link>
        <Link to="/" className="secondary">Back to home</Link>
      </header>

      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Question tracker</p>
            <h1>All Questions</h1>
          </div>
          {data && (
            <div className="questions-stats">
              <span className="count-badge">{filtered.length} / {data.totalQuestions} shown</span>
              <span className="count-badge">{data.friendlyCombos} friendly combos</span>
              <span className="count-badge">{data.spicyCombos} spicy combos</span>
            </div>
          )}
        </div>

        <div className="questions-toolbar">
          <input
            type="search"
            placeholder="Search questions or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search questions"
          />
          <select aria-label="Filter by language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="all">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>
          <select aria-label="Filter by pool" value={pool} onChange={(e) => setPool(e.target.value)}>
            <option value="all">All pools</option>
            {pools.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select aria-label="Filter by angle" value={angle} onChange={(e) => setAngle(e.target.value)}>
            <option value="all">All angles</option>
            <option value="pos">pos</option>
            <option value="neg">neg</option>
            <option value="weird">weird</option>
            <option value="classic">classic</option>
          </select>
        </div>
      </section>

      {error && <div className="notice error-notice" role="alert">{error}</div>}
      {!data && !error && <p className="muted" role="status">Loading questions...</p>}

      {data && (
        <ul className="questions-list">
          {filtered.map((q) => (
            <li key={q.id} className="question-tracker-item">
              <div>
                <strong>{q.text}</strong>
                <div className="muted small-copy">{q.id}</div>
              </div>
              <div className="question-tracker-meta">
                <span className="question-tracker-pill">{q.language.toUpperCase()}</span>
                <span className="question-tracker-pill">{q.pool}</span>
                <span className="question-tracker-pill">{q.angle}</span>
                {q.spicy && <span className="question-tracker-pill is-spicy">18+</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
