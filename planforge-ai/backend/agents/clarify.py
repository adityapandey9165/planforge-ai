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


async def get_clarification_questions(form_data: dict) -> list:
    """Agent 1a — Generate 5 smart questions based on the form."""
    template = load_prompt("clarify_questions_prompt.txt")
    prompt = fill_prompt(
        template,
        idea=form_data.get("idea", ""),
        goal=form_data.get("goal", ""),
        challenges=form_data.get("challenges", ""),
        scale=form_data.get("scale", ""),
        tech_stack=form_data.get("tech_stack", ""),
        auth_needed=form_data.get("auth_needed", False),
        deployment_needed=form_data.get("deployment_needed", False),
        type=form_data.get("type", ""),
    )
    raw = await call_llm(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        return [{"id": 1, "question": "What is the primary problem this solves?", "why": "Helps focus the plan"}]


async def clarify(form_data: dict, qa_pairs: list = None) -> dict:
    """Agent 1b — Produce structured summary from form + Q&A answers."""
    template = load_prompt("clarify_prompt.txt")

    qa_text = "None provided"
    if qa_pairs:
        qa_text = "\n".join(
            [f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}" for i, qa in enumerate(qa_pairs)]
        )

    prompt = fill_prompt(
        template,
        idea=form_data.get("idea", ""),
        goal=form_data.get("goal", ""),
        challenges=form_data.get("challenges", ""),
        scale=form_data.get("scale", ""),
        tech_stack=form_data.get("tech_stack", ""),
        auth_needed=form_data.get("auth_needed", False),
        deployment_needed=form_data.get("deployment_needed", False),
        type=form_data.get("type", ""),
        qa_pairs=qa_text,
    )
    raw = await call_llm(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        return {"raw_response": raw, "parse_error": True}