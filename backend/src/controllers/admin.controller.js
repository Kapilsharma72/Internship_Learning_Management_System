const User = require("../models/User");
const Course = require("../models/Course");
const Certificate = require("../models/Certificate");
const MentorStudent = require("../models/MentorStudent");

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

exports.approveMentor = async (req, res) => {
  const mentor = await User.findById(req.params.id);

  if (!mentor || mentor.role !== "mentor") {
    return res.status(404).json({ message: "Mentor not found" });
  }

  mentor.mentorApproved = true;
  await mentor.save();

  res.json({ message: "Mentor approved" });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

exports.allocateStudentToMentor = async (req, res) => {
  const { studentId } = req.body;
  const mentorId = req.params.mentorId;

  const mentor = await User.findOne({ _id: mentorId, role: "mentor" });
  if (!mentor) {
    return res.status(404).json({ message: "Mentor not found" });
  }

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  await MentorStudent.findOneAndUpdate(
    { mentor: mentorId, student: studentId },
    { mentor: mentorId, student: studentId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ message: "Student allocated to mentor" });
};

exports.getAnalytics = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalMentors = await User.countDocuments({ role: "mentor" });
  const totalAdmins = await User.countDocuments({ role: "admin" });

  const totalCourses = await Course.countDocuments();
  const totalCertificates = await Certificate.countDocuments();

  res.json({
    totalUsers,
    totalStudents,
    totalMentors,
    totalAdmins,
    totalCourses,
    totalCertificates
  });
};
