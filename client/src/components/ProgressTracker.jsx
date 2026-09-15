import { Search, ShieldCheck, PenTool, CheckCircle } from "lucide-react";

const AGENTS = [
  { id: "researcher", label: "Research", icon: Search },
  { id: "factchecker", label: "Fact-Check", icon: ShieldCheck },
  { id: "writer", label: "Write", icon: PenTool },
];

export default function ProgressTracker({ events, currentAgent }) {
  const completedAgents = new Set(
    events.filter((e) => e.type === "progress").map((e) => e.agent)
  );

  const latestEvent = events[events.length - 1];
  const latestMessage = latestEvent?.message || "Initializing...";

  const currentIdx = AGENTS.findIndex((a) => a.id === currentAgent);

  function getStepClass(agent, idx) {
    if (completedAgents.has(agent.id) && currentAgent !== agent.id) {
      return "progress-step completed";
    }
    if (agent.id === currentAgent || idx === currentIdx) {
      return "progress-step active";
    }
    return "progress-step";
  }

  function getConnectorClass(idx) {
    const nextAgent = AGENTS[idx + 1];
    if (nextAgent && completedAgents.has(AGENTS[idx].id)) {
      return "progress-connector completed";
    }
    return "progress-connector";
  }

  return (
    <div className="progress-container">
      <div className="progress-steps">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const isCompleted =
            completedAgents.has(agent.id) && currentAgent !== agent.id;
          return (
            <div key={agent.id} style={{ display: "flex", alignItems: "center" }}>
              <div className={getStepClass(agent, idx)}>
                {isCompleted ? (
                  <CheckCircle size={14} />
                ) : agent.id === currentAgent ? (
                  <span className="spinner" />
                ) : (
                  <Icon size={14} />
                )}
                {agent.label}
              </div>
              {idx < AGENTS.length - 1 && (
                <div className={getConnectorClass(idx)} />
              )}
            </div>
          );
        })}
      </div>

      <div className="progress-message">📍 {latestMessage}</div>
    </div>
  );
}
