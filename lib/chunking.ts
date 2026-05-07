export interface ChunkedDocument {
  id: string;
  text: string;
  pageNumber?: number;
  metadata: Record<string, unknown>;
}

/**
 * Simple and effective sentence-based splitting
 * Creates smaller, more focused chunks for better retrieval
 */
function splitBySentences(text: string): string[] {
  // Split by sentence endings or multiple newlines
  const sentences = text.split(/(?<=[.!?])\s+|\n\n+/).filter((s) => s.trim().length > 0);
  return sentences.map((s) => s.trim());
}

/**
 * Splits documents into chunks using sentence-aware splitting.
 * This strategy creates smaller, more focused chunks for better semantic search.
 * 
 * Strategy: Sentence-Aware Chunking
 * - Creates chunks of 3-5 sentences (typically 300-700 chars)
 * - Preserves complete sentences (no mid-sentence cuts)
 * - Maintains semantic meaning
 * - High overlap (50%) for context preservation
 * 
 * Benefits:
 * - Better retrieval accuracy
 * - Respects sentence boundaries
 * - More granular context
 * - Works well with semantic search
 */
export async function chunkDocument(
  text: string,
  pageNumber?: number,
  sentencesPerChunk: number = 8,
  overlap: number = 2
): Promise<ChunkedDocument[]> {
  // First clean the text
  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?,;:])/g, "$1")
    .trim();

  // Split by sentences
  const sentences = splitBySentences(cleanText);

  if (sentences.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  
  // Create overlapping chunks
  for (let i = 0; i < sentences.length; i += sentencesPerChunk - overlap) {
    const chunkSentences = sentences.slice(
      i,
      i + sentencesPerChunk
    );
    
    if (chunkSentences.length > 0) {
      chunks.push(chunkSentences.join(" "));
    }
  }

  // Ensure last chunk is included
  if (sentences.length % sentencesPerChunk !== 0) {
    const lastChunkStart = Math.max(
      0,
      sentences.length - sentencesPerChunk
    );
    const lastChunk = sentences.slice(lastChunkStart).join(" ");
    
    if (lastChunk.length > 0 && !chunks.includes(lastChunk)) {
      chunks.push(lastChunk);
    }
  }

  return chunks.map((chunk, index) => ({
    id: `chunk-${pageNumber || 0}-${index}`,
    text: chunk,
    pageNumber,
    metadata: {
      chunkIndex: index,
      totalChunks: chunks.length,
      pageNumber: pageNumber || 0,
    },
  }));
}

/**
 * Paragraph-based chunking strategy (alternative)
 * Splits by double newlines to respect paragraph structure
 */
export function chunkDocumentByParagraph(
  text: string,
  pageNumber?: number
): ChunkedDocument[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  return paragraphs.map((paragraph, index) => ({
    id: `para-${pageNumber || 0}-${index}`,
    text: paragraph,
    pageNumber,
    metadata: {
      chunkIndex: index,
      totalChunks: paragraphs.length,
      pageNumber: pageNumber || 0,
    },
  }));
}
