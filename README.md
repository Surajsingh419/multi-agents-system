# 🤖 Multi-Agent Research System v2.0

An AI-powered multi-agent research assistant that searches the web, verifies facts, scrapes source pages, and produces polished research reports with in-text citations — powered by Google Gemini, LangGraph, Express, and React.

## Architecture

```
User Query (Web UI or CLI)
    │
    ▼
LangGraph Multi-Agent Workflow
    │
    ├──► 🔍 Research Agent (Tavily Search + Cheerio Scraper)
    │       - Query rewriting
    │       - Web search via Tavily
    │       - Web page content scraping
    │
    ├──► ✅ Fact-Checker Agent
    │       - Cross-verifies claims across sources
    │       - Scores confidence
    │       - Flags disputed claims
    │
    └──► ✍️ Writer Agent
            - Generates executive summary
            - Formats findings with in-text citations [1][2]
            - Compiles comprehensive bibliography
    │
    ▼
Final Report + Real-Time SSE Stream
```

## Tech Stack

| Component | Technology |
|---|---|
| LLM | Google Gemini (`gemini-3.6-flash`) |
| Multi-Agent Orchestration | LangGraph.js (`@langchain/langgraph`) |
| Web Search | Tavily API (`@langchain/tavily`) |
| Web Scraping | Cheerio with retry & fallback strategies |
| Backend API | Express v5 + Server-Sent Events (SSE) |
| Frontend | React 19 + Vite (Dark Mode & Glassmorphism) |
| Caching | In-Memory LRU Cache |

## Quick Start

### 1. Install dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Configure API keys

Create `.env` in the root folder:

```env
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
PORT=3001
```

### 3. Run the App

#### Fullstack Web App (Frontend + Backend)
```bash
npm run dev
```
- **React Frontend**: [http://localhost:5173](http://localhost:5173)
- **Express Backend API**: [http://localhost:3001](http://localhost:3001)

#### Backend Server Only (Serves built React app too)
```bash
npm run build     # Builds React client into client/dist
npm run server    # Starts Express server on http://localhost:3001
```

#### Terminal Interactive CLI Mode
```bash
npm run cli
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both Express backend and Vite frontend concurrently |
| `npm run server` | Runs the Express API server only (`http://localhost:3001`) |
| `npm run client` | Runs the Vite frontend only (`http://localhost:5173`) |
| `npm run cli` | Runs the interactive research terminal CLI |
| `npm run build` | Builds the React frontend production bundle |

## License

MIT
