import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  FileText,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useJob } from "@/hooks/useJob";
import { usePayment } from "@/hooks/usePayment";

export default function AnalyzeJD() {
  const { jobDescriptions, loading, error, fetchJobs, create, remove } =
    useJob();
  const { subscription, fetchSubscription } = usePayment();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchSubscription();
  }, [fetchJobs, fetchSubscription]);

  const usage = subscription?.usage?.jobs_uploaded ?? 0;
  const limit = subscription?.limits?.jobs ?? 5;
  const isUnlimited = limit === "Infinity" || limit === Infinity;
  const numericLimit = isUnlimited ? Infinity : Number(limit);
  const usagePercent = isUnlimited
    ? 0
    : Math.min((usage / numericLimit) * 100, 100);
  const limitReached = !isUnlimited && usage >= numericLimit;

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !experienceLevel.trim()) return;
    const result = await create(title, description, experienceLevel);
    if (result) {
      setTitle("");
      setDescription("");
      setExperienceLevel("");
      fetchJobs();
      fetchSubscription();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await remove(id);
    if (success) {
      fetchJobs();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analyze Job Description</h1>
        <p className="text-muted-foreground">
          Add job descriptions to analyze them against your resume.
        </p>
      </div>

      {/* Usage Indicator */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Job Descriptions Added</span>
            <Badge variant={limitReached ? "destructive" : "secondary"}>
              {usage} / {isUnlimited ? "∞" : numericLimit}
            </Badge>
          </div>
          {!isUnlimited && <Progress value={usagePercent} className="h-2" />}
        </div>
      </div>

      {limitReached && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            You've reached your job description limit. Upgrade your plan to add
            more.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title</label>
            <Input
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Level</label>
            <Input
              placeholder="e.g., 5 years+, Senior, Entry Level"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description</label>
            <Textarea
              placeholder="Paste the job description here..."
              className="min-h-[200px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={
              !title.trim() ||
              !description.trim() ||
              !experienceLevel ||
              loading ||
              limitReached
            }
            className="w-full gradient-primary border-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Job Description"
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Job Descriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Job Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && jobDescriptions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No job descriptions yet</p>
              <p className="text-sm">Add your first job description above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobDescriptions.map((job) => (
                <div
                  key={job._id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{job.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {job.experienceLevel}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(job._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
