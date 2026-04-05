import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const { user } = useAuth();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await client.get(`/assignments/${assignmentId}`);
      setPayload(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mySubmission = useMemo(() => {
    if (!payload?.submissions || !user) {
      return null;
    }

    return payload.submissions.find(
      (item) => item.student?._id === user._id || item.student === user._id,
    );
  }, [payload, user]);

  const progress = useMemo(() => {
    if (!payload?.submissions?.length) {
      return 0;
    }

    const done = payload.submissions.filter(
      (item) => item.status === "acknowledged",
    ).length;
    return Math.round((done / payload.submissions.length) * 100);
  }, [payload]);

  const triggerAction = async (endpoint) => {
    setActionLoading(true);
    setError("");
    try {
      await client.post(`/assignments/${assignmentId}/${endpoint}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${endpoint}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Assignment Details">
        <div className="flex h-52 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!payload?.assignment) {
    return (
      <Layout title="Assignment Details">
        <p className="rounded-xl border border-rose-300/40 bg-rose-400/20 p-4 text-rose-100">
          {error || "Assignment not found"}
        </p>
      </Layout>
    );
  }

  const { assignment, submissions, groups } = payload;

  return (
    <Layout title={assignment.title}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-2 text-sm text-slate-300">
            {assignment.description}
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-slate-700 px-3 py-1">
              Deadline: {new Date(assignment.deadline).toLocaleString()}
            </span>
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">
              Type: {assignment.submissionType}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-slate-200">Acknowledgment Progress</p>
            <span className="text-sm font-semibold text-emerald-300">
              {progress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {user.role === "student" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-3 text-sm text-slate-200">Your status:</p>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs">
                {mySubmission?.status || "pending"}
              </span>
              {mySubmission?.status === "acknowledged" && (
                <span className="text-emerald-300">Done</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerAction("submit")}
                disabled={actionLoading}
                className="rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-900"
              >
                Submit
              </button>
              <button
                onClick={() => triggerAction("acknowledge")}
                disabled={actionLoading}
                className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-900"
              >
                Acknowledge
              </button>
            </div>
            {assignment.submissionType === "group" && (
              <p className="mt-3 text-xs text-slate-300">
                For group assignments, only leader can acknowledge and status
                reflects to all members.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rose-300/40 bg-rose-400/20 p-4 text-rose-100">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Submissions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Student</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Submitted</th>
                  <th className="pb-2">Acknowledged By</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <tr key={item._id} className="border-b border-white/5">
                    <td className="py-2 pr-4">
                      {item.student?.name || "Unknown"}
                    </td>
                    <td className="py-2 pr-4">{item.status}</td>
                    <td className="py-2 pr-4">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="py-2">{item.acknowledgedBy?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {assignment.submissionType === "group" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold text-white">Groups</h2>
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group._id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-sm text-emerald-200">
                    Leader: {group.leader?.name}
                  </p>
                  <p className="text-xs text-slate-300">
                    Members:{" "}
                    {group.members?.map((member) => member.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssignmentPage;
