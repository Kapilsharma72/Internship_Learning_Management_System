const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  title: { type: String, required: true },
  description: { type: String },

  imageUrl: { type: String },
  videoUrl: { type: String },

  sequence: { type: Number, required: true }

}, { timestamps: true });

chapterSchema.index({ course: 1, sequence: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
