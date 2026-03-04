import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResume } from "@/hooks/useResume";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Eye,
  Trash2,
  Loader2,
  Upload,
  Download,
  MoreVertical,
  Calendar,
  File,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyResumes() {
  const { resumes, loading, error, fetchResumes, remove } = useResume();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleDelete = async () => {
    if (!selectedResume) return;

    setDeletingId(selectedResume.id);
    const success = await remove(selectedResume.id);
    setDeletingId(null);
    setDeleteDialogOpen(false);

    if (success) {
      toast({
        title: "Resume deleted",
        description: `${selectedResume.name} has been deleted.`,
      });
    } else {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the resume.",
        variant: "destructive",
      });
    }
    setSelectedResume(null);
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "docx":
      case "doc":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "txt":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const openDeleteDialog = (id: string, name: string) => {
    setSelectedResume({ id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground">
            Manage all your uploaded resumes.
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/upload")} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload New
        </Button>
      </div>

      {loading && resumes.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={fetchResumes}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <File className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first resume to get started with AI-powered analysis.
            </p>
            <Button
              onClick={() => navigate("/dashboard/upload")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card
                key={resume._id}
                className="group hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <Badge className={getFileTypeColor(resume.fileType)}>
                        {resume.fileType.toUpperCase()}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleView(resume.fileUrl)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDownload(resume.fileUrl, resume.fileName)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            openDeleteDialog(resume._id, resume.fileName)
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3
                    className="font-medium truncate mb-1"
                    title={resume.fileName}
                  >
                    {resume.fileName}
                  </h3>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(resume.createdAt)}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(resume.fileUrl)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        openDeleteDialog(resume._id, resume.fileName)
                      }
                      disabled={deletingId === resume._id}
                    >
                      {deletingId === resume._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedResume?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
