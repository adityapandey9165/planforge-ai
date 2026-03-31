import { useNavigate } from "react-router-dom";

export default function RateLimitBanner({ onDismiss }: { onDismiss: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-amber-800">
          ⚠️ Groq rate limit reached
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          The server's API key hit its limit. Add your own free Groq key to continue.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/settings")}
          className="text-xs bg-amber-800 text-white px-3 py-1.5 rounded-lg hover:bg-amber-900 transition font-medium"
        >
          Add Key →
        </button>
        <button onClick={onDismiss} className="text-amber-500 hover:text-amber-800 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}