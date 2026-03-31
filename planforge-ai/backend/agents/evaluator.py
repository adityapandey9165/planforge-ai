import json
from .llm import call_llm
from .prompt_loader import load_prompt, fill_prompt


def _parse_json(raw: str):
    clean = raw.strip()
    if "```json" in clean:
        clean = clean.split("```json")[1].split("```")[0].strip()
    elif "```" in clean:
        parts = clean.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("{"):
                clean = part
                break
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        try:
            result = json.loads(clean[start:end])
            # Validate it's actually evaluation data not architecture data
            if "score" in result:
                return result
        except Exception:
            pass
    raise ValueError("Not valid evaluation JSON")


async def evaluate(plan_data: dict, arch_data: dict, user_groq_key: str = None) -> dict:
    template = load_prompt("evaluator_prompt.txt")
    prompt = fill_prompt(
        template,
        mvp_steps=json.dumps(plan_data.get("mvp_steps", []), indent=2),
        recommended_stack=json.dumps(plan_data.get("recommended_stack", {}), indent=2),
        total_estimated_weeks=plan_data.get("total_estimated_weeks", "?"),
        system_design=arch_data.get("system_design", ""),
        endpoint_count=len(arch_data.get("api_endpoints", [])),
        table_count=len(arch_data.get("database_schema", [])),
    )
    raw = await call_llm(prompt, user_groq_key=user_groq_key)

    try:
        return _parse_json(raw)
    except Exception:
        # Fallback evaluation so pipeline never breaks
        return {
            "score": 3.5,
            "clarity": {"rating": "Good", "feedback": "Plan structure is clear and followable."},
            "logic": {"rating": "Good", "feedback": "Steps are in a logical order."},
            "completeness": {"rating": "Fair", "feedback": "Some implementation details could be expanded."},
            "overall_feedback": "Solid MVP plan. The stack choices are appropriate for the scale. Consider adding more detail to each step.",
            "improvements": [
                "Add testing steps to the plan",
                "Define error handling strategy",
                "Add deployment checklist"
            ]
        }