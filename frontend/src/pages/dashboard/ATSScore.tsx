import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "@/components/CircularProgress";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Briefcase,
} from "lucide-react";
import { useMatch } from "@/hooks/useMatch";
import { useResume } from "@/hooks/useResume";
import { useJob } from "@/hooks/useJob";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ATSScore() {
  const { atsScore, atsLoading, fetchATSScore, error } = useMatch();
  const { resumes, fetchResumes, loading: resumesLoading } = useResume();
  const { jobDescriptions, fetchJobs, loading: jobsLoading } = useJob();

  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("none");

  // Fetch resumes and jobs on mount
  useEffect(() => {
    fetchResumes();
    fetchJobs();
  }, [fetchResumes, fetchJobs]);

  const handleAnalyze = async () => {
    if (!selectedResumeId) return;
    await fetchATSScore(
      selectedResumeId,
      selectedJobId !== "none" ? selectedJobId : undefined,
    );
  };

  // Calculate overall score from breakdown
  const calculateOverall = () => {
    if (!atsScore?.breakdown) return 0;
    const { formatting, keywords, readability, structure, experience } =
      atsScore.breakdown;
    const scores = [
      formatting?.score,
      keywords?.score,
      readability?.score,
      structure?.score,
      experience?.score,
    ].filter((s) => s !== undefined);
    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  };

  const overall = atsScore?.overallScore ?? calculateOverall();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case "high":
        return <Badge className="bg-success">High Pass Likelihood</Badge>;
      case "medium":
        return <Badge className="bg-warning">Medium Pass Likelihood</Badge>;
      case "low":
        return <Badge variant="destructive">Low Pass Likelihood</Badge>;
      default:
        return null;
    }
  };

  // Transform breakdown to array for display
  const breakdownArray = atsScore?.breakdown
    ? [
        {
          label: "Formatting",
          score: atsScore.breakdown.formatting?.score ?? 0,
          tips: [
            ...(atsScore.breakdown.formatting?.tips || []),
            ...(atsScore.breakdown.formatting?.issues || []),
          ],
        },
        {
          label: "Keywords",
          score: atsScore.breakdown.keywords?.score ?? 0,
          tips: [
            ...(atsScore.breakdown.keywords?.tips || []),
            `Matched: ${atsScore.breakdown.keywords?.matched?.slice(0, 5).join(", ") || "None"}`,
            `Missing: ${atsScore.breakdown.keywords?.missing?.slice(0, 5).join(", ") || "None"}`,
          ],
        },
        {
          label: "Readability",
          score: atsScore.breakdown.readability?.score ?? 0,
          tips: [
            ...(atsScore.breakdown.readability?.tips || []),
            ...(atsScore.breakdown.readability?.issues || []),
          ],
        },
        {
          label: "Structure",
          score: atsScore.breakdown.structure?.score ?? 0,
          tips: [
            ...(atsScore.breakdown.structure?.tips || []),
            ...(atsScore.breakdown.structure?.issues || []),
          ],
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">ATS Score</h1>
        <p className="text-muted-foreground">
          See how your resume performs against Applicant Tracking Systems.
        </p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Select Resume
              </label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
                disabled={resumesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume._id} value={resume._id}>
                      {resume.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Target Job (Optional)
              </label>
              <Select
                value={selectedJobId}
                onValueChange={setSelectedJobId}
                disabled={jobsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job description" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific job</SelectItem>
                  {jobDescriptions.map((job) => (
                    <SelectItem key={job._id} value={job._id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedResumeId || atsLoading}
                className="w-full"
              >
                {atsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze ATS Score"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {atsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Analyzing your resume with AI...
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {atsScore && !atsLoading && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <CircularProgress
                  value={overall}
                  label="Overall ATS Score"
                  sublabel="Based on AI analysis"
                />
                <div className="mt-4">
                  {getLikelihoodBadge(atsScore.passLikelihood)}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
              {breakdownArray.map((b) => (
                <Card key={b.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{b.label}</span>
                      <span className={`font-bold ${getScoreColor(b.score)}`}>
                        {b.score}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getBarColor(b.score)}`}
                        style={{ width: `${b.score}%` }}
                      />
                    </div>
                    <ul className="mt-3 space-y-1">
                      {b.tips.slice(0, 4).map((t, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          {b.score >= 80 ? (
                            <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                          )}
                          {t}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Experience Breakdown */}
          {atsScore.breakdown.experience && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Experience Analysis
                  <span
                    className={`text-lg ${getScoreColor(atsScore.breakdown.experience.score)}`}
                  >
                    {atsScore.breakdown.experience.score}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-success">
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {atsScore.breakdown.experience.strengths?.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-warning">
                      Areas to Improve
                    </h4>
                    <ul className="space-y-1">
                      {atsScore.breakdown.experience.weaknesses?.map((w, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {atsScore.suggestions?.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!atsScore && !atsLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground">
              Select a resume and click "Analyze ATS Score" to see how your
              resume performs against ATS systems.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
