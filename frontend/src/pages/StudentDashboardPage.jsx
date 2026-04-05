import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import Layout from "../components/Layout";

const StudentDashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await client.get("/courses/my");
        setCourses(data.courses || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Layout title="Student Dashboard">
      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent" />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-400/20 p-4 text-rose-100">
          {error}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course._id}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <h2 className="text-xl font-semibold text-white">
                {course.title}
              </h2>
              <p className="mb-4 text-xs uppercase tracking-wider text-slate-400">
                {course.code}
              </p>
              <div className="space-y-2">
                {course.assignments?.map((assignment) => (
                  <Link
                    key={assignment._id}
                    to={`/assignment/${assignment._id}`}
                    className="block rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-400/20"
                  >
                    {assignment.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboardPage;
