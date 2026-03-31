import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { getApiHeaders } from "../lib/apiConfig";
import RateLimitBanner from "../components/RateLimitBanner";
const API = "http://localhost:8000";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

type Step = "form" | "questions" | "generating";

interface Question {
  id: number;
  question: string;
  why: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    idea: "",
    goal: "",
    challenges: "",
    scale: "Small",
    tech_stack: "",
    auth_needed: false,
    deployment_needed: false,
    type: "Personal",
  });

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [rateLimited, setRateLimited] = useState(false);
   const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimited(false);
    setStep("generating");

    try {
      const token = await getToken();
      const res = await fetch(`${API}/clarify-questions`, {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify(form),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setStep("form");
        return;
      }
      if (!res.ok) throw new Error("Failed to get questions");
      const data = await res.json();
      setQuestions(data.questions);
      setStep("questions");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  };


  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimited(false);
    setStep("generating");

    const qa_pairs = questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] || "No answer provided",
    }));

    try {
      const token = await getToken();
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ form_data: form, qa_pairs }),
      });

      if (res.status === 429) {
        setRateLimited(true);
        setStep("questions");
        return;
      }
      if (!res.ok) throw new Error("Generation failed");
      const result = await res.json();
      navigate("/output", { state: { result, form } });
    } catch (err) {
      setError("Generation failed. Please try again.");
      setStep("questions");
    }
  };

  // ── Generating screen ──────────────────────────────────────────────────────
  if (step === "generating") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {questions.length === 0 ? "Analyzing your idea..." : "Generating your plan..."}
          </h2>
          <p className="text-sm text-gray-500">
            {questions.length === 0
              ? "Preparing smart questions for you"
              : "4 AI agents are working on your project plan"}
          </p>
          {questions.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">This takes 30–60 seconds</p>
          )}
        </div>
      </div>
    );
  }

  // ── Questions screen ───────────────────────────────────────────────────────
  if (step === "questions") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">
                A few quick questions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Your answers help the AI generate a much more accurate plan.
              </p>
            </div>
            {rateLimited && (
            <RateLimitBanner onDismiss={() => setRateLimited(false)} />
            )}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {q.id}. {q.question}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">{q.why}</p>
                  <textarea
                    rows={2}
                    placeholder="Your answer..."
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Generate My Plan →
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Step 1 of 2
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Describe your project
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the details and we'll generate a complete plan for you.
            </p>
          </div>
            {rateLimited && (
            <RateLimitBanner onDismiss={() => setRateLimited(false)} />
            )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Idea *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your project idea in a few sentences..."
                  value={form.idea}
                  onChange={(e) => setForm({ ...form, idea: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portfolio project, startup idea, learning..."
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Challenges
                </label>
                <input
                  type="text"
                  placeholder="e.g. Real-time updates, scalability, complex auth..."
                  value={form.challenges}
                  onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Tech Stack
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, FastAPI, PostgreSQL..."
                  value={form.tech_stack}
                  onChange={(e) => setForm({ ...form, tech_stack: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale
                </label>
                <div className="flex gap-2">
                  {["Small", "Medium", "Large"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, scale: s })}
                      className={`flex-1 py-2 text-sm rounded-lg border transition ${
                        form.scale === s
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <div className="flex gap-2">
                  {["Personal", "Professional"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 text-sm rounded-lg border transition ${
                        form.type === t
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-200 text-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.auth_needed}
                    onChange={(e) => setForm({ ...form, auth_needed: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Auth needed</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.deployment_needed}
                    onChange={(e) =>
                      setForm({ ...form, deployment_needed: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Deployment needed</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
            >
              Continue →
            </button>
          </form>
        </div>
      </div>
    </>
  );
}