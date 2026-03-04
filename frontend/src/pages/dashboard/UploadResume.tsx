import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadArea } from "@/components/FileUploadArea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useResume } from "@/hooks/useResume";
import { usePayment } from "@/hooks/usePayment";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Eye,
  Trash2,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
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

export default function UploadResume() {
  const { resumes, loading, error, fetchResumes, remove } = useResume();
  const { subscription, fetchSubscription } = usePayment();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
    fetchSubscription();
  }, [fetchResumes, fetchSubscription]);

  const usage = subscription?.usage?.resumes_uploaded ?? 0;
  const limit = subscription?.limits?.resumes ?? 5;
  const isUnlimited = limit === "Infinity" || limit === Infinity;
  const numericLimit = isUnlimited ? Infinity : Number(limit);
  const usagePercent = isUnlimited
    ? 0
    : Math.min((usage / numericLimit) * 100, 100);
  const limitReached = !isUnlimited && usage >= numericLimit;

  const handleDelete = async (id: string, fileName: string) => {
    setDeletingId(id);
    const success = await remove(id);
    setDeletingId(null);

    if (success) {
      toast({
        title: "Resume deleted",
        description: `${fileName} has been deleted.`,
      });
    } else {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the resume.",
        variant: "destructive",
      });
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Upload Resume</h1>
        <p className="text-muted-foreground">
          Upload your resume to get started with AI analysis.
        </p>
      </div>

      {/* Usage Indicator */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Resumes Uploaded</span>
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
            You've reached your resume upload limit. Upgrade your plan to upload
            more.
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resume Upload</CardTitle>
        </CardHeader>
        <CardContent>
          {limitReached ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Upload limit reached</p>
              <p className="text-sm mt-1">
                Upgrade your subscription to continue uploading resumes.
              </p>
            </div>
          ) : (
            <FileUploadArea
              onUploadSuccess={() => {
                fetchResumes();
                fetchSubscription();
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Supported Formats</h3>
          <div className="grid grid-cols-4 gap-3">
            {["PDF", "DOCX", "DOC", "TXT"].map((f) => (
              <div
                key={f}
                className="rounded-lg bg-muted p-3 text-center text-sm font-medium"
              >
                {f}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Maximum file size: 5MB. Your files are encrypted and stored
            securely.
          </p>
        </CardContent>
      </Card>

      {/* Recently Uploaded Resumes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && resumes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-2" onClick={fetchResumes}>
                Try Again
              </Button>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No resumes uploaded yet.</p>
              <p className="text-sm">
                Upload your first resume above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {getFileIcon(resume.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resume.fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {resume.fileType.toUpperCase()} · Uploaded{" "}
                      {formatDate(resume.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(resume.fileUrl)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          disabled={deletingId === resume._id}
                        >
                          {deletingId === resume._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{resume.fileName}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDelete(resume._id, resume.fileName)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
