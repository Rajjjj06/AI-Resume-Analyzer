import JobDescription from "../model/job-description.model.js";
import Embedding from "../model/embedding.model.js";
import User from "../model/user.model.js";
import { processJobDescription } from "../service/job-description-parser.js";
import {
  storeJobEmbeddings,
  deleteEmbeddings,
} from "../service/vector.service.js";
import { logger } from "../config/logger.js";

/**
 * Create job description and trigger parsing
 */
export const createJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, experienceLevel } = req.body;

    if (!userId || !title || !description || !experienceLevel) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create job description with pending status
    const jobDescription = new JobDescription({
      user: userId,
      title,
      description,
      experienceLevel,
      rawText: description,
      parsingStatus: "pending",
    });

    await jobDescription.save();
    logger.info(`Job description created for user ${userId}`);

    // Increment job usage count
    await User.findByIdAndUpdate(userId, {
      $inc: { "usage.jobs_uploaded": 1 },
    });

    // Start async parsing
    parseJobDescriptionAsync(jobDescription._id, description, title);

    res.status(201).json({
      message: "Job description created successfully. Parsing in progress...",
      jobDescription,
    });
  } catch (error) {
    logger.error(`Error creating job description: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Async function to parse job description in background
 */
const parseJobDescriptionAsync = async (jobId, rawText, title) => {
  try {
    // Update status to processing
    await JobDescription.findByIdAndUpdate(jobId, {
      parsingStatus: "processing",
    });

    logger.info(`Starting parsing for job description: ${jobId}`);

    // Process the job description
    const { parsedData } = await processJobDescription(rawText, title);

    // Update with parsed data
    const job = await JobDescription.findByIdAndUpdate(
      jobId,
      {
        parsedData,
        parsingStatus: "completed",
        parsingError: null,
      },
      { returnDocument: "after" },
    );

    logger.info(`Job description ${jobId} parsed successfully`);

    // Generate and store embeddings in ChromaDB
    try {
      logger.info(`Starting embedding generation for job: ${jobId}`);

      const chunks = await storeJobEmbeddings(
        job.user,
        jobId,
        parsedData,
        title,
      );

      // Save embedding reference in MongoDB
      await Embedding.findOneAndUpdate(
        { sourceType: "job", sourceId: jobId },
        {
          sourceType: "job",
          sourceId: jobId,
          sourceModel: "JobDescription",
          user: job.user,
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
        `Job ${jobId} embeddings stored successfully (${chunks.length} chunks)`,
      );
    } catch (embeddingError) {
      // Log embedding error but don't fail the parsing
      logger.error(
        `Error storing embeddings for job ${jobId}: ${embeddingError.message}`,
      );

      await Embedding.findOneAndUpdate(
        { sourceType: "job", sourceId: jobId },
        {
          sourceType: "job",
          sourceId: jobId,
          sourceModel: "JobDescription",
          user: job.user,
          status: "failed",
          error: embeddingError.message,
        },
        { upsert: true },
      );
    }
  } catch (error) {
    logger.error(`Error parsing job description ${jobId}: ${error.message}`);

    await JobDescription.findByIdAndUpdate(jobId, {
      parsingStatus: "failed",
      parsingError: error.message,
    });
  }
};

/**
 * Manually trigger job description parsing (re-parse)
 */
export const parseJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    const jobDescription = await JobDescription.findOne({
      _id: jobId,
      user: userId,
    });

    if (!jobDescription) {
      return res.status(404).json({ message: "Job description not found" });
    }

    // Update status to processing
    jobDescription.parsingStatus = "processing";
    jobDescription.parsingError = null;
    await jobDescription.save();

    // Process the job description
    const { parsedData } = await processJobDescription(
      jobDescription.description,
      jobDescription.title,
    );

    // Update with parsed data
    jobDescription.parsedData = parsedData;
    jobDescription.parsingStatus = "completed";
    await jobDescription.save();

    res.status(200).json({
      message: "Job description parsed successfully",
      parsedData,
    });
  } catch (error) {
    logger.error(`Error parsing job description: ${error.message}`);

    await JobDescription.findByIdAndUpdate(req.params.id, {
      parsingStatus: "failed",
      parsingError: error.message,
    });

    res.status(500).json({ message: "Failed to parse job description" });
  }
};

/**
 * Get parsing status of a job description
 */
export const getParsingStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    const jobDescription = await JobDescription.findOne({
      _id: jobId,
      user: userId,
    }).select("parsingStatus parsingError parsedData");

    if (!jobDescription) {
      return res.status(404).json({ message: "Job description not found" });
    }

    res.status(200).json({
      status: jobDescription.parsingStatus,
      error: jobDescription.parsingError,
      data: jobDescription.parsedData,
    });
  } catch (error) {
    logger.error(`Error fetching parsing status: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get only parsed data for a job description
 */
export const getParsedData = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.id;

    const jobDescription = await JobDescription.findOne({
      _id: jobId,
      user: userId,
    }).select("parsedData parsingStatus title");

    if (!jobDescription) {
      return res.status(404).json({ message: "Job description not found" });
    }

    if (jobDescription.parsingStatus !== "completed") {
      return res.status(400).json({
        message: "Job description parsing not completed",
        status: jobDescription.parsingStatus,
      });
    }

    res.status(200).json({
      title: jobDescription.title,
      parsedData: jobDescription.parsedData,
    });
  } catch (error) {
    logger.error(`Error fetching parsed data: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllJobDescriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "Missing user ID" });
    }

    const jobDescriptions = await JobDescription.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ jobDescriptions });
  } catch (error) {
    logger.error(`Error fetching job descriptions: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const getJobDescriptionById = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobDescriptionId = req.params.id;
    if (!userId || !jobDescriptionId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const jobDescription = await JobDescription.findOne({
      _id: jobDescriptionId,
      user: userId,
    });
    return res.status(200).json({ jobDescription });
  } catch (error) {
    logger.error(`Error fetching job description by ID: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteJobDescription = async (req, res) => {
  try {
    const userId = req.user._id;
    const jobDescriptionId = req.params.id;

    if (!userId || !jobDescriptionId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const jobDescription = await JobDescription.findOneAndDelete({
      _id: jobDescriptionId,
      user: userId,
    });
    if (!jobDescription) {
      return res.status(404).json({ message: "Job description not found" });
    }

    // Delete embeddings from ChromaDB
    try {
      await deleteEmbeddings("jobs", jobDescriptionId);
      await Embedding.deleteOne({
        sourceType: "job",
        sourceId: jobDescriptionId,
      });
    } catch (embeddingError) {
      logger.warn(
        `Failed to delete embeddings for job ${jobDescriptionId}: ${embeddingError.message}`,
      );
    }

    return res
      .status(200)
      .json({ message: "Job description deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting job description: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};

export const jobExperienceLevels = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({ message: "Missing user ID" });
    }
    const filter = { user: userId };
    const experienceLevels = await JobDescription.distinct(
      "experienceLevel",
      filter,
    );
    res.status(200).json({ experienceLevels });
  } catch (error) {
    logger.error(`Error fetching job experience levels: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
};
