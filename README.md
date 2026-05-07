# NotebookLM RAG - Document Intelligence Platform

A production-ready Retrieval-Augmented Generation (RAG) application built with **Next.js**, **Gemini API**, and **Qdrant Vector Database**. Upload any document and have an intelligent conversation with it powered by cutting-edge AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D%2018-brightgreen)

## 🎯 Features

### Core RAG Pipeline
- **Document Upload**: Support for PDF, TXT, and Markdown files (up to 50MB)
- **Intelligent Chunking**: Recursive character splitting with overlap to preserve context
- **Vector Embeddings**: Store documents as searchable embeddings in Qdrant
- **Semantic Search**: Find the most relevant document sections using vector similarity
- **Context-Aware Generation**: Generate answers grounded only in the uploaded document

### Web Interface
- **Modern UI**: Built with React and Tailwind CSS
- **Real-time Chat**: Interactive Q&A with your documents
- **Multiple Documents**: Manage and switch between uploaded documents
- **Source Attribution**: See which document sections informed each answer

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, LangChain
- **LLM**: Google Gemini API (`gemini-pro`)
- **Vector DB**: Qdrant (Cloud or Local)
- **Embeddings**: Configurable (supports Cohere, Ollama, local)
- **File Processing**: PDF parsing with `pdf-parse`, LangChain loaders

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Qdrant instance (local or cloud)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd notebook-lm
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_API_KEY=your_gemini_api_key
QDRANT_URL=http://localhost:6333
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start Qdrant (if using local)**
```bash
docker-compose up -d
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 RAG Pipeline Architecture

### 1. Document Ingestion
```
Upload File (PDF/TXT/MD) 
    ↓
Extract Text
    ↓
Validate & Clean
```

### 2. Chunking Strategy
**Implemented: Recursive Character Splitting**
- Chunk size: 1000 characters
- Overlap: 200 characters
- Separators: Paragraph, sentence, word, character (fallback)
- Preserves semantic coherence while maintaining context

```typescript
RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""]
})
```

### 3. Embedding Generation
```
Chunks
    ↓
Generate Embeddings (384-dim vectors)
    ↓
Store in Qdrant with Metadata
```

**Supported embedding services:**
- Cohere API (default)
- Ollama (local)
- Custom embedding endpoints

### 4. Vector Storage (Qdrant)
- **Collection**: `notebook-documents`
- **Vector Dimension**: 384
- **Distance Metric**: Cosine Similarity
- **Metadata**: Document ID, chunk index, page numbers

### 5. Retrieval
```
User Query
    ↓
Generate Query Embedding
    ↓
Semantic Search (top 5 similar chunks)
    ↓
Combine Context
    ↓
Pass to LLM
```

**Retrieval Configuration:**
- Top K results: 5 (configurable)
- Score threshold: 0.2
- Includes relevance scoring

### 6. Generation (Gemini Pro)
```
Context + Query
    ↓
System Prompt (enforces grounding)
    ↓
Gemini Pro API
    ↓
Grounded Response
```

**System Prompt enforces:**
- Answer only based on provided context
- Cite relevant document sections
- Reject questions not answerable from context
- No hallucination or general knowledge

## 🛠️ API Endpoints

### Documents Management

**Upload Document**
```bash
POST /api/documents
Content-Type: multipart/form-data

{
  "file": <File>
}

Response:
{
  "success": true,
  "documentId": "uuid",
  "fileName": "document.pdf",
  "chunkCount": 45,
  "message": "Document uploaded and indexed successfully"
}
```

**List Documents**
```bash
GET /api/documents

Response:
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "fileName": "document.pdf",
      "fileType": "pdf",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "textLength": 50000,
      "chunkCount": 45
    }
  ],
  "total": 1
}
```

**Delete Document**
```bash
DELETE /api/documents

{
  "documentId": "uuid"
}

Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Query Interface

**Ask Question**
```bash
POST /api/query
Content-Type: application/json

{
  "query": "How to debug Node.js applications?",
  "documentId": "uuid",
  "contextLimit": 5,
  "temperature": 0.3
}

Response:
{
  "success": true,
  "query": "How to debug Node.js applications?",
  "answer": "Based on the document...",
  "relevantChunks": [
    {
      "text": "Debugging is...",
      "score": 0.89
    }
  ],
  "sources": 3
}
```

## 📦 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
```bash
git push origin main
```

2. **Create Vercel Project**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables in Settings

3. **Set Environment Variables**
```env
GOOGLE_API_KEY=your_key
QDRANT_URL=your_qdrant_url
```

4. **Deploy**
```bash
vercel deploy
```

### Docker Deployment

1. **Build Image**
```bash
docker build -t notebook-lm .
```

2. **Run Container**
```bash
docker run -p 3000:3000 \
  -e GOOGLE_API_KEY=your_key \
  -e QDRANT_URL=http://qdrant:6333 \
  notebook-lm
```

### Using Docker Compose

```bash
docker-compose up --build
```

Services:
- Next.js app: http://localhost:3000
- Qdrant: http://localhost:6333

## 🔧 Configuration

### Environment Variables

```env
# Required
GOOGLE_API_KEY=your_gemini_api_key

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional_if_cloud

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional Embeddings
COHERE_API_KEY=optional_for_cohere_embeddings
```

### Tuning Parameters

**Chunking** (in `lib/chunking.ts`):
```typescript
chunkSize: 1000          // Increase for longer context
chunkOverlap: 200        // Increase to preserve cross-chunk context
```

**Retrieval** (in `app/api/query/route.ts`):
```typescript
k: 5                     // Number of chunks to retrieve
scoreThreshold: 0.2      // Similarity threshold (0-1)
```

**Generation** (in `lib/gemini.ts`):
```typescript
temperature: 0.3         // Lower = more deterministic
maxTokens: 1024          // Max response length
topP: 0.8                // Nucleus sampling parameter
```

## 📊 Project Structure

```
notebook-lm/
├── app/
│   ├── api/
│   │   ├── documents/      # Document upload/management
│   │   └── query/          # Query processing
│   ├── components/         # React components
│   │   ├── DocumentUpload.tsx
│   │   └── ChatInterface.tsx
│   ├── page.tsx            # Main page
│   ├── layout.tsx          # Layout
│   └── globals.css         # Global styles
├── lib/
│   ├── chunking.ts         # Document chunking strategies
│   ├── embeddings.ts       # Embedding generation
│   ├── vectorstore.ts      # Qdrant integration
│   ├── gemini.ts           # Gemini API integration
│   └── fileProcessor.ts    # File processing utilities
├── public/
│   └── uploads/            # Temporary file storage
├── data/
│   └── documents.json      # Document metadata
├── docker-compose.yml      # Docker Compose config
├── Dockerfile              # Docker image
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── next.config.js          # Next.js config
└── .env.example            # Environment template
```

## 🧪 Testing

### Test Document Upload
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@sample.pdf"
```

### Test Query
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the main topic?",
    "documentId": "your-document-id"
  }'
```

## 🎓 Key Concepts

### RAG (Retrieval-Augmented Generation)
1. **Retrieval**: Find relevant document sections using vector similarity
2. **Augmentation**: Include retrieved sections as context
3. **Generation**: Generate response using LLM with context

### Vector Embeddings
- Convert text to high-dimensional vectors
- Semantically similar texts have similar vectors
- Enable fast similarity search via dot product

### Chunking Importance
- Too small: Loses context
- Too large: Irrelevant results
- Overlap: Preserves context across chunks
- Strategy: Use document structure (paragraphs, sentences)

## 🚨 Limitations & Future Work

### Current Limitations
- Single query per document (no multi-turn context)
- No file persistence (loses data on restart)
- Basic embedding approach (consider Cohere/OpenAI)
- No user authentication
- No conversation history

### Future Enhancements
- [ ] Multi-turn conversations with memory
- [ ] Support for more file formats (Excel, CSV, JSON)
- [ ] User authentication and document sharing
- [ ] Advanced chunking strategies (semantic, hierarchical)
- [ ] Real-time document indexing progress
- [ ] Export conversation as PDF
- [ ] API rate limiting and analytics

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support & Troubleshooting

### Qdrant Connection Failed
```bash
# Start Qdrant
docker-compose up -d qdrant

# Verify connection
curl http://localhost:6333/health
```

### Gemini API Errors
- Verify API key is valid: https://makersuite.google.com
- Check API quota: https://console.cloud.google.com
- Ensure Gemini API is enabled

### File Upload Fails
- Check file size (max 50MB)
- Verify file format (PDF, TXT, MD only)
- Ensure `/public/uploads` directory exists

### Slow Responses
- Reduce `chunkSize` for faster retrieval
- Increase `contextLimit` for better answers
- Check Qdrant performance

## 📞 Contact

- **Author**: [Your Name]
- **Email**: [Your Email]
- **Issues**: [GitHub Issues]

---

Built with ❤️ using Next.js, Gemini, and Qdrant
