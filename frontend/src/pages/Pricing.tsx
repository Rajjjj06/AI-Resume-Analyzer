import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function Pricing() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = async () => {
    if (user) {
      navigate("/dashboard/subscription");
    } else {
      await signInWithGoogle();
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, <span className="gradient-text">transparent</span> pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          No hidden fees. Start free, upgrade when you need more.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={`relative ${t.popular ? "border-primary shadow-xl scale-[1.03]" : "border-border/50"}`}
          >
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
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
                  <li key={f.text} className="flex items-center gap-2 text-sm">
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
                className={`w-full ${t.popular ? "gradient-primary border-0" : ""}`}
                variant={t.popular ? "default" : "outline"}
                onClick={handlePlanClick}
                disabled={authLoading}
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
