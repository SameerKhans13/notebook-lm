import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("DEBUG: GOOGLE_API_KEY is missing from process.env");
    throw new Error("GOOGLE_API_KEY is not defined in environment variables");
  }

  // Log first/last chars for debugging 403 errors
  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log(`DEBUG: Using API Key [${maskedKey}], length: ${apiKey.length}`);

  return new GoogleGenerativeAI(apiKey);
};

interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Generate answer using Gemini LLM with retrieved context
 */
export async function generateAnswer(
  query: string,
  context: string,
  options: GenerationOptions = {}
): Promise<string> {
  const {
    temperature = 0.3,
    maxTokens = 1024,
    topP = 0.8,
  } = options;

  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemPrompt = `You are a professional Research Assistant. Answer the question using ONLY the provided context.
STRICT RULES:
1. Start your response with **Synthesis** if you are summarizing multiple units.
2. Use inline citations in the format [Source 1], [Source 2], etc., immediately after the sentence they support.
3. If multiple sources support a claim, use [Source 1, Source 2].
4. Use clear, bold headers for different sections of your answer.
5. If the answer isn't in the context, say "I cannot find this information in the provided units."`;

  const fullPrompt = `${systemPrompt}

CONTEXT FROM DOCUMENT:
${context}

USER QUESTION:
${query}

ANSWER:`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP,
      },
    });

    const response = result.response.text();
    return response || "No response generated";
  } catch (error) {
    console.error("Error generating answer with Gemini:", error);
    throw new Error("Failed to generate answer");
  }
}

/**
 * Generate answer with streaming (for real-time responses)
 */
export async function* generateAnswerStream(
  query: string,
  context: string,
  options: GenerationOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    temperature = 0.3,
    maxTokens = 1024,
    topP = 0.8,
  } = options;

  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemPrompt = `You are a professional Research Assistant. Answer the question using ONLY the provided context.
STRICT RULES:
1. Start your response with **Synthesis** if you are summarizing multiple units.
2. Use inline citations in the format [Source 1], [Source 2], etc., immediately after the sentence they support.
3. If multiple sources support a claim, use [Source 1, Source 2].
4. Use clear, bold headers for different sections of your answer.
5. If the answer isn't in the context, say "I cannot find this information in the provided units."`;

  const fullPrompt = `${systemPrompt}

CONTEXT FROM DOCUMENT:
${context}

USER QUESTION:
${query}

ANSWER:`;

  try {
    const stream = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP,
      },
    });

    for await (const chunk of stream.stream) {
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if ("text" in part && part.text) {
            yield part.text;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in streaming generation:", error);
    throw new Error("Failed to generate answer stream");
  }
}
