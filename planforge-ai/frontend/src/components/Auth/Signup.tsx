import { useState } from "react";
import { supabase } from "../../lib/supabase";

function getPasswordStrength(pwd: string) {
  const checks = {
    length: pwd.length >= 8,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed <= 1 ? "Weak" : passed <= 2 ? "Fair" : passed === 3 ? "Good" : "Strong";
  return { checks, passed, strength };
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { checks, passed, strength } = getPasswordStrength(password);

  const strengthColor =
    strength === "Strong" ? "bg-green-500" :
    strength === "Good" ? "bg-blue-500" :
    strength === "Fair" ? "bg-yellow-400" : "bg-red-400";

  const strengthText =
    strength === "Strong" ? "text-green-600" :
    strength === "Good" ? "text-blue-600" :
    strength === "Fair" ? "text-yellow-600" : "text-red-500";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (passed < 4) {
      setError("Please meet all password requirements.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <a href="/login" className="inline-block mt-6 text-sm text-indigo-600 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Start building your projects</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
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
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* Strength bar — only show when typing */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= passed ? strengthColor : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${strengthText}`}>{strength}</span>
                </div>
                {/* Checklist */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {[
                    { key: "length", label: "At least 8 characters" },
                    { key: "lowercase", label: "Lowercase letter" },
                    { key: "uppercase", label: "Uppercase letter" },
                    { key: "number", label: "Number" },
                  ].map(({ key, label }) => (
                    <p key={key} className={`text-xs flex items-center gap-1 ${
                      checks[key as keyof typeof checks] ? "text-green-600" : "text-gray-400"
                    }`}>
                      <span>{checks[key as keyof typeof checks] ? "✓" : "○"}</span>
                      {label}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${
                confirm.length > 0
                  ? confirm === password
                    ? "border-green-400"
                    : "border-red-300"
                  : "border-gray-200"
              }`}
            />
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {confirm.length > 0 && confirm === password && (
              <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-5">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}