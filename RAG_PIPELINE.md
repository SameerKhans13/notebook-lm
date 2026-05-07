# RAG Pipeline Documentation

## Comprehensive Guide to NotebookLM's Retrieval-Augmented Generation System

### Table of Contents
1. [Overview](#overview)
2. [Chunking Strategy](#chunking-strategy)
3. [Embedding Pipeline](#embedding-pipeline)
4. [Vector Storage](#vector-storage)
5. [Retrieval Process](#retrieval-process)
6. [Generation Process](#generation-process)
7. [Performance Optimization](#performance-optimization)

---

## Overview

The NotebookLM RAG pipeline consists of 6 main stages:

```
Document → Chunking → Embedding → Storage → Retrieval → Generation → Answer
```

Each stage is designed to ensure:
- **Accuracy**: Answers are grounded in actual document content
- **Speed**: Fast retrieval and generation
- **Relevance**: Only most relevant information is used
- **Scalability**: Can handle large documents

---

## Chunking Strategy

### What is Chunking?

Chunking is the process of splitting a long document into manageable pieces (chunks) that are:
- Small enough to fit in the LLM's context window
- Large enough to preserve semantic meaning
- Overlapping to maintain context across chunks

### Implemented Strategy: Recursive Character Splitting

**Configuration:**
```typescript
chunkSize: 1000              // Characters per chunk
chunkOverlap: 200            // Overlap between chunks
separators: [
  "\n\n",                    // Paragraph breaks
  "\n",                       // Line breaks
  " ",                        // Space (word boundaries)
  ""                          // Character (fallback)
]
```

### How It Works

1. **First Attempt**: Split by paragraph (`\n\n`)
   - If chunks ≤ 1000 chars, use them
   - If chunks > 1000 chars, proceed to step 2

2. **Second Attempt**: Split by line (`\n`)
   - If chunks ≤ 1000 chars, use them
   - Otherwise, proceed to step 3

3. **Third Attempt**: Split by word (` `)
   - If chunks ≤ 1000 chars, use them
   - Otherwise, proceed to step 4

4. **Final Fallback**: Split by character
   - Split at character level (last resort)

### Example

**Original Document:**
```
The Python programming language is powerful.

It has a simple syntax and is easy to learn.
Many developers use Python for web development.

Data science professionals also prefer Python.
```

**After Chunking (overlap=200):**
```
Chunk 1: "The Python programming language is powerful.\n\nIt 
has a simple syntax and is easy to learn.\nMany developers 
use Python for web development."

Chunk 2: "Many developers use Python for web development.\n\nData 
science professionals also prefer Python."
```

### Why This Strategy?

✅ **Preserves Context**: Overlap keeps related information together
✅ **Semantic Coherence**: Respects document structure
✅ **Flexible**: Works with any text format
✅ **Efficient**: Reduces redundant chunks
❌ **Limitation**: May miss connections between paragraphs

### Alternative Strategies (Optional Implementation)

**1. Semantic Chunking**
- Split based on semantic meaning
- Uses embeddings to find natural boundaries
- Pros: More intelligent splitting
- Cons: Requires pre-computation

**2. Hierarchical Chunking**
- Create chunks at multiple levels
- Allows granular retrieval
- Pros: Better for structured docs
- Cons: More complex

**3. Fixed-Size Sliding Window**
```typescript
chunkSize: 512
stride: 256  // Move 256 chars per chunk
```

---

## Embedding Pipeline

### What are Embeddings?

Embeddings are vector representations of text:
- Convert text to list of numbers (e.g., 384 dimensions)
- Semantically similar texts have similar vectors
- Enable fast similarity search using math

### Example

```
Text: "The Eiffel Tower is in Paris"
Embedding: [0.23, -0.45, 0.78, 0.12, -0.33, ...]  (384 dimensions)

Text: "Paris has the famous Eiffel Tower"
Embedding: [0.24, -0.44, 0.76, 0.13, -0.32, ...]  (similar!)
```

### Embedding Generation Options

#### Option 1: Cohere API (Recommended for Production)

```typescript
import axios from "axios";

async function generateEmbedding(text: string) {
  const response = await axios.post(
    "https://api.cohere.com/v1/embed",
    {
      texts: [text],
      model: "embed-english-v3.0"
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`
      }
    }
  );
  return response.data.embeddings[0];
}
```

#### Option 2: Ollama (Local Embeddings)

```bash
# Pull embedding model
ollama pull nomic-embed-text

# Use in code
const response = await axios.post(
  "http://localhost:11434/api/embeddings",
  {
    model: "nomic-embed-text",
    prompt: text
  }
);
```

#### Option 3: OpenAI Embeddings

```typescript
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small"
});

const vector = await embeddings.embedQuery(text);
```

### Current Implementation

Currently using local embeddings with random vector generation (for testing).
**Recommended for production**: Integrate Cohere or OpenAI.

---

## Vector Storage

### Qdrant Vector Database

**Why Qdrant?**
- Fast similarity search (HNSW algorithm)
- Scales to millions of vectors
- Cloud and local options
- RESTful API

### Data Structure

**Collection: `notebook-documents`**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "vector": [0.23, -0.45, 0.78, ...],  // 384 dimensions
  "payload": {
    "text": "The Eiffel Tower is located in Paris...",
    "chunkId": "chunk-0-1",
    "documentId": "doc-uuid",
    "pageNumber": 1,
    "metadata": {
      "chunkIndex": 1,
      "totalChunks": 45,
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Storage Process

```typescript
// 1. Connect to Qdrant
const client = new QdrantClient({ url: "http://localhost:6333" });

// 2. Create collection
await client.createCollection("notebook-documents", {
  vectors: {
    size: 384,              // Embedding dimension
    distance: "Cosine"      // Similarity metric
  }
});

// 3. Upsert points
await client.upsert("notebook-documents", {
  points: [
    {
      id: "unique-id-1",
      vector: [0.23, -0.45, 0.78, ...],
      payload: { text: "...", metadata: {...} }
    },
    // More points...
  ]
});
```

### Similarity Metrics

**Cosine Similarity** (Used in NotebookLM)
- Range: -1 to 1 (higher = more similar)
- Formula: `cos(θ) = A·B / (|A||B|)`
- Best for: Text embeddings

**Euclidean Distance**
- Range: 0 to ∞ (lower = more similar)
- Formula: `√((x₁-x₂)² + (y₁-y₂)²)`
- Best for: Spatial data

---

## Retrieval Process

### Step 1: Query Embedding

```typescript
const userQuery = "How to debug Node.js applications?";
const queryEmbedding = await generateEmbedding(userQuery);
// Output: [0.31, -0.52, 0.65, ...]
```

### Step 2: Similarity Search

```typescript
const results = await client.search("notebook-documents", {
  vector: queryEmbedding,
  limit: 5,               // Top 5 results
  score_threshold: 0.2    // Minimum similarity
});
```

### Step 3: Filtering Results

```typescript
const relevantChunks = results
  .filter(r => r.score > 0.3)  // Filter low scores
  .slice(0, 5)                  // Top 5
  .map(r => ({
    text: r.payload.text,
    score: r.score,
    pageNumber: r.payload.pageNumber
  }));
```

### Retrieval Configuration

**Adjustable Parameters:**

```typescript
contextLimit: 5          // Number of chunks
scoreThreshold: 0.2      // Minimum similarity score (0-1)
maxContextLength: 4000   // Max total characters
```

**Impact:**
- **Higher contextLimit**: Better answers, slower processing
- **Lower scoreThreshold**: More results, noise risk
- **Higher maxContextLength**: More context, token usage

---

## Generation Process

### System Prompt Design

The system prompt is crucial for grounded generation:

```typescript
const systemPrompt = `You are an AI assistant that answers questions 
based ONLY on the provided context from the document.

Rules:
1. Only answer based on the context provided.
2. If answer not in context, state clearly.
3. Cite relevant document parts.
4. Do NOT use general knowledge.
5. Be concise and accurate.`;
```

### Gemini API Integration

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = client.getGenerativeModel({ model: "gemini-pro" });

const result = await model.generateContent({
  contents: [{
    role: "user",
    parts: [{
      text: `${systemPrompt}\n\nContext:\n${context}\n\nQuery:\n${query}`
    }]
  }],
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 1024,
    topP: 0.8
  }
});
```

### Generation Parameters

**Temperature** (0.0 - 2.0)
- 0.0: Deterministic (same answer always)
- 0.3: Focused, consistent (recommended for RAG)
- 1.0: Balanced
- 2.0: Creative, diverse

**Top-P (Nucleus Sampling)** (0.0 - 1.0)
- 0.0: Only top choice
- 0.8: Top 80% likely tokens (recommended)
- 1.0: All tokens

**Max Tokens**
- Controls response length
- 1024: Standard for RAG
- 512: Quick responses
- 2048: Detailed answers

---

## Performance Optimization

### 1. Chunking Optimization

```typescript
// Trade-off between retrieval speed and context
// Smaller chunks = faster but less context
chunkSize: 500          // Instead of 1000
chunkOverlap: 100       // Instead of 200

// Or more context = slower but better answers
chunkSize: 2000         // Larger chunks
chunkOverlap: 400
```

### 2. Retrieval Optimization

```typescript
// Reduce context to speed up LLM
contextLimit: 3         // Top 3 instead of 5

// Increase threshold to filter noise
scoreThreshold: 0.5     // Higher = stricter
```

### 3. Generation Optimization

```typescript
// Faster but less detailed
temperature: 0.1
maxTokens: 512

// Slower but better quality
temperature: 0.5
maxTokens: 1024
```

### 4. Indexing Optimization

- **Batch Uploads**: Index multiple docs together
- **Async Processing**: Index while user uploads next doc
- **Caching**: Cache common query results

---

## Quality Metrics

### Measuring RAG Quality

1. **Relevance**: Are retrieved chunks relevant?
   ```
   Precision = Relevant chunks / Total retrieved
   ```

2. **Grounding**: Is answer based on document?
   - Check if answer uses document facts
   - Verify no hallucinations

3. **Completeness**: Does answer fully address query?
   - Compare with gold standard answer

4. **Latency**: How fast are responses?
   - Retrieval time < 100ms
   - Generation time < 2 seconds

### Testing

```bash
# Test retrieval
curl http://localhost:6333/health

# Test embedding
curl -X POST http://localhost:3000/api/query \
  -d '{"query":"test","documentId":"doc-1"}'

# Verify grounding
# Upload doc with specific facts
# Ask questions not in doc
# Verify "not found" responses
```

---

## Troubleshooting

### Q: Answers are too general
**A:** Reduce temperature (0.1-0.2), reduce context limit, stricter score threshold

### Q: Answers are too short
**A:** Increase maxTokens, increase context limit, increase temperature

### Q: Slow responses
**A:** Reduce chunkSize, reduce contextLimit, use fewer top results

### Q: Wrong answers
**A:** Check if data is in document, adjust chunking strategy, increase score threshold

---

## Further Reading

- [LangChain Documentation](https://python.langchain.com/)
- [Qdrant Vector Database](https://qdrant.tech/documentation/)
- [Google Gemini API](https://ai.google.dev/tutorials/python_quickstart)
- [RAG Techniques](https://arxiv.org/abs/2312.01213)

---

**Last Updated**: January 2024
