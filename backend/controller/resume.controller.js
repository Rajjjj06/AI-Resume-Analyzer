import Resume from "../model/resume.model.js";
import Embedding from "../model/embedding.model.js";
import User from "../model/user.model.js";
import { getPresignedUrl, deleteFromS3 } from "../service/signed.js";
import { processResume } from "../service/resume-parser.js";
import {
  storeResumeEmbeddings,
  deleteEmbeddings,
} from "../service/vector.service.js";
import { logger } from "../config/logger.js";

/**
 * Upload resume and trigger parsing
 */
export const uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileType = file.originalname.split(".").pop().toLowerCase();
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not found" });
    }

    const allowedTypes = ["pdf", "doc", "docx", "txt"];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // Create resume with pending status
    const resume = new Resume({
      user: userId,
      fileName: file.originalname,
      fileType,
      s3Key: file.key,
      parsingStatus: "pending",
    });

    await resume.save();

    // Get presigned URL for immediate access
    const presignedUrl = await getPresignedUrl(file.key);

    parseResumeAsync(resume._id, file.key, fileType);

    // Increment resume usage count
    await User.findByIdAndUpdate(userId, {
      $inc: { "usage.resumes_uploaded": 1 },
    });

    res.status(201).json({
      message: "Resume uploaded successfully. Parsing in progress...",
      resume: {
        _id: resume._id,
        fileName: resume.fileName,
        fileType: resume.fileType,
        parsingStatus: resume.parsingStatus,
        createdAt: resume.createdAt,
      },
      presignedUrl,
    });
  } catch (error) {
    logger.error("Error uploading resume:", error);
    res.status(500).json({ error: "Failed to upload resume" });
  }
};

/**
 * Async function to parse resume in background
 */
const parseResumeAsync = async (resumeId, s3Key, fileType) => {
  try {
    // Update status to processing
    await Resume.findByIdAndUpdate(resumeId, {
      parsingStatus: "processing",
    });

    logger.info(`Starting parsing for resume: ${resumeId}`);

    // Process the resume (extract text + parse)
    const { rawText, parsedData } = await processResume(s3Key, fileType);

    // Update resume with parsed data
    const resume = await Resume.findByIdAndUpdate(
      resumeId,
      {
        rawText,
        parsedData,
        parsingStatus: "completed",
        parsingError: null,
      },
      { returnDocument: "after" },
    );

    logger.info(`Resume ${resumeId} parsed successfully`);

    // Generate and store embeddings in ChromaDB
    try {
      logger.info(`Starting embedding generation for resume: ${resumeId}`);

      const chunks = await storeResumeEmbeddings(
        resume.user,
        resumeId,
        parsedData,
      );

      // Save embedding reference in MongoDB
      await Embedding.findOneAndUpdate(
        { sourceType: "resume", sourceId: resumeId },
        {
          sourceType: "resume",
          sourceId: resumeId,
          sourceModel: "Resume",
          user: resume.user,
          chunks: chunks.map((c) => ({
            vectorId: c.vectorId,
            section: c.section,
            content: c.content,
            metadata: c.metadata || {},
          })),
          embeddingModel: "all-MiniLM-L6-v2",
          status: "completed",
          vectorCount: chunks.length,
          error: null,
        },
        { upsert: true, returnDocument: "after" },
      );

      logger.info(
        `Resume ${resumeId} embeddings stored successfully (${chunks.length} chunks)`,
      );
    } catch (embeddingError) {
      // Log embedding error but don't fail the parsing
      logger.error(
        `Error storing embeddings for resume ${resumeId}: ${embeddingError.message}`,
      );

      await Embedding.findOneAndUpdate(
        { sourceType: "resume", sourceId: resumeId },
        {
          sourceType: "resume",
          sourceId: resumeId,
          sourceModel: "Resume",
          user: resume.user,
          status: "failed",
          error: embeddingError.message,
        },
        { upsert: true },
      );
    }
  } catch (error) {
    logger.error(`Error parsing resume ${resumeId}: ${error.message}`);

    // Update with error status
    await Resume.findByIdAndUpdate(resumeId, {
      parsingStatus: "failed",
      parsingError: error.message,
    });
  }
};

/**
 * Manually trigger resume parsing (re-parse)
 */
export const parseResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, user: userId });
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Update status to processing
    resume.parsingStatus = "processing";
    resume.parsingError = null;
    await resume.save();

    // Process the resume
    const { rawText, parsedData } = await processResume(
      resume.s3Key,
      resume.fileType,
    );

    // Update resume with parsed data
    resume.rawText = rawText;
    resume.parsedData = parsedData;
    resume.parsingStatus = "completed";
    await resume.save();

    res.status(200).json({
      message: "Resume parsed successfully",
      parsedData,
    });
  } catch (error) {
    logger.error("Error parsing resume:", error);

    // Update status to failed
    await Resume.findByIdAndUpdate(req.params.id, {
      parsingStatus: "failed",
      parsingError: error.message,
    });

    res.status(500).json({ error: "Failed to parse resume" });
  }
};

/**
 * Get parsing status of a resume
 */
export const getParsingStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, user: userId }).select(
      "parsingStatus parsingError parsedData",
    );

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.status(200).json({
      status: resume.parsingStatus,
      error: resume.parsingError,
      data: resume.parsedData,
    });
  } catch (error) {
    logger.error("Error fetching parsing status:", error);
    res.status(500).json({ error: "Failed to fetch parsing status" });
  }
};

/**
 * Get all resumes for the logged-in user
 */
export const getResumes = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ error: "User not found" });
    }

    const resumes = await Resume.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("-rawText"); // Exclude rawText for list view (large field)

    const resumesWithUrls = await Promise.all(
      resumes.map(async (resume) => ({
        ...resume.toObject(),
        fileUrl: await getPresignedUrl(resume.s3Key),
      })),
    );

    res.status(200).json({ resumes: resumesWithUrls });
  } catch (error) {
    logger.error("Error fetching resumes:", error);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
};

/**
 * Get single resume by ID with full details
 */
export const getResumeById = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ error: "User not found" });
    }

    const resumeId = req.params.id;
    const resume = await Resume.findOne({ _id: resumeId, user: userId });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const fileUrl = await getPresignedUrl(resume.s3Key);

    res.status(200).json({
      ...resume.toObject(),
      fileUrl,
    });
  } catch (error) {
    logger.error("Error fetching resume by ID:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
};

/**
 * Delete a resume
 */
export const deleteResume = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ error: "User not found" });
    }

    const resumeId = req.params.id;
    const resume = await Resume.findOne({ _id: resumeId, user: userId });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Delete from S3
    await deleteFromS3(resume.s3Key);

    // Delete embeddings from ChromaDB
    try {
      await deleteEmbeddings("resumes", resumeId);
      await Embedding.deleteOne({ sourceType: "resume", sourceId: resumeId });
    } catch (embeddingError) {
      logger.warn(
        `Failed to delete embeddings for resume ${resumeId}: ${embeddingError.message}`,
      );
    }

    // Delete from database
    await Resume.deleteOne({ _id: resumeId });

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    logger.error("Error deleting resume:", error);
    res.status(500).json({ error: "Failed to delete resume" });
  }
};

/**
 * Get only parsed data for a resume
 */
export const getParsedData = async (req, res) => {
  try {
    const userId = req.user._id;
    const resumeId = req.params.id;

    const resume = await Resume.findOne({ _id: resumeId, user: userId }).select(
      "parsedData parsingStatus fileName",
    );

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    if (resume.parsingStatus !== "completed") {
      return res.status(400).json({
        error: "Resume parsing not completed",
        status: resume.parsingStatus,
      });
    }

    res.status(200).json({
      fileName: resume.fileName,
      parsedData: resume.parsedData,
    });
  } catch (error) {
    logger.error("Error fetching parsed data:", error);
    res.status(500).json({ error: "Failed to fetch parsed data" });
  }
};
