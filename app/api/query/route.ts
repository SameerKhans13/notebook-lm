import { NextRequest, NextResponse } from "next/server";
import { VectorStore } from "@/lib/vectorstore";
import { generateAnswer } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { query, documentId, contextLimit = 5, temperature = 0.3 } =
      await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Search for relevant chunks
    const vectorStore = new VectorStore();

    const relevantChunks = await vectorStore.search(
      query,
      contextLimit,
      0.2 // Lower threshold to get more results if needed
    );

    if (relevantChunks.length === 0) {
      return NextResponse.json(
        {
          answer:
            "I could not find relevant information in the document to answer your query. Please try rephrasing your question.",
          relevantChunks: [],
          sources: [],
        },
        { status: 200 }
      );
    }

    // Combine chunks into context
    const context = relevantChunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}]\n${chunk.text}\n(Relevance: ${(chunk.score * 100).toFixed(1)}%)`
      )
      .join("\n\n---\n\n");

    // Generate answer using Gemini
    const answer = await generateAnswer(query, context, {
      temperature,
      maxTokens: 1024,
    });

    return NextResponse.json({
      success: true,
      query,
      answer,
      relevantChunks: relevantChunks.map((chunk) => ({
        text: chunk.text.substring(0, 200) + "...",
        score: chunk.score,
      })),
      sources: relevantChunks.length,
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query: " + String(error) },
      { status: 500 }
    );
  }
}
