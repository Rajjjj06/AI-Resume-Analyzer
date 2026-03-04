import Groq from "groq-sdk";
import Resume from "../model/resume.model.js";
import JobDescription from "../model/job-description.model.js";
import MatchResume from "../model/match-resume.js";
import { findRelevantResumeSections, querySimilar } from "./vector.service.js";
import { logger } from "../config/logger.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Fetch resume by ID
const getResumeById = async (resumeId) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) throw new Error("Resume not found");
  return resume;
};

// Fetch job description by ID
const getJobById = async (jobId) => {
  const job = await JobDescription.findById(jobId);
  if (!job) throw new Error("Job description not found");
  return job;
};

// Build RAG-enhanced prompt for Groq
const buildRAGMatchPrompt = (resume, job, retrievedContext) => {
  const resumeData = resume.parsedData || {};
  const jobData = job.parsedData || {};

  return `
    You are an expert HR analyst. Analyze resume fitness for a job using the retrieved context from our vector database.

    RETRIEVED RESUME CONTEXT (Most relevant sections for this job):
    ${retrievedContext}

    ADDITIONAL RESUME INFO:
    Total Experience: ${resumeData.totalExperienceYears || 0} years
    All Skills: ${JSON.stringify(resumeData.skills || [])}
    Education: ${JSON.stringify(resumeData.education || [])}
    Summary: ${resumeData.summary || "N/A"}

    JOB REQUIREMENTS:
    Title: ${job.title || jobData.jobTitle || "N/A"}
    Company: ${jobData.company || "N/A"}
    Required Skills: ${JSON.stringify(jobData.skills || [])}
    Experience Level: ${job.experienceLevel || jobData.experienceLevel || "N/A"}
    Required Experience Years: ${JSON.stringify(jobData.experienceYears || {})}
    Qualifications: ${JSON.stringify(jobData.qualifications || [])}
    Preferred Qualifications: ${JSON.stringify(jobData.preferredQualifications || [])}
    Responsibilities: ${JSON.stringify(jobData.responsibilities || [])}

    Based on the semantic similarity of resume sections to job requirements, provide a detailed match analysis.

    Respond in JSON format only (no markdown, no code blocks):
    {
      "matchScore": <number 0-100>,
      "matchedSkills": [<list of matching skills>],
      "missingSkills": [<list of skills candidate lacks>],
      "experienceMatch": <true/false>,
      "educationMatch": <true/false>,
      "recommendations": [<list of improvement suggestions>],
      "relevantExperience": [<specific experiences that match job requirements>],
      "strengthAreas": [<areas where candidate excels for this role>],
      "gapAreas": [<areas needing improvement for this role>]
    }
  `;
};

// Fallback prompt when RAG is not available
const buildFallbackMatchPrompt = (resume, job) => {
  const resumeData = resume.parsedData || {};
  const jobData = job.parsedData || {};

  return `
    Analyze the following resume and job description. Provide a detailed match analysis.

    RESUME:
    Skills: ${JSON.stringify(resumeData.skills || [])}
    Total Experience Years: ${resumeData.totalExperienceYears || 0}
    Experience: ${JSON.stringify(resumeData.experience || [])}
    Education: ${JSON.stringify(resumeData.education || [])}
    Summary: ${resumeData.summary || "N/A"}

    JOB DESCRIPTION:
    Title: ${job.title || jobData.jobTitle || "N/A"}
    Company: ${jobData.company || "N/A"}
    Required Skills: ${JSON.stringify(jobData.skills || [])}
    Experience Level: ${job.experienceLevel || jobData.experienceLevel || "N/A"}
    Required Experience Years: ${JSON.stringify(jobData.experienceYears || {})}
    Qualifications: ${JSON.stringify(jobData.qualifications || [])}
    Preferred Qualifications: ${JSON.stringify(jobData.preferredQualifications || [])}
    Responsibilities: ${JSON.stringify(jobData.responsibilities || [])}

    Respond in JSON format only (no markdown, no code blocks):
    {
      "matchScore": <number 0-100>,
      "matchedSkills": [<list of matching skills>],
      "missingSkills": [<list of skills candidate lacks>],
      "experienceMatch": <true/false>,
      "educationMatch": <true/false>,
      "recommendations": [<list of improvement suggestions>]
    }
  `;
};

// Call Groq API for analysis
const analyzeWithGroq = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are an expert HR analyst. Analyze resumes against job descriptions accurately. Always respond in valid JSON only, with no markdown formatting or code blocks.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2048,
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

// Main matching function with RAG
export const matchResumeWithJob = async (userId, resumeId, jobId) => {
  // Check if match already exists
  const existingMatch = await MatchResume.findOne({
    resume: resumeId,
    jobDescription: jobId,
  });

  if (existingMatch) {
    return existingMatch;
  }

  // Fetch data
  const resume = await getResumeById(resumeId);
  const job = await getJobById(jobId);
  const jobData = job.parsedData || {};

  let prompt;
  let useRAG = false;

  // Try to use RAG with vector search
  try {
    logger.info(
      `Attempting RAG-enhanced matching for resume ${resumeId} and job ${jobId}`,
    );

    const relevantSections = await findRelevantResumeSections(
      resumeId.toString(),
      jobData,
      job.title,
    );

    if (relevantSections.length > 0) {
      // Build context from retrieved chunks
      const retrievedContext = relevantSections
        .map(
          (section) =>
            `[${section.metadata.section.toUpperCase()}] (Relevance: ${(section.score * 100).toFixed(1)}%)\n${section.document}`,
        )
        .join("\n\n");

      prompt = buildRAGMatchPrompt(resume, job, retrievedContext);
      useRAG = true;
      logger.info(
        `Using RAG with ${relevantSections.length} relevant sections`,
      );
    } else {
      logger.info(
        "No relevant sections found, falling back to standard matching",
      );
      prompt = buildFallbackMatchPrompt(resume, job);
    }
  } catch (ragError) {
    logger.warn(`RAG matching failed, using fallback: ${ragError.message}`);
    prompt = buildFallbackMatchPrompt(resume, job);
  }

  const analysis = await analyzeWithGroq(prompt);

  // Save match result
  const matchResult = await MatchResume.create({
    user: userId,
    resume: resumeId,
    jobDescription: jobId,
    matchScore: analysis.matchScore,
    matchedSkills: analysis.matchedSkills,
    missingSkills: analysis.missingSkills,
    experienceMatch: analysis.experienceMatch,
    educationMatch: analysis.educationMatch,
    recommendations: analysis.recommendations,
  });

  return matchResult;
};

// Get all matches for a user
export const getUserMatches = async (userId) => {
  return await MatchResume.find({ user: userId })
    .populate("resume", "name")
    .populate("jobDescription", "title company")
    .sort({ createdAt: -1 });
};

// Get single match by ID
export const getMatchById = async (matchId) => {
  return await MatchResume.findById(matchId)
    .populate("resume")
    .populate("jobDescription");
};

// Delete a match
export const deleteMatch = async (matchId, userId) => {
  return await MatchResume.findOneAndDelete({
    _id: matchId,
    user: userId,
  });
};

export const generateInterviewQuestions = async (
  matchId,
  difficulty,
  numberOfQuestions,
) => {
  try {
    const match = await MatchResume.findById(matchId)
      .populate("resume")
      .populate("jobDescription");
    if (!match) throw new Error("Match not found");

    const resume = match.resume;
    const job = match.jobDescription;
    const skills = resume.parsedData?.skills || [];
    const experience = resume.parsedData?.experience || [];
    const experienceYears = calculateExperienceYears(experience);

    // Determine experience level
    const experienceLevel = getExperienceLevel(experienceYears);

    // Job details
    const jobTitle = job.parsedData?.jobTitle || job.title || "the position";
    const jobSkills = job.parsedData?.skills || [];
    const jobResponsibilities = job.parsedData?.responsibilities || [];

    const prompt = buildInterviewQuestionsPrompt({
      jobTitle,
      jobSkills,
      jobResponsibilities,
      candidateSkills: skills,
      candidateExperience: experience,
      experienceLevel,
      difficulty,
      numberOfQuestions,
    });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer and career coach. Generate interview questions that are appropriate for the candidate's experience level and the job requirements. Always provide helpful tips on how to answer each question effectively.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    logger.error("Error generating interview questions:", error);
    throw error;
  }
};

const calculateExperienceYears = (experience) => {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;
  experience.forEach((exp) => {
    if (exp.startDate && exp.endDate) {
      const start = new Date(exp.startDate);
      const end =
        exp.endDate === "Present" ? new Date() : new Date(exp.endDate);
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += months;
    }
  });

  return Math.round(totalMonths / 12);
};

const getExperienceLevel = (years) => {
  if (years < 1) return "Entry Level / Fresher";
  if (years < 3) return "Junior";
  if (years < 5) return "Mid-Level";
  if (years < 8) return "Senior";
  if (years < 12) return "Lead / Staff";
  return "Principal / Architect";
};

const buildInterviewQuestionsPrompt = ({
  jobTitle,
  jobSkills,
  jobResponsibilities,
  candidateSkills,
  candidateExperience,
  experienceLevel,
  difficulty,
  numberOfQuestions,
}) => {
  const difficultyDescriptions = {
    easy: "Basic conceptual questions, fundamental knowledge, simple scenarios",
    medium: "Intermediate complexity, practical application, some edge cases",
    hard: "Advanced concepts, complex scenarios, system design, deep technical knowledge",
  };
  return `
Generate ${numberOfQuestions} interview questions for a ${jobTitle} position.

**Candidate Profile:**
- Experience Level: ${experienceLevel}
- Skills: ${candidateSkills.join(", ")}
- Past Roles: ${candidateExperience.map((e) => e.title || e.position).join(", ")}

**Job Requirements:**
- Required Skills: ${jobSkills.join(", ")}
- Key Responsibilities: ${jobResponsibilities.slice(0, 5).join(", ")}

**Question Difficulty: ${difficulty}**
(${difficultyDescriptions[difficulty] || difficultyDescriptions.medium})

Generate a JSON response with the following structure:
{
  "questions": [
    {
      "id": 1,
      "category": "Technical/Behavioral/Situational/Problem Solving",
      "question": "The interview question",
      "difficulty": "${difficulty}",
      "relatedSkills": ["skill1", "skill2"],
      "expectedTopics": ["topic1", "topic2"],
      "tip": "A helpful tip on how to answer this question effectively, including structure, what to highlight, and common mistakes to avoid",
      "sampleAnswerOutline": "Brief outline of key points to cover in the answer"
    }
  ],
  "metadata": {
    "jobTitle": "${jobTitle}",
    "experienceLevel": "${experienceLevel}",
    "difficulty": "${difficulty}",
    "totalQuestions": ${numberOfQuestions}
  }
}

Mix the questions between:
- Technical questions (based on skills)
- Behavioral questions (STAR format scenarios)
- Situational questions (how would you handle...)
- Problem-solving questions (relevant to the role)

Make the tips actionable and specific to each question.
`;
};
