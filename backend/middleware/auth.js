import { verifyToken } from "../utils/jwt.js";
import User from "../model/user.model.js";
import { logger } from "../config/logger.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization.split(" ")[1];
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = verifyToken(authHeader);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ message: "Unauthorized" });
  }
};
