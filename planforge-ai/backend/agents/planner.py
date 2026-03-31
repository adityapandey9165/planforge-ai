import json
from .llm import call_llm
from .prompt_loader import load_prompt, fill_prompt


def _parse_json(raw: str):
    clean = raw.strip()
    if "```" in clean:
        parts = clean.split("```")
        for part in parts:
            if part.startswith("json"):
                clean = part[4:].strip()
                break
            elif "{" in part or "[" in part:
                clean = part.strip()
                break
    start = min(
        clean.find("{") if clean.find("{") != -1 else len(clean),
        clean.find("[") if clean.find("[") != -1 else len(clean),
    )
    end = max(clean.rfind("}"), clean.rfind("]")) + 1
    clean = clean[start:end]
    return json.loads(clean)

async def plan(clarified: dict, user_groq_key: str = None) -> dict:
    """Agent 2 — Generate a detailed project plan from clarified data."""
    template = load_prompt("planner_prompt.txt")
    prompt = fill_prompt(template, clarified=json.dumps(clarified, indent=2))
    raw = await call_llm(prompt, user_groq_key=user_groq_key)
    try:
        return _parse_json(raw)
    except Exception:
        return {"raw_response": raw, "parse_error": True}