import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    vectorId: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const embeddingSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ["resume", "job"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sourceModel",
    },
    sourceModel: {
      type: String,
      enum: ["Resume", "JobDescription"],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Chunked content stored in vector database
    chunks: [chunkSchema],
    // Embedding model used
    embeddingModel: {
      type: String,
      default: "all-MiniLM-L6-v2",
    },
    // Embedding status
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    error: {
      type: String,
      default: null,
    },
    // Number of vectors stored
    vectorCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Compound index to ensure one embedding record per source document
embeddingSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });
embeddingSchema.index({ user: 1 });
embeddingSchema.index({ status: 1 });

export default mongoose.model("Embedding", embeddingSchema);
