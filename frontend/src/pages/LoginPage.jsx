import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "professor" ? "/professor" : "/student"}
        replace
      />
    );
  }

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post("/auth/login", form);
      login(data);
      navigate(data.user.role === "professor" ? "/professor" : "/student");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[conic-gradient(at_top_right,_#1e293b,_#0f172a,_#14532d)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur"
      >
        <h1 className="mb-2 text-3xl font-bold text-white">Welcome Back</h1>
        <p className="mb-6 text-sm text-slate-200">
          Login to continue your assignment workflow.
        </p>

        <label className="mb-2 block text-sm text-slate-100">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          className="mb-4 w-full rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-white outline-none ring-emerald-400 placeholder:text-slate-400 focus:ring"
          placeholder="you@example.com"
        />

        <label className="mb-2 block text-sm text-slate-100">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          className="mb-4 w-full rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-white outline-none ring-emerald-400 placeholder:text-slate-400 focus:ring"
          placeholder="********"
        />

        {error && (
          <p className="mb-4 rounded-md bg-rose-500/20 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-70"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          ) : (
            "Login"
          )}
        </button>

        <p className="mt-5 text-sm text-slate-200">
          New user?{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
