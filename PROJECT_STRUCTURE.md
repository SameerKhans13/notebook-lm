# 📁 Project Structure & File Guide

Complete guide to all files in the NotebookLM RAG application.

## Directory Structure

```
notebook-lm/
│
├── app/                                  # Next.js App Router
│   ├── api/
│   │   ├── documents/
│   │   │   └── route.ts                 # Document upload/management API
│   │   └── query/
│   │       └── route.ts                 # Query processing API
│   ├── components/
│   │   ├── DocumentUpload.tsx           # Upload component
│   │   └── ChatInterface.tsx            # Chat interface component
│   ├── page.tsx                         # Main page
│   ├── layout.tsx                       # Root layout
│   └── globals.css                      # Global styles
│
├── lib/                                  # Core business logic
│   ├── chunking.ts                      # Document chunking strategies
│   ├── embeddings.ts                    # Embedding generation
│   ├── vectorstore.ts                   # Qdrant integration
│   ├── gemini.ts                        # Gemini API integration
│   └── fileProcessor.ts                 # File parsing utilities
│
├── public/
│   └── uploads/                         # Temporary file storage
│
├── data/
│   └── documents.json                   # Document metadata storage
│
├── .github/
│   └── workflows/
│       └── deploy.yml                   # GitHub Actions CI/CD
│
├── Configuration Files
│   ├── package.json                     # Dependencies & scripts
│   ├── tsconfig.json                    # TypeScript config
│   ├── tailwind.config.ts               # Tailwind CSS config
│   ├── next.config.js                   # Next.js config
│   ├── postcss.config.js                # PostCSS config
│   ├── .eslintrc.json                   # ESLint config
│   ├── .prettierrc                      # Code formatting config
│   └── vercel.json                      # Vercel deployment config
│
├── Docker & Deployment
│   ├── Dockerfile                       # Docker container config
│   ├── docker-compose.yml               # Local development stack
│   └── DEPLOYMENT.md                    # Deployment guide
│
├── Documentation
│   ├── README.md                        # Main documentation
│   ├── SETUP_GUIDE.md                   # Setup instructions
│   ├── RAG_PIPELINE.md                  # Technical details
│   ├── SUBMISSION_CHECKLIST.md          # Assignment checklist
│   ├── PROJECT_STRUCTURE.md             # This file
│   └── .env.example                     # Environment template
│
├── Quick Start
│   ├── quickstart.sh                    # Linux/Mac setup script
│   └── quickstart.bat                   # Windows setup script
│
├── Version Control
│   ├── .gitignore                       # Git ignore rules
│   └── .github/workflows/deploy.yml     # CI/CD pipeline
│
└── License
    └── LICENSE (if added)               # MIT License
```

---

## File Descriptions

### Application Files

#### `app/page.tsx` (Main Page)
**Purpose**: Root component rendering the entire UI
**Exports**:
- `Home` component with document upload and chat interface
**Imports**: `DocumentUpload`, `ChatInterface`

#### `app/layout.tsx` (Root Layout)
**Purpose**: HTML layout wrapper for entire app
**Exports**:
- `RootLayout` component with metadata
**Content**: Head configuration, global styles

#### `app/globals.css` (Global Styles)
**Purpose**: Global CSS and Tailwind imports
**Content**: 
- Tailwind directives
- Reset styles
- Font configuration

---

### API Routes

#### `app/api/documents/route.ts` (Document Management)
**Methods**:
- `POST /api/documents` - Upload document
  - Input: FormData with file
  - Process: Extract text → Chunk → Generate embeddings → Store
  - Output: { documentId, fileName, chunkCount }
  
- `GET /api/documents` - List all documents
  - Output: Array of document metadata
  
- `DELETE /api/documents` - Delete document
  - Input: { documentId }
  - Output: { success: true }

**Database**: Writes to `data/documents.json` and Qdrant

#### `app/api/query/route.ts` (Query Processing)
**Methods**:
- `POST /api/query` - Process user query
  - Input: { query, documentId, contextLimit, temperature }
  - Process: Search → Retrieve → Generate answer
  - Output: { answer, relevantChunks, sources }

**Integration**: Uses VectorStore for retrieval, Gemini for generation

---

### React Components

#### `app/components/DocumentUpload.tsx`
**Purpose**: File upload interface
**Props**:
- `onUploadSuccess(documentId, fileName)` - Callback on success
**State**:
- `uploading` - Upload in progress
- `error` - Error message
- `success` - Success message
**Features**:
- Drag & drop support (can be added)
- File validation
- Progress feedback

#### `app/components/ChatInterface.tsx`
**Purpose**: Chat interface for asking questions
**Props**:
- `documentId` - Current document
- `documentName` - Display name
**State**:
- `messages` - Chat history
- `input` - User input
- `loading` - Loading state
**Features**:
- Auto-scroll on new messages
- Message history
- Source attribution

---

### Core Libraries

#### `lib/chunking.ts` (Document Chunking)
**Functions**:
- `chunkDocument()` - Recursive character splitting
  - Input: text, pageNumber, chunkSize, chunkOverlap
  - Output: Array of ChunkedDocument
  - Strategy: Recursive with fallback separators
  
- `chunkDocumentByParagraph()` - Alternative paragraph splitting
  - Input: text, pageNumber
  - Output: Array of ChunkedDocument

**Exports**: `chunkDocument`, `chunkDocumentByParagraph`, `ChunkedDocument` interface

#### `lib/embeddings.ts` (Embedding Generation)
**Functions**:
- `generateEmbedding()` - Generate embedding for text
  - Input: text string
  - Output: 384-dimensional vector
  - Fallback: Random normalized vector
  
- `generateEmbeddings()` - Batch generate embeddings
  - Input: Array of texts
  - Output: Array of 384-dim vectors

**Config**: Supports Cohere, Ollama, or fallback local

#### `lib/vectorstore.ts` (Vector Database)
**Class**: `VectorStore`
**Methods**:
- `constructor()` - Initialize with Qdrant URL
- `initializeCollection()` - Create collection if not exists
- `storeDocuments()` - Upload chunks with embeddings
- `search()` - Semantic search
- `deleteDocument()` - Remove document vectors
- `getStats()` - Collection statistics

**Integration**: Qdrant client, UUID generation

#### `lib/gemini.ts` (LLM Integration)
**Functions**:
- `generateAnswer()` - Generate grounded response
  - Input: query, context, options
  - Output: String response
  - LLM: Gemini Pro
  - System prompt: Enforces grounding
  
- `generateAnswerStream()` - Streaming response (optional)
  - Input: query, context, options
  - Output: AsyncGenerator of strings

**Config**: Temperature, maxTokens, topP parameters

#### `lib/fileProcessor.ts` (File Handling)
**Functions**:
- `extractTextFromPDF()` - Extract text from PDF
  - Input: File path
  - Output: Full text string
  - Library: pdf-parse
  
- `extractTextFromFile()` - Extract text from text/markdown
  - Input: File path
  - Output: File contents
  
- `processUploadedFile()` - Main processing function
  - Input: File path
  - Output: { text, fileName, fileType }
  - Process: Validate → Extract → Clean
  
- `validateFile()` - Validate file before processing
  - Input: File path, maxSizeInMB
  - Output: { valid, error? }

---

### Configuration Files

#### `package.json`
**Purpose**: Project dependencies and scripts
**Scripts**:
```json
{
  "dev": "next dev",           // Development server
  "build": "next build",       // Production build
  "start": "next start",       // Production server
  "lint": "next lint"          // Code linting
}
```
**Dependencies**: 45 packages (see package.json for full list)

#### `tsconfig.json`
**Purpose**: TypeScript configuration
**Key Settings**:
- Target: ES2020
- Strict: true (strict type checking)
- Path aliases: `@/*` → root

#### `next.config.js`
**Purpose**: Next.js configuration
**Settings**:
- React strict mode
- Ignore build errors during development

#### `tailwind.config.ts`
**Purpose**: Tailwind CSS configuration
**Content**: Content paths, theme extensions

#### `postcss.config.js`
**Purpose**: PostCSS configuration for Tailwind
**Plugins**: tailwindcss, autoprefixer

#### `vercel.json`
**Purpose**: Vercel deployment configuration
**Content**: Build commands, environment variables, rewrites

#### `.eslintrc.json`
**Purpose**: ESLint configuration
**Config**: Next.js core web vitals

#### `.prettierrc`
**Purpose**: Code formatting rules
**Settings**: 2-space tabs, single quotes in JSDoc, 80 char line width

#### `.env.example`
**Purpose**: Environment variable template
**Variables**:
- GOOGLE_API_KEY
- QDRANT_URL
- QDRANT_API_KEY
- NEXT_PUBLIC_API_URL

---

### Docker Files

#### `Dockerfile`
**Purpose**: Container image definition
**Base**: node:20-alpine
**Process**:
1. Install system dependencies
2. Copy package.json
3. npm install
4. Copy application code
5. npm run build
6. Expose port 3000
7. Start with npm start

#### `docker-compose.yml`
**Purpose**: Local development environment
**Services**:
- `qdrant` - Vector database
  - Port: 6333
  - Persistent volume
  - Health check

---

### Documentation Files

#### `README.md` (60+ KB)
**Sections**:
- Features overview
- Quick start guide
- Architecture explanation
- API documentation
- Configuration options
- Deployment instructions
- Troubleshooting
- Contributing guidelines

#### `SETUP_GUIDE.md` (10+ KB)
**Sections**:
- Prerequisites
- Step-by-step setup
- Getting API keys
- Running development server
- Testing instructions
- Common issues & solutions
- Deployment options
- Useful commands

#### `RAG_PIPELINE.md` (15+ KB)
**Sections**:
- Overview of RAG pipeline
- Detailed chunking strategy
- Embedding generation options
- Vector storage explanation
- Retrieval process
- Generation process
- Performance optimization
- Quality metrics
- Troubleshooting

#### `DEPLOYMENT.md` (12+ KB)
**Sections**:
- Vercel deployment
- Docker deployment
- Cloud Run deployment
- Railway deployment
- Self-hosted VPS
- Production checklist
- Performance optimization
- Monitoring & debugging
- Scaling strategy

#### `SUBMISSION_CHECKLIST.md` (10+ KB)
**Sections**:
- Submission requirements
- Marking scheme details
- Code quality checklist
- RAG pipeline verification
- Testing procedures
- Pre-submission verification
- Common mistakes to avoid
- Success criteria

#### `.env.example`
**Purpose**: Template for environment variables
**Variables**: GOOGLE_API_KEY, QDRANT_URL, etc.

---

### Quick Start Scripts

#### `quickstart.sh` (Linux/Mac)
**Purpose**: Automated setup for Unix-like systems
**Steps**:
1. Check Node.js/npm
2. Create .env.local
3. Start Qdrant with Docker
4. npm install
5. npm run build
6. npm run dev

#### `quickstart.bat` (Windows)
**Purpose**: Automated setup for Windows
**Steps**: Same as shell script but with Windows commands

---

### Version Control

#### `.gitignore`
**Purpose**: Exclude files from Git
**Excludes**:
- node_modules/
- .next/
- .env.local
- Logs
- Build artifacts
- IDE files

#### `.github/workflows/deploy.yml`
**Purpose**: GitHub Actions CI/CD pipeline
**Triggers**: Push to main, pull requests
**Jobs**:
1. Build on Node 18 & 20
2. Run tests
3. Deploy to Vercel (on main)

---

## File Statistics

```
Total Files: ~25 core files
Total Lines of Code: ~3000+
TypeScript: ~1500 lines
CSS/Tailwind: ~300 lines
Documentation: ~2000 lines
Config: ~200 lines

Key Metrics:
- API routes: 2
- React components: 2
- Utility modules: 5
- Config files: 8
- Documentation files: 6
```

---

## Dependencies Overview

### Main Dependencies
- **next** (14.0.3) - React framework
- **react** (18.2.0) - UI library
- **@google/generative-ai** (0.3.0) - Gemini API
- **@qdrant/js-client** (1.9.0) - Vector database
- **langchain** (0.1.0) - LLM utilities
- **pdf-parse** (1.1.1) - PDF processing
- **axios** (1.6.0) - HTTP client

### Dev Dependencies
- **typescript** (5.3.3) - Language
- **tailwindcss** (3.3.6) - Styling
- **eslint** (8.55.0) - Code quality

---

## Import Relationships

```
page.tsx
├── DocumentUpload.tsx
│   ├── lib/fileProcessor.ts
│   └── app/api/documents/route.ts
├── ChatInterface.tsx
│   └── app/api/query/route.ts
│       ├── lib/vectorstore.ts
│       └── lib/gemini.ts
└── layout.tsx
    └── globals.css

API Routes:
├── documents/route.ts
│   ├── lib/fileProcessor.ts
│   ├── lib/chunking.ts
│   └── lib/vectorstore.ts
└── query/route.ts
    ├── lib/vectorstore.ts
    └── lib/gemini.ts

Libraries:
├── chunking.ts
│   └── (langchain text splitter)
├── embeddings.ts
│   └── (axios for API calls)
├── vectorstore.ts
│   ├── (qdrant client)
│   └── lib/embeddings.ts
├── gemini.ts
│   └── (@google/generative-ai)
└── fileProcessor.ts
    ├── (fs for file I/O)
    └── (pdf-parse for PDFs)
```

---

## Data Flow

```
1. Upload Flow:
   User chooses file
   → DocumentUpload component
   → POST /api/documents
   → fileProcessor extracts text
   → chunking splits text
   → embeddings generates vectors
   → vectorstore stores in Qdrant
   → Response: documentId

2. Query Flow:
   User types question
   → ChatInterface component
   → POST /api/query
   → vectorstore searches semantically
   → retrieves top 5 chunks
   → gemini generates answer
   → Response: answer with sources

3. Delete Flow:
   User deletes document
   → DELETE /api/documents
   → vectorstore removes vectors
   → metadata updated
   → Response: success
```

---

## How to Navigate This Project

### To Understand the RAG Pipeline:
1. Start with `README.md` - Overview
2. Read `RAG_PIPELINE.md` - Technical details
3. Examine `lib/chunking.ts` - Chunking strategy
4. Study `lib/vectorstore.ts` - Vector operations
5. Review `lib/gemini.ts` - Answer generation

### To Modify the Application:
1. Frontend changes: Edit `app/components/`
2. API changes: Edit `app/api/`
3. Core logic: Edit `lib/`
4. Configuration: Edit config files

### To Deploy:
1. Read `DEPLOYMENT.md`
2. Follow deployment option (Vercel recommended)
3. Set environment variables
4. Push to GitHub
5. Deploy automatically

---

## File Size & Performance

```
app/page.tsx:              ~3 KB
app/components/:           ~5 KB total
app/api/:                  ~6 KB total
lib/:                      ~12 KB total
Configuration:             ~8 KB total
Documentation:             ~80 KB total
node_modules/:             ~500 MB (not in repo)
```

---

This structure ensures:
✅ Clear separation of concerns
✅ Scalability for future features
✅ Easy testing and debugging
✅ Comprehensive documentation
✅ Production-ready deployment

---

Last Updated: January 2024
