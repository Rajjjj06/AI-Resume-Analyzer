import User from "../model/user.model.js";
import PLANS from "../config/plans.js";
import { logger } from "../config/logger.js";

export const checkUsage = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user; // already loaded by authMiddleware
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const plan = user.subscription?.plan || "free";
      let limits = PLANS[plan]?.limits || PLANS.free.limits;

      // Check if paid subscription has expired
      if (plan !== "free" && user.subscription?.expires_at) {
        if (new Date() > new Date(user.subscription.expires_at)) {
          user.subscription.plan = "free";
          await user.save();
          limits = PLANS.free.limits;
          logger.info(
            `User ${user._id} subscription expired, downgraded to free`,
          );
        }
      }

      return checkLimit(user, resourceType, limits, res, next);
    } catch (error) {
      logger.error("Error checking usage limits:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};

function checkLimit(user, resourceType, limits, res, next) {
  let currentUsage, limit, label;

  switch (resourceType) {
    case "resume":
      currentUsage = user.usage?.resumes_uploaded || 0;
      limit = limits.resumes;
      label = "resume uploads";
      break;
    case "job":
      currentUsage = user.usage?.jobs_uploaded || 0;
      limit = limits.jobs;
      label = "job description uploads";
      break;
    case "interview_questions":
      currentUsage = user.usage?.interview_questions_used || 0;
      limit = limits.interview_questions;
      label = "interview question generations";
      break;
    default:
      return res.status(400).json({ message: "Invalid resource type" });
  }

  if (limit !== Infinity && currentUsage >= limit) {
    return res.status(403).json({
      message: `You have reached your ${label} limit (${limit}). Please upgrade your plan.`,
      currentUsage,
      limit,
      plan: user.subscription?.plan || "free",
    });
  }

  next();
}
