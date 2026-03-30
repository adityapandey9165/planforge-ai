import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm">PlanForge</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/create")}
            className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            + New Project
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}