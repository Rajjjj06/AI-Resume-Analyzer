import { useEffect } from "react";
import { usePayment } from "@/hooks/usePayment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  X,
  Loader2,
  FileText,
  Briefcase,
  MessageSquare,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const tiers = [
  {
    planId: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for trying out ResumeAI",
    features: [
      { text: "5 resume uploads", included: true },
      { text: "5 job descriptions", included: true },
      { text: "5 interview question sets", included: true },
      { text: "Basic ATS scoring", included: true },
      { text: "Resume comparison", included: true },
      { text: "Priority support", included: false },
      { text: "Unlimited uploads", included: false },
    ],
  },
  {
    planId: "pro",
    name: "Pro",
    price: "₹200",
    period: "/month",
    desc: "For active job seekers and freelancers",
    popular: true,
    features: [
      { text: "15 resume uploads", included: true },
      { text: "15 job descriptions", included: true },
      { text: "20 interview question sets", included: true },
      { text: "Advanced ATS scoring", included: true },
      { text: "Resume comparison", included: true },
      { text: "Priority support", included: true },
      { text: "Unlimited uploads", included: false },
    ],
  },
  {
    planId: "pro_plus",
    name: "Pro+",
    price: "₹500",
    period: "/month",
    desc: "Unlimited everything for power users",
    features: [
      { text: "Unlimited resume uploads", included: true },
      { text: "Unlimited job descriptions", included: true },
      { text: "Unlimited interview questions", included: true },
      { text: "Advanced ATS scoring", included: true },
      { text: "Resume comparison", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to features", included: true },
    ],
  },
];

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export default function Subscription() {
  const {
    initiatePayment,
    fetchSubscription,
    cancelSubscription,
    subscription,
    loading,
  } = usePayment();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const currentPlan = subscription?.subscription?.plan || "free";
  const usage = subscription?.usage || {
    resumes_uploaded: 0,
    jobs_uploaded: 0,
    interview_questions_used: 0,
  };
  const limits = subscription?.limits || {
    resumes: 5,
    jobs: 5,
    interview_questions: 5,
  };

  const getUsagePercent = (used: number, limit: number | string) => {
    if (limit === "Unlimited" || limit === Infinity || limit === "Infinity")
      return 0;
    return Math.min((used / Number(limit)) * 100, 100);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return;
    await initiatePayment(planId);
  };

  const getButtonText = (planId: string) => {
    if (planId === currentPlan) return "Current Plan";
    if (planId === "free") return "Free Plan";
    return `Upgrade to ${planLabels[planId] || planId}`;
  };

  const isCurrentPlan = (planId: string) => planId === currentPlan;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your plan, view usage, and upgrade or cancel anytime.
        </p>
      </div>

      {/* Current Plan & Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <Badge
            className={
              currentPlan === "pro_plus"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                : currentPlan === "pro"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }
          >
            {planLabels[currentPlan] || "Free"} Plan
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentPlan !== "free" && subscription?.subscription && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">Expires on</span>
              <span className="font-medium">
                {formatDate(subscription.subscription.expires_at)}
              </span>
            </div>
          )}

          {/* Usage Bars */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Resumes Uploaded
                </span>
                <span className="font-medium">
                  {usage.resumes_uploaded} / {limits.resumes}
                </span>
              </div>
              <Progress
                value={getUsagePercent(usage.resumes_uploaded, limits.resumes)}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Job Descriptions
                </span>
                <span className="font-medium">
                  {usage.jobs_uploaded} / {limits.jobs}
                </span>
              </div>
              <Progress
                value={getUsagePercent(usage.jobs_uploaded, limits.jobs)}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Interview Questions
                </span>
                <span className="font-medium">
                  {usage.interview_questions_used} /{" "}
                  {limits.interview_questions}
                </span>
              </div>
              <Progress
                value={getUsagePercent(
                  usage.interview_questions_used,
                  limits.interview_questions,
                )}
                className="h-2"
              />
            </div>
          </div>

          {/* Cancel Button */}
          {currentPlan !== "free" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={loading}
                >
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Cancel Subscription?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Your plan will be downgraded to Free immediately. Your usage
                    counters will be reset. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={cancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={`relative ${t.popular ? "border-primary shadow-xl scale-[1.03]" : "border-border/50"} ${isCurrentPlan(t.planId) ? "ring-2 ring-primary" : ""}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrentPlan(t.planId) && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Active
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
                <p className="text-4xl font-bold mt-2">
                  {t.price}
                  <span className="text-base text-muted-foreground font-normal">
                    {t.period}
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {t.features.map((f) => (
                    <li
                      key={f.text}
                      className="flex items-center gap-2 text-sm"
                    >
                      {f.included ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span
                        className={f.included ? "" : "text-muted-foreground/60"}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${t.popular && !isCurrentPlan(t.planId) ? "gradient-primary border-0" : ""}`}
                  variant={
                    t.popular && !isCurrentPlan(t.planId)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleUpgrade(t.planId)}
                  disabled={
                    loading || isCurrentPlan(t.planId) || t.planId === "free"
                  }
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {getButtonText(t.planId)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
