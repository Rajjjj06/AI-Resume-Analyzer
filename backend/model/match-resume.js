import mongoose from "mongoose";

const matchResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobDescription",
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    experienceMatch: {
      type: Boolean,
      default: false,
    },
    educationMatch: {
      type: Boolean,
      default: false,
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

matchResumeSchema.index({ resume: 1, jobDescription: 1 }, { unique: true });
matchResumeSchema.index({ user: 1 });

export default mongoose.model("MatchResume", matchResumeSchema);
