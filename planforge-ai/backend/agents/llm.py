import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5-coder:3b"


async def call_llm(prompt: str, user_groq_key: str = None) -> str:
    active_key = user_groq_key or GROQ_API_KEY

    if active_key:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {active_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                    },
                )
                if response.status_code == 429:
                    raise ValueError("RATE_LIMIT")
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except ValueError:
            raise
        except Exception as e:
            print(f"Groq failed: {e} — falling back to Ollama")

    # Ollama fallback
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            return response.json()["response"]
    except Exception as e:
        raise ValueError("RATE_LIMIT")