import express from "express";
import {
  createJobDescription,
  getAllJobDescriptions,
  getJobDescriptionById,
  deleteJobDescription,
  jobExperienceLevels,
  parseJobDescription,
  getParsingStatus,
  getParsedData,
} from "../controller/job-description.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkUsage } from "../middleware/usage.js";

const router = express.Router();

// Create job description (auto-triggers parsing) — usage-checked
router.post("/job", authMiddleware, checkUsage("job"), createJobDescription);

// Get all job descriptions
router.get("/jobs", authMiddleware, getAllJobDescriptions);

// Get experience levels
router.get("/experience-levels", authMiddleware, jobExperienceLevels);

// Get single job description
router.get("/job/:id", authMiddleware, getJobDescriptionById);

// Delete job description
router.delete("/job/:id", authMiddleware, deleteJobDescription);

// Manually trigger parsing (re-parse)
router.post("/job/:id/parse", authMiddleware, parseJobDescription);

// Get parsing status
router.get("/job/:id/status", authMiddleware, getParsingStatus);

// Get only parsed data
router.get("/job/:id/parsed", authMiddleware, getParsedData);

export default router;
