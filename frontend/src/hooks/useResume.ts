import { useState, useCallback, useRef } from "react";
import {
  getResumes,
  getResumeById,
  uploadResume,
  deleteResume,
  parseResume,
  getParsingStatus,
  getParsedData,
  Resume,
  ParsedData,
} from "../services/resume";

type ParsingStatus = "pending" | "processing" | "completed" | "failed";

interface UseResumeReturn {
  resumes: Resume[];
  resume: Resume | null;
  parsedData: ParsedData | null;
  parsingStatus: ParsingStatus | null;
  loading: boolean;
  error: string | null;
  fetchResumes: () => Promise<void>;
  fetchResumeById: (id: string) => Promise<void>;
  upload: (file: File) => Promise<Resume | null>;
  remove: (id: string) => Promise<boolean>;
  reparse: (id: string) => Promise<boolean>;
  checkParsingStatus: (id: string) => Promise<ParsingStatus | null>;
  fetchParsedData: (id: string) => Promise<ParsedData | null>;
  pollParsingStatus: (
    id: string,
    onComplete?: (data: ParsedData) => void,
  ) => void;
  stopPolling: () => void;
}

export const useResume = (): UseResumeReturn => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch all resumes
   */
  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single resume by ID
   */
  const fetchResumeById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getResumeById(id);
      setResume(data);
      setParsedData(data.parsedData || null);
      setParsingStatus(data.parsingStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch resume");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new resume
   */
  const upload = useCallback(async (file: File): Promise<Resume | null> => {
    setLoading(true);
    setError(null);
    try {
      const { resume: newResume } = await uploadResume(file);
      setResumes((prev) => [newResume, ...prev]);
      setParsingStatus(newResume.parsingStatus);
      return newResume;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a resume
   */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await deleteResume(id);
        setResumes((prev) => prev.filter((r) => r._id !== id));
        if (resume?._id === id) {
          setResume(null);
          setParsedData(null);
          setParsingStatus(null);
        }
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete resume",
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [resume],
  );

  /**
   * Re-parse a resume
   */
  const reparse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setParsingStatus("processing");
    try {
      const { parsedData: newParsedData } = await parseResume(id);
      setParsedData(newParsedData);
      setParsingStatus("completed");

      // Update resume in list
      setResumes((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, parsingStatus: "completed" } : r,
        ),
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse resume");
      setParsingStatus("failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check parsing status
   */
  const checkParsingStatus = useCallback(
    async (id: string): Promise<ParsingStatus | null> => {
      try {
        const { status, data } = await getParsingStatus(id);
        setParsingStatus(status);
        if (data) {
          setParsedData(data);
        }
        return status;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check status");
        return null;
      }
    },
    [],
  );

  /**
   * Fetch only parsed data
   */
  const fetchParsedData = useCallback(
    async (id: string): Promise<ParsedData | null> => {
      setLoading(true);
      setError(null);
      try {
        const { parsedData: data } = await getParsedData(id);
        setParsedData(data);
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch parsed data",
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Poll parsing status until complete
   */
  const pollParsingStatus = useCallback(
    (id: string, onComplete?: (data: ParsedData) => void) => {
      // Clear any existing polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      const poll = async () => {
        try {
          const { status, data } = await getParsingStatus(id);
          setParsingStatus(status);

          if (status === "completed" && data) {
            setParsedData(data);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            onComplete?.(data);
          } else if (status === "failed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setError("Resume parsing failed");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      };

      // Poll every 2 seconds
      pollingRef.current = setInterval(poll, 2000);

      // Initial check
      poll();
    },
    [],
  );

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    resumes,
    resume,
    parsedData,
    parsingStatus,
    loading,
    error,
    fetchResumes,
    fetchResumeById,
    upload,
    remove,
    reparse,
    checkParsingStatus,
    fetchParsedData,
    pollParsingStatus,
    stopPolling,
  };
};
