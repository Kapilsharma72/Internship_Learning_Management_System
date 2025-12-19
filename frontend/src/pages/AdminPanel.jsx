import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [allocationForm, setAllocationForm] = useState({
    mentorId: "",
    studentId: "",
  });
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadUsers = () => {
    setLoading(true);
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .catch(() => setMessage("Failed to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    api
      .get("/admin/analytics")
      .then((res) => setAnalytics(res.data))
      .catch(() => {
        // analytics are helpful but not critical – do not block the page
      });
  }, []);

  const approveMentor = async (id) => {
    setMessage("");
    try {
      await api.put(`/admin/users/${id}/approve-mentor`);
      setMessage("Mentor approved.");
      loadUsers();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not approve mentor.");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    setMessage("");
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage("User deleted.");
      loadUsers();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not delete user.");
    }
  };

  const pendingMentors = users.filter(
    (u) => u.role === "mentor" && !u.mentorApproved
  ).length;

  const filteredUsers = users.filter((u) => {
    const bySearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    let byRole = true;
    if (roleFilter === "students") byRole = u.role === "student";
    else if (roleFilter === "mentors") byRole = u.role === "mentor";
    else if (roleFilter === "pending-mentors")
      byRole = u.role === "mentor" && !u.mentorApproved;
    else if (roleFilter === "admins") byRole = u.role === "admin";

    return bySearch && byRole;
  });

  return (
    <div className="container">
      <div className="card-panel">
        <h2>Admin panel</h2>
        <p className="small">
          Manage platform users, allocate mentors to students and keep an eye on how the
          platform is being used.
        </p>

        {analytics && (
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-label">Total users</div>
              <div className="analytics-value">{analytics.totalUsers}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Students</div>
              <div className="analytics-value">{analytics.totalStudents}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Mentors</div>
              <div className="analytics-value">{analytics.totalMentors}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Admins</div>
              <div className="analytics-value">{analytics.totalAdmins}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Courses</div>
              <div className="analytics-value">{analytics.totalCourses}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Certificates issued</div>
              <div className="analytics-value">
                {analytics.totalCertificates}
              </div>
            </div>
          </div>
        )}

        {message && <div className="banner">{message}</div>}

        {loading && <p className="small">Loading users…</p>}

        {!loading && users.length === 0 && (
          <p className="small muted">No users found in the system.</p>
        )}

        {!loading && users.length > 0 && (
          <section className="controls-row" style={{ marginTop: "1rem" }}>
            <div className="controls-left">
              <input
                className="input"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="controls-right">
              <button
                type="button"
                className={`chip ${roleFilter === "all" ? "chip-active" : ""}`}
                onClick={() => setRoleFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`chip ${
                  roleFilter === "students" ? "chip-active" : ""
                }`}
                onClick={() => setRoleFilter("students")}
              >
                Students
              </button>
              <button
                type="button"
                className={`chip ${
                  roleFilter === "mentors" ? "chip-active" : ""
                }`}
                onClick={() => setRoleFilter("mentors")}
              >
                Mentors
              </button>
              <button
                type="button"
                className={`chip ${
                  roleFilter === "pending-mentors" ? "chip-active" : ""
                }`}
                onClick={() => setRoleFilter("pending-mentors")}
              >
                Pending mentors ({pendingMentors})
              </button>
              <button
                type="button"
                className={`chip ${
                  roleFilter === "admins" ? "chip-active" : ""
                }`}
                onClick={() => setRoleFilter("admins")}
              >
                Admins
              </button>
            </div>
          </section>
        )}

        {!loading && users.length > 0 && (
          <section style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
            <h3 className="section-title">Allocate students to mentors</h3>
            <p className="small muted">
              Choose a mentor and a student to link them. Mentors can only assign courses
              to students that are allocated here.
            </p>

            <form
              className="form-row"
              style={{ maxWidth: 520, marginTop: "0.75rem" }}
              onSubmit={async (e) => {
                e.preventDefault();
                setMessage("");
                try {
                  await api.post(
                    `/admin/mentors/${allocationForm.mentorId}/allocate-student`,
                    { studentId: allocationForm.studentId }
                  );
                  setMessage("Student allocated to mentor.");
                } catch (err) {
                  setMessage(
                    err?.response?.data?.message ||
                      "Could not allocate student to mentor."
                  );
                }
              }}
            >
              <label className="small">Mentor</label>
              <select
                className="input"
                value={allocationForm.mentorId}
                onChange={(e) =>
                  setAllocationForm((f) => ({ ...f, mentorId: e.target.value }))
                }
              >
                <option value="">Select a mentor</option>
                {users
                  .filter((u) => u.role === "mentor")
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>

              <label className="small">Student</label>
              <select
                className="input"
                value={allocationForm.studentId}
                onChange={(e) =>
                  setAllocationForm((f) => ({ ...f, studentId: e.target.value }))
                }
              >
                <option value="">Select a student</option>
                {users
                  .filter((u) => u.role === "student")
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
              </select>

              <div className="actions">
                <button
                  className="btn secondary"
                  disabled={!allocationForm.mentorId || !allocationForm.studentId}
                >
                  Link student to mentor
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="table">
          <div className="table-head">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {filteredUsers.map((u) => (
            <div key={u._id} className="table-row">
              <span>{u.name}</span>
              <span>{u.email}</span>
              <span>{u.role}</span>
              <span>
                {u.role === "mentor"
                  ? u.mentorApproved
                    ? "Approved"
                    : "Pending approval"
                  : "—"}
              </span>
              <span className="table-actions">
                {u.role === "mentor" && !u.mentorApproved && (
                  <button
                    className="btn small-btn"
                    onClick={() => approveMentor(u._id)}
                  >
                    Approve
                  </button>
                )}
                <button
                  className="btn small-btn danger"
                  onClick={() => deleteUser(u._id)}
                >
                  Remove
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
