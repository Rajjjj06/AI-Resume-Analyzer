import pdfParse from "pdf-parse-fork";
import mammoth from "mammoth";
import Groq from "groq-sdk";
import { s3Client, BUCKET_NAME } from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "../config/logger.js";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============ FILE EXTRACTION ============

/**
 * Fetch file from S3
 */
const getFileFromS3 = async (s3Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    const response = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error(`Error fetching file from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Extract text from PDF
 */
const extractFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    logger.error(`Error extracting PDF text: ${error.message}`);
    throw error;
  }
};

/**
 * Extract text from DOCX
 */
const extractFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    logger.error(`Error extracting DOCX text: ${error.message}`);
    throw error;
  }
};

/**
 * Extract text based on file type
 */
export const extractTextFromResume = async (s3Key, fileType) => {
  const buffer = await getFileFromS3(s3Key);

  switch (fileType.toLowerCase()) {
    case "pdf":
      return extractFromPDF(buffer);
    case "docx":
    case "doc":
      return extractFromDOCX(buffer);
    case "txt":
      return buffer.toString("utf-8");
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

// ============ REGEX-BASED EXTRACTION (For Simple Fields) ============

/**
 * Extract email from text
 */
const extractEmail = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0].toLowerCase() : null;
};

/**
 * Extract phone number from text
 */
const extractPhone = (text) => {
  const phonePatterns = [
    /(?:\+91[-.\s]?)?[6-9]\d{9}/, // Indian mobile
    /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // US format
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/, // International
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
};

/**
 * Extract name (usually first prominent text)
 */
const extractName = (text) => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();

    // Skip common headers
    const skipPatterns =
      /^(resume|curriculum|vitae|cv|portfolio|profile|contact|summary|objective)/i;
    if (skipPatterns.test(cleaned)) continue;

    // Skip if contains email or phone
    if (cleaned.includes("@") || /\d{5,}/.test(cleaned)) continue;

    // Name pattern: 2-4 words, mostly letters
    if (
      cleaned.length >= 3 &&
      cleaned.length <= 50 &&
      /^[A-Za-z\s.'-]+$/.test(cleaned)
    ) {
      const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        // Check if words are capitalized (like names)
        const looksLikeName = words.every(
          (w) => /^[A-Z]/.test(w) || w.length <= 2,
        );
        if (looksLikeName) {
          return cleaned;
        }
      }
    }
  }
  return null;
};

/**
 * Extract LinkedIn URL
 */
const extractLinkedIn = (text) => {
  const linkedinRegex =
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi;
  const matches = text.match(linkedinRegex);
  return matches ? matches[0] : null;
};

/**
 * Extract GitHub URL
 */
const extractGitHub = (text) => {
  const githubRegex =
    /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/gi;
  const matches = text.match(githubRegex);
  return matches ? matches[0] : null;
};

/**
 * Extract portfolio/website URL
 */
const extractPortfolio = (text) => {
  // Exclude linkedin and github
  const urlRegex =
    /(?:https?:\/\/)?(?:www\.)?(?!linkedin\.com|github\.com)[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
  const matches = text.match(urlRegex);

  if (matches) {
    // Filter out common non-portfolio URLs
    const filtered = matches.filter(
      (url) =>
        !url.includes("email") &&
        !url.includes("mailto") &&
        !url.includes("google.com") &&
        !url.includes("microsoft.com"),
    );
    return filtered.length > 0 ? filtered[0] : null;
  }
  return null;
};

/**
 * Extract location (basic regex approach)
 */
const extractLocation = (text) => {
  // Common patterns for location
  const locationPatterns = [
    /(?:location|address|city|based in|residing)[:\s]*([A-Za-z\s,]+(?:India|USA|UK|Canada|Australia)?)/i,
    /([A-Za-z]+,\s*[A-Za-z\s]+)(?=\s*[\n|])/,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      if (location.length > 2 && location.length < 50) {
        return location;
      }
    }
  }
  return null;
};

// ============ GROQ LLM EXTRACTION (For Complex Fields) ============

/**
 * Parse complex fields using Groq LLM
 */
const parseComplexFieldsWithGroq = async (rawText) => {
  try {
    const prompt = `You are a resume parser. Extract structured information from the following resume text.

Resume Text:
"""
${rawText}
"""

Extract and return ONLY a valid JSON object (no markdown, no explanation, no code blocks) with this exact structure:

{
  "summary": "professional summary or objective if present, otherwise null",
  "skills": ["array of technical and soft skills mentioned"],
  "totalExperienceYears": 0,
  "experience": [
    {
      "role": "job title",
      "company": "company name",
      "location": "location or null",
      "startDate": "start date (e.g., Jan 2020)",
      "endDate": "end date or Present",
      "duration": "calculated duration (e.g., 2 years 3 months)",
      "description": ["array of job responsibilities and achievements"]
    }
  ],
  "education": [
    {
      "degree": "degree name (e.g., B.Tech, MBA)",
      "field": "field of study (e.g., Computer Science)",
      "institution": "university/college name",
      "location": "location or null",
      "startDate": "start date or null",
      "endDate": "graduation date or null",
      "gpa": "GPA/CGPA if mentioned, otherwise null"
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "brief project description combining all bullet points",
      "technologies": ["extract ALL technologies, frameworks, libraries, APIs mentioned in the project"],
      "link": "project link or null"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "date": "date obtained or null"
    }
  ],
  "languages": ["spoken/written languages if mentioned"],
  "awards": ["awards, achievements, honors if mentioned"]
}

Important Instructions:
1. Calculate totalExperienceYears by summing all work experience durations
2. For skills, extract ALL technical skills (programming languages, frameworks, tools, libraries, APIs) and soft skills - do not limit the count
3. Parse dates in a readable format
4. If a field is not found, use null for strings and empty arrays [] for arrays
5. For projects, extract EVERY technology/framework/library/API mentioned (e.g., React Native, Socket.IO, MongoDB, JWT, Zustand, Firebase, etc.)
6. Return ONLY the JSON object, no additional text`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a precise resume parser. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent output
      max_tokens: 4000,
    });

    let content = completion.choices[0]?.message?.content || "{}";

    // Clean up response - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    }
    if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }

    // Parse JSON
    const parsedData = JSON.parse(content.trim());

    return parsedData;
  } catch (error) {
    logger.error(`Error parsing with Groq: ${error.message}`);

    // Return empty structure on error
    return {
      summary: null,
      skills: [],
      totalExperienceYears: 0,
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      awards: [],
    };
  }
};

// ============ HYBRID PARSING (Regex + Groq) ============

/**
 * Main hybrid parsing function
 * - Regex for: name, email, phone, linkedin, github, portfolio, location
 * - Groq for: summary, skills, experience, education, projects, certifications
 */
export const parseResumeHybrid = async (rawText) => {
  try {
    // Step 1: Extract simple fields with Regex (fast & free)
    logger.info("Extracting personal info with regex...");
    const personalInfo = {
      name: extractName(rawText),
      email: extractEmail(rawText),
      phone: extractPhone(rawText),
      location: extractLocation(rawText),
      linkedin: extractLinkedIn(rawText),
      github: extractGitHub(rawText),
      portfolio: extractPortfolio(rawText),
    };

    logger.info(`Personal info extracted: ${JSON.stringify(personalInfo)}`);

    // Step 2: Extract complex fields with Groq LLM
    logger.info("Extracting complex fields with Groq LLM...");
    const complexData = await parseComplexFieldsWithGroq(rawText);

    // Step 3: Combine results
    const parsedData = {
      personalInfo,
      summary: complexData.summary || null,
      skills: complexData.skills || [],
      totalExperienceYears: complexData.totalExperienceYears || 0,
      experience: complexData.experience || [],
      education: complexData.education || [],
      projects: complexData.projects || [],
      certifications: complexData.certifications || [],
      languages: complexData.languages || [],
      awards: complexData.awards || [],
    };

    return parsedData;
  } catch (error) {
    logger.error(`Error in hybrid parsing: ${error.message}`);
    throw error;
  }
};

// ============ MAIN PROCESS FUNCTION ============

/**
 * Main function to extract text and parse resume
 */
export const processResume = async (s3Key, fileType) => {
  try {
    // Step 1: Extract raw text from file
    logger.info(`Extracting text from ${fileType} file...`);
    const rawText = await extractTextFromResume(s3Key, fileType);
    logger.info(`Extracted ${rawText.length} characters from resume`);

    // Step 2: Parse with hybrid approach
    logger.info("Starting hybrid parsing...");
    const parsedData = await parseResumeHybrid(rawText);
    logger.info("Resume parsing completed successfully");

    return {
      rawText,
      parsedData,
    };
  } catch (error) {
    logger.error(`Error processing resume: ${error.message}`);
    throw error;
  }
};

export default {
  extractTextFromResume,
  parseResumeHybrid,
  processResume,
};
