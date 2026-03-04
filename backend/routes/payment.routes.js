import express from "express";
import {
  createOrder,
  verifyPayment,
  getSubscription,
  cancelSubscription,
} from "../controller/payment.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createOrder);
router.post("/verify-payment", authMiddleware, verifyPayment);
router.get("/subscription", authMiddleware, getSubscription);
router.post("/cancel", authMiddleware, cancelSubscription);

export default router;
