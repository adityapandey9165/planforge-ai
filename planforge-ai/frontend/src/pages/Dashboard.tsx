import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

interface Project {
  id: string;
  title: string;
  score: number | null;
  created_at: string;
  input_data: any;
  output_data: any;
}

function ScoreDot({ score }: { score: number | null }) {
  if (!score) return <span className="text-xs text-gray-300">No score</span>;
  const color = score >= 4 ? "text-green-600" : score >= 3 ? "text-yellow-600" : "text-red-500";
  return <span className={`text-sm font-semibold ${color}`}>{score}/5</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUserEmail(sessionData.session?.user.email || "");

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setProjects(data);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Your Projects</h1>
              {userEmail && (
                <p className="text-sm text-gray-400 mt-0.5">{userEmail}</p>
              )}
            </div>
            <button
              onClick={() => navigate("/create")}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              + New Project
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* Empty state */}
          {!loading && projects.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">No projects yet</h2>
              <p className="text-sm text-gray-400 mb-6">
                Create your first project and get an AI-generated plan in minutes.
              </p>
              <button
                onClick={() => navigate("/create")}
                className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Project
              </button>
            </div>
          )}

          {/* Project list */}
          {!loading && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() =>
                    navigate("/output", {
                      state: { result: project.output_data, form: project.input_data },
                    })
                  }
                  className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-600 transition">
                        {project.title || "Untitled Project"}
                      </h3>
                      {project.input_data?.idea && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {project.input_data.idea}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(project.created_at)}
                        </span>
                        {project.input_data?.scale && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {project.input_data.scale}
                          </span>
                        )}
                        {project.input_data?.type && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {project.input_data.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <ScoreDot score={project.score} />
                      <p className="text-xs text-gray-300 mt-1">→</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}