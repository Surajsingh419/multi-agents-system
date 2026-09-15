import ReactMarkdown from "react-markdown";
import { Clock, Globe, RotateCcw, Zap } from "lucide-react";

export default function ReportView({ report, sources, metrics, query, onReset }) {
  const totalTime = metrics
    ? (metrics.totalTimeMs / 1000).toFixed(1)
    : "—";

  return (
    <div className="report-container">
      <div className="report-card">
        <div className="report-content">
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      </div>

      {metrics && (
        <div className="metrics-bar">
          <div className="metric-item">
            <Clock size={14} />
            <span className="metric-value">{totalTime}s</span> total time
          </div>
          <div className="metric-item">
            <Zap size={14} />
            <span className="metric-value">{metrics.toolCalls || 0}</span> tool
            calls
          </div>
          <div className="metric-item">
            <Globe size={14} />
            <span className="metric-value">{metrics.scrapeSuccesses || 0}</span>{" "}
            pages scraped
          </div>
          <div className="metric-item">
            <span className="metric-value">
              {metrics.agentTransitions?.length || 0}
            </span>{" "}
            agents used
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button className="search-button" onClick={onReset}>
          <RotateCcw size={16} /> New Research
        </button>
      </div>
    </div>
  );
}
