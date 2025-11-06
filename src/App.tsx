import { useState } from "react";
import "./App.css";
import QuickNote from "./components/QuickNote";
import ManageNotes from "./components/ManageNotes";

function App() {
  const [tab, setTab] = useState<"quick" | "manage">("quick");

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">📝</span>
          <span className="brand-name">快速笔记</span>
        </div>
        <nav className="segmented">
          <button
            className={`segmented-item ${tab === "quick" ? "active" : ""}`}
            onClick={() => setTab("quick")}
          >
            快记
          </button>
          <button
            className={`segmented-item ${tab === "manage" ? "active" : ""}`}
            onClick={() => setTab("manage")}
          >
            管理
          </button>
        </nav>
      </header>
      <main className="container">
        <div className="page-card">
          {tab === "quick" ? <QuickNote /> : <ManageNotes />}
        </div>
      </main>
    </div>
  );
}

export default App;
