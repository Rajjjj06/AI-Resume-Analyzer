import Groq from "groq-sdk";
import Resume from "../model/resume.model.js";
import JobDescription from "../model/job-description.model.js";
import { findRelevantResumeSections, querySimilar } from "./vector.service.js";
import { logger } from "../config/logger.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Call Groq API with a prompt
 */
const analyzeWithGroq = async (prompt, systemPrompt) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  let content = response.choices[0]?.message?.content;

  // Remove markdown code blocks if present
  if (content) {
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    } else if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    logger.error("Failed to parse Groq response:", content);
    throw new Error("Failed to parse AI response");
  }
};

/**
 * Calculate ATS score for a resume, optionally against a specific job
 */
export const calculateATSScore = async (resumeId, jobId = null) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const resumeData = resume.parsedData || {};
  let jobContext = "";
  let jobSkills = [];

  // If job provided, use RAG to find relevant sections
  if (jobId) {
    const job = await JobDescription.findById(jobId);
    if (job) {
      const jobData = job.parsedData || {};
      jobSkills = jobData.skills || [];

      try {
        // Find how resume sections match job requirements
        const matches = await findRelevantResumeSections(
          resumeId.toString(),
          jobData,
          job.title,
        );

        if (matches.length > 0) {
          const matchContext = matches
            .map(
              (m) =>
                `[${m.metadata.section}] (${(m.score * 100).toFixed(0)}% match): ${m.document}`,
            )
            .join("\n\n");

          jobContext = `
TARGET JOB: ${job.title}
REQUIRED SKILLS: ${jobSkills.join(", ")}
RESPONSIBILITIES: ${jobData.responsibilities?.slice(0, 5).join("; ") || "N/A"}
QUALIFICATIONS: ${jobData.qualifications?.slice(0, 3).join("; ") || "N/A"}

MATCHING RESUME SECTIONS (from vector search):
${matchContext}
`;
        }
      } catch (ragError) {
        logger.warn(`RAG failed for ATS scoring: ${ragError.message}`);
        jobContext = `
TARGET JOB: ${job.title}
REQUIRED SKILLS: ${jobSkills.join(", ")}
`;
      }
    }
  }

  const prompt = `
Analyze this resume for ATS (Applicant Tracking System) compatibility and provide detailed scoring.

RESUME DATA:
Name: ${resumeData.personalInfo?.name || "N/A"}
Email: ${resumeData.personalInfo?.email || "N/A"}
Skills: ${resumeData.skills?.join(", ") || "None listed"}
Total Experience: ${resumeData.totalExperienceYears || 0} years
Number of Positions: ${resumeData.experience?.length || 0}
Education: ${resumeData.education?.map((e) => `${e.degree} in ${e.field} from ${e.institution}`).join("; ") || "N/A"}
Projects: ${resumeData.projects?.length || 0}
Certifications: ${resumeData.certifications?.length || 0}
Summary: ${resumeData.summary || "None"}

${jobContext}

Analyze the resume and provide a JSON response with:
{
  "overallScore": <number 0-100>,
  "breakdown": {
    "formatting": {
      "score": <number 0-100>,
      "issues": [<specific formatting issues found>],
      "tips": [<actionable improvement suggestions>]
    },
    "keywords": {
      "score": <number 0-100>,
      "matched": [<keywords found that match common ATS requirements${jobId ? " and job requirements" : ""}>],
      "missing": [<important keywords that should be added>],
      "tips": [<suggestions for keyword optimization>]
    },
    "readability": {
      "score": <number 0-100>,
      "issues": [<readability problems>],
      "tips": [<suggestions for improvement>]
    },
    "structure": {
      "score": <number 0-100>,
      "issues": [<structural problems like missing sections>],
      "tips": [<suggestions for better organization>]
    },
    "experience": {
      "score": <number 0-100>,
      "strengths": [<strong points in experience section>],
      "weaknesses": [<areas needing improvement>]
    }
  },
  "suggestions": [<top 5 prioritized improvements to increase ATS score>],
  "passLikelihood": "<high/medium/low> - likelihood of passing ATS screening"
}
`;

  const systemPrompt =
    "You are an ATS (Applicant Tracking System) expert. Analyze resumes for ATS compatibility and provide detailed, actionable feedback. Always respond in valid JSON only.";

  const result = await analyzeWithGroq(prompt, systemPrompt);
  return result;
};

/**
 * Generate interview questions based on resume and job description
 */
export const generateInterviewQuestions = async (resumeId, jobId) => {
  const resume = await Resume.findById(resumeId);
  const job = await JobDescription.findById(jobId);

  if (!resume || !job) {
    throw new Error("Resume or job not found");
  }

  const resumeData = resume.parsedData || {};
  const jobData = job.parsedData || {};

  let ragContext = "";

  // Use RAG to find relevant resume sections for generating questions
  try {
    const relevantSections = await findRelevantResumeSections(
      resumeId.toString(),
      jobData,
      job.title,
    );

    if (relevantSections.length > 0) {
      ragContext = `
RELEVANT RESUME SECTIONS FOR THIS JOB:
${relevantSections.map((s) => `[${s.metadata.section}]: ${s.document}`).join("\n\n")}
`;
    }
  } catch (ragError) {
    logger.warn(`RAG failed for interview questions: ${ragError.message}`);
  }

  const prompt = `
Generate interview questions based on the candidate's resume and the job requirements.

JOB DETAILS:
Title: ${job.title}
Required Skills: ${jobData.skills?.join(", ") || "N/A"}
Experience Level: ${job.experienceLevel}
Responsibilities: ${jobData.responsibilities?.join("; ") || "N/A"}
Qualifications: ${jobData.qualifications?.join("; ") || "N/A"}

CANDIDATE RESUME:
Skills: ${resumeData.skills?.join(", ") || "N/A"}
Experience: ${resumeData.totalExperienceYears || 0} years
Summary: ${resumeData.summary || "N/A"}
${ragContext}

Generate a JSON response with categorized interview questions:
{
  "technicalQuestions": [
    {
      "question": "<technical question based on job requirements>",
      "expectedTopics": [<topics candidate should cover>],
      "difficulty": "<easy/medium/hard>",
      "rationale": "<why this question is relevant>"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "<behavioral/STAR format question>",
      "competencyTested": "<leadership/teamwork/problem-solving/etc>",
      "expectedTopics": [<topics to cover>]
    }
  ],
  "experienceQuestions": [
    {
      "question": "<question about specific experience from resume>",
      "context": "<which resume section this relates to>",
      "followUpQuestions": [<2-3 follow-up questions>]
    }
  ],
  "skillGapQuestions": [
    {
      "question": "<question about skills the job requires but not clearly on resume>",
      "skill": "<the skill being probed>",
      "purpose": "<why this question helps assess the gap>"
    }
  ],
  "closingQuestions": [
    "<question for candidate to ask>"
  ]
}

Generate 3-4 questions per category, tailored specifically to this candidate and role.
`;

  const systemPrompt =
    "You are an expert technical interviewer. Generate insightful, relevant interview questions that assess both technical skills and cultural fit. Always respond in valid JSON only.";

  return await analyzeWithGroq(prompt, systemPrompt);
};

/**
 * Generate resume improvement suggestions
 */
export const generateResumeImprovements = async (resumeId, jobId = null) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const resumeData = resume.parsedData || {};
  let jobContext = "";

  if (jobId) {
    const job = await JobDescription.findById(jobId);
    if (job) {
      const jobData = job.parsedData || {};

      // Use RAG to understand gaps
      try {
        const relevantSections = await findRelevantResumeSections(
          resumeId.toString(),
          jobData,
          job.title,
        );

        const lowScoreSections = relevantSections.filter((s) => s.score < 0.7);

        jobContext = `
TARGET JOB: ${job.title}
REQUIRED SKILLS: ${jobData.skills?.join(", ") || "N/A"}
KEY RESPONSIBILITIES: ${jobData.responsibilities?.slice(0, 5).join("; ") || "N/A"}
QUALIFICATIONS: ${jobData.qualifications?.join("; ") || "N/A"}

AREAS WITH LOWER SEMANTIC MATCH (need improvement):
${lowScoreSections.map((s) => `[${s.metadata.section}] (${(s.score * 100).toFixed(0)}% match): ${s.document.substring(0, 200)}...`).join("\n")}
`;
      } catch (ragError) {
        logger.warn(`RAG failed for improvements: ${ragError.message}`);
        const job = await JobDescription.findById(jobId);
        jobContext = `
TARGET JOB: ${job.title}
REQUIRED SKILLS: ${job.parsedData?.skills?.join(", ") || "N/A"}
`;
      }
    }
  }

  const prompt = `
Analyze this resume and provide detailed improvement suggestions.

CURRENT RESUME:
Personal Info: ${JSON.stringify(resumeData.personalInfo || {})}
Summary: ${resumeData.summary || "None"}
Skills: ${resumeData.skills?.join(", ") || "None"}
Experience (${resumeData.experience?.length || 0} positions):
${resumeData.experience?.map((e) => `- ${e.role} at ${e.company} (${e.duration})`).join("\n") || "None"}
Education:
${resumeData.education?.map((e) => `- ${e.degree} in ${e.field} from ${e.institution}`).join("\n") || "None"}
Projects: ${resumeData.projects?.length || 0}
Certifications: ${resumeData.certifications?.length || 0}

${jobContext}

Provide a JSON response with actionable improvements:
{
  "prioritizedImprovements": [
    {
      "priority": 1,
      "section": "<summary/skills/experience/education/etc>",
      "issue": "<what's wrong or missing>",
      "suggestion": "<specific improvement>",
      "example": "<example of improved content if applicable>",
      "impact": "<high/medium/low>"
    }
  ],
  "summaryRewrite": {
    "current": "<current summary or 'None'>",
    "suggested": "<improved summary tailored to career/job>",
    "keyChanges": [<what was improved>]
  },
  "skillsOptimization": {
    "keep": [<skills to keep as-is>],
    "rephrase": [{"from": "<current>", "to": "<better phrasing>"}],
    "add": [<skills to consider adding if candidate has them>],
    "remove": [<skills that may not add value>]
  },
  "experienceBulletImprovements": [
    {
      "position": "<role at company>",
      "originalBullet": "<example original bullet>",
      "improvedBullet": "<improved version with metrics/results>",
      "technique": "<STAR/CAR/XYZ method used>"
    }
  ],
  "formatSuggestions": [
    "<formatting improvement suggestions>"
  ],
  "overallAssessment": {
    "currentStrength": "<what's good about the resume>",
    "biggestGap": "<most important area to improve>",
    "estimatedImprovementPotential": "<percentage improvement possible>"
  }
}

Provide 5-7 prioritized improvements and specific examples where possible.
`;

  const systemPrompt =
    "You are an expert resume writer and career coach. Provide specific, actionable resume improvements. Use industry best practices and ATS optimization techniques. Always respond in valid JSON only.";

  return await analyzeWithGroq(prompt, systemPrompt);
};

/**
 * Find best matching jobs for a resume
 */
export const findMatchingJobs = async (userId, resumeId, limit = 5) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error("Resume not found");
  }

  const resumeData = resume.parsedData || {};

  // Build search query from resume
  const searchQuery = [
    resumeData.skills?.slice(0, 10).join(" "),
    resumeData.summary,
    resumeData.experience
      ?.slice(0, 2)
      .map((e) => e.role)
      .join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  // Search for matching job sections in vector database
  try {
    const matches = await querySimilar(
      "jobs",
      searchQuery,
      { userId: userId.toString() },
      limit * 2, // Get more results to deduplicate by job
    );

    // Deduplicate by job ID and get top matches
    const seenJobs = new Set();
    const topJobs = [];

    for (const match of matches) {
      const jobId = match.metadata.sourceId;
      if (!seenJobs.has(jobId)) {
        seenJobs.add(jobId);
        topJobs.push({
          jobId,
          section: match.metadata.section,
          score: match.score,
          content: match.document,
        });
        if (topJobs.length >= limit) break;
      }
    }

    // Fetch full job details
    const jobIds = topJobs.map((j) => j.jobId);
    const jobs = await JobDescription.find({ _id: { $in: jobIds } });

    // Combine with scores
    const results = topJobs
      .map((match) => {
        const job = jobs.find((j) => j._id.toString() === match.jobId);
        return {
          job: job
            ? {
                _id: job._id,
                title: job.title,
                description: job.description?.substring(0, 200) + "...",
                experienceLevel: job.experienceLevel,
                parsedData: job.parsedData,
              }
            : null,
          relevanceScore: Math.round(match.score * 100),
          matchedOn: match.section,
        };
      })
      .filter((r) => r.job !== null);

    return results;
  } catch (error) {
    logger.error(`Error finding matching jobs: ${error.message}`);
    throw error;
  }
};
