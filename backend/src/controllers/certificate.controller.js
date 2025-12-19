const PDFDocument = require("pdfkit");
const Course = require("../models/Course");
const Chapter = require("../models/Chapter");
const Progress = require("../models/Progress");
const Certificate = require("../models/Certificate");
const User = require("../models/User");

exports.downloadCertificate = async (req, res) => {
  const studentId = req.user.userId;
  const courseId = req.params.courseId;

  const totalChapters = await Chapter.countDocuments({ course: courseId });
  const completedChapters = await Progress.countDocuments({
    student: studentId,
    course: courseId
  });

  if (totalChapters === 0 || completedChapters !== totalChapters) {
    return res.status(403).json({
      message: "Course not fully completed"
    });
  }

  let certificate = await Certificate.findOne({
    student: studentId,
    course: courseId
  });

  if (!certificate) {
    certificate = await Certificate.create({
      student: studentId,
      course: courseId
    });
  }

  const course = await Course.findById(courseId).populate("mentor");
  const student = await User.findById(studentId);

  const issuedDate = new Date(certificate.issuedAt);
  const certificateId = certificate._id.toString().slice(-8).toUpperCase();

  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=certificate-${course.title}.pdf`
  );

  doc.pipe(res);

  // Simple border
  doc
    .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .stroke("#e5e7eb");

  // Header
  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text("Internship Learning Management System", { align: "right" });

  doc.moveDown(2);

  // Title
  doc
    .fontSize(28)
    .fillColor("#111827")
    .text("Certificate of Completion", { align: "center" });

  doc.moveDown(1.5);

  // Recipient line
  const studentName = student?.name || "Student";
  doc
    .fontSize(12)
    .fillColor("#6b7280")
    .text("This certificate is proudly presented to", {
      align: "center"
    });

  doc.moveDown(0.7);

  doc
    .fontSize(20)
    .fillColor("#111827")
    .text(studentName, { align: "center" });

  doc.moveDown(1.2);

  // Course + description
  doc
    .fontSize(12)
    .fillColor("#4b5563")
    .text(
      "for successfully completing the internship learning programme",
      { align: "center" }
    );

  doc.moveDown(0.8);

  doc
    .fontSize(16)
    .fillColor("#111827")
    .text(`“${course.title}”`, { align: "center" });

  doc.moveDown(2);

  // Details row
  const leftX = 80;
  const rightX = doc.page.width - 80;

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(`Course mentor: ${course.mentor?.name || "N/A"}`, leftX, doc.y, {
      align: "left"
    });

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .fillColor("#374151")
    .text(`Date of completion: ${issuedDate.toDateString()}`, leftX, doc.y, {
      align: "left"
    });

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text(`Certificate ID: ${certificateId}`, leftX, doc.y, {
      align: "left"
    });

  // Signatures
  const signatureBaseY = doc.page.height - 170;

  doc
    .moveTo(leftX, signatureBaseY)
    .lineTo(leftX + 160, signatureBaseY)
    .stroke("#d1d5db");

  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text("Mentor signature", leftX, signatureBaseY + 5, {
      width: 160,
      align: "center"
    });

  doc
    .moveTo(rightX - 160, signatureBaseY)
    .lineTo(rightX, signatureBaseY)
    .stroke("#d1d5db");

  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text("Admin signature", rightX - 160, signatureBaseY + 5, {
      width: 160,
      align: "center"
    });

  doc.end();
};
