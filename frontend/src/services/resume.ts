import { api } from "./api";

// ============ INTERFACES ============

interface PersonalInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

interface Experience {
  role: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string;
  duration: string;
  description: string[];
}

interface Education {
  degree: string;
  field: string;
  institution: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  gpa: string | null;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link: string | null;
}

interface Certification {
  name: string;
  issuer: string;
  date: string | null;
}

export interface ParsedData {
  personalInfo: PersonalInfo;
  summary: string | null;
  skills: string[];
  totalExperienceYears: number;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  languages: string[];
  awards: string[];
}

export interface Resume {
  _id: string;
  user: string;
  fileName: string;
  fileType: string;
  s3Key: string;
  fileUrl?: string;
  rawText?: string;
  parsedData?: ParsedData;
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  parsingError?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UploadResponse {
  message: string;
  presignedUrl: string;
  resume: Resume;
}

interface ParsingStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
  data: ParsedData | null;
}

interface ParsedDataResponse {
  fileName: string;
  parsedData: ParsedData;
}

// ============ API FUNCTIONS ============

/**
 * Get all resumes for the logged-in user
 */
export const getResumes = async (): Promise<Resume[]> => {
  try {
    const response = await api.get("/api/v1/resume");
    return response.data.resumes;
  } catch (error) {
    console.error("Error fetching resumes:", error);
    throw error;
  }
};

/**
 * Get single resume by ID with full details
 */
export const getResumeById = async (id: string): Promise<Resume> => {
  try {
    const response = await api.get(`/api/v1/resume/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching resume:", error);
    throw error;
  }
};

/**
 * Upload a new resume (triggers auto-parsing)
 */
export const uploadResume = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await api.post("/api/v1/resume/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
};

/**
 * Delete a resume
 */
export const deleteResume = async (
  id: string,
): Promise<{ message: string }> => {
  try {
    const response = await api.delete(`/api/v1/resume/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
};

/**
 * Manually trigger resume parsing (re-parse)
 */
export const parseResume = async (
  id: string,
): Promise<{ message: string; parsedData: ParsedData }> => {
  try {
    const response = await api.post(`/api/v1/resume/${id}/parse`);
    return response.data;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

/**
 * Get parsing status of a resume
 */
export const getParsingStatus = async (
  id: string,
): Promise<ParsingStatusResponse> => {
  try {
    const response = await api.get(`/api/v1/resume/${id}/status`);
    return response.data;
  } catch (error) {
    console.error("Error fetching parsing status:", error);
    throw error;
  }
};

/**
 * Get only parsed data for a resume
 */
export const getParsedData = async (
  id: string,
): Promise<ParsedDataResponse> => {
  try {
    const response = await api.get(`/api/v1/resume/${id}/parsed`);
    return response.data;
  } catch (error) {
    console.error("Error fetching parsed data:", error);
    throw error;
  }
};
