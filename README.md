# PAISA — Portfolio AI & Intelligent Signal Advisor

> *"Har rupee ko samjho."*
> The intelligence layer your portfolio never had.

**Competition:** ET AI Hackathon 2026 — Problem Statement 6

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React 18 + Vite · Tailwind CSS · Framer Motion · Recharts │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Landing  │  │Dashboard │  │  X-Ray   │  │   Radar    │ │
│  │  Page    │  │   Hub    │  │   Page   │  │   Page     │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘ │
│  ┌──────────┐  ┌──────────┐                                │
│  │  Chat    │  │  Impact  │     PortfolioContext (Global)   │
│  │  Page    │  │  Report  │                                 │
│  └──────────┘  └──────────┘                                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + SSE
┌────────────────────────┴────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
│                                                             │
│  ┌─── ai_router.py ──────────────────────────────────────┐ │
│  │                                                       │ │
│  │  Task 1: Deep Analysis   → Gemini 2.5 Pro            │ │
│  │  Task 2: Chat Stream     → Gemini 2.0 Flash          │ │
│  │  Task 3: Signal Classify → Groq Llama 3.3 70B        │ │
│  │  Task 4: Sentiment       → DeepSeek R1               │ │
│  │  Task 5: Rebalancing     → Gemini 2.5 Pro            │ │
│  │  All Fallbacks           → Groq (14,400/day safety)  │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  X-Ray Agent │  │ Radar Agent  │  │   Chat Agent     │  │
│  │  parsers.py  │  │  signals.py  │  │  ai_router.py    │  │
│  │  calcs.py    │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│        External: AMFI India API · BSE/NSE Endpoints         │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Model AI Strategy

| Task                  | Model                | Why                              | Free Tier    |
|-----------------------|----------------------|----------------------------------|--------------|
| Deep Portfolio Analysis| Gemini 2.5 Pro      | Strongest reasoning              | ✅            |
| Chat Conversations    | Gemini 2.0 Flash     | Fast + high quality              | 1,500/day    |
| Signal Classification | Groq Llama 3.3 70B   | Fastest inference                | 14,400/day   |
| Sentiment Analysis    | DeepSeek R1          | Excellent reasoning over text    | ✅            |
| Rebalancing Plan      | Gemini 2.5 Pro       | Needs deep reasoning             | ✅            |
| **All Fallbacks**     | **Groq Llama 3.3**   | **14,400/day safety net**        | ✅            |

---

## Setup Instructions

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env (all free tier):
#   GEMINI_API_KEY    → aistudio.google.com
#   GROQ_API_KEY      → console.groq.com
#   DEEPSEEK_API_KEY  → platform.deepseek.com
#   MISTRAL_API_KEY   → console.mistral.ai
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## Environment Variables

| Variable           | Provider   | Get Key At                    | Required |
|--------------------|------------|-------------------------------|----------|
| `GEMINI_API_KEY`   | Google     | aistudio.google.com           | Yes      |
| `GROQ_API_KEY`     | Groq       | console.groq.com              | Yes      |
| `DEEPSEEK_API_KEY` | DeepSeek   | platform.deepseek.com         | Optional |
| `MISTRAL_API_KEY`  | Mistral    | console.mistral.ai            | Optional |

> Without API keys, PAISA falls back to rule-based analysis and responses.

---

## API Endpoints

| Method | Endpoint         | AI Model Used          | Description                          |
|--------|------------------|------------------------|--------------------------------------|
| POST   | `/api/upload`    | Gemini 2.5 Pro         | Upload PDF → parse → AI analysis     |
| GET    | `/api/signals`   | Groq + DeepSeek        | Signals + classification + sentiment |
| POST   | `/api/chat`      | Gemini 2.0 Flash       | Chat with AI advisor (SSE stream)    |
| POST   | `/api/rebalance` | Gemini 2.5 Pro         | Generate AI rebalancing plan         |

---

## Multi-Agent Architecture

### X-Ray Agent
- **Role:** Portfolio decomposition and analysis
- **Capabilities:** XIRR calculation (scipy), fund overlap detection (Jaccard similarity), expense drag analysis, AI rebalancing recommendations
- **AI:** Gemini 2.5 Pro for deep analysis, Groq Llama 3.3 fallback

### Radar Agent
- **Role:** Real-time market signal tracking
- **Capabilities:** Insider trade monitoring, bulk deal detection, AI confidence scoring, news sentiment
- **AI:** Groq Llama 3.3 for classification, DeepSeek R1 for sentiment

### Chat Agent
- **Role:** Context-aware portfolio advisor
- **Capabilities:** Full portfolio context injection, streaming responses via SSE
- **AI:** Gemini 2.0 Flash for conversation, Groq Llama 3.3 fallback

---

## Tech Stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Framer Motion, Recharts  |
| Backend   | FastAPI, Uvicorn, pdfplumber, scipy, httpx              |
| AI Models | Gemini 2.5 Pro, Gemini 2.0 Flash, Groq Llama 3.3 70B, DeepSeek R1 |
| Data      | AMFI India API, BSE/NSE public endpoints                |
| Fonts     | DM Serif Display, IBM Plex Mono, DM Sans                |

---

## Team

**Team Name:** _[Your Team Name]_

---

*Built for ET AI Hackathon 2026 · Problem Statement 6*
