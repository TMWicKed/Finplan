# FinPlan GPS — Presentation & Product Brief

**WalkingTree Hackathon 2026**  
**Tagline:** *Agentic AI financial planning with goals, guardrails, and a continuous learning loop.*

This document is written for the **representation / presentation team**. Use it to build slides, demo scripts, and judge-facing narratives. Technical setup is in the appendix.

---

## 1. Elevator pitch (30 seconds)

**FinPlan GPS** is an AI-powered financial planning platform for Indian households and their advisors. A client sets life goals, compares savings and investments, runs “what-if” scenarios (e.g. home purchase), and chats with **Ira** — an AI advisor backed by a **multi-agent pipeline**, not a single chatbot.

Every Ira answer runs through **seven specialized agents**, ends with an automated **Reflection & Evaluation** quality gate, and feeds a **human feedback → learning dashboard** loop so the system improves over time.

---

## 2. Problem we solve

| Pain point | How FinPlan GPS addresses it |
|------------|------------------------------|
| Generic robo-advice | Context-aware agents use real profile, goals, surplus, and Indian tax/banking context |
| Black-box AI | Live **agent workflow** panel shows each step, confidence, and reflection verdict |
| Advisor overload | Planners get a **risk dashboard**, behavioral alerts, and review tools |
| Trust & compliance | **Reflection agent** flags conflicts, funding gaps, and risky recommendations; **PII masking** on outputs |
| No improvement loop | Thumbs-up/down, Reviewer Lab, and **Agent Learning** governance metrics |

---

## 3. Who uses it

| Persona | Role in app | Primary screens |
|---------|-------------|-----------------|
| **Rahul Sharma** (demo client) | `CLIENT` | Goals, Savings, Investments, What-If, Ira chat |
| **Amit Mehta** (demo planner) | `PLANNER` | Risk Management dashboard + same planning tools + Ira (“Agency Desk”) |

Demo accounts (see §10).

---

## 4. Product modules (what to show on slides)

### 4.1 Client journey (6 steps in sidebar)

1. **Basic Profile Setup** — Income, expenses, surplus, family, location  
2. **Track Life Goals (Goal GPS)** — Retirement, education, home; SIP needs; funding gaps  
3. **Savings Maximizer** — Compare major Indian banks (indicative FD/savings rates)  
4. **Future Planner (Investments)** — Asset allocation, tax sections (80C, ELSS, PPF, NPS, etc.)  
5. **Alternative Scenarios (What-If)** — Home purchase: EMI, surplus impact, goal funding trade-offs  
6. **Chat with Ira AI** — Natural-language advisory with full agent orchestration visible  

### 4.2 Planner journey

- **Risk Management** — Behavioral alerts (panic selling, FOMO, concentration), client oversight  
- Same planning modules as client, plus **Reviewer Lab** and playbook management inside Ira  

### 4.3 Ira Agent Chat (hero demo)

Side panel tabs:

| Tab | Purpose |
|-----|---------|
| **Workflow** | Real-time view of all 7 agents: status, confidence, timing |
| **Reviewer** | Human critique, failure patterns, prompt corrections |
| **Playbook** | Active advisory playbooks (scenario templates) |
| **Learning** | Agent performance, reflection stats, governance, improvement recommendations |

**Suggested demo questions for Ira:**

- *“Can I afford a ₹1.2 crore home with my current surplus?”* → What-If + Goal agents  
- *“How should I allocate my ELSS and 80C this year?”* → Tax/regulatory sensitivity  
- *“Am I on track for my daughter’s education goal?”* → Goal Planning agent  

---

## 5. Agentic AI architecture (core differentiator)

### 5.1 One orchestrator, seven agents

All Ira chat requests go through **`AgentOrchestrator`** — a sequential pipeline. Each agent is a **class** (`BaseAgent`) registered in an **`AgentRegistry`**. Every run gets a unique **`executionId`** for audit and learning.

```
User message
    │
    ▼
┌─────────────────────────────┐
│  1. Market Intelligence      │  Major bank FD/savings matrix (India)
├─────────────────────────────┤
│  2. Goal Planning            │  SIP gaps, funding %, goal health
├─────────────────────────────┤
│  3. What-If Simulation       │  Home loan EMI & surplus impact (if relevant)
├─────────────────────────────┤
│  4. Behavioral Finance       │  Panic / FOMO / concentration detection
├─────────────────────────────┤
│  5. Playbook Generation      │  Selects active advisory playbooks
├─────────────────────────────┤
│  6. Financial Summary        │  Gemini LLM → Ira narrative + recommendations
│     (+ PII security masking) │
├─────────────────────────────┤
│  7. Reflection & Evaluation  │  Deterministic quality gate (no LLM)
└─────────────────────────────┘
    │
    ▼
Response + workflow trace + reflection verdict
```

### 5.2 Agent responsibilities (slide-friendly)

| Agent | Type | What it does |
|-------|------|----------------|
| **Market Intelligence** | Deterministic | Surfaces indicative rates from major Indian banks for context |
| **Goal Planning** | Deterministic | Analyzes goals, required SIP, severe funding gaps |
| **What-If Simulation** | Deterministic | Home purchase EMI and impact on investable surplus / goals |
| **Behavioral Finance** | Deterministic | Classifies behavioral risk; triggers planner alerts |
| **Playbook Generation** | Deterministic | Applies active hackathon playbooks to the session |
| **Financial Summary** | **Gemini LLM** | Synthesizes final Ira answer from all prior agent briefings |
| **Reflection & Evaluation** | Deterministic | PASS / PASS_WITH_WARNINGS / FAIL; adjusts confidence; flags human review |

### 5.3 Reflection & confidence (governance story)

**Reflection agent** checks for issues such as:

- Agent conflicts (e.g. optimistic goals vs pessimistic what-if)  
- Severe funding gaps  
- Missing playbook actions  
- Confidence inconsistency across agents  
- High-risk recommendations  
- Advisor review required  

**Confidence** is computed across the pipeline, then **adjusted** by reflection penalties. UI shows baseline → adjusted confidence and a **Reflection Audit Card**.

### 5.4 Continuous learning loop

```
Generate → Reflect → Human Feedback → Learn → Improve prompts/playbooks
```

| Capability | Description |
|------------|-------------|
| **Human feedback** | Thumbs up/down on Ira replies; optional critique comment |
| **Reviewer Lab** | Negative feedback categorized (Regulatory Omission, Calculation Drift, Context Drift, Lack of Specifics) |
| **Prompt corrections** | Planner-approved clauses injected into future Ira system prompts |
| **Learning dashboard** | Per-agent success rate, reflection PASS/FAIL stats, governance summary |
| **Improvement recommendations** | Deterministic patterns (e.g. repeated FAIL verdicts, low confidence runs) |
| **Persistence** | Optional PostgreSQL for traces, evaluations, and feedback (in-memory fallback for demo without DB) |

---

## 6. Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite, Recharts, Motion |
| Backend | Node.js, Express (monolith `server.ts` + `server/api.ts`) |
| AI | Google Gemini (`@google/genai`) via `server/lib/iraAdvisory.ts` |
| Agents | Custom `server/agents/` framework (OOP, not a third-party agent framework) |
| Database (optional) | PostgreSQL 15, Drizzle ORM, migrations in `server/db/` |
| DevOps (declared) | `docker-compose.yml` for Postgres + microservice stubs |

**Architecture choice for judges:** Single deployable app with a **clear agent framework** and optional Postgres — easy to demo locally, production-ready persistence when `DATABASE_URL` is set.

---

## 7. Key API endpoints (for technical slides)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/ira/chat` | Main Ira chat (runs full agent pipeline) |
| `POST /api/v1/ira/agent-workflow` | Debug: raw orchestration output |
| `GET /api/v1/ira/agent-traces/:executionId` | Fetch trace for a run |
| `POST /api/v1/ira/feedback` | Human feedback (+ optional DB persist) |
| `GET /api/v1/ira/learning/dashboard` | Learning & performance metrics |
| `GET /api/v1/ira/learning/governance` | Governance summary for compliance narrative |
| `GET /api/v1/system/health` | Postgres / Gemini / fallback mode status |
| `POST /api/v1/goals/simulate` | Goal SIP simulation |
| `POST /api/v1/whatif/simulate` | Home purchase what-if |

---

## 8. Suggested presentation flow (10–12 minutes)

| Minute | Slide / action | Talking point |
|--------|----------------|---------------|
| 0–1 | Title + problem | Indian families need goal-based planning, not generic chatbots |
| 1–2 | Personas | Client vs Planner; Rahul vs Amit |
| 2–4 | **Live: Goal GPS + What-If** | Show funding gap and home EMI impact |
| 4–7 | **Live: Ira chat** | Open Workflow tab; send one strong question; watch agents complete |
| 7–8 | **Reflection Audit Card** | Show PASS/WARN/FAIL and adjusted confidence |
| 8–9 | **Learning tab** | Agent performance, governance, improvement recommendations |
| 9–10 | Negative feedback → Reviewer | Show self-repairing prompt correction |
| 10–11 | Architecture diagram | 7-agent pipeline (use diagram in §5.1) |
| 11–12 | Close | Agentic + governed + learning; optional Postgres persistence |

**Backup if Gemini is slow:** Mention Summary Agent uses Gemini; workflow shows progress; offline fallback exists if API key missing.

---

## 9. Slide deck outline (copy-paste for designers)

1. Cover — FinPlan GPS, WalkingTree Hackathon 2026  
2. Problem — Fragmented planning, untrusted AI  
3. Solution — Multi-agent Ira with reflection & learning  
4. Users — Client + Planner  
5. Platform map — 6 client modules screenshot/mockup  
6. **Agent pipeline diagram** (§5.1)  
7. Agent table (§5.2)  
8. Reflection & governance (§5.3)  
9. Learning loop (§5.4)  
10. Security — PII masking, human-in-the-loop  
11. Tech stack (§6)  
12. Demo credentials (§10)  
13. Live demo / video QR  
14. Impact & roadmap (Postgres, multi-client, production)  
15. Thank you / Q&A  

---

## 10. Demo login credentials

| Role | Email | Password |
|------|-------|----------|
| **Planner** | `planner@finplan.in` | `planner123` |
| **Client** | `rahul@gmail.com` | `rahul123` |

**Demo client profile:** Rahul Sharma — pre-seeded goals (retirement, daughter’s education, home), monthly surplus, and bank context.

**Run locally:** `npm install` → copy `.env.example` to `.env` → set `GEMINI_API_KEY` → `npm run dev` → open `http://localhost:3000`

---

## 11. Judge / stakeholder talking points

- **Not a wrapper around ChatGPT** — six deterministic specialist agents + one LLM summarizer + one reflection gate.  
- **Explainable** — Every run has `executionId`, timeline, per-agent confidence, and reflection issues.  
- **India-specific** — Tax sections, major banks, home-loan what-if, INR goals.  
- **Responsible AI** — Reflection FAIL blocks overconfident advice; planner review path; PII masking on outputs.  
- **Gets better over time** — Feedback → categorized failures → prompt corrections → learning dashboard.  
- **Production path** — Optional PostgreSQL for traces and feedback without changing the agent framework.

---

## 12. Brand & visual notes

- **Primary green:** `#2cab52` / `#2cab25`  
- **Product name styling:** FinPlan **GPS** (GPS = goal positioning system metaphor)  
- **AI assistant name:** **Ira**  
- **Tone:** Professional, trustworthy, India-first personal finance  

---

## Appendix A — Quick technical setup

```bash
# Install & run
npm install
cp .env.example .env
# Add GEMINI_API_KEY=your_key

npm run dev
# → http://localhost:3000

# Optional PostgreSQL
docker compose up -d postgres
# DATABASE_URL=postgresql://postgres:postgres_secure_pass@localhost:5432/finplan_db
npm run db:migrate
```

**Health check:** `GET http://localhost:3000/api/v1/system/health`

---

## Appendix B — Repository structure (for technical appendix slide)

```
Finplan/
├── src/                    # React UI
│   └── components/         # GoalGPS, IraAgentChat, AgentLearningPanel, …
├── server/
│   ├── api.ts              # REST API & in-memory demo state
│   ├── agents/             # Agent framework + orchestrator
│   ├── lib/                # Gemini Ira, goal/what-if/behavioral logic
│   └── db/                 # Drizzle schema, migrations, persistence
├── server.ts               # Express + Vite entry
└── docker-compose.yml      # Postgres (optional)
```

---

## Appendix C — Glossary

| Term | Meaning |
|------|---------|
| **Ira** | In-app AI financial assistant |
| **Agent** | Specialized planning module with defined inputs/outputs |
| **Orchestrator** | Runs agents in order and stores execution trace |
| **Reflection** | Post-pipeline quality evaluation (deterministic rules) |
| **Playbook** | Reusable advisory scenario template |
| **Execution ID** | Unique ID per Ira pipeline run (audit & feedback linkage) |

---

*Document version: May 2026 — aligned with FinPlan GPS hackathon build.*
