import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/useAuth";
import { usePayment } from "@/hooks/usePayment";
import {
  User,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  FileText,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const planLabels: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    fetchSubscription,
    cancelSubscription,
    subscription,
    loading: paymentLoading,
  } = usePayment();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
    if (limit === "Unlimited") return 0;
    return Math.min(100, Math.round((used / Number(limit)) * 100));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Your account information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user?.photoURL || undefined}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">
                Signed in with Google
              </p>
            </div>
          </div>

          <Separator />

          {/* User Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Full Name
                </Label>
                <p className="font-medium">{user?.name || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Email Address
                </Label>
                <p className="font-medium">{user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Account Created
                </Label>
                <p className="font-medium">{formatDate(user?.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Email Verified
                </Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={user?.emailVerified ? "default" : "secondary"}
                    className={
                      user?.emailVerified
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : ""
                    }
                  >
                    {user?.emailVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Usage Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription & Usage
          </CardTitle>
          <Badge
            variant="default"
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
          {/* Plan Details */}
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

          {/* Upgrade Button */}
          {currentPlan !== "pro_plus" && (
            <Button
              className="w-full gradient-primary border-0"
              onClick={() => navigate("/dashboard/subscription")}
            >
              Upgrade Plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Cancel Subscription */}
          {currentPlan !== "free" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  disabled={paymentLoading}
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
                    {paymentLoading ? (
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

      <Card>
        <CardHeader>
          <CardTitle>Account ID</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm break-all">
            {user?.id || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This is your unique account identifier.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
