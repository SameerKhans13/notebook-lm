# PostgreSQL + pgvector Setup Guide

## Migration Completed ✅

Your NotebookLM application has been successfully migrated from **Qdrant** to **PostgreSQL with pgvector**.

## What Changed

- **Vector Database**: Qdrant → PostgreSQL with pgvector extension
- **Vector Store**: [lib/vectorstore.ts](lib/vectorstore.ts) completely rewritten to use `pg` client
- **Docker Compose**: Updated to run PostgreSQL with pgvector image
- **Dependencies**: Added `pg` (PostgreSQL client)
- **.env Configuration**: Updated to use `DATABASE_URL` instead of `QDRANT_URL`

## Setup Instructions

### Option 1: Using Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- Docker Desktop running

#### Start PostgreSQL with pgvector

```bash
# Navigate to project directory
cd notebook-lm

# Start the PostgreSQL container
docker-compose up -d

# Verify container is running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres
```

The database will automatically initialize with tables and indexes from `init-db.sql`.

**Connection Details:**
- Host: `localhost`
- Port: `5432`
- Username: `notebook_user`
- Password: `notebook_password`
- Database: `notebook_db`

### Option 2: Local PostgreSQL Installation

#### On Windows (using Chocolatey or Installer)

```bash
# Using Chocolatey (if installed)
choco install postgresql

# During installation:
# - Set superuser password
# - Note the port (default: 5432)

# After installation, open pgAdmin or psql
psql -U postgres

# Create database and enable pgvector
CREATE DATABASE notebook_db;
\c notebook_db
CREATE EXTENSION vector;

# Run the init script
psql -U postgres -d notebook_db -f init-db.sql
```

#### Using WSL2 + Linux PostgreSQL

```bash
# Inside WSL2
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres psql << EOF
CREATE DATABASE notebook_db;
\c notebook_db
CREATE EXTENSION vector;
EOF

# Run init script
sudo -u postgres psql -d notebook_db -f /path/to/init-db.sql
```

## Environment Configuration

Update `.env` with your database connection:

```env
GOOGLE_API_KEY=your_google_api_key
DATABASE_URL=postgresql://notebook_user:notebook_password@localhost:5432/notebook_db
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Verify PostgreSQL Connection

### Using psql (Command Line)

```bash
psql -U notebook_user -h localhost -d notebook_db

# Inside psql:
\dt                          # List all tables
SELECT COUNT(*) FROM documents;  # Check document count
SELECT COUNT(*) FROM document_metadata;  # Check metadata
```

### Using pgAdmin (GUI)

1. Install pgAdmin (free, no Docker required)
2. Create a new server with connection details above
3. Browse tables in the GUI

### Using Node.js (Quick Test)

```bash
# Create test.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://notebook_user:notebook_password@localhost:5432/notebook_db'
});

pool.query('SELECT NOW();', (err, res) => {
  if (err) console.error(err);
  else {
    console.log('✅ Connected to PostgreSQL:', res.rows[0]);
    process.exit(0);
  }
});

# Run
node test.js
```

## Features of pgvector Setup

✅ **Vector Similarity Search** - Uses cosine distance operator (`<=>`)
✅ **IVFFLAT Indexing** - Fast approximate nearest neighbor search
✅ **JSONB Support** - Flexible metadata storage
✅ **Full SQL Support** - Complex queries, joins, filtering
✅ **Transactions** - ACID compliance
✅ **Scalability** - Better for production workloads

## Key Tables

### `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  chunk_id VARCHAR(255),
  document_id VARCHAR(255),
  text TEXT,
  embedding vector(384),          -- pgvector column
  page_number INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP,
  created_at TIMESTAMP
);
```

### `document_metadata`
```sql
CREATE TABLE document_metadata (
  id VARCHAR(255) PRIMARY KEY,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  chunk_count INTEGER,
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Running the Application

### 1. Start PostgreSQL
```bash
# Using Docker
docker-compose up -d

# OR local PostgreSQL (ensure service is running)
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Dev Server
```bash
npm run dev
```

App will be available at: `http://localhost:3001`

## Troubleshooting

### Connection Refused Error
- **Issue**: `connect ECONNREFUSED 127.0.0.1:5432`
- **Solution**: Ensure PostgreSQL is running. Check with: `psql -U postgres`

### Vector Type Not Found
- **Issue**: `ERROR: type "vector" does not exist`
- **Solution**: pgvector extension not installed. Run: `CREATE EXTENSION vector;`

### Permission Denied
- **Issue**: `FATAL: role "notebook_user" does not exist`
- **Solution**: Check credentials in `.env` match database setup

### Index Creation Failed
- **Issue**: `ERROR: IVFFLAT index failed`
- **Solution**: IVFFLAT is optional. Application will work without it but slower.

### Docker Not Running
- **Issue**: `failed to connect to the docker API`
- **Solution**: Start Docker Desktop or install Docker for your system

## Performance Tips

1. **Create additional indexes** for frequent queries:
   ```sql
   CREATE INDEX idx_documents_document_id_text 
   ON documents(document_id, text);
   ```

2. **Tune IVFFLAT parameters** for larger datasets:
   ```sql
   CREATE INDEX idx_documents_embedding_tuned 
   ON documents USING ivfflat (embedding vector_cosine_ops) 
   WITH (lists = 200);  -- Increase for larger datasets
   ```

3. **Monitor query performance**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM documents 
   ORDER BY embedding <=> '[...]'::vector 
   LIMIT 5;
   ```

## Migration from Qdrant

All Qdrant-specific code has been removed:
- ❌ Removed: axios-based Qdrant REST API calls
- ❌ Removed: QDRANT_URL environment variable
- ✅ Added: PostgreSQL connection pooling
- ✅ Added: pgvector native integration

## Next Steps

1. ✅ Start PostgreSQL container or local instance
2. ✅ Verify database connection
3. ✅ Run `npm install` to update dependencies
4. ✅ Start dev server with `npm run dev`
5. ✅ Upload a document to test the RAG pipeline

## Deployment

For production deployment:

- **Vercel**: Use managed PostgreSQL (Neon, Supabase, Railway)
- **Docker**: Use docker-compose.yml as reference
- **Kubernetes**: Create PostgreSQL StatefulSet with pgvector
- **Cloud**: AWS RDS Aurora PostgreSQL with pgvector

Update `DATABASE_URL` to point to your production database.

---

Questions? Check [lib/vectorstore.ts](lib/vectorstore.ts) for the complete pgvector implementation.
