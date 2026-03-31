import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const GROQ_KEY_STORAGE = "planforge_groq_key";
const OLLAMA_MODE_STORAGE = "planforge_ollama_mode";

export default function Settings() {
  const navigate = useNavigate();
  const [groqKey, setGroqKey] = useState("");
  const [ollamaMode, setOllamaMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setGroqKey(localStorage.getItem(GROQ_KEY_STORAGE) || "");
    setOllamaMode(localStorage.getItem(OLLAMA_MODE_STORAGE) === "true");
  }, []);

  const handleSave = () => {
    setError("");
    if (groqKey && !groqKey.startsWith("gsk_")) {
      setError("Groq API keys must start with gsk_");
      return;
    }
    if (groqKey) {
      localStorage.setItem(GROQ_KEY_STORAGE, groqKey);
    } else {
      localStorage.removeItem(GROQ_KEY_STORAGE);
    }
    localStorage.setItem(OLLAMA_MODE_STORAGE, String(ollamaMode));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setGroqKey("");
    setOllamaMode(false);
    localStorage.removeItem(GROQ_KEY_STORAGE);
    localStorage.removeItem(OLLAMA_MODE_STORAGE);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your LLM provider. Keys are stored locally in your browser only.
          </p>
        </div>

        {/* Groq API Key */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800">Groq API Key</h2>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              Recommended
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Bring your own key from{" "}
            <a 
              href="https://console.groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              console.groq.com
            </a>
            . Free tier is generous. Overrides the server key.
          </p>
          <input
            type="password"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* Ollama Mode */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Use Ollama (Local)</h2>
              <p className="text-sm text-gray-500 mt-1">
                Run fully offline using{" "}
                <code className="bg-gray-100 px-1 rounded">qwen2.5-coder:3b</code>.
                Requires local setup.
              </p>
            </div>
            <button
              onClick={() => setOllamaMode(!ollamaMode)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                ollamaMode ? "bg-indigo-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  ollamaMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {ollamaMode && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium mb-1">
                ⚠️ Local setup required
              </p>
              <p className="text-sm text-amber-700 mb-3">
                Ollama only works when the backend is running on your machine.
                It won't work on the hosted version.
              </p>
              
              <a 
                href="https://github.com/adityapandey9165/planforge-ai/blob/main/SELF_HOSTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm bg-amber-800 text-white px-4 py-2 rounded-lg hover:bg-amber-900 transition font-medium"
              >
                📖 View Self-Hosting Guide →
              </a>
            </div>
          )}
        </div> {/* <-- ADDED MISSING CLOSING DIV HERE */}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Clear all
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-800 transition ml-auto"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}