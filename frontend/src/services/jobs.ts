import { api } from "./api";

// ============ INTERFACES ============

interface ExperienceYears {
  min: number | null;
  max: number | null;
}

interface Salary {
  min: string | null;
  max: string | null;
  currency: string | null;
}

export interface ParsedJobData {
  jobTitle: string | null;
  company: string | null;
  location: string | null;
  jobType: string | null;
  experienceLevel: "entry" | "mid" | "senior" | "executive" | null;
  experienceYears: ExperienceYears;
  salary: Salary;
  skills: string[];
  responsibilities: string[];
  qualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  summary: string | null;
}

export interface Job {
  _id: string;
  user: string;
  title: string;
  description: string;
  experienceLevel: string;
  rawText?: string;
  parsedData?: ParsedJobData;
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  parsingError?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParsingStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
  data: ParsedJobData | null;
}

interface ParsedDataResponse {
  title: string;
  parsedData: ParsedJobData;
}

// ============ API FUNCTIONS ============

/**
 * Get all jobs for the logged-in user
 */
export const getJobs = async (): Promise<Job[]> => {
  try {
    const response = await api.get("/api/v1/job-description/jobs");
    return response.data.jobDescriptions;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Create a new job description (triggers auto-parsing)
 */
export const createJob = async (
  title: string,
  description: string,
  experienceLevel: string,
): Promise<Job> => {
  try {
    const response = await api.post("/api/v1/job-description/job", {
      title,
      description,
      experienceLevel,
    });
    return response.data.jobDescription;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Get single job description by ID
 */
export const getJobById = async (id: string): Promise<Job> => {
  try {
    const response = await api.get(`/api/v1/job-description/job/${id}`);
    return response.data.jobDescription;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Delete a job description
 */
export const deleteJob = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/api/v1/job-description/job/${id}`);
    return response.data;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Get experience levels
 */
export const getExperienceLevels = async (): Promise<string[]> => {
  try {
    const response = await api.get("/api/v1/job-description/experience-levels");
    return response.data.experienceLevels;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Manually trigger job description parsing (re-parse)
 */
export const parseJob = async (
  id: string,
): Promise<{ message: string; parsedData: ParsedJobData }> => {
  try {
    const response = await api.post(`/api/v1/job-description/job/${id}/parse`);
    return response.data;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Get parsing status of a job description
 */
export const getParsingStatus = async (
  id: string,
): Promise<ParsingStatusResponse> => {
  try {
    const response = await api.get(`/api/v1/job-description/job/${id}/status`);
    return response.data;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};

/**
 * Get only parsed data for a job description
 */
export const getParsedData = async (
  id: string,
): Promise<ParsedDataResponse> => {
  try {
    const response = await api.get(`/api/v1/job-description/job/${id}/parsed`);
    return response.data;
  } catch (error) {
    console.log("Error", error);
    throw error;
  }
};
