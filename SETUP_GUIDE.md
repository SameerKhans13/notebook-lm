# 📖 Setup Guide - NotebookLM RAG

Complete step-by-step guide to get NotebookLM running on your machine.

## Prerequisites

Before you start, ensure you have:
- **Node.js 18+** ([Download](https://nodejs.org))
- **npm or yarn** (comes with Node.js)
- **Docker** (optional, for Qdrant)
- **Git** ([Download](https://git-scm.com))

### Verify Installation

```bash
# Check Node.js
node --version  # Should be v18+

# Check npm
npm --version   # Should be v9+

# Check Git
git --version
```

## Step 1: Get API Keys

### Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API key** 
3. Select or create a Google Cloud project
4. Copy the API key
5. **Keep it safe!** Don't share it or commit to Git

## Step 2: Set Up Qdrant Vector Database

### Option A: Local Qdrant (Recommended for Development)

**Prerequisites**: Docker and Docker Compose installed

```bash
# Create docker-compose.yml (already included in repo)
docker-compose up -d qdrant

# Verify it's running
curl http://localhost:6333/health
# Should return: {"status":"ok"}
```

Qdrant will be available at: `http://localhost:6333`

### Option B: Qdrant Cloud (For Production)

1. Visit [Qdrant Cloud](https://cloud.qdrant.io)
2. Create an account and cluster
3. Copy the cluster URL and API key
4. Update `.env.local` with these values

### Option C: In-Memory (For Testing Only)

Skip this step - app has fallback for testing without Qdrant.

## Step 3: Clone Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd notebook-lm

# Or if starting fresh
# npm create next-app@latest notebook-lm -- --typescript --tailwind
```

## Step 4: Install Dependencies

```bash
npm install
# or with yarn
yarn install
```

This will install:
- Next.js 14
- React 18
- Gemini API client
- Qdrant client
- LangChain utilities
- And more...

## Step 5: Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
```

Edit `.env.local`:

```env
# REQUIRED: Your Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Vector Database (local)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Or for Qdrant Cloud
# QDRANT_URL=https://your-cluster.qdrant.io
# QDRANT_API_KEY=your_api_key_here

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Step 6: Run Development Server

```bash
npm run dev
```

Output should show:
```
▲ Next.js 14.0.0
- Local:        http://localhost:3000
- Environments: .env.local
```

## Step 7: Open in Browser

Visit: **http://localhost:3000**

You should see:
- 📚 NotebookLM header
- Upload form on the left
- Chat interface on the right

## Testing the Application

### 1. Upload a Test Document

Create a simple test file `test.txt`:
```
The capital of France is Paris.
Paris is known for the Eiffel Tower.
The Eiffel Tower was built in 1889.
It's located in Paris, France.
```

- Click "Choose File"
- Select `test.txt`
- Wait for "Document uploaded! X chunks indexed."

### 2. Ask a Question

- Type: "What is the capital of France?"
- Click Send
- You should get: "The capital of France is Paris."

### 3. Verify Grounding

The answer should be grounded in the document, not general knowledge.
- Try asking something not in the document
- Response should be: "I cannot find this information in the provided document."

## Common Issues & Solutions

### Issue: "Failed to connect to Qdrant"

**Solution:**
```bash
# Start Qdrant
docker-compose up -d qdrant

# Check if it's running
docker-compose ps

# View logs
docker-compose logs qdrant
```

### Issue: "GOOGLE_API_KEY is not defined"

**Solution:**
1. Check `.env.local` file exists
2. Verify key is set correctly (no extra spaces)
3. Restart dev server: `npm run dev`

### Issue: "File upload fails"

**Solution:**
1. Check file size (max 50MB)
2. Use .pdf, .txt, or .md files
3. Verify `/public/uploads` directory exists
4. Check terminal for error details

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Use different port
npm run dev -- -p 3001

# Or kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

## Building for Production

```bash
# Build the application
npm run build

# Run production server
npm start
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `GOOGLE_API_KEY`: Your Gemini API key
     - `QDRANT_URL`: Your Qdrant URL
     - `QDRANT_API_KEY`: Your Qdrant API key (if using cloud)
   - Redeploy

### Deploy with Docker

```bash
# Build image
docker build -t notebook-lm .

# Run container
docker run -p 3000:3000 \
  -e GOOGLE_API_KEY=your_key \
  -e QDRANT_URL=http://qdrant:6333 \
  --link qdrant \
  notebook-lm

# Or use Docker Compose
docker-compose up --build
```

## Project Structure Overview

```
notebook-lm/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── documents/      # Upload/manage docs
│   │   └── query/          # Process queries
│   ├── components/         # React components
│   │   ├── DocumentUpload.tsx
│   │   └── ChatInterface.tsx
│   ├── page.tsx            # Main page
│   └── layout.tsx          # Root layout
├── lib/                    # Utility functions
│   ├── chunking.ts         # Text splitting
│   ├── embeddings.ts       # Vector generation
│   ├── vectorstore.ts      # Qdrant integration
│   ├── gemini.ts           # Gemini API
│   └── fileProcessor.ts    # File parsing
├── public/                 # Static files
│   └── uploads/            # Temp uploads
├── data/                   # Data storage
│   └── documents.json      # Metadata
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── next.config.js          # Next.js config
├── Dockerfile              # Container config
└── docker-compose.yml      # Docker compose
```

## Understanding the RAG Pipeline

```
1. UPLOAD FILE
   └─→ Extract text (PDF/TXT/MD)

2. CHUNK
   └─→ Split into overlapping chunks (1000 chars)

3. EMBED
   └─→ Convert chunks to vectors (384 dimensions)

4. STORE
   └─→ Save in Qdrant with metadata

5. QUERY
   └─→ User asks question

6. RETRIEVE
   └─→ Find 5 most similar chunks (vector search)

7. GENERATE
   └─→ Feed context + query to Gemini

8. ANSWER
   └─→ Return grounded response
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Code quality
npm run lint             # Run ESLint

# Docker
docker-compose up        # Start services
docker-compose down      # Stop services
docker-compose logs      # View logs

# Qdrant
curl http://localhost:6333/health  # Check status
```

## Performance Tips

1. **Chunk Size**: Larger chunks = faster but less precise
2. **Retrieval Count**: More chunks = better context but slower
3. **Temperature**: Higher = more creative, lower = more focused
4. **Batch Processing**: Upload multiple docs for better indexing

## Next Steps

1. ✅ Complete setup
2. 📚 Upload your first document
3. 💬 Start asking questions
4. 🚀 Deploy to production
5. 🔧 Customize for your use case

## Support

- 📖 [README.md](../README.md) - Full documentation
- 🐛 [GitHub Issues](../../issues) - Report bugs
- 💬 [Discussions](../../discussions) - Ask questions

---

Happy RAG-ing! 🚀
