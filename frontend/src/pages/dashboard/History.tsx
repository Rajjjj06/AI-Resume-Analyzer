import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResume } from "@/hooks/useResume";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, Loader2, FileText, Download } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HistoryPage() {
  const { resumes, loading, error, fetchResumes, remove } = useResume();
  const { toast } = useToast();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFileTypeBadge = (fileType: string) => {
    const colors: Record<string, string> = {
      pdf: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      docx: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      doc: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      txt: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[fileType.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  const openDeleteDialog = (id: string, name: string) => {
    setSelectedResume({ id, name });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">View all your uploaded resumes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Resumes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && resumes.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={fetchResumes}>
                Try Again
              </Button>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No resumes found.</p>
              <p className="text-sm">Upload a resume to see it here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.map((resume) => (
                  <TableRow key={resume._id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(resume.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">
                      {resume.fileName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={getFileTypeBadge(resume.fileType)}>
                        {resume.fileType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(resume.fileUrl)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
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
                            <>
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
