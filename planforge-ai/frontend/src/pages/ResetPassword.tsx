import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => window.location.href = "/dashboard", 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Set new password</h1>
        <p className="text-sm text-gray-500 mb-6">Choose a strong new password.</p>

        {done ? (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">
            ✓ Password updated! Redirecting...
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
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
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}