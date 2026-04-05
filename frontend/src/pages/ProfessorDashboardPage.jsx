import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import Layout from "../components/Layout";

const ProfessorDashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [newAssignment, setNewAssignment] = useState({
    courseId: "",
    title: "",
    description: "",
    deadline: "",
    submissionType: "individual",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const { data } = await client.get("/courses/my");
      setCourses(data.courses || []);
      const map = {};
      (data.analytics || []).forEach((item) => {
        map[item.courseId] = item;
      });
      setAnalyticsMap(map);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCreateAssignment = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !newAssignment.courseId ||
      !newAssignment.title ||
      !newAssignment.description ||
      !newAssignment.deadline
    ) {
      setError("Fill all assignment fields before creating.");
      return;
    }

    setSaving(true);
    try {
      await client.post("/assignments", newAssignment);
      setNewAssignment({
        courseId: newAssignment.courseId,
        title: "",
        description: "",
        deadline: "",
        submissionType: "individual",
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Assignment creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Professor Dashboard">
      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={onCreateAssignment}
            className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2"
          >
            <select
              value={newAssignment.courseId}
              onChange={(event) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                }))
              }
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.code})
                </option>
              ))}
            </select>
            <input
              placeholder="Assignment title"
              value={newAssignment.title}
              onChange={(event) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
            />
            <input
              type="datetime-local"
              value={newAssignment.deadline}
              onChange={(event) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  deadline: event.target.value,
                }))
              }
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
            />
            <select
              value={newAssignment.submissionType}
              onChange={(event) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  submissionType: event.target.value,
                }))
              }
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2"
            >
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
            <textarea
              placeholder="Description"
              value={newAssignment.description}
              onChange={(event) =>
                setNewAssignment((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 md:col-span-2"
              rows={3}
            />
            <button
              disabled={saving}
              className="rounded-md bg-emerald-400 px-3 py-2 font-semibold text-slate-900 md:col-span-2"
            >
              {saving ? "Creating..." : "Create Assignment"}
            </button>
          </form>

          {error && (
            <p className="rounded-xl border border-rose-300/40 bg-rose-400/20 p-4 text-rose-100">
              {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => {
              const analytics = analyticsMap[course._id] || {
                submissionCounts: [],
                studentCount: 0,
              };
              const statusMap = { pending: 0, submitted: 0, acknowledged: 0 };
              analytics.submissionCounts?.forEach((item) => {
                statusMap[item._id] = item.count;
              });

              const total =
                statusMap.pending +
                  statusMap.submitted +
                  statusMap.acknowledged || 1;
              const donePct = Math.round(
                (statusMap.acknowledged / total) * 100,
              );

              return (
                <div
                  key={course._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {course.title}
                      </h2>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        {course.code}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-xs text-emerald-100">
                      {analytics.studentCount} students
                    </span>
                  </div>

                  <div className="mb-3 h-2 rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${donePct}%` }}
                    />
                  </div>
                  <p className="mb-3 text-xs text-slate-300">
                    Acknowledged progress: {donePct}%
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-700 px-2 py-1">
                      Pending: {statusMap.pending}
                    </span>
                    <span className="rounded-full bg-amber-400/20 px-2 py-1 text-amber-100">
                      Submitted: {statusMap.submitted}
                    </span>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-emerald-100">
                      Acknowledged: {statusMap.acknowledged}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {course.assignments?.map((assignment) => (
                      <Link
                        key={assignment._id}
                        to={`/assignment/${assignment._id}`}
                        className="block rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-400/20"
                      >
                        {assignment.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfessorDashboardPage;
