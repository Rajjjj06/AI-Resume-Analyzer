import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Briefcase, Target, TrendingUp, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useResume } from "@/hooks/useResume";
import { useJob } from "@/hooks/useJob";
import { useMatch } from "@/hooks/useMatch";
import { useAuth } from "@/context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { resumes, fetchResumes, loading: resumesLoading } = useResume();
  const { jobDescriptions, fetchJobs, loading: jobsLoading } = useJob();
  const { matches, fetchMatches, loading: matchesLoading } = useMatch();

  useEffect(() => {
    fetchResumes();
    fetchJobs();
    fetchMatches();
  }, [fetchResumes, fetchJobs, fetchMatches]);

  const loading = resumesLoading || jobsLoading || matchesLoading;

  // Calculate average match score
  const avgMatchScore = useMemo(() => {
    if (matches.length === 0) return 0;
    const total = matches.reduce((sum, m) => sum + (m.matchScore || 0), 0);
    return Math.round(total / matches.length);
  }, [matches]);

  // Format recent matches for activity table
  const recentActivity = useMemo(() => {
    return matches.slice(0, 5).map((match) => {
      const resume =
        typeof match.resume === "object"
          ? (match.resume as { name?: string })
          : null;
      const job =
        typeof match.jobDescription === "object"
          ? (match.jobDescription as { title?: string; company?: string })
          : null;

      return {
        date: new Date(match.createdAt).toLocaleDateString(),
        resume: resume?.name || "Resume",
        role: job?.title || "Job",
        score: match.matchScore,
        status: "Completed",
      };
    });
  }, [matches]);

  if (loading && resumes.length === 0 && jobDescriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back
          {user?.name ? `, ${user.name.split(" ")[0]}` : ""}! Here's an overview
          of your activity.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Resumes"
          value={resumes.length}
          icon={FileText}
          description="Uploaded resumes"
        />
        <StatCard
          title="Job Descriptions"
          value={jobDescriptions.length}
          icon={Briefcase}
          description="Analyzed jobs"
        />
        <StatCard
          title="Total Matches"
          value={matches.length}
          icon={Target}
          description="Resume-job matches"
        />
        <StatCard
          title="Avg. Match Score"
          value={`${avgMatchScore}%`}
          icon={TrendingUp}
          description="Across all matches"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No matches yet</p>
              <p className="text-sm">
                Upload a resume and create a match to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.date}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {a.resume}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {a.role}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold text-sm ${
                          a.score >= 80
                            ? "text-green-600 dark:text-green-400"
                            : a.score >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {a.score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "Completed" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
