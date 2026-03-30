from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import os
from dotenv import load_dotenv

from agents.clarify import get_clarification_questions, clarify
from agents.planner import plan
from agents.architect import architect
from agents.evaluator import evaluate
from agents.prompt_loader import load_prompt, fill_prompt
from agents.llm import call_llm

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_ANON_KEY},
        )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return response.json()["id"]


class ProjectInput(BaseModel):
    idea: str
    goal: str
    challenges: str = ""
    scale: str = "Medium"
    tech_stack: str = ""
    auth_needed: bool = False
    deployment_needed: bool = False
    type: str = "Personal"


class QAPair(BaseModel):
    question: str
    answer: str


class GenerateRequest(BaseModel):
    form_data: ProjectInput
    qa_pairs: Optional[List[QAPair]] = []


class EnhanceRequest(BaseModel):
    original_plan: dict
    original_architecture: dict
    original_score: float
    original_feedback: str
    enhancement_request: str


@app.get("/")
def root():
    return {"message": "PlanForge API is running"}


@app.get("/me")
async def get_me(user_id: str = Depends(verify_token)):
    return {"user_id": user_id, "message": "Token is valid"}


@app.post("/clarify-questions")
async def get_questions(data: ProjectInput, user_id: str = Depends(verify_token)):
    """Step 1 — Get 5 smart clarifying questions based on the form."""
    questions = await get_clarification_questions(data.model_dump())
    return {"questions": questions}


@app.post("/generate")
async def generate(data: GenerateRequest, user_id: str = Depends(verify_token)):
    """Step 2 — Run full 4-agent pipeline with form data + Q&A answers."""
    form_data = data.form_data.model_dump()
    qa_pairs = [qa.model_dump() for qa in (data.qa_pairs or [])]

    clarified = await clarify(form_data, qa_pairs)
    plan_output = await plan(clarified)
    arch_output = await architect(plan_output)
    evaluation = await evaluate(plan_output, arch_output)

    return {
        "user_id": user_id,
        "input": form_data,
        "clarified": clarified,
        "plan": plan_output,
        "architecture": arch_output,
        "evaluation": evaluation,
    }


@app.post("/enhance")
async def enhance_plan(data: EnhanceRequest, user_id: str = Depends(verify_token)):
    """Step 3 (optional) — Refine the plan based on user feedback."""
    template = load_prompt("enhance_prompt.txt")
    prompt = fill_prompt(
        template,
        original_plan=json.dumps(data.original_plan, indent=2),
        original_architecture=json.dumps(data.original_architecture, indent=2),
        original_score=data.original_score,
        original_feedback=data.original_feedback,
        enhancement_request=data.enhancement_request,
    )

    raw = await call_llm(prompt)

    try:
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                if part.startswith("json"):
                    clean = part[4:].strip()
                    break
        result = json.loads(clean)
        new_plan = result.get("plan", data.original_plan)
        new_arch = result.get("architecture", data.original_architecture)
        new_evaluation = await evaluate(new_plan, new_arch)
        return {
            "user_id": user_id,
            "plan": new_plan,
            "architecture": new_arch,
            "evaluation": new_evaluation,
            "changes_made": result.get("changes_made", []),
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Enhancement failed — try rephrasing your request")