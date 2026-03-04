import crypto from "crypto";
import Razorpay from "../config/razorpay.js";
import User from "../model/user.model.js";
import PLANS from "../config/plans.js";
import { logger } from "../config/logger.js";
import dotenv from "dotenv";
dotenv.config();

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    if (plan === "free") {
      return res
        .status(400)
        .json({ message: "Free plan does not require payment" });
    }

    const amount = PLANS[plan].price;

    const options = {
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        plan,
      },
    };

    const order = await Razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating payment order" });
  }
};

// Verify payment and activate subscription
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } =
      req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Activate subscription
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "subscription.plan": plan,
          "subscription.razorpay_payment_id": razorpay_payment_id,
          "subscription.razorpay_subscription_id": razorpay_order_id,
          "subscription.started_at": now,
          "subscription.expires_at": expiresAt,
          // Reset usage on plan upgrade
          "usage.resumes_uploaded": 0,
          "usage.jobs_uploaded": 0,
          "usage.interview_questions_used": 0,
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Subscription activated for user ${userId}: ${plan}`);

    res.json({
      success: true,
      message: "Subscription activated",
      subscription: user.subscription,
      usage: user.usage,
    });
  } catch (error) {
    logger.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

// Cancel subscription — revert to free plan
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentPlan = user.subscription?.plan || "free";
    if (currentPlan === "free") {
      return res
        .status(400)
        .json({ message: "You are already on the free plan" });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        "subscription.plan": "free",
        "subscription.razorpay_payment_id": null,
        "subscription.razorpay_subscription_id": null,
        "subscription.started_at": null,
        "subscription.expires_at": null,
        "usage.resumes_uploaded": 0,
        "usage.jobs_uploaded": 0,
        "usage.interview_questions_used": 0,
      },
    });

    logger.info(`Subscription cancelled for user ${userId}`);

    res.json({
      success: true,
      message: "Subscription cancelled. You are now on the free plan.",
    });
  } catch (error) {
    logger.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "Error cancelling subscription" });
  }
};

// Get current subscription status with usage
export const getSubscription = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = user.subscription?.plan || "free";
    const limits = PLANS[plan]?.limits || PLANS.free.limits;

    res.json({
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
    });
  } catch (error) {
    logger.error("Error fetching subscription details:", error);
    res.status(500).json({ message: "Error fetching subscription details" });
  }
};
