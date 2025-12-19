import { useEffect, useState } from "react";
import api from "../services/api";
import { downloadCertificate } from "../services/downloadCertificate";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [chaptersByCourse, setChaptersByCourse] = useState({});
  const [chapterLoading, setChapterLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    api
      .get("/student/progress/my")
      .then((res) => setCourses(res.data))
      .catch(() => setMessage("Failed to load course progress."))
      .finally(() => setLoading(false));
  }, []);

  const toggleCourse = async (courseId) => {
    setMessage("");
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      return;
    }

    // If we do not yet have chapters for this course, load them from the API.
    if (!chaptersByCourse[courseId]) {
      setChapterLoading(true);
      try {
        const res = await api.get(`/student/courses/${courseId}/chapters`);
        setChaptersByCourse((prev) => ({ ...prev, [courseId]: res.data }));
      } catch (err) {
        setMessage(
          err?.response?.data?.message || "Could not load chapters for this course."
        );
      } finally {
        setChapterLoading(false);
      }
    }

    setActiveCourseId(courseId);
  };

  const completeChapter = async (courseId, chapterId) => {
    setMessage("");
    try {
      await api.post(`/student/progress/${chapterId}/complete`);

      // Refresh progress percentage
      const progressRes = await api.get("/student/progress/my");
      setCourses(progressRes.data);

      // Refresh chapter lock state for this course
      const chaptersRes = await api.get(`/student/courses/${courseId}/chapters`);
      setChaptersByCourse((prev) => ({ ...prev, [courseId]: chaptersRes.data }));

      setMessage("Chapter marked as completed.");
    } catch (err) {
      setMessage(
        err?.response?.data?.message ||
          "Could not complete this chapter. Check prerequisites."
      );
    }
  };

  const totalCourses = courses.length;
  const completedCourses = courses.filter(
    (c) => c.completionPercentage === 100
  ).length;
  const activeCourses = courses.filter(
    (c) => c.completionPercentage > 0 && c.completionPercentage < 100
  ).length;
  const overallCompletion =
    totalCourses === 0
      ? 0
      : Math.round(
          courses.reduce(
            (sum, c) => sum + (c.completionPercentage || 0),
            0
          ) / totalCourses
        );

  const nextCourseToContinue =
    courses.find((c) => c.completionPercentage > 0 && c.completionPercentage < 100) ||
    courses.find((c) => c.completionPercentage === 0);

  const filteredCourses = courses.filter((course) => {
    const bySearch =
      !search ||
      course.title.toLowerCase().includes(search.toLowerCase());

    let byStatus = true;
    if (statusFilter === "inprogress") {
      byStatus =
        course.completionPercentage > 0 &&
        course.completionPercentage < 100;
    } else if (statusFilter === "completed") {
      byStatus = course.completionPercentage === 100;
    }

    return bySearch && byStatus;
  });

  return (
    <div className="container">
      <div className="card-panel">
        <h2>My Courses</h2>
        <p className="small">
          Work through chapters in order. Certificates unlock automatically at 100%
          completion.
        </p>

        {!loading && totalCourses > 0 && (
          <section className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Total courses</div>
              <div className="stat-value">{totalCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In progress</div>
              <div className="stat-value">{activeCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{completedCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overall completion</div>
              <div className="stat-value">{overallCompletion}%</div>
            </div>
          </section>
        )}

        {!loading && nextCourseToContinue && (
          <section className="continue-card">
            <div>
              <div className="small muted">Continue where you left off</div>
              <div className="continue-title">{nextCourseToContinue.title}</div>
              <div className="small muted">
                {nextCourseToContinue.completionPercentage === 0
                  ? "Not started yet"
                  : `You are ${nextCourseToContinue.completionPercentage}% done`}
              </div>
            </div>
            <button
              className="btn small-btn"
              onClick={() => toggleCourse(nextCourseToContinue.courseId)}
            >
              Open course
            </button>
          </section>
        )}

        {message && <div className="banner">{message}</div>}

        {loading && <p className="small">Loading your progress…</p>}

        {!loading && courses.length === 0 && (
          <div className="small muted">You currently have no assigned courses.</div>
        )}

        {!loading && courses.length > 0 && (
          <section className="controls-row">
            <div className="controls-left">
              <input
                className="input"
                placeholder="Search courses by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="controls-right">
              <button
                type="button"
                className={`chip ${statusFilter === "all" ? "chip-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`chip ${
                  statusFilter === "inprogress" ? "chip-active" : ""
                }`}
                onClick={() => setStatusFilter("inprogress")}
              >
                In progress
              </button>
              <button
                type="button"
                className={`chip ${
                  statusFilter === "completed" ? "chip-active" : ""
                }`}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </button>
            </div>
          </section>
        )}

        {filteredCourses.map((course) => {
          const isActive = activeCourseId === course.courseId;
          const chapters = chaptersByCourse[course.courseId] || [];

          return (
            <div key={course.courseId} className="course-card">
              <div className="course-card-header" onClick={() => toggleCourse(course.courseId)}>
                <div>
                  <h4 className="course-title">{course.title}</h4>
                  <div className="small muted">
                    Progress: {course.completionPercentage}%
                  </div>
                </div>

                <div className="course-header-right">
                  <div className="progress-wrap" aria-hidden>
                    <div
                      className="progress-bar"
                      style={{ width: `${course.completionPercentage}%` }}
                    />
                  </div>
                  <span className="chevron">{isActive ? "▴" : "▾"}</span>
                </div>
              </div>

              {isActive && (
                <div className="course-body">
                  {chapterLoading && chapters.length === 0 && (
                    <p className="small">Loading chapters…</p>
                  )}

                  {chapters.length === 0 && !chapterLoading && (
                    <p className="small muted">
                      No chapters have been published for this course yet.
                    </p>
                  )}

                  {chapters.map((ch, index) => (
                    <div key={ch._id} className="chapter-row">
                      <div className="chapter-main">
                        <div className="chapter-index">{index + 1}</div>
                        <div>
                          <div className="chapter-title">{ch.title}</div>
                          {ch.description && (
                            <div className="small muted">{ch.description}</div>
                          )}

                          {(ch.imageUrl || ch.videoUrl) && (
                            <div className="chapter-links">
                              {ch.imageUrl && (
                                <a
                                  href={ch.imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="small"
                                >
                                  View image
                                </a>
                              )}
                              {ch.videoUrl && (
                                <a
                                  href={ch.videoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="small"
                                >
                                  Watch video
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          className="btn small-btn"
                          disabled={ch.locked || ch.completed}
                          onClick={() => completeChapter(course.courseId, ch._id)}
                        >
                          {ch.completed
                            ? "Completed"
                            : ch.locked
                            ? "Locked"
                            : "Mark complete"}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="actions">
                    <button
                      className="btn"
                      disabled={course.completionPercentage < 100}
                      onClick={() => downloadCertificate(course.courseId)}
                    >
                      {course.completionPercentage === 100
                        ? "Download Certificate"
                        : "Certificate locked until 100%"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
