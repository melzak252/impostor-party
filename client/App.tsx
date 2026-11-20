import { BrowserRouter, Link, Route, Routes } from "react-router";
import { Home, JoinPage } from "./Home";
import { PartyPage } from "./Lobby";

function NotFound() {
  return <main className="app-shell narrow-shell"><p className="eyebrow">Page not found</p><h1 className="page-title">Wrong room?</h1><p>That link does not lead to an Impostor Party.</p><Link to="/" className="primary link-button">Back to home</Link></main>;
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/join/:code" element={<JoinPage />} />
    <Route path="/party/:code" element={<PartyPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter>;
}
