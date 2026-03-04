import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileSearch,
  Target,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Resume Parsing",
    desc: "Extract structured data from any resume format with AI-powered parsing.",
  },
  {
    icon: BarChart3,
    title: "ATS Scoring",
    desc: "Get instant ATS compatibility scores with actionable improvement tips.",
  },
  {
    icon: Target,
    title: "JD Matching",
    desc: "Compare resumes against job descriptions to find the perfect match.",
  },
  {
    icon: MessageSquare,
    title: "Interview Questions",
    desc: "Generate role-specific interview questions with STAR-method tips.",
  },
  {
    icon: TrendingUp,
    title: "Skill Gap Analysis",
    desc: "Identify missing skills and get recommendations for upskilling.",
  },
  {
    icon: Zap,
    title: "Smart Suggestions",
    desc: "AI-powered rewrite suggestions to strengthen every section of your resume.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    text: "ResumeAI helped me increase my ATS score from 45% to 92%. Got 3x more callbacks!",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "Product Manager",
    text: "The JD matching feature is incredible. I can tailor my resume in minutes.",
    avatar: "MJ",
  },
  {
    name: "Priya Patel",
    role: "HR Director",
    text: "We use ResumeAI to screen 500+ resumes weekly. It's a game changer.",
    avatar: "PP",
  },
];

const tiers = [
  {
    name: "Free",
    price: "₹0",
    features: [
      "5 resume uploads",
      "5 job descriptions",
      "5 interview question sets",
      "Basic ATS score",
    ],
  },
  {
    name: "Pro",
    price: "₹200",
    features: [
      "15 resume uploads",
      "15 job descriptions",
      "20 interview question sets",
      "Advanced ATS scoring",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Pro+",
    price: "₹500",
    features: [
      "Unlimited resumes",
      "Unlimited job descriptions",
      "Unlimited interview questions",
      "Priority support",
      "Early access to features",
    ],
  },
];

export default function Landing() {
  const { signInWithGoogle, loading } = useAuth();
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Powered by Advanced AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              AI-Powered Resume &{" "}
              <span className="gradient-text">Hiring Assistant</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Analyze resumes, match job descriptions, generate interview
              questions, and optimize your hiring workflow — all with
              cutting-edge AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="gradient-primary border-0 text-base px-8"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">
            Everything you need to land your dream job
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comprehensive tools powered by AI to analyze, optimize, and perfect
            your job application.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50"
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Loved by thousands</h2>
            <p className="text-muted-foreground">
              See what our users have to say about ResumeAI.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-warning text-warning"
                      />
                    ))}
                  </div>
                  <p className="text-sm mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground">
            Start for free. Upgrade when you're ready.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={`relative ${t.popular ? "border-primary shadow-lg scale-105" : "border-border/50"}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="text-3xl font-bold my-3">
                  {t.price}
                  <span className="text-sm text-muted-foreground font-normal">
                    /mo
                  </span>
                </p>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${t.popular ? "gradient-primary border-0" : ""}`}
                  variant={t.popular ? "default" : "outline"}
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-primary py-20">
        <div className="container text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-3">
            Ready to supercharge your job search?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
            Join thousands of job seekers who've already improved their chances
            with ResumeAI.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            Start Free Today <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
