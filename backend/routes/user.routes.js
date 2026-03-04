import { verifyFirebaseToken, getUser } from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import express from "express";

const router = express.Router();

router.post("/auth/signin", verifyFirebaseToken);
router.get("/me", authMiddleware, getUser);

export default router;
