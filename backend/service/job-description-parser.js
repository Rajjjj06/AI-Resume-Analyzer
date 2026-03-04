import Groq from "groq-sdk";
import { logger } from "../config/logger.js";

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============ REGEX-BASED EXTRACTION ============

/**
 * Extract experience requirements from text
 */
const extractExperienceRequired = (text) => {
  const patterns = [
    /(\d+)\+?\s*(?:to|-)\s*(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
    /(?:minimum|at least|atleast)\s*(\d+)\s*(?:years?|yrs?)/i,
    /(?:experience|exp)[:\s]*(\d+)\+?\s*(?:years?|yrs?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        return {
          min: parseInt(match[1]),
          max: parseInt(match[2]),
          text: match[0],
        };
      }
      return {
        min: parseInt(match[1]),
        max: null,
        text: match[0],
      };
    }
  }

  // Check for experience level keywords
  const levelPatterns = {
    entry: /\b(entry[\s-]?level|junior|fresher|graduate|0-1\s*years?)\b/i,
    mid: /\b(mid[\s-]?level|intermediate|2-5\s*years?)\b/i,
    senior: /\b(senior|lead|principal|staff|5\+?\s*years?|6\+?\s*years?)\b/i,
    executive:
      /\b(director|vp|vice\s*president|c-level|executive|head\s*of)\b/i,
  };

  for (const [level, pattern] of Object.entries(levelPatterns)) {
    if (pattern.test(text)) {
      return {
        min:
          level === "entry"
            ? 0
            : level === "mid"
              ? 2
              : level === "senior"
                ? 5
                : 10,
        max: null,
        text: level,
        level,
      };
    }
  }

  return null;
};

/**
 * Extract salary information
 */
const extractSalary = (text) => {
  const patterns = [
    /(?:salary|compensation|pay|ctc)[:\s]*(?:₹|Rs\.?|INR|USD|\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|K|lakh|lac|lpa|per\s*annum)?(?:\s*(?:to|-)\s*(?:₹|Rs\.?|INR|USD|\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:k|K|lakh|lac|lpa)?)?/i,
    /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d{3})*)\s*(?:to|-)\s*(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d{3})*)/i,
    /\$\s*(\d+(?:,\d{3})*)\s*(?:to|-)\s*\$?\s*(\d+(?:,\d{3})*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        min: match[1]?.replace(/,/g, ""),
        max: match[2]?.replace(/,/g, "") || null,
        text: match[0],
      };
    }
  }
  return null;
};

/**
 * Extract location from text
 */
const extractLocation = (text) => {
  const patterns = [
    /(?:location|based in|office)[:\s]*([A-Za-z\s,]+?)(?:\n|$|\.)/i,
    /\b(remote|hybrid|on-?site|work from home|wfh)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0];
    }
  }
  return null;
};

/**
 * Extract job type (full-time, part-time, contract, etc.)
 */
const extractJobType = (text) => {
  const patterns = [
    /\b(full[\s-]?time|part[\s-]?time|contract|freelance|internship|temporary|permanent)\b/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toLowerCase().replace(/[\s-]+/g, "-");
    }
  }
  return null;
};

/**
 * Extract company name (basic approach)
 */
const extractCompanyName = (text) => {
  const patterns = [
    /(?:company|organization|employer)[:\s]*([A-Za-z0-9\s&.,-]+?)(?:\n|$|\.)/i,
    /(?:about|join)\s+([A-Z][A-Za-z0-9\s&.,-]{2,30})(?:\n|,|\.)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50) {
        return name;
      }
    }
  }
  return null;
};

// ============ GROQ LLM EXTRACTION ============

/**
 * Parse complex fields using Groq LLM
 */
const parseJobDescriptionWithGroq = async (rawText, title = null) => {
  try {
    const prompt = `You are a job description parser. Extract structured information from the following job description text.

Job Description Text:
"""
${rawText}
"""

Extract and return ONLY a valid JSON object (no markdown, no explanation, no code blocks) with this exact structure:

{
  "jobTitle": "${title || "extract the job title from the text"}",
  "company": "company name if mentioned, otherwise null",
  "location": "job location if mentioned (city, state, country, or remote/hybrid)",
  "jobType": "full-time, part-time, contract, internship, or null",
  "experienceLevel": "entry, mid, senior, or executive based on requirements",
  "experienceYears": {
    "min": minimum years required (number),
    "max": maximum years or null
  },
  "salary": {
    "min": "minimum salary if mentioned",
    "max": "maximum salary or null",
    "currency": "currency code (INR, USD, etc.) or null"
  },
  "skills": ["array of ALL required technical skills, tools, technologies, frameworks"],
  "responsibilities": ["array of job responsibilities/duties"],
  "qualifications": ["array of required qualifications (education, certifications, etc.)"],
  "preferredQualifications": ["array of nice-to-have or preferred qualifications"],
  "benefits": ["array of benefits if mentioned (health insurance, PTO, etc.)"],
  "summary": "brief 1-2 sentence summary of the role"
}

Important Instructions:
1. Extract ALL skills mentioned - programming languages, frameworks, tools, databases, cloud platforms, etc.
2. Separate required qualifications from preferred/nice-to-have ones
3. If salary is in LPA (Lakhs Per Annum), keep it as is
4. For experienceLevel: entry (0-2 yrs), mid (2-5 yrs), senior (5+ yrs), executive (director+)
5. Return ONLY the JSON object, no additional text`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a precise job description parser. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    let content = completion.choices[0]?.message?.content || "{}";

    // Clean up response
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

    const parsedData = JSON.parse(content.trim());
    return parsedData;
  } catch (error) {
    logger.error(`Error parsing job description with Groq: ${error.message}`);

    // Return empty structure on error
    return {
      jobTitle: null,
      company: null,
      location: null,
      jobType: null,
      experienceLevel: null,
      experienceYears: { min: null, max: null },
      salary: { min: null, max: null, currency: null },
      skills: [],
      responsibilities: [],
      qualifications: [],
      preferredQualifications: [],
      benefits: [],
      summary: null,
    };
  }
};

// ============ HYBRID PARSING ============

/**
 * Main hybrid parsing function for job descriptions
 * - Regex for: experience years, salary, location, job type
 * - Groq for: skills, responsibilities, qualifications, summary
 */
export const parseJobDescriptionHybrid = async (rawText, title = null) => {
  try {
    // Step 1: Extract simple fields with Regex
    logger.info("Extracting basic job info with regex...");
    const regexData = {
      experienceRequired: extractExperienceRequired(rawText),
      salary: extractSalary(rawText),
      location: extractLocation(rawText),
      jobType: extractJobType(rawText),
      company: extractCompanyName(rawText),
    };

    logger.info(`Basic info extracted: ${JSON.stringify(regexData)}`);

    // Step 2: Extract complex fields with Groq LLM
    logger.info("Extracting detailed job info with Groq LLM...");
    const llmData = await parseJobDescriptionWithGroq(rawText, title);

    // Step 3: Combine results (prefer regex for structured fields, LLM for complex)
    const parsedData = {
      jobTitle: title || llmData.jobTitle,
      company: regexData.company || llmData.company,
      location: regexData.location || llmData.location,
      jobType: regexData.jobType || llmData.jobType,
      experienceLevel: llmData.experienceLevel,
      experienceYears: regexData.experienceRequired
        ? {
            min: regexData.experienceRequired.min,
            max: regexData.experienceRequired.max,
          }
        : llmData.experienceYears,
      salary: regexData.salary
        ? {
            min: regexData.salary.min,
            max: regexData.salary.max,
            currency: null,
          }
        : llmData.salary,
      skills: llmData.skills || [],
      responsibilities: llmData.responsibilities || [],
      qualifications: llmData.qualifications || [],
      preferredQualifications: llmData.preferredQualifications || [],
      benefits: llmData.benefits || [],
      summary: llmData.summary,
    };

    return parsedData;
  } catch (error) {
    logger.error(`Error in hybrid job description parsing: ${error.message}`);
    throw error;
  }
};

/**
 * Main function to parse job description
 */
export const processJobDescription = async (rawText, title = null) => {
  try {
    logger.info("Starting job description parsing...");
    const parsedData = await parseJobDescriptionHybrid(rawText, title);
    logger.info("Job description parsing completed successfully");

    return {
      rawText,
      parsedData,
    };
  } catch (error) {
    logger.error(`Error processing job description: ${error.message}`);
    throw error;
  }
};

export default {
  parseJobDescriptionHybrid,
  processJobDescription,
};
