import mongoose from "mongoose";

// Sub-schemas for parsed data
const experienceYearsSchema = new mongoose.Schema(
  {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
  },
  { _id: false },
);

const salarySchema = new mongoose.Schema(
  {
    min: { type: String, default: null },
    max: { type: String, default: null },
    currency: { type: String, default: null },
  },
  { _id: false },
);

const parsedJobDataSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, default: null },
    company: { type: String, default: null },
    location: { type: String, default: null },
    jobType: { type: String, default: null },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "executive", null],
      default: null,
    },
    experienceYears: { type: experienceYearsSchema, default: {} },
    salary: { type: salarySchema, default: {} },
    skills: [{ type: String }],
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    preferredQualifications: [{ type: String }],
    benefits: [{ type: String }],
    summary: { type: String, default: null },
  },
  { _id: false },
);

const jobDescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    experienceLevel: {
      type: String,
      required: true,
    },
    // Raw text (same as description for now, but can be used for file uploads)
    rawText: {
      type: String,
      default: null,
    },
    // Parsed structured data
    parsedData: {
      type: parsedJobDataSchema,
      default: {},
    },
    // Parsing status
    parsingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    parsingError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
jobDescriptionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("JobDescription", jobDescriptionSchema);
