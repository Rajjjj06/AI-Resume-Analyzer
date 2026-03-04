import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "@/components/CircularProgress";
import {
  CheckCircle,
  XCircle,
  Lightbulb,
  FileText,
  Loader2,
  RefreshCw,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useJob } from "@/hooks/useJob";
import { useResume } from "@/hooks/useResume";
import { useMatch } from "@/hooks/useMatch";

export default function MatchResults() {
  const { jobDescriptions, loading: jobsLoading, fetchJobs } = useJob();
  const { resumes, loading: resumesLoading, fetchResumes } = useResume();
  const {
    match,
    loading: matchLoading,
    error: matchError,
    create,
    clearMatch,
  } = useMatch();
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchJobs();
    fetchResumes();
  }, [fetchJobs, fetchResumes]);

  // Clear match when selection changes, but not on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    clearMatch();
  }, [selectedResume, selectedJob, clearMatch]);

  const handleAnalyze = async () => {
    if (selectedResume && selectedJob) {
      try {
        await create({ resumeId: selectedResume, jobId: selectedJob });
      } catch (err) {
        console.error("Failed to create match:", err);
      }
    }
  };

  const canAnalyze = selectedResume && selectedJob && !matchLoading;
  const hasResults = match !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Match Results</h1>
        <p className="text-muted-foreground">
          Resume vs Job Description compatibility analysis.
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

          {!hasResults && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {matchError ? (
                <div className="text-destructive text-sm">{matchError}</div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <FileText className="h-5 w-5 mr-2" />
                  <span>
                    Select both a resume and job description, then click Analyze
                  </span>
                </div>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="min-w-[120px]"
              >
                {matchLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Match"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results - only show when match data exists */}
      {hasResults && (
        <>
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardContent className="p-6 flex flex-col items-center gap-4">
                <CircularProgress
                  value={match.matchScore}
                  label="Match Score"
                  sublabel={
                    match.matchScore >= 80
                      ? "Excellent match!"
                      : match.matchScore >= 60
                        ? "Good match with room to improve"
                        : "Needs improvement"
                  }
                />
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Briefcase
                      className={`h-4 w-4 ${match.experienceMatch ? "text-success" : "text-destructive"}`}
                    />
                    <span>
                      Experience: {match.experienceMatch ? "Match" : "Gap"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap
                      className={`h-4 w-4 ${match.educationMatch ? "text-success" : "text-destructive"}`}
                    />
                    <span>
                      Education: {match.educationMatch ? "Match" : "Gap"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={matchLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${matchLoading ? "animate-spin" : ""}`}
                  />
                  Re-analyze
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" /> Matching
                  Skills ({match.matchedSkills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {match.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {match.matchedSkills.map((s) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="bg-success/10 text-success border-success/20"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No matching skills found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" /> Missing Skills
                ({match.missingSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {match.missingSkills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="bg-destructive/10 text-destructive border-destructive/20"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No missing skills - great job!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" /> Recommendations (
                {match.recommendations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {match.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recommendations - your resume is well-aligned!
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
