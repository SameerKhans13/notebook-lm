import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GOOGLE_API_KEY is missing from process.env");
    console.error("Environment variables available:", Object.keys(process.env).filter(k => k.includes("GOOGLE") || k.includes("API")));
    throw new Error(
      "GOOGLE_API_KEY is not defined in environment variables. Please set it in Vercel Environment Variables."
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate real AI embedding using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getClient();
    // Using a confirmed model from your account
    const model = client.getGenerativeModel({ model: "gemini-embedding-001" });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    // Return a zero-vector of size 3072 as last resort
    return new Array(3072).fill(0);
  }
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  return Promise.all(texts.map((text) => generateEmbedding(text)));
}

