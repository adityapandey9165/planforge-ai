import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { getApiHeaders } from "../lib/apiConfig";
import RateLimitBanner from "../components/RateLimitBanner";
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? "bg-green-100 text-green-700"
      : score >= 3
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      <span>Score</span>
      <span className="text-lg">{score}/5</span>
    </div>
  );
}

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
  if (!ref.current || !chart) return;
  setFailed(false);

  import("mermaid").then((mermaid) => {
    mermaid.default.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      suppressErrorRendering: true,  // ← add this
    });

    const id = "mermaid-" + Date.now();
    ref.current!.innerHTML = "";

    mermaid.default
      .render(id, chart.trim())
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch(() => {
        if (ref.current) ref.current.innerHTML = ""; // clear any error UI
        setFailed(true);
      });
  });
}, [chart]);

  if (failed) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Architecture Diagram</p>
        <pre className="text-xs text-gray-500 whitespace-pre-wrap overflow-auto leading-relaxed">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-gray-50 rounded-xl p-4 flex items-center justify-center min-h-32 overflow-auto"
    />
  );
}
export default function OutputView() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  const [enhancing, setEnhancing] = useState(false);
  const [enhanceText, setEnhanceText] = useState("");
  const [currentResult, setCurrentResult] = useState(result);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(location.state?.groupId || null);
  const [currentVersion, setCurrentVersion] = useState<number>(location.state?.version || 1);
  const [versions, setVersions] = useState<{ version: number; output_data: any; score: number | null }[]>([]);
  const [lastSavedResult, setLastSavedResult] = useState<string>(JSON.stringify(result));

  // Load all versions for this group
  useEffect(() => {
    if (!groupId) return;
    supabase
      .from("projects")
      .select("version, output_data, score")
      .eq("group_id", groupId)
      .order("version", { ascending: true })
      .then(({ data }) => {
        if (data) setVersions(data);
      });
  }, [groupId]);

  useEffect(() => {
    if (!result) navigate("/create");
  }, [result, navigate]);

  if (!currentResult) return null;

  const { clarified, plan, architecture, evaluation } = currentResult;

  const hasChanges = JSON.stringify(currentResult) !== lastSavedResult;

  const handleEnhance = async () => {
    if (!enhanceText.trim()) return;
    setEnhancing(true);
    setError("");
    setRateLimited(false);

    try {
      const token = await getToken();
      const res = await fetch(`${API}/enhance`, {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({
          original_plan: plan,
          original_architecture: architecture,
          original_score: evaluation?.score || 0,
          original_feedback: evaluation?.overall_feedback || "",
          enhancement_request: enhanceText,
        }),
      });

      if (res.status === 429) {
        setRateLimited(true);
        return;
      }
      if (!res.ok) throw new Error("Enhancement failed");
      const enhanced = await res.json();
      setCurrentResult({ ...currentResult, ...enhanced });
      setEnhanceText("");
      setSaved(false);
    } catch {
      setError("Enhancement failed. Try rephrasing your request.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges && saved) {
      setError("No changes to save.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await supabase.auth.getSession();
      const user_id = data.session?.user.id;

      const newGroupId = groupId || crypto.randomUUID();
      const newVersion = groupId ? currentVersion + 1 : 1;

      await supabase.from("projects").insert({
        user_id,
        title: clarified?.project_summary?.slice(0, 80) || "Untitled Project",
        input_data: currentResult.input,
        output_data: currentResult,
        score: evaluation?.score || null,
        group_id: newGroupId,
        version: newVersion,
      });

      setGroupId(newGroupId);
      setCurrentVersion(newVersion);
      setLastSavedResult(JSON.stringify(currentResult));
      setSaved(true);

      // Refresh versions list
      const { data: vData } = await supabase
        .from("projects")
        .select("version, output_data, score")
        .eq("group_id", newGroupId)
        .order("version", { ascending: true });
      if (vData) setVersions(vData);

    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchVersion = (v: { version: number; output_data: any }) => {
    setCurrentResult(v.output_data);
    setCurrentVersion(v.version);
    setLastSavedResult(JSON.stringify(v.output_data));
    setSaved(true);
  };
  const exportMarkdown = () => {
  const lines: string[] = [];

  lines.push(`# ${clarified?.project_summary || "Project Plan"}`);
  lines.push(`\n**Score:** ${evaluation?.score}/5\n`);

  lines.push(`## Core Features`);
  clarified?.core_features?.forEach((f: string) => lines.push(`- ${f}`));

  lines.push(`\n## MVP Plan`);
  plan?.mvp_steps?.forEach((step: any) => {
    lines.push(`\n### Step ${step.step}: ${step.title}`);
    lines.push(`${step.description}`);
    lines.push(`- **Estimated:** ${step.estimated_days} days`);
    if (step.deliverable) lines.push(`- **Deliverable:** ${step.deliverable}`);
  });

  lines.push(`\n**Total Timeline:** ${plan?.total_estimated_weeks} weeks`);
  lines.push(`**Complexity:** ${clarified?.technical_complexity}`);

  lines.push(`\n## Must Have`);
  plan?.features?.must_have?.forEach((f: string) => lines.push(`- ${f}`));

  lines.push(`\n## Nice to Have`);
  plan?.features?.nice_to_have?.forEach((f: string) => lines.push(`- ${f}`));

  lines.push(`\n## System Design`);
  lines.push(`${architecture?.system_design}`);

  lines.push(`\n## API Endpoints`);
  architecture?.api_endpoints?.forEach((ep: any) => {
    lines.push(`- \`${ep.method} ${ep.path}\` — ${ep.description}`);
  });

  if (architecture?.mermaid_diagram) {
    lines.push(`\n## Architecture Diagram`);
    lines.push("```mermaid");
    lines.push(architecture.mermaid_diagram);
    lines.push("```");
  }

  lines.push(`\n## Evaluation`);
  lines.push(`**Overall:** ${evaluation?.overall_feedback}`);
  ["clarity", "logic", "completeness"].forEach((dim) => {
    lines.push(`- **${dim}:** ${evaluation?.[dim]?.rating} — ${evaluation?.[dim]?.feedback}`);
  });

  if (evaluation?.improvements?.length > 0) {
    lines.push(`\n## Improvements`);
    evaluation.improvements.forEach((imp: string) => lines.push(`- ${imp}`));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${clarified?.project_summary?.slice(0, 40) || "project-plan"}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Your Project Plan</h1>
              <p className="text-sm text-gray-500 mt-1">{clarified?.project_summary}</p>
            </div>
            {evaluation?.score && <ScoreBadge score={evaluation.score} />}
          </div>
          {rateLimited && (
            <RateLimitBanner onDismiss={() => setRateLimited(false)} />
            )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {/* Version switcher */}
          {versions.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Versions:</span>
              <div className="flex gap-1">
                {versions.map((v) => (
                  <button
                    key={v.version}
                    onClick={() => handleSwitchVersion(v)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                      currentVersion === v.version
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-200 text-gray-500 hover:border-indigo-300"
                    }`}
                  >
                    v{v.version}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Features */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Core Features</h2>
            <div className="flex flex-wrap gap-2">
              {clarified?.core_features?.map((f: string, i: number) => (
                <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* MVP Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">MVP Plan</h2>
            <div className="space-y-4">
              {plan?.mvp_steps?.map((step: any) => (
                <div key={step.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{step.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-indigo-600">{step.estimated_days} days</span>
                      {step.deliverable && (
                        <span className="text-xs text-gray-400">→ {step.deliverable}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Timeline</p>
                <p className="text-sm font-medium text-gray-700">{plan?.total_estimated_weeks} weeks</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Complexity</p>
                <p className="text-sm font-medium text-gray-700">{clarified?.technical_complexity}</p>
              </div>
            </div>
          </div>

          {/* Must Have / Nice to Have */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-xs font-semibold text-green-600 mb-2">Must Have</h2>
              <ul className="space-y-1">
                {plan?.features?.must_have?.map((f: string, i: number) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-xs font-semibold text-gray-400 mb-2">Nice to Have</h2>
              <ul className="space-y-1">
                {plan?.features?.nice_to_have?.map((f: string, i: number) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                    <span className="text-gray-300 mt-0.5">◦</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Architecture */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">System Design</h2>
            <p className="text-xs text-gray-500 mb-4">{architecture?.system_design}</p>

            {architecture?.mermaid_diagram && (
              <MermaidDiagram chart={architecture.mermaid_diagram} />
            )}

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 mb-2">API Endpoints</p>
              <div className="space-y-1">
                {architecture?.api_endpoints?.map((ep: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                      ep.method === "GET" ? "bg-green-100 text-green-700" :
                      ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                      ep.method === "PUT" || ep.method === "PATCH" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-gray-700">{ep.path}</span>
                    <span className="text-gray-400">— {ep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation */}
          {evaluation && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Evaluation</h2>
                <ScoreBadge score={evaluation.score} />
              </div>

              <p className="text-xs text-gray-600 mb-4">{evaluation.overall_feedback}</p>

              <div className="space-y-3 mb-4">
                {["clarity", "logic", "completeness"].map((dim) => {
                  const rating = evaluation[dim]?.rating;
                  const pct = rating === "Excellent" ? 100 : rating === "Good" ? 78 : rating === "Fair" ? 50 : 25;
                  const color = rating === "Excellent" || rating === "Good"
                    ? "bg-green-500" : rating === "Fair"
                    ? "bg-yellow-400" : "bg-red-400";
                  const textColor = rating === "Excellent" || rating === "Good"
                    ? "text-green-600" : rating === "Fair"
                    ? "text-yellow-600" : "text-red-500";
                  return (
                    <div key={dim}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 capitalize">{dim}</span>
                        <span className={`text-xs font-semibold ${textColor}`}>{rating}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{evaluation[dim]?.feedback}</p>
                    </div>
                  );
                })}
              </div>

              {evaluation.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Improvements</p>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((imp: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-indigo-400">→</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Enhance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Enhance this plan</h2>
            <p className="text-xs text-gray-400 mb-3">
              Tell the AI what to change — stack, detail level, timeline, etc.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Use PostgreSQL instead of SQLite, add more steps..."
                value={enhanceText}
                onChange={(e) => setEnhanceText(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleEnhance}
                disabled={enhancing || !enhanceText.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {enhancing ? "..." : "Enhance"}
              </button>
            </div>
          </div>
 
          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || (saved && !hasChanges)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                saved && !hasChanges
                  ? "bg-green-600 text-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } disabled:opacity-50`}
            >
              {saved && !hasChanges
                ? `✓ Saved as v${currentVersion}`
                : saving
                ? "Saving..."
                : groupId
                ? `Save as v${currentVersion + 1}`
                : "Save Project"}
            </button>
            <button
              onClick={exportMarkdown}
              className="px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              ↓ Export .md
            </button>
            <button
              onClick={() => navigate("/create")}
              className="px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              New Project
            </button>
          </div>

        </div>
      </div>
    </>
  );
}