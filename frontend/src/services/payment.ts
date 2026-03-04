import { api } from "./api";

export interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  plan: string;
  key: string;
}

export interface SubscriptionResponse {
  subscription: {
    plan: string;
    razorpay_payment_id: string | null;
    razorpay_subscription_id: string | null;
    started_at: string | null;
    expires_at: string | null;
  };
  usage: {
    resumes_uploaded: number;
    jobs_uploaded: number;
    interview_questions_used: number;
  };
  limits: {
    resumes: number | string;
    jobs: number | string;
    interview_questions: number | string;
  };
}

export const createOrder = (plan: string) =>
  api.post<OrderResponse>("/api/v1/payment/create-order", { plan });

export const verifyPayment = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: string;
}) =>
  api.post<{ success: boolean; message: string }>(
    "/api/v1/payment/verify-payment",
    data,
  );

export const getSubscription = () =>
  api.get<SubscriptionResponse>("/api/v1/payment/subscription");

export const cancelPlan = () =>
  api.post<{ success: boolean; message: string }>("/api/v1/payment/cancel");
