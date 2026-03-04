import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String },
    company: { type: String },
    location: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    duration: { type: String },
    description: [{ type: String }],
  },
  { _id: false },
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String },
    field: { type: String },
    institution: { type: String },
    location: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    gpa: { type: String },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    link: { type: String },
  },
  { _id: false },
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String },
    issuer: { type: String },
    date: { type: String },
  },
  { _id: false },
);

const personalInfoSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
  },
  { _id: false },
);

const parsedDataSchema = new mongoose.Schema(
  {
    personalInfo: { type: personalInfoSchema, default: {} },
    summary: { type: String },
    skills: [{ type: String }],
    totalExperienceYears: { type: Number, default: 0 },
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certifications: [certificationSchema],
    languages: [{ type: String }],
    awards: [{ type: String }],
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx", "txt"],
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },

    rawText: {
      type: String,
      default: null,
    },

    parsedData: {
      type: parsedDataSchema,
      default: {},
    },

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

resumeSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Resume", resumeSchema);
