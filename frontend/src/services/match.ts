import { api } from "./api";

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

export const getMatches = async (): Promise<Match[]> => {
  try {
    const response = await api.get("/api/v1/matching/");
    return response.data;
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};

export const getMatchById = async (id: string): Promise<Match> => {
  try {
    const response = await api.get(`/api/v1/matching/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching match:", error);
    throw error;
  }
};

export const deleteMatch = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/api/v1/matching/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting match:", error);
    throw error;
  }
};

interface CreateMatchParams {
  resumeId: string;
  jobId: string;
}

export const createMatch = async ({
  resumeId,
  jobId,
}: CreateMatchParams): Promise<Match> => {
  try {
    const response = await api.post("/api/v1/matching/", { resumeId, jobId });
    return response.data;
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
};

interface RefreshMatchParams {
  id: string;
  resumeId: string;
  jobId: string;
}

export const refreshMatch = async ({
  id,
  resumeId,
  jobId,
}: RefreshMatchParams): Promise<Match> => {
  try {
    const response = await api.post(`/api/v1/matching/${id}/refresh`, {
      resumeId,
      jobId,
    });
    return response.data;
  } catch (error) {
    console.error("Error refreshing match:", error);
    throw error;
  }
};

// ATS Score Interfaces
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

interface ATSScore {
  overallScore: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  passLikelihood: "high" | "medium" | "low";
}

interface ATSScoreResponse {
  success: boolean;
  resumeId: string;
  jobId: string | null;
  atsScore: ATSScore;
}

export const getATSScore = async (
  resumeId: string,
  jobId?: string,
): Promise<ATSScoreResponse> => {
  try {
    const response = await api.post("/api/v1/matching/ats-score", {
      resumeId,
      jobId,
    });
    return response.data;
  } catch (error) {
    console.error("Error calculating ATS score:", error);
    throw error;
  }
};

// Interview Questions Interfaces
export interface InterviewQuestion {
  id: number;
  category: "Technical" | "Behavioral" | "Situational" | "Problem Solving";
  question: string;
  difficulty: "easy" | "medium" | "hard";
  relatedSkills: string[];
  expectedTopics: string[];
  tip: string;
  sampleAnswerOutline: string;
}

export interface InterviewQuestionsMetadata {
  jobTitle: string;
  experienceLevel: string;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
}

export interface InterviewQuestionsData {
  questions: InterviewQuestion[];
  metadata: InterviewQuestionsMetadata;
}

interface InterviewQuestionsResponse {
  success: boolean;
  data: InterviewQuestionsData;
}

export interface GenerateInterviewQuestionsParams {
  matchId: string;
  difficulty: "easy" | "medium" | "hard";
  numberOfQuestions: number;
}

export const getInterviewQuestions = async ({
  matchId,
  difficulty,
  numberOfQuestions,
}: GenerateInterviewQuestionsParams): Promise<InterviewQuestionsResponse> => {
  try {
    const response = await api.post(
      `/api/v1/matching/${matchId}/interview-questions`,
      {
        difficulty,
        numberOfQuestions,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw error;
  }
};

// Resume Improvements Interfaces
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

interface ResumeImprovements {
  prioritizedImprovements: PrioritizedImprovement[];
  summaryRewrite: SummaryRewrite;
  skillsOptimization: SkillsOptimization;
  experienceBulletImprovements: BulletImprovement[];
  formatSuggestions: string[];
  overallAssessment: OverallAssessment;
}

interface ImprovementsResponse {
  success: boolean;
  resumeId: string;
  jobId: string | null;
  improvements: ResumeImprovements;
}

export const getResumeImprovements = async (
  resumeId: string,
  jobId?: string,
): Promise<ImprovementsResponse> => {
  try {
    const response = await api.post("/api/v1/matching/improvements", {
      resumeId,
      jobId,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating resume improvements:", error);
    throw error;
  }
};

// Find Matching Jobs Interfaces
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

interface FindMatchingJobsResponse {
  success: boolean;
  resumeId: string;
  matches: MatchingJob[];
}

export const findMatchingJobs = async (
  resumeId: string,
  limit?: number,
): Promise<FindMatchingJobsResponse> => {
  try {
    const response = await api.post("/api/v1/matching/find-jobs", {
      resumeId,
      limit,
    });
    return response.data;
  } catch (error) {
    console.error("Error finding matching jobs:", error);
    throw error;
  }
};
