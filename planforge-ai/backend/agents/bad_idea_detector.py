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
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        return json.loads(clean[start:end])
    raise ValueError("Could not parse JSON")


async def detect_bad_idea(form_data: dict, user_groq_key: str = None) -> dict:
    """Agent 0 — Runs before the main pipeline. Detects major flaws in the idea."""
    template = load_prompt("bad_idea_prompt.txt")
    prompt = fill_prompt(
        template,
        idea=form_data.get("idea", ""),
        goal=form_data.get("goal", ""),
        scale=form_data.get("scale", ""),
        type=form_data.get("type", ""),
        tech_stack=form_data.get("tech_stack", ""),
    )
    raw = await call_llm(prompt, user_groq_key=user_groq_key)
    try:
        return _parse_json(raw)
    except Exception:
        # If parsing fails, don't block the pipeline
        return {
            "risk_level": "Low",
            "is_viable": True,
            "summary": "Analysis unavailable",
            "problems": [],
            "strengths": []
        }