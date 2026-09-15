import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ProgressTracker from "./components/ProgressTracker";
import ReportView from "./components/ReportView";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [query, setQuery] = useState("");
  const [progressEvents, setProgressEvents] = useState([]);
  const [currentAgent, setCurrentAgent] = useState("");
  const [report, setReport] = useState("");
  const [sources, setSources] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  async function handleSearch(searchQuery) {
    setQuery(searchQuery);
    setStatus("loading");
    setProgressEvents([]);
    setCurrentAgent("system");
    setReport("");
    setSources([]);
    setMetrics(null);
    setError("");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          const dataLine = trimmed
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data: "));

          if (!dataLine) continue;

          try {
            const jsonStr = dataLine.replace(/^data:\s*/, "");
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case "progress":
                setProgressEvents((prev) => [...prev, event]);
                setCurrentAgent(event.agent);
                break;
              case "sources":
                setSources(event.sources);
                break;
              case "report":
                setReport(event.content);
                break;
              case "done":
                setMetrics(event.metrics);
                setStatus("done");
                break;
              case "error":
                throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr.message !== "Unexpected end of JSON input") {
              console.warn("SSE parse error:", parseErr);
            }
          }
        }
      }

      if (report || status !== "done") {
        setStatus("done");
      }
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setQuery("");
    setProgressEvents([]);
    setReport("");
    setSources([]);
    setMetrics(null);
    setError("");
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-icon">🤖</div>
        <h1>Multi-Agent Research System</h1>
        <p>AI-powered research with autonomous agents</p>
        <div className="agent-badges">
          <span className="agent-badge">🔍 Research Agent</span>
          <span className="agent-badge">✅ Fact-Checker</span>
          <span className="agent-badge">✍️ Writer Agent</span>
        </div>
      </header>

      <SearchBar
        onSearch={handleSearch}
        disabled={status === "loading"}
      />

      {status === "loading" && (
        <ProgressTracker
          events={progressEvents}
          currentAgent={currentAgent}
        />
      )}

      {status === "error" && (
        <div className="error-container">
          <p>❌ {error}</p>
          <button
            className="search-button"
            onClick={handleReset}
            style={{ marginTop: "1rem" }}
          >
            Try Again
          </button>
        </div>
      )}

      {(status === "done" || report) && report && (
        <ReportView
          report={report}
          sources={sources}
          metrics={metrics}
          query={query}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
