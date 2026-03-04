import { morganMessage } from "../config/logger.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import connectDb from "../config/db.js";
import userRoutes from "../routes/user.routes.js";
import resumeRoutes from "../routes/resume.routes.js";
import jobDescriptionRoutes from "../routes/job-description.routes.js";
import matchingRoutes from "../routes/matching.routes.js";
import paymentRoutes from "../routes/payment.routes.js";
connectDb();

const app = express();

app.use(express.json());

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan("combined", { stream: { write: morganMessage } }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", userRoutes);
app.use("/api/v1/resume", resumeRoutes);
app.use("/api/v1/job-description", jobDescriptionRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/payment", paymentRoutes);

export default app;
