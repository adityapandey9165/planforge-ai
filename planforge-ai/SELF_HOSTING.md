# 🖥️ Self-Hosting PlanForge AI with Ollama

If you don't have a Groq API key, you can run PlanForge AI fully locally using Ollama — no internet required after setup.

## Prerequisites
- [Ollama](https://ollama.com/) installed
- Node.js 18+
- Python 3.10+

## Step 1 — Clone the repo
```bash
git clone https://github.com/adityapandey9165/planforge-ai.git
cd planforge-ai
```

## Step 2 — Pull the model
```bash
ollama pull qwen2.5-coder:3b
```

## Step 3 — Start Ollama
```bash
ollama serve
```

## Step 4 — Set up the backend
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=        # leave blank to use Ollama only
```

Start the backend:
```bash
uvicorn main:app --reload
```

## Step 5 — Set up the frontend
```bash
cd ../frontend
npm install
npm run dev
```

## Step 6 — Enable Ollama in Settings
Open `http://localhost:5173`, log in, go to **Settings**, and toggle **Use Ollama (Local)**.

> ⚠️ Ollama is slow on CPU (~2–5 min per generation). A GPU speeds this up significantly.
> Ollama mode only works when running the backend locally — it won't work on the hosted version.