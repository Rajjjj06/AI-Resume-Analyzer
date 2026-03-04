import { useState, useCallback } from "react";
import {
  createOrder,
  verifyPayment,
  getSubscription,
  cancelPlan,
} from "@/services/payment";
import type { SubscriptionResponse } from "@/services/payment";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(
    null,
  );

  /** Dynamically load the Razorpay checkout script if not already loaded */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /** Open Razorpay checkout for a given plan */
  const initiatePayment = async (plan: string) => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Error",
          description:
            "Failed to load payment gateway. Please check your connection.",
          variant: "destructive",
        });
        return;
      }

      const { data: order } = await createOrder(plan);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "ResumeAI",
        description: `${plan.replace("_", " ").toUpperCase()} Plan`,
        order_id: order.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const { data: result } = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            });

            if (result.success) {
              toast({
                title: "Success!",
                description: "Your subscription has been activated.",
              });
              await fetchSubscription();
            }
          } catch {
            toast({
              title: "Verification Failed",
              description:
                "Payment verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      });
      rzp.open();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to initiate payment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Fetch latest subscription status from backend */
  const fetchSubscription = useCallback(async () => {
    try {
      const { data } = await getSubscription();
      setSubscription(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  /** Cancel the current subscription and revert to free */
  const cancelSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await cancelPlan();
      if (data.success) {
        toast({
          title: "Subscription Cancelled",
          description: "You are now on the free plan.",
        });
        await fetchSubscription();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to cancel subscription.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    fetchSubscription,
    cancelSubscription,
    subscription,
    loading,
  };
}
