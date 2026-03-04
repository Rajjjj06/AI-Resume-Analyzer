import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/hooks/useResume";

interface FileUploadAreaProps {
  onUploadSuccess?: () => void;
}

export function FileUploadArea({ onUploadSuccess }: FileUploadAreaProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { upload, loading: uploading } = useResume();
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setUploadComplete(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setUploadComplete(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setProgress(0);

    // Simulate progress while uploading
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90; // Hold at 90% until actual completion
        return p + 10;
      });
    }, 150);

    const result = await upload(file);
    clearInterval(interval);

    if (result) {
      setProgress(100);
      setUploadComplete(true);
      toast({
        title: "Resume uploaded!",
        description: `${file.name} has been uploaded successfully.`,
      });
      onUploadSuccess?.();
      // Reset after a delay
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        setUploadComplete(false);
      }, 2000);
    } else {
      setProgress(0);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="font-medium mb-1">Drag & drop your resume here</p>
        <p className="text-sm text-muted-foreground">
          or click to browse · PDF, DOC, DOCX, TXT
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          {uploadComplete ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <FileText className="h-8 w-8 text-primary" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          {!uploading && !uploadComplete && (
            <button
              onClick={() => {
                setFile(null);
                setProgress(0);
              }}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      )}

      {(uploading || progress > 0) && (
        <Progress value={progress} className="h-2" />
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading || uploadComplete}
        className="gradient-primary border-0 w-full"
      >
        {uploading
          ? "Uploading..."
          : uploadComplete
            ? "Uploaded!"
            : "Upload Resume"}
      </Button>
    </div>
  );
}
