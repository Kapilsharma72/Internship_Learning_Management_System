const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Assignment = require("../models/Assignment");
const Progress = require("../models/Progress");
const User = require("../models/User");
const MentorStudent = require("../models/MentorStudent");

exports.createCourse = async (req, res) => {
  const course = await Course.create({
    title: req.body.title,
    description: req.body.description,
    mentor: req.user.userId
  });

  res.status(201).json(course);
};

exports.getMyCourses = async (req, res) => {
  const courses = await Course.find({ mentor: req.user.userId });
  res.json(courses);
};

exports.updateCourse = async (req, res) => {
  const { title, description } = req.body;

  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, mentor: req.user.userId },
    { $set: { title, description } },
    { new: true }
  );

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json(course);
};

exports.deleteCourse = async (req, res) => {
  const course = await Course.findOneAndDelete({
    _id: req.params.id,
    mentor: req.user.userId
  });

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  res.json({ message: "Course deleted" });
};

exports.addChapter = async (req, res) => {
  const { title, description, imageUrl, videoUrl, sequence } = req.body;

  const course = await Course.findOne({
    _id: req.params.id,
    mentor: req.user.userId
  });

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  try {
    const chapter = await Chapter.create({
      course: course._id,
      title,
      description,
      imageUrl,
      videoUrl,
      sequence
    });

    res.status(201).json(chapter);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Chapter sequence already exists for this course" });
    }
    throw err;
  }
};

exports.assignCourse = async (req, res) => {
  const { studentId } = req.body;

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const isAllocated = await MentorStudent.findOne({
    mentor: req.user.userId,
    student: studentId
  });

  if (!isAllocated) {
    return res.status(403).json({
      message: "You can assign courses only to students allocated to you by an admin"
    });
  }

  const course = await Course.findOne({
    _id: req.params.id,
    mentor: req.user.userId
  });

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const assignment = await Assignment.findOneAndUpdate(
    { student: studentId, course: course._id },
    { $setOnInsert: { student: studentId, course: course._id } },
    { upsert: true, new: true }
  );

  res.status(201).json(assignment);
};

exports.getMyStudents = async (req, res) => {
  const mappings = await MentorStudent.find({ mentor: req.user.userId }).populate(
    "student",
    "name email"
  );

  const students = mappings.map((m) => ({
    id: m.student._id,
    name: m.student.name,
    email: m.student.email
  }));

  res.json(students);
};

exports.getCourseChapters = async (req, res) => {
  const mentorId = req.user.userId;
  const courseId = req.params.id;

  const course = await Course.findOne({ _id: courseId, mentor: mentorId });
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const chapters = await Chapter.find({ course: courseId }).sort({
    sequence: 1
  });

  res.json(chapters);
};

exports.getCourseProgress = async (req, res) => {
  const mentorId = req.user.userId;
  const courseId = req.params.id;

  const course = await Course.findOne({ _id: courseId, mentor: mentorId });
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  const totalChapters = await Chapter.countDocuments({ course: courseId });
  if (totalChapters === 0) {
    return res.json([]);
  }

  const assignments = await Assignment.find({ course: courseId }).populate(
    "student",
    "name email"
  );

  const progressByStudent = await Progress.aggregate([
    {
      $match: {
        course: course._id
      }
    },
    {
      $group: {
        _id: "$student",
        completedChapters: { $sum: 1 }
      }
    }
  ]);

  const progressMap = new Map();
  progressByStudent.forEach((p) => {
    progressMap.set(String(p._id), p.completedChapters);
  });

  const response = assignments.map((a) => {
    const completed = progressMap.get(String(a.student._id)) || 0;
    const percentage = Math.round((completed / totalChapters) * 100);

    return {
      studentId: a.student._id,
      name: a.student.name,
      email: a.student.email,
      completionPercentage: percentage
    };
  });

  res.json(response);
};
