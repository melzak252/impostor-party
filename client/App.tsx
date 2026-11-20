import { BrowserRouter, Link, Route, Routes } from "react-router";
import { APP_VERSION } from "../shared/protocol";
import { Home, JoinPage } from "./Home";
import { PartyPage } from "./Lobby";
import { QuestionsPage } from "./Questions";

function NotFound() {
  return (
    <main className="app-shell narrow-shell">
      <p className="eyebrow">Page not found</p>
      <h1 className="page-title">Wrong room?</h1>
      <p>That link does not lead to an Impostor Party.</p>
      <Link to="/" className="primary link-button">Back to home</Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/party/:code" element={<PartyPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <div className="app-version-tag" aria-label="Application version">
        v{APP_VERSION}
      </div>
    </BrowserRouter>
  );
}
