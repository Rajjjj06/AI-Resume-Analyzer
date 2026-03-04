import express from "express";
import {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
  parseResume,
  getParsingStatus,
  getParsedData,
} from "../controller/resume.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkUsage } from "../middleware/usage.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Upload resume (auto-triggers parsing) — usage-checked
router.post(
  "/upload",
  authMiddleware,
  checkUsage("resume"),
  upload.single("resume"),
  uploadResume,
);

// Get all resumes
router.get("/", authMiddleware, getResumes);

// Get single resume with full details
router.get("/:id", authMiddleware, getResumeById);

// Delete resume
router.delete("/:id", authMiddleware, deleteResume);

// Manually trigger parsing (re-parse)
router.post("/:id/parse", authMiddleware, parseResume);

// Get parsing status
router.get("/:id/status", authMiddleware, getParsingStatus);

// Get only parsed data
router.get("/:id/parsed", authMiddleware, getParsedData);

export default router;
