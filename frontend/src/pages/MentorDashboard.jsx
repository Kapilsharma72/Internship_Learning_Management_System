import { useEffect, useState } from "react";
import api from "../services/api";

export default function MentorDashboard() {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [chapterForm, setChapterForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    sequence: 1,
  });

  const [assignForm, setAssignForm] = useState({
    studentId: "",
  });

  const [enrolledProgress, setEnrolledProgress] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [chaptersPreview, setChaptersPreview] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const loadCourses = () => {
    api
      .get("/mentor/courses/my")
      .then((res) => setCourses(res.data))
      .catch(() => setMessage("Failed to load your courses."));
  };

  useEffect(() => {
    loadCourses();
    api
      .get("/mentor/students/my")
      .then((res) => setAvailableStudents(res.data))
      .catch(() => {
        // if this fails, mentors simply won't see any students to assign to
      });
  }, []);

  const selectCourse = (course) => {
    setSelectedCourseId(course._id);
    setSelectedCourseTitle(course.title);
    setMessage("");
    setEnrolledProgress([]);
    setChaptersPreview([]);

    setLoadingProgress(true);
    api
      .get(`/mentor/courses/${course._id}/progress`)
      .then((res) => setEnrolledProgress(res.data))
      .catch(() => setMessage("Could not load student progress for this course."))
      .finally(() => setLoadingProgress(false));
  };

  const loadChaptersPreview = () => {
    if (!selectedCourseId) return;
    setChaptersLoading(true);
    api
      .get(`/mentor/courses/${selectedCourseId}/chapters`)
      .then((res) => setChaptersPreview(res.data))
      .catch(() => setMessage("Could not load chapters for this course."))
      .finally(() => setChaptersLoading(false));
  };

  const createCourse = async (e) => {
    e.preventDefault();
    setMessage("");
    setCreating(true);

    try {
      await api.post("/mentor/courses", { title, description });
      setTitle("");
      setDescription("");
      loadCourses();
      setMessage("Course created successfully.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not create course.");
    } finally {
      setCreating(false);
    }
  };

  const addChapter = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setMessage("");
    try {
      await api.post(`/mentor/courses/${selectedCourseId}/chapters`, {
        ...chapterForm,
        sequence: Number(chapterForm.sequence) || 1,
      });

      setChapterForm({
        title: "",
        description: "",
        imageUrl: "",
        videoUrl: "",
        sequence: Number(chapterForm.sequence) + 1,
      });

      setMessage("Chapter added to course.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not add chapter.");
    }
  };

  const assignCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setMessage("");
    try {
      await api.post(`/mentor/courses/${selectedCourseId}/assign`, {
        studentId: assignForm.studentId,
      });

      setAssignForm({ studentId: "" });
      setMessage("Course assigned to student.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not assign course.");
    }
  };

  const totalCourses = courses.length;
  const totalAllocatedStudents = availableStudents.length;
  const activeCourseStudents = enrolledProgress.length;

  const filteredCourses = courses.filter((c) =>
    courseSearch
      ? c.title.toLowerCase().includes(courseSearch.toLowerCase())
      : true
  );

  return (
    <div className="container">
      <div className="card-panel">
        <h2>Mentor workspace</h2>
        <p className="small">
          Create courses, add chapters in order, and assign courses to students.
        </p>

        {(totalCourses > 0 || totalAllocatedStudents > 0) && (
          <section className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Courses you own</div>
              <div className="stat-value">{totalCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Allocated students</div>
              <div className="stat-value">{totalAllocatedStudents}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Students on selected course</div>
              <div className="stat-value">{activeCourseStudents}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Assignable courses</div>
              <div className="stat-value">
                {totalCourses === 0 ? 0 : totalCourses}
              </div>
            </div>
          </section>
        )}

        {message && <div className="banner">{message}</div>}

        <section className="grid-2">
          <div>
            <h3 className="section-title">Create a new course</h3>
            <form className="form-row" onSubmit={createCourse}>
              <label className="small">Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="REST API Internship Bootcamp"
              />

              <label className="small">Short description</label>
              <textarea
                className="input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will students learn in this course?"
              />

              <div className="actions">
                <button className="btn" disabled={creating}>
                  {creating ? "Creating…" : "Create course"}
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className="controls-row" style={{ marginTop: 0 }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                My courses
              </h3>
              <input
                className="input"
                style={{ maxWidth: 240 }}
                placeholder="Search by title…"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
              />
            </div>

            {courses.length === 0 && (
              <p className="small muted">
                You have not published any courses yet. Create one on the left.
              </p>
            )}

            {filteredCourses.map((c) => (
              <div
                key={c._id}
                className={`course-card clickable ${
                  selectedCourseId === c._id ? "active" : ""
                }`}
                onClick={() => selectCourse(c)}
              >
                <h4 className="course-title">{c.title}</h4>
                <p className="small muted">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {selectedCourseId && (
          <section style={{ marginTop: "2rem" }}>
            <h3 className="section-title">
              Manage course: <span style={{ fontWeight: 500 }}>{selectedCourseTitle}</span>
            </h3>
            <p className="small muted">
              Add structured content, assign it to the right students, and keep an eye on
              how they progress.
            </p>
            <div className="grid-2">
              <form className="form-row" onSubmit={addChapter}>
                <h4 className="small-heading">Add chapter</h4>

                <label className="small">Title</label>
                <input
                  className="input"
                  value={chapterForm.title}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Chapter 1 – Getting started"
                />

                <label className="small">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={chapterForm.description}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="What is covered in this chapter?"
                />

                <label className="small">Image URL</label>
                <input
                  className="input"
                  value={chapterForm.imageUrl}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  placeholder="Optional supporting diagram or slide deck"
                />

                <label className="small">Video URL</label>
                <input
                  className="input"
                  value={chapterForm.videoUrl}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, videoUrl: e.target.value }))
                  }
                  placeholder="YouTube / Vimeo / Drive link"
                />

                <label className="small">Sequence number</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={chapterForm.sequence}
                  onChange={(e) =>
                    setChapterForm((f) => ({ ...f, sequence: e.target.value }))
                  }
                />

                <div className="actions">
                  <button className="btn">Add chapter</button>
                </div>
              </form>

              <form className="form-row" onSubmit={assignCourse}>
                <h4 className="small-heading">Assign course to a student</h4>
                <p className="small muted">
                  Choose from the students that an admin has allocated to you.
                </p>

                <label className="small">Student id</label>
                <select
                  className="input"
                  value={assignForm.studentId}
                  onChange={(e) =>
                    setAssignForm({ studentId: e.target.value })
                  }
                >
                  <option value="">Select a student</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>

                <div className="actions">
                  <button
                    className="btn secondary"
                    disabled={!assignForm.studentId || !selectedCourseId}
                  >
                    Assign course
                  </button>
                </div>
              </form>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <div className="controls-row" style={{ marginTop: 0 }}>
                <h3 className="section-title">Student progress for this course</h3>
                <button
                  type="button"
                  className="btn secondary small-btn"
                  onClick={loadChaptersPreview}
                >
                  View chapter outline
                </button>
              </div>

              {chaptersLoading && (
                <p className="small">Loading chapter outline…</p>
              )}

              {chaptersPreview.length > 0 && !chaptersLoading && (
                <div className="table" style={{ marginBottom: "1rem" }}>
                  <div className="table-head">
                    <span>#</span>
                    <span>Chapter</span>
                    <span>Sequence</span>
                    <span />
                    <span />
                  </div>
                  {chaptersPreview.map((ch, idx) => (
                    <div key={ch._id} className="table-row">
                      <span>{idx + 1}</span>
                      <span>{ch.title}</span>
                      <span>{ch.sequence}</span>
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              )}

              <h3 className="section-title">Student progress for this course</h3>
              {loadingProgress && <p className="small">Loading enrolled students…</p>}
              {!loadingProgress && enrolledProgress.length === 0 && (
                <p className="small muted">
                  No students are enrolled yet or no progress has been recorded.
                </p>
              )}

              {enrolledProgress.length > 0 && (
                <div className="table">
                  <div className="table-head">
                    <span>Student</span>
                    <span>Email</span>
                    <span>Completion</span>
                    <span />
                    <span />
                  </div>
                  {enrolledProgress.map((row) => (
                    <div key={row.studentId} className="table-row">
                      <span>{row.name}</span>
                      <span>{row.email}</span>
                      <span>{row.completionPercentage}%</span>
                      <span>
                        <div className="progress-wrap">
                          <div
                            className="progress-bar"
                            style={{ width: `${row.completionPercentage}%` }}
                          />
                        </div>
                      </span>
                      <span />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
