import { Card, CardContent } from "@/components/ui/card";
import {
  FileSearch,
  Target,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Brain,
  Layers,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Resume Parsing",
    desc: "Our AI extracts structured data from resumes in any format — PDF, DOCX, or plain text. It identifies sections, skills, experience, and education automatically.",
    highlights: ["Multi-format support", "99% accuracy", "Instant processing"],
  },
  {
    icon: BarChart3,
    title: "ATS Scoring",
    desc: "Get detailed ATS compatibility scores with breakdowns for formatting, keywords, readability, and structure. Know exactly what to fix.",
    highlights: ["Score breakdown", "Keyword analysis", "Format checks"],
  },
  {
    icon: Target,
    title: "JD Matching",
    desc: "Compare any resume against a job description to find skill matches, gaps, and alignment percentage. Perfect for both candidates and recruiters.",
    highlights: ["Skill matching", "Gap identification", "Match percentage"],
  },
  {
    icon: MessageSquare,
    title: "Interview Question Generator",
    desc: "Generate tailored interview questions based on the role, experience level, and specific skills. Includes STAR-method tips for each question.",
    highlights: ["Role-specific", "STAR framework", "Experience-based"],
  },
  {
    icon: TrendingUp,
    title: "Skill Gap Analysis",
    desc: "Identify missing skills compared to target roles and get personalized recommendations for courses, certifications, and experience to bridge the gap.",
    highlights: ["Gap detection", "Learning paths", "Priority ranking"],
  },
  {
    icon: Zap,
    title: "Smart Suggestions",
    desc: "AI-powered rewrite suggestions for every resume section. Improve impact statements, quantify achievements, and strengthen your narrative.",
    highlights: ["AI rewrites", "Impact optimization", "One-click apply"],
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Your data is encrypted end-to-end. We never share or sell your personal information. GDPR and SOC 2 compliant.",
    highlights: ["End-to-end encryption", "GDPR compliant", "Data ownership"],
  },
  {
    icon: Clock,
    title: "Real-Time Analysis",
    desc: "Get results in seconds, not minutes. Our optimized AI pipeline processes resumes and job descriptions in real-time.",
    highlights: ["< 3s processing", "Live feedback", "Instant results"],
  },
  {
    icon: Brain,
    title: "Continuous Learning",
    desc: "Our AI models are continuously trained on the latest hiring trends, ensuring your resume stays current and competitive.",
    highlights: ["Updated weekly", "Industry trends", "Best practices"],
  },
  {
    icon: Layers,
    title: "Batch Processing",
    desc: "Upload multiple resumes or job descriptions at once. Perfect for recruiters screening hundreds of candidates.",
    highlights: ["Bulk upload", "Parallel processing", "Export results"],
  },
];

export default function Features() {
  return (
    <div className="container py-16 md:py-24">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Powerful features for{" "}
          <span className="gradient-text">modern hiring</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to optimize resumes, match candidates, and
          streamline your hiring process and improve at the same time.
        </p>
        console.log("Features page loaded");
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <Card
            key={f.title}
            className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-border/50"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {f.highlights.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
