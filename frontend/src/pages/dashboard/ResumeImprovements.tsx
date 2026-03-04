import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useJob } from "@/hooks/useJob";
import { useResume } from "@/hooks/useResume";

const issues = [
  {
    section: "Professional Summary",
    severity: "high",
    original:
      "I am a software developer with experience in various technologies and I have worked on many projects.",
    suggested:
      "Results-driven Software Engineer with 5+ years of experience building scalable web applications using React, Node.js, and AWS. Led a team of 4 engineers to deliver a platform serving 100K+ users.",
  },
  {
    section: "Work Experience — Bullet Point",
    severity: "medium",
    original: "Worked on the frontend of the application and fixed bugs.",
    suggested:
      "Architected and implemented a React-based dashboard that reduced page load times by 40% and improved user engagement by 25%, serving 50K+ daily active users.",
  },
  {
    section: "Skills Section",
    severity: "low",
    original: "JavaScript, HTML, CSS, React, Node",
    suggested:
      "Languages: JavaScript (ES6+), TypeScript, Python | Frontend: React, Next.js, Tailwind CSS | Backend: Node.js, Express, PostgreSQL | Cloud: AWS (S3, Lambda, EC2), Docker",
  },
];

export default function ResumeImprovements() {
  const { jobDescriptions, loading: jobsLoading, fetchJobs } = useJob();
  const { resumes, loading: resumesLoading, fetchResumes } = useResume();
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchResumes();
  }, [fetchJobs, fetchResumes]);

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const canShowResults = selectedResume && selectedJob;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Resume Improvements</h1>
        <p className="text-muted-foreground">
          AI-powered suggestions to strengthen your resume.
        </p>
      </div>

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Resume & Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume</label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No resumes uploaded
                    </div>
                  ) : (
                    resumes.map((resume) => (
                      <SelectItem key={resume._id} value={resume._id}>
                        {resume.fileName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : jobDescriptions.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No job descriptions added
                    </div>
                  ) : (
                    jobDescriptions.map((job) => (
                      <SelectItem key={job._id} value={job._id}>
                        {job.title} ({job.experienceLevel})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canShowResults && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-5 w-5 mr-2" />
              <span>
                Select both a resume and job description to see improvement
                suggestions
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvements - only show when both selected */}
      {canShowResults && (
        <>
          {issues.map((issue, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {issue.severity === "high" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    {issue.section}
                  </CardTitle>
                  <Badge
                    variant={
                      issue.severity === "high" ? "destructive" : "secondary"
                    }
                    className="text-xs capitalize"
                  >
                    {issue.severity} priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    Original
                  </p>
                  <p className="text-sm">{issue.original}</p>
                </div>
                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-success mb-1">
                        Suggested
                      </p>
                      <p className="text-sm">{issue.suggested}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyText(issue.suggested, i)}
                    >
                      {copied === i ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
