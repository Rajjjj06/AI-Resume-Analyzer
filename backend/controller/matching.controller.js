import * as matchingService from "../service/matching.service.js";
import { generateInterviewQuestions } from "../service/matching.service.js";
import * as atsService from "../service/ats.service.js";
import User from "../model/user.model.js";
import { logger } from "../config/logger.js";

export const createMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { resumeId, jobId } = req.body;
    if (!userId || !resumeId || !jobId) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const match = await matchingService.matchResumeWithJob(
      userId,
      resumeId,
      jobId,
    );
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const matches = await matchingService.getUserMatches(userId);
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await matchingService.getMatchById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }
    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const matchId = req.params.id;
    const deleteMatch = await matchingService.deleteMatch(matchId, userId);
    if (!deleteMatch) {
      return res
        .status(404)
        .json({ message: "Match not found or unauthorized" });
    }
    res.status(200).json({ message: "Match deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    await matchingService.deleteMatch(id, userId);
    const { resumeId, jobId } = req.body;
    const newMatch = await matchingService.matchResumeWithJob(
      userId,
      resumeId,
      jobId,
    );
    res.status(200).json(newMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Calculate ATS score for a resume
 */
export const getATSScore = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: "Resume ID is required" });
    }

    logger.info(
      `Calculating ATS score for resume ${resumeId}${jobId ? ` against job ${jobId}` : ""}`,
    );

    const atsScore = await atsService.calculateATSScore(
      resumeId,
      jobId || null,
    );

    res.status(200).json({
      success: true,
      resumeId,
      jobId: jobId || null,
      atsScore,
    });
  } catch (error) {
    logger.error(`ATS score calculation error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Generate interview questions based on resume and job
 */
export const getInterviewQuestions = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { difficulty = "medium", numberOfQuestions = 10 } = req.body;

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty. Must be easy, medium, or hard",
      });
    }

    // Validate number of questions
    let questionsCount = Math.min(
      Math.max(parseInt(numberOfQuestions) || 10, 1),
      20,
    );

    // Cap to remaining plan quota
    const user = req.user;
    const plan = user.subscription?.plan || "free";
    const planLimits = (await import("../config/plans.js")).default;
    const planLimit = planLimits[plan]?.limits?.interview_questions ?? 5;
    if (planLimit !== Infinity) {
      const used = user.usage?.interview_questions_used || 0;
      const remaining = Math.max(planLimit - used, 0);
      questionsCount = Math.min(questionsCount, remaining);
      if (questionsCount <= 0) {
        return res.status(403).json({
          success: false,
          message: `You have reached your interview question limit (${planLimit}). Please upgrade your plan.`,
        });
      }
    }

    const result = await generateInterviewQuestions(
      matchId,
      difficulty,
      questionsCount,
    );

    // Increment interview questions usage count by number generated
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { "usage.interview_questions_used": questionsCount },
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate interview questions",
    });
  }
};

/**
 * Get resume improvement suggestions
 */
export const getResumeImprovements = async (req, res) => {
  try {
    const { resumeId, jobId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: "Resume ID is required" });
    }

    logger.info(
      `Generating improvements for resume ${resumeId}${jobId ? ` targeting job ${jobId}` : ""}`,
    );

    const improvements = await atsService.generateResumeImprovements(
      resumeId,
      jobId || null,
    );

    res.status(200).json({
      success: true,
      resumeId,
      jobId: jobId || null,
      improvements,
    });
  } catch (error) {
    logger.error(`Resume improvements generation error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Find best matching jobs for a resume
 */
export const findMatchingJobs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { resumeId, limit } = req.body;

    if (!resumeId) {
      return res.status(400).json({ message: "Resume ID is required" });
    }

    logger.info(`Finding matching jobs for resume ${resumeId}`);

    const matchingJobs = await atsService.findMatchingJobs(
      userId,
      resumeId,
      limit || 5,
    );

    res.status(200).json({
      success: true,
      resumeId,
      matches: matchingJobs,
    });
  } catch (error) {
    logger.error(`Find matching jobs error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
