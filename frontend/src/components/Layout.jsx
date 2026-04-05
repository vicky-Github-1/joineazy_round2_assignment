import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937,_#0f172a_45%,_#020617)] text-slate-100">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to={user?.role === "professor" ? "/professor" : "/student"}
            className="text-lg font-semibold tracking-wide text-emerald-300"
          >
            JoinEazy Flow
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/20 px-3 py-1 text-emerald-100">
              {user?.role}
            </span>
            <span className="text-slate-300">{user?.name}</span>
            <button
              onClick={onLogout}
              className="rounded-md border border-rose-300/40 bg-rose-400/20 px-3 py-1 text-rose-100 transition hover:bg-rose-400/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
};

export default Layout;
