import User from "../model/user.model.js";
import PLANS from "../config/plans.js";
import { logger } from "../config/logger.js";
import admin from "../config/firebase.js";
import { generateToken } from "../utils/jwt.js";

export const verifyFirebaseToken = async (req, res) => {
  try {
    const { token: idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, email_verified } = decodedToken;
    let user = await User.findOne({ firebaseId: uid });
    if (!user) {
      user = new User({
        name: name || email?.split("@")[0] || "User",
        email,
        firebaseId: uid,
        photoURL: picture || null,
        emailVerified: email_verified || false,
      });
      await user.save();
    } else {
      // Update user info if changed
      if (picture && user.photoURL !== picture) {
        user.photoURL = picture;
      }
      if (name && user.name !== name) {
        user.name = name;
      }
      if (email_verified !== undefined) {
        user.emailVerified = email_verified;
      }
      await user.save();
    }
    if (user) {
      const token = generateToken({ userId: user._id.toString() });
      const plan = user.subscription?.plan || "free";
      const limits = PLANS[plan]?.limits || PLANS.free.limits;
      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          firebaseId: user.firebaseId,
          subscription: user.subscription || { plan: "free" },
          usage: user.usage || {
            resumes_uploaded: 0,
            jobs_uploaded: 0,
            interview_questions_used: 0,
          },
          limits: {
            resumes: limits.resumes === Infinity ? "Unlimited" : limits.resumes,
            jobs: limits.jobs === Infinity ? "Unlimited" : limits.jobs,
            interview_questions:
              limits.interview_questions === Infinity
                ? "Unlimited"
                : limits.interview_questions,
          },
        },
        data: {
          token,
        },
      });
    }
    logger.info(`User authenticated: ${email}`);
  } catch (error) {
    logger.error("Error verifying Firebase token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    logger.info(`Fetching user data for user: ${req.user.email}`);
    const plan = req.user.subscription?.plan || "free";
    const limits = PLANS[plan]?.limits || PLANS.free.limits;
    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        photoURL: req.user.photoURL,
        emailVerified: req.user.emailVerified,
        createdAt: req.user.createdAt,
        firebaseId: req.user.firebaseId,
        subscription: req.user.subscription || { plan: "free" },
        usage: req.user.usage || {
          resumes_uploaded: 0,
          jobs_uploaded: 0,
          interview_questions_used: 0,
        },
        limits: {
          resumes: limits.resumes === Infinity ? "Unlimited" : limits.resumes,
          jobs: limits.jobs === Infinity ? "Unlimited" : limits.jobs,
          interview_questions:
            limits.interview_questions === Infinity
              ? "Unlimited"
              : limits.interview_questions,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
};
