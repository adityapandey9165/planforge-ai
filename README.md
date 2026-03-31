# 🧠 PlanForge AI

> AI-powered project planning platform that turns your idea into a complete, actionable plan in seconds.

🔗 **Live:** https://planforge-ai-jade.vercel.app

---

## ✨ Features

- **4 AI Agents** — Clarify → Plan → Architect → Evaluate pipeline
- **Bad Idea Detector** — Detects high-risk ideas before planning
- **Smart Questions** — 5 tailored clarifying questions per project
- **Architecture Diagram** — Auto-generated Mermaid system design
- **Score Breakdown** — Visual evaluation across clarity, logic, completeness
- **Enhance** — Refine your plan with natural language feedback
- **Version History** — Save v1, v2, v3 and switch between them
- **Export as Markdown** — Download your plan as a `.md` file
- **Bring Your Own Groq Key** — Use your own API key in Settings
- **Ollama Support** — Run fully offline with local LLM
- **Auth** — Email signup/login with Supabase

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind v3 |
| Backend | FastAPI + Python |
| Auth & DB | Supabase (email auth + PostgreSQL) |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Fallback LLM | Ollama (qwen2.5-coder:3b) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo
```bash
git clone https://github.com/adityapandey9165/planforge-ai.git
cd planforge-ai
```

### 2. Set up the backend
```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```
```bash
uvicorn main:app --reload
```

### 3. Set up the frontend
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```
```bash
npm run dev
```

---

## 🖥️ Self Hosting with Ollama

See [SELF_HOSTING.md](./SELF_HOSTING.md) for running fully offline with Ollama.

---

## 📁 Project Structure
```
planforge-ai/
├── frontend/src/
│   ├── pages/          # Dashboard, CreateProject, OutputView, Settings
│   ├── components/     # Navbar, RateLimitBanner, Auth
│   └── lib/            # supabase.ts, apiConfig.ts
├── backend/
│   ├── agents/         # llm.py, clarify.py, planner.py, architect.py, evaluator.py, bad_idea_detector.py
│   ├── prompts/        # 7 .txt prompt files
│   └── main.py
└── SELF_HOSTING.md
```

---

## 🤖 How It Works

1. **You describe your project** — idea, goal, scale, tech stack
2. **Bad Idea Detector** runs first — flags high-risk ideas with suggestions
3. **5 clarifying questions** are generated based on your input
4. **4 AI agents** run in sequence:
   - 🔍 **Clarify** — structures your input into a clean summary
   - 📋 **Planner** — generates MVP steps, timeline, features
   - 🏗️ **Architect** — designs system architecture + API endpoints
   - ⭐ **Evaluator** — scores the plan across 3 dimensions
5. **Enhance** your plan with natural language — saves as a new version
6. **Export** as Markdown or save to your dashboard

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://planforge-ai-jade.vercel.app |
| Backend | Render | https://planforge-ai.onrender.com |

> ⚠️ Free tier on Render — first request may take 30-50 seconds to wake up.

---

## 📄 License

MIT — feel free to fork and build on it.

---

Built with ❤️ by [Aditya Pandey](https://github.com/adityapandey9165)