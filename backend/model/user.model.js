import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firebaseId: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
    default: null,
  },
  emailVerified: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subscription: {
    plan: {
      type: String,
      enum: ["free", "pro", "pro_plus"],
      default: "free",
    },
    razorpay_subscription_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    started_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
  },
  usage: {
    resumes_uploaded: { type: Number, default: 0 },
    jobs_uploaded: { type: Number, default: 0 },
    interview_questions_used: { type: Number, default: 0 },
  },
});

export default mongoose.model("User", userSchema);
