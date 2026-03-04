import { useCallback, useState } from "react";
import {
  getMatches,
  getMatchById,
  createMatch,
  deleteMatch,
  refreshMatch,
  getATSScore,
  getInterviewQuestions,
  getResumeImprovements,
  findMatchingJobs,
  InterviewQuestionsData,
  InterviewQuestion,
  GenerateInterviewQuestionsParams,
} from "../services/match";

// SessionStorage helpers — persist data across refreshes, clear on tab close
const CACHE_KEYS = {
  matches: "cache_matches",
  match: "cache_match",
  atsScore: "cache_atsScore",
  interviewQuestions: "cache_interviewQuestions",
} as const;

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full — ignore
  }
}

function removeCache(key: string) {
  sessionStorage.removeItem(key);
}

interface Match {
  _id: string;
  user: string;
  resume: string;
  jobDescription: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  educationMatch: boolean;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

// ATS Score Types
interface ATSBreakdown {
  formatting: {
    score: number;
    issues: string[];
    tips: string[];
  };
  keywords: {
    score: number;
    matched: string[];
    missing: string[];
    tips: string[];
  };
  readability: {
    score: number;
    issues: string[];
    tips: string[];
  };
  structure: {
    score: number;
    issues: string[];
    tips: string[];
  };
  experience: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
}

interface ATSScoreData {
  overallScore: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  passLikelihood: "high" | "medium" | "low";
}

interface ATSScoreResponse {
  success: boolean;
  resumeId: string;
  jobId: string | null;
  atsScore: ATSScoreData;
}

// Interview Questions Types - using imported types from match.ts
export type {
  InterviewQuestion,
  InterviewQuestionsData,
} from "../services/match";

// Resume Improvements Types
interface PrioritizedImprovement {
  priority: number;
  section: string;
  issue: string;
  suggestion: string;
  example?: string;
  impact: "high" | "medium" | "low";
}

interface SummaryRewrite {
  current: string;
  suggested: string;
  keyChanges: string[];
}

interface SkillRephrase {
  from: string;
  to: string;
}

interface SkillsOptimization {
  keep: string[];
  rephrase: SkillRephrase[];
  add: string[];
  remove: string[];
}

interface BulletImprovement {
  position: string;
  originalBullet: string;
  improvedBullet: string;
  technique: string;
}

interface OverallAssessment {
  currentStrength: string;
  biggestGap: string;
  estimatedImprovementPotential: string;
}

interface ResumeImprovementsData {
  prioritizedImprovements: PrioritizedImprovement[];
  summaryRewrite: SummaryRewrite;
  skillsOptimization: SkillsOptimization;
  experienceBulletImprovements: BulletImprovement[];
  formatSuggestions: string[];
  overallAssessment: OverallAssessment;
}

// Matching Jobs Types
interface MatchingJob {
  job: {
    _id: string;
    title: string;
    description: string;
    experienceLevel: string;
    parsedData: Record<string, unknown>;
  };
  relevanceScore: number;
  matchedOn: string;
}

interface CreateMatchParams {
  resumeId: string;
  jobId: string;
}

interface RefreshMatchParams {
  id: string;
  resumeId: string;
  jobId: string;
}

export const useMatch = () => {
  const [matches, setMatchesState] = useState<Match[]>(
    () => getCached<Match[]>(CACHE_KEYS.matches) || [],
  );
  const [match, setMatchState] = useState<Match | null>(() =>
    getCached<Match>(CACHE_KEYS.match),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ATS & Analysis State — initialized from sessionStorage
  const [atsScore, setAtsScoreState] = useState<ATSScoreData | null>(() =>
    getCached<ATSScoreData>(CACHE_KEYS.atsScore),
  );
  const [atsLoading, setAtsLoading] = useState(false);
  const [interviewQuestions, setInterviewQuestionsState] =
    useState<InterviewQuestionsData | null>(() =>
      getCached<InterviewQuestionsData>(CACHE_KEYS.interviewQuestions),
    );
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [improvements, setImprovements] =
    useState<ResumeImprovementsData | null>(null);
  const [improvementsLoading, setImprovementsLoading] = useState(false);
  const [matchingJobs, setMatchingJobs] = useState<MatchingJob[]>([]);
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  // Wrapped setters that also persist to sessionStorage
  const setMatches = useCallback((data: Match[]) => {
    setMatchesState(data);
    setCache(CACHE_KEYS.matches, data);
  }, []);

  const setAtsScore = useCallback((data: ATSScoreData | null) => {
    setAtsScoreState(data);
    if (data) setCache(CACHE_KEYS.atsScore, data);
    else removeCache(CACHE_KEYS.atsScore);
  }, []);

  const setMatch = useCallback((data: Match | null) => {
    setMatchState(data);
    if (data) setCache(CACHE_KEYS.match, data);
    else removeCache(CACHE_KEYS.match);
  }, []);

  const setInterviewQuestions = useCallback(
    (data: InterviewQuestionsData | null) => {
      setInterviewQuestionsState(data);
      if (data) setCache(CACHE_KEYS.interviewQuestions, data);
      else removeCache(CACHE_KEYS.interviewQuestions);
    },
    [],
  );

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  }, [setMatches]);

  const fetchMatchById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMatchById(id);
        setMatch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch match");
      } finally {
        setLoading(false);
      }
    },
    [setMatch],
  );

  // Fix: Added params
  const create = useCallback(
    async ({ resumeId, jobId }: CreateMatchParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await createMatch({ resumeId, jobId });
        setMatch(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create match");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setMatch],
  );

  // Fix: Added params
  const refresh = useCallback(
    async ({ id, resumeId, jobId }: RefreshMatchParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = await refreshMatch({ id, resumeId, jobId });
        setMatch(data);
        return data;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to refresh match",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setMatch],
  );

  const deleteMatchById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteMatch(id);
      // Remove from local state and cache after deletion
      setMatchesState((prev) => {
        const updated = prev.filter((m) => m._id !== id);
        setCache(CACHE_KEYS.matches, updated);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete match");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear current match
  const clearMatch = useCallback(() => {
    setMatch(null);
    setError(null);
  }, [setMatch]);

  // Fetch ATS Score
  const fetchATSScore = useCallback(
    async (resumeId: string, jobId?: string) => {
      setAtsLoading(true);
      setError(null);
      try {
        const response = await getATSScore(resumeId, jobId);
        setAtsScore(response.atsScore);
        return response.atsScore;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to calculate ATS score",
        );
        throw err;
      } finally {
        setAtsLoading(false);
      }
    },
    [setAtsScore],
  );

  // Fetch Interview Questions
  const fetchInterviewQuestions = useCallback(
    async (params: GenerateInterviewQuestionsParams) => {
      setInterviewLoading(true);
      setError(null);
      try {
        const response = await getInterviewQuestions(params);
        setInterviewQuestions(response.data);
        return response.data;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate interview questions",
        );
        throw err;
      } finally {
        setInterviewLoading(false);
      }
    },
    [setInterviewQuestions],
  );

  // Fetch Resume Improvements
  const fetchImprovements = useCallback(
    async (resumeId: string, jobId?: string) => {
      setImprovementsLoading(true);
      setError(null);
      try {
        const response = await getResumeImprovements(resumeId, jobId);
        setImprovements(response.improvements);
        return response.improvements;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to generate improvements",
        );
        throw err;
      } finally {
        setImprovementsLoading(false);
      }
    },
    [],
  );

  // Find Matching Jobs
  const fetchMatchingJobs = useCallback(
    async (resumeId: string, limit?: number) => {
      setMatchingJobsLoading(true);
      setError(null);
      try {
        const response = await findMatchingJobs(resumeId, limit);
        setMatchingJobs(response.matches);
        return response.matches;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to find matching jobs",
        );
        throw err;
      } finally {
        setMatchingJobsLoading(false);
      }
    },
    [],
  );

  // Clear ATS data
  const clearAtsData = useCallback(() => {
    setAtsScore(null);
    setInterviewQuestions(null);
    setImprovements(null);
    setMatchingJobs([]);
  }, [setAtsScore, setInterviewQuestions]);

  return {
    // Match state
    matches,
    match,
    loading,
    error,
    fetchMatches,
    fetchMatchById,
    create,
    refresh,
    deleteMatch: deleteMatchById,
    clearMatch,

    // ATS Score
    atsScore,
    atsLoading,
    fetchATSScore,

    // Interview Questions
    interviewQuestions,
    interviewLoading,
    fetchInterviewQuestions,

    // Improvements
    improvements,
    improvementsLoading,
    fetchImprovements,

    // Matching Jobs
    matchingJobs,
    matchingJobsLoading,
    fetchMatchingJobs,

    // Clear all analysis data
    clearAtsData,
  };
};
