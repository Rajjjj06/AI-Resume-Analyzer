import {
  createMatch,
  getMatchById,
  getUserMatches,
  refreshMatch,
  deleteMatch,
  getATSScore,
  getInterviewQuestions,
  getResumeImprovements,
  findMatchingJobs,
} from "../controller/matching.controller.js";

import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { checkUsage } from "../middleware/usage.js";

const router = express.Router();

// Match routes
router.post("/", authMiddleware, createMatch);
router.get("/", authMiddleware, getUserMatches);
router.get("/:id", authMiddleware, getMatchById);
router.delete("/:id", authMiddleware, deleteMatch);
router.post("/:id/refresh", authMiddleware, refreshMatch);

// ATS & Analysis routes
router.post("/ats-score", authMiddleware, getATSScore);
router.post(
  "/:matchId/interview-questions",
  authMiddleware,
  checkUsage("interview_questions"),
  getInterviewQuestions,
);
router.post("/improvements", authMiddleware, getResumeImprovements);
router.post("/find-jobs", authMiddleware, findMatchingJobs);

export default router;
