const mongoose = require("mongoose");

const mentorStudentSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

mentorStudentSchema.index(
  { mentor: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model("MentorStudent", mentorStudentSchema);


