import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://planforge-ai-jade.vercel.app/reset-password",
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  // ── Forgot password screen ─────────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">Reset password</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we'll send you a reset link.
          </p>

          {resetSent ? (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              ✓ Reset link sent! Check your email.
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}

          <p className="text-sm text-center mt-5">
            <button
              onClick={() => { setForgotMode(false); setResetSent(false); setError(""); }}
              className="text-indigo-600 hover:underline"
            >
              ← Back to login
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Login screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Log in to your account</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 flex items-center justify-between">
              <span>Password</span>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setError(""); }}
                className="text-xs text-indigo-500 hover:underline font-normal"
              >
                Forgot password?
              </button>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-5">
          Don't have an account?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}