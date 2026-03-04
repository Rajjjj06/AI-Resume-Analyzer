import { ChromaClient } from "chromadb";
import { pipeline } from "@xenova/transformers";
import { logger } from "../config/logger.js";

// Suppress noisy ChromaDB deserialization warnings (we pass embeddings directly)
const _origConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("No embedding function configuration found") ||
    msg.includes(
      "Cannot instantiate a collection with the DefaultEmbeddingFunction",
    )
  ) {
    return; // silently ignore
  }
  _origConsoleWarn.apply(console, args);
};

// ChromaDB availability flag
let chromaAvailable = false;
let chroma = null;

// Initialize ChromaDB client with connection check
const initChroma = async () => {
  if (chroma !== null) return chromaAvailable;

  try {
    chroma = new ChromaClient({
      path: process.env.CHROMA_URL || "http://localhost:8000",
    });

    // Test connection by getting heartbeat
    await chroma.heartbeat();
    chromaAvailable = true;
    logger.info("ChromaDB connection established successfully");
  } catch (error) {
    chromaAvailable = false;
    logger.warn(
      `ChromaDB not available: ${error.message}. RAG features will be disabled.`,
    );
  }

  return chromaAvailable;
};

// Initialize on module load (non-blocking)
initChroma().catch(() => {});

// Embedding pipeline (singleton)
let embeddingPipeline = null;

/**
 * Check if ChromaDB is available
 */
export const isChromaAvailable = async () => {
  if (chroma === null) {
    await initChroma();
  }
  return chromaAvailable;
};

/**
 * Get or initialize the embedding pipeline
 */
const getEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    logger.info("Initializing embedding model...");
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    logger.info("Embedding model loaded successfully");
  }
  return embeddingPipeline;
};

/**
 * Generate embeddings for text using local transformer model
 */
export const generateEmbedding = async (text) => {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

/**
 * Custom embedding function for ChromaDB
 */
class CustomEmbeddingFunction {
  async generate(texts) {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

const embeddingFunction = new CustomEmbeddingFunction();

/**
 * Get or create a collection in ChromaDB
 * We provide our custom embedding function so ChromaDB doesn't
 * try to instantiate the DefaultEmbeddingFunction.
 */
export const getCollection = async (collectionName) => {
  const available = await isChromaAvailable();
  if (!available) {
    throw new Error("ChromaDB is not available");
  }

  try {
    return await chroma.getOrCreateCollection({
      name: collectionName,
      metadata: { "hnsw:space": "cosine" },
      embeddingFunction: embeddingFunction,
    });
  } catch (error) {
    logger.error(
      `Error getting collection ${collectionName}: ${error.message}`,
    );
    throw error;
  }
};

/**
 * Chunk resume data into meaningful sections
 */
export const chunkResumeData = (parsedData) => {
  const chunks = [];

  // Skills chunk
  if (parsedData.skills?.length > 0) {
    chunks.push({
      section: "skills",
      content: `Skills and Technologies: ${parsedData.skills.join(", ")}`,
    });
  }

  // Summary chunk
  if (parsedData.summary) {
    chunks.push({
      section: "summary",
      content: `Professional Summary: ${parsedData.summary}`,
    });
  }

  // Experience chunks (one per job)
  parsedData.experience?.forEach((exp, i) => {
    const descriptions = exp.description?.join(" ") || "";
    chunks.push({
      section: "experience",
      content: `Work Experience: ${exp.role} at ${exp.company}${exp.location ? ` in ${exp.location}` : ""}. Duration: ${exp.duration || `${exp.startDate} - ${exp.endDate}`}. Responsibilities and achievements: ${descriptions}`,
      metadata: { index: i, company: exp.company, role: exp.role },
    });
  });

  // Education chunks
  parsedData.education?.forEach((edu, i) => {
    chunks.push({
      section: "education",
      content: `Education: ${edu.degree}${edu.field ? ` in ${edu.field}` : ""} from ${edu.institution}${edu.location ? ` in ${edu.location}` : ""}${edu.gpa ? `. GPA: ${edu.gpa}` : ""}`,
      metadata: { index: i, institution: edu.institution },
    });
  });

  // Projects chunks
  parsedData.projects?.forEach((proj, i) => {
    chunks.push({
      section: "projects",
      content: `Project: ${proj.name}. Description: ${proj.description}. Technologies used: ${proj.technologies?.join(", ") || "N/A"}`,
      metadata: { index: i, name: proj.name },
    });
  });

  // Certifications chunk
  if (parsedData.certifications?.length > 0) {
    const certText = parsedData.certifications
      .map((c) => `${c.name} by ${c.issuer}`)
      .join(", ");
    chunks.push({
      section: "certifications",
      content: `Certifications: ${certText}`,
    });
  }

  return chunks;
};

/**
 * Chunk job description data into meaningful sections
 */
export const chunkJobData = (parsedData, title) => {
  const chunks = [];

  // Job title and summary
  chunks.push({
    section: "overview",
    content: `Job Title: ${title || parsedData.jobTitle}. Company: ${parsedData.company || "N/A"}. Location: ${parsedData.location || "N/A"}. Job Type: ${parsedData.jobType || "N/A"}. Experience Level: ${parsedData.experienceLevel || "N/A"}.${parsedData.summary ? ` Summary: ${parsedData.summary}` : ""}`,
  });

  // Required skills
  if (parsedData.skills?.length > 0) {
    chunks.push({
      section: "skills",
      content: `Required Skills and Technologies: ${parsedData.skills.join(", ")}`,
    });
  }

  // Responsibilities
  if (parsedData.responsibilities?.length > 0) {
    chunks.push({
      section: "responsibilities",
      content: `Job Responsibilities: ${parsedData.responsibilities.join(". ")}`,
    });
  }

  // Qualifications
  if (parsedData.qualifications?.length > 0) {
    chunks.push({
      section: "qualifications",
      content: `Required Qualifications: ${parsedData.qualifications.join(". ")}`,
    });
  }

  // Preferred qualifications
  if (parsedData.preferredQualifications?.length > 0) {
    chunks.push({
      section: "preferred",
      content: `Preferred Qualifications: ${parsedData.preferredQualifications.join(". ")}`,
    });
  }

  // Experience requirements
  if (parsedData.experienceYears?.min || parsedData.experienceYears?.max) {
    chunks.push({
      section: "experience_req",
      content: `Experience Required: ${parsedData.experienceYears.min || 0} - ${parsedData.experienceYears.max || "N/A"} years`,
    });
  }

  return chunks;
};

/**
 * Store resume embeddings in ChromaDB
 */
export const storeResumeEmbeddings = async (userId, resumeId, parsedData) => {
  const available = await isChromaAvailable();
  if (!available) {
    logger.warn(
      `ChromaDB not available, skipping embeddings for resume ${resumeId}`,
    );
    return [];
  }

  const collection = await getCollection("resumes");
  const chunks = chunkResumeData(parsedData);

  if (chunks.length === 0) {
    logger.warn(`No chunks to store for resume ${resumeId}`);
    return [];
  }

  const ids = [];
  const embeddings = [];
  const documents = [];
  const metadatas = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vectorId = `resume-${resumeId}-${chunk.section}-${i}`;

    ids.push(vectorId);
    embeddings.push(await generateEmbedding(chunk.content));
    documents.push(chunk.content);
    metadatas.push({
      userId: userId.toString(),
      sourceId: resumeId.toString(),
      sourceType: "resume",
      section: chunk.section,
      ...(chunk.metadata || {}),
    });

    chunk.vectorId = vectorId;
  }

  // Upsert to ChromaDB
  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  logger.info(`Stored ${chunks.length} vectors for resume ${resumeId}`);
  return chunks;
};

/**
 * Store job description embeddings in ChromaDB
 */
export const storeJobEmbeddings = async (userId, jobId, parsedData, title) => {
  const available = await isChromaAvailable();
  if (!available) {
    logger.warn(`ChromaDB not available, skipping embeddings for job ${jobId}`);
    return [];
  }

  const collection = await getCollection("jobs");
  const chunks = chunkJobData(parsedData, title);

  if (chunks.length === 0) {
    logger.warn(`No chunks to store for job ${jobId}`);
    return [];
  }

  const ids = [];
  const embeddings = [];
  const documents = [];
  const metadatas = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vectorId = `job-${jobId}-${chunk.section}-${i}`;

    ids.push(vectorId);
    embeddings.push(await generateEmbedding(chunk.content));
    documents.push(chunk.content);
    metadatas.push({
      userId: userId.toString(),
      sourceId: jobId.toString(),
      sourceType: "job",
      section: chunk.section,
      ...(chunk.metadata || {}),
    });

    chunk.vectorId = vectorId;
  }

  // Upsert to ChromaDB
  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  logger.info(`Stored ${chunks.length} vectors for job ${jobId}`);
  return chunks;
};

/**
 * Query similar documents from a collection
 */
export const querySimilar = async (
  collectionName,
  queryText,
  filters = {},
  nResults = 5,
) => {
  const available = await isChromaAvailable();
  if (!available) {
    logger.warn("ChromaDB not available, returning empty results");
    return [];
  }

  const collection = await getCollection(collectionName);
  const queryEmbedding = await generateEmbedding(queryText);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    where: Object.keys(filters).length > 0 ? filters : undefined,
    include: ["documents", "metadatas", "distances"],
  });

  // Format results
  const matches = [];
  if (results.ids[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      matches.push({
        id: results.ids[0][i],
        document: results.documents[0][i],
        metadata: results.metadatas[0][i],
        distance: results.distances[0][i],
        score: 1 - results.distances[0][i], // Convert distance to similarity score
      });
    }
  }

  return matches;
};

/**
 * Find relevant resume sections for a job description
 */
export const findRelevantResumeSections = async (resumeId, jobData, title) => {
  const available = await isChromaAvailable();
  if (!available) {
    logger.warn(
      "ChromaDB not available, returning empty results for findRelevantResumeSections",
    );
    return [];
  }

  const queries = [];

  // Query for skills match
  if (jobData.skills?.length > 0) {
    queries.push({
      query: `Skills required: ${jobData.skills.join(", ")}`,
      type: "skills",
    });
  }

  // Query for experience match
  if (jobData.responsibilities?.length > 0) {
    queries.push({
      query: `Work experience with: ${jobData.responsibilities.slice(0, 3).join(". ")}`,
      type: "experience",
    });
  }

  // Query for qualifications match
  if (jobData.qualifications?.length > 0) {
    queries.push({
      query: `Qualifications: ${jobData.qualifications.slice(0, 3).join(". ")}`,
      type: "qualifications",
    });
  }

  // General job match query
  queries.push({
    query: `${title || jobData.jobTitle} with ${jobData.skills?.slice(0, 5).join(", ")} experience`,
    type: "general",
  });

  const allMatches = [];
  const seenIds = new Set();

  for (const q of queries) {
    const matches = await querySimilar(
      "resumes",
      q.query,
      { sourceId: resumeId.toString() },
      3,
    );

    for (const match of matches) {
      if (!seenIds.has(match.id)) {
        seenIds.add(match.id);
        allMatches.push({ ...match, queryType: q.type });
      }
    }
  }

  // Sort by relevance score
  allMatches.sort((a, b) => b.score - a.score);

  return allMatches;
};

/**
 * Delete embeddings for a document
 */
export const deleteEmbeddings = async (collectionName, sourceId) => {
  const available = await isChromaAvailable();
  if (!available) {
    logger.warn(`ChromaDB not available, skipping delete for ${sourceId}`);
    return;
  }

  try {
    const collection = await getCollection(collectionName);
    await collection.delete({
      where: { sourceId: sourceId.toString() },
    });
    logger.info(`Deleted embeddings for ${sourceId} from ${collectionName}`);
  } catch (error) {
    logger.error(`Error deleting embeddings: ${error.message}`);
  }
};

/**
 * Get embedding statistics for a collection
 */
export const getCollectionStats = async (collectionName) => {
  const available = await isChromaAvailable();
  if (!available) {
    return { name: collectionName, count: 0, available: false };
  }

  const collection = await getCollection(collectionName);
  const count = await collection.count();
  return { name: collectionName, count, available: true };
};
