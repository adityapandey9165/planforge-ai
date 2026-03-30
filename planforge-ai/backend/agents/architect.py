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
            if part.startswith("{") or part.startswith("["):
                clean = part
                break
    start = clean.find("{")
    end = clean.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(clean[start:end])
        except Exception:
            pass
    raise ValueError("Could not parse JSON")


async def architect(plan_data: dict) -> dict:
    template = load_prompt("architect_prompt.txt")
    prompt = fill_prompt(template, plan=json.dumps(plan_data, indent=2))
    raw = await call_llm(prompt)

    try:
        return _parse_json(raw)
    except Exception:
        # Fallback — return a basic structure so the pipeline doesn't break
        return {
            "system_design": "Standard frontend-backend-database architecture.",
            "api_endpoints": [
                {"method": "GET", "path": "/tasks", "description": "Get all tasks", "auth_required": True},
                {"method": "POST", "path": "/tasks", "description": "Create a task", "auth_required": True},
                {"method": "PUT", "path": "/tasks/{id}", "description": "Update a task", "auth_required": True},
                {"method": "DELETE", "path": "/tasks/{id}", "description": "Delete a task", "auth_required": True},
            ],
            "database_schema": [
                {
                    "table": "tasks",
                    "columns": [
                        {"name": "id", "type": "uuid", "note": "primary key"},
                        {"name": "user_id", "type": "uuid", "note": "foreign key"},
                        {"name": "title", "type": "text", "note": ""},
                        {"name": "status", "type": "text", "note": ""},
                        {"name": "created_at", "type": "timestamp", "note": "default now()"}
                    ]
                }
            ],
            "mermaid_diagram": "graph TD\n    User-->Frontend\n    Frontend-->Backend\n    Backend-->Database"
        }