const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Progress = require("../models/Progress");

exports.getCourseChapters = async (req, res) => {
  const studentId = req.user.userId;
  const courseId = req.params.courseId;

  const assigned = await Assignment.findOne({
    student: studentId,
    course: courseId
  });

  if (!assigned) {
    return res.status(403).json({ message: "Course not assigned" });
  }

  const chapters = await Chapter.find({ course: courseId })
    .sort({ sequence: 1 });

  const completed = await Progress.find({
    student: studentId,
    course: courseId
  });

  const completedIds = completed.map(p => p.chapter.toString());

  const response = chapters.map((ch, index) => ({
    _id: ch._id,
    title: ch.title,
    description: ch.description,
    imageUrl: ch.imageUrl,
    videoUrl: ch.videoUrl,
    completed: completedIds.includes(ch._id.toString()),
    locked:
      index > 0 && !completedIds.includes(chapters[index - 1]._id.toString())
  }));

  res.json(response);
};

exports.completeChapter = async (req, res) => {
  const studentId = req.user.userId;
  const chapterId = req.params.chapterId;

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found" });
  }

  // Check course assignment
  const assigned = await Assignment.findOne({
    student: studentId,
    course: chapter.course
  });

  if (!assigned) {
    return res.status(403).json({ message: "Course not assigned" });
  }

  // Fetch all chapters of the course in order
  const chapters = await Chapter.find({ course: chapter.course })
    .sort({ sequence: 1 });

  const currentIndex = chapters.findIndex(
    ch => ch._id.toString() === chapterId
  );

  if (currentIndex === -1) {
    return res.status(400).json({ message: "Invalid chapter" });
  }

  // Check previous chapter completion
  if (currentIndex > 0) {
    const previousChapter = chapters[currentIndex - 1];

    const previousCompleted = await Progress.findOne({
      student: studentId,
      chapter: previousChapter._id
    });

    if (!previousCompleted) {
      return res.status(400).json({
        message: "Previous chapter not completed"
      });
    }
  }

  // Mark current chapter as completed
  try {
    await Progress.findOneAndUpdate(
      { student: studentId, course: chapter.course, chapter: chapterId },
      { $setOnInsert: { completedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ message: "Chapter completed" });
  } catch (err) {
    // If a unique-index duplicate slips through due to race conditions, treat it as already completed.
    if (err && err.code === 11000) {
      return res.json({ message: "Chapter already completed" });
    }
    throw err;
  }
};

exports.getMyProgress = async (req, res) => {
  const studentId = req.user.userId;

  const assignments = await Assignment.find({ student: studentId })
    .populate("course");

  const result = [];

  for (const assign of assignments) {
    const totalChapters = await Chapter.countDocuments({
      course: assign.course._id
    });

    const completedChapters = await Progress.countDocuments({
      student: studentId,
      course: assign.course._id
    });

    const percentage =
      totalChapters === 0
        ? 0
        : Math.round((completedChapters / totalChapters) * 100);

    result.push({
      courseId: assign.course._id,
      title: assign.course.title,
      completionPercentage: percentage
    });
  }

  res.json(result);
};
