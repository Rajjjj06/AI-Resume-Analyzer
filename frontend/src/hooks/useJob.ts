import { useState, useCallback, useRef } from "react";
import {
  getJobs,
  getJobById,
  createJob,
  deleteJob,
  getExperienceLevels,
  parseJob,
  getParsingStatus,
  getParsedData,
  Job,
  ParsedJobData,
} from "../services/jobs";

type ParsingStatus = "pending" | "processing" | "completed" | "failed";

interface UseJobReturn {
  jobDescriptions: Job[];
  job: Job | null;
  parsedData: ParsedJobData | null;
  parsingStatus: ParsingStatus | null;
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  create: (
    title: string,
    description: string,
    experienceLevel: string,
  ) => Promise<Job | null>;
  remove: (id: string) => Promise<boolean>;
  levelExperience: () => Promise<string[]>;
  reparse: (id: string) => Promise<boolean>;
  checkParsingStatus: (id: string) => Promise<ParsingStatus | null>;
  fetchParsedData: (id: string) => Promise<ParsedJobData | null>;
  pollParsingStatus: (
    id: string,
    onComplete?: (data: ParsedJobData) => void,
  ) => void;
  stopPolling: () => void;
}

export const useJob = (): UseJobReturn => {
  const [jobDescriptions, setJobDescriptions] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<string[]>([]);

  // Ref for polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch all jobs
   */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs();
      setJobDescriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch single job by ID
   */
  const fetchJobById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobById(id);
      setJob(data);
      setParsedData(data.parsedData || null);
      setParsingStatus(data.parsingStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new job description
   */
  const createJobDescription = useCallback(
    async (title: string, description: string, experienceLevel: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await createJob(title, description, experienceLevel);
        setJob(data);
        setParsingStatus(data.parsingStatus);
        setJobDescriptions((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create job");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a job description
   */
  const deleteJobDescription = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteJob(id);
        setJobDescriptions((prev) => prev.filter((job) => job._id !== id));
        if (job?._id === id) {
          setJob(null);
          setParsedData(null);
          setParsingStatus(null);
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete job");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [job],
  );

  /**
   * Fetch experience levels
   */
  const fetchExperienceLevels = useCallback(async (): Promise<string[]> => {
    try {
      const levels = await getExperienceLevels();
      setLevels(levels);
      return levels;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch experience levels",
      );
      return [];
    }
  }, []);

  /**
   * Re-parse a job description
   */
  const reparse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setParsingStatus("processing");
    try {
      const { parsedData: newParsedData } = await parseJob(id);
      setParsedData(newParsedData);
      setParsingStatus("completed");

      // Update job in list
      setJobDescriptions((prev) =>
        prev.map((j) =>
          j._id === id ? { ...j, parsingStatus: "completed" as const } : j,
        ),
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse job");
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
    async (id: string): Promise<ParsedJobData | null> => {
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
    (id: string, onComplete?: (data: ParsedJobData) => void) => {
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
            setError("Job description parsing failed");
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
    jobDescriptions,
    job,
    parsedData,
    parsingStatus,
    loading,
    error,
    fetchJobs,
    fetchJobById,
    create: createJobDescription,
    remove: deleteJobDescription,
    levelExperience: fetchExperienceLevels,
    reparse,
    checkParsingStatus,
    fetchParsedData,
    pollParsingStatus,
    stopPolling,
  };
};
