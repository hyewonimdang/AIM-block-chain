import { useState } from "react";
import { ChainView } from "./components/ChainView";
import { MiningView } from "./components/MiningView";
import { NodesView } from "./components/NodesView";
import { JournalDashboard } from "./components/JournalDashboard";
import "./App.css";

const TABS = [
  { id: "chain", label: "체인 / 위변조", el: <ChainView /> },
  { id: "mining", label: "채굴", el: <MiningView /> },
  { id: "nodes", label: "노드 동기화", el: <NodesView /> },
  { id: "journal", label: "활동 일지", el: <JournalDashboard /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function App() {
  const [tab, setTab] = useState<TabId>("chain");
  return (
    <div className="app">
      <header className="app-header">
        <h1>AIM Block Chain</h1>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>{TABS.find((t) => t.id === tab)?.el}</main>
    </div>
  );
}
