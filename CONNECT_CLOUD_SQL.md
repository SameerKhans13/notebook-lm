# 🔗 Connect to Cloud SQL Instance

## Your Instance Details

- **Instance Name**: `my-demo-db`
- **Connection Name**: `burnished-treat-482906-f4:asia-south1:my-demo-db`
- **Public IP**: `34.93.143.147`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `OfficialGradeBench-2025`

---

## Step 1: Add Your IP to Authorized Networks

### Using Google Cloud Console (Easiest)

1. Go to your instance: [Cloud SQL Console](https://console.cloud.google.com/sql/instances/my-demo-db/overview?project=burnished-treat-482906-f4)

2. Click **"EDIT"** at the top

3. Scroll down to **"Connections"** section

4. Under **"Authorized networks"**, click **"ADD NETWORK"**

5. Add your current IP:
   - Name: `My Local Machine`
   - Network: Get your IP from https://whatismyip.com
   - Or use `0.0.0.0/0` to allow all IPs (less secure, but works for testing)

6. Click **"SAVE"** at the bottom

### Using gcloud Command

```bash
# Get your current IP
curl https://api.ipify.org

# Add your IP to authorized networks
gcloud sql instances patch my-demo-db \
  --authorized-networks=YOUR_IP_ADDRESS \
  --project=burnished-treat-482906-f4

# Or allow all IPs (for testing only)
gcloud sql instances patch my-demo-db \
  --authorized-networks=0.0.0.0/0 \
  --project=burnished-treat-482906-f4
```

---

## Step 2: Initialize Database

Once your IP is authorized, run these commands:

### Connect to Database

```bash
# Using psql
psql -h 34.93.143.147 -U postgres -d postgres

# Enter password when prompted: OfficialGradeBench-2025
```

### Initialize pgvector and Tables

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension
\dx vector

-- Run initialization script
\i init-db.sql

-- Or copy-paste from init-db.sql:
```

```sql
-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    chunk_id VARCHAR(255) NOT NULL,
    document_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    embedding vector(3072),
    page_number INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_chunk_id ON documents(chunk_id);
CREATE INDEX IF NOT EXISTS idx_documents_timestamp ON documents(timestamp);

-- Create document_metadata table
CREATE TABLE IF NOT EXISTS document_metadata (
    id VARCHAR(255) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    chunk_count INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for document_metadata
CREATE INDEX IF NOT EXISTS idx_document_metadata_uploaded_at ON document_metadata(uploaded_at);
```

### Verify Setup

```sql
-- List all tables
\dt

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Exit
\q
```

---

## Step 3: Test Connection from Your App

```bash
# Test database connection
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW(), version()', (err, res) => { if (err) { console.error('❌ Error:', err.message); } else { console.log('✅ Connected!'); console.log('Time:', res.rows[0].now); console.log('Version:', res.rows[0].version); } pool.end(); });"
```

Expected output:
```
✅ Connected!
Time: 2026-05-07T...
Version: PostgreSQL 18...
```

---

## Step 4: Configure for Production (Vercel)

### Add Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
Name: GOOGLE_API_KEY
Value: your_google_gemini_api_key_here
Environments: Production, Preview, Development

Name: DATABASE_URL
Value: postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres
Environments: Production, Preview, Development

Name: NEXT_PUBLIC_API_URL
Value: https://notebook-lm.vercel.app
Environments: Production, Preview, Development
```

### Add Vercel IPs to Cloud SQL

For production, add Vercel's IP ranges to authorized networks:

**Option 1: Allow all (Quick but less secure)**
```
0.0.0.0/0
```

**Option 2: Vercel-specific IPs (More secure)**

Add these networks in Cloud SQL:
```
76.76.21.0/24
76.76.19.0/24
```

Or use Cloud SQL Proxy for maximum security.

---

## Step 5: Deploy and Test

### Deploy to Vercel

```bash
git add .
git commit -m "Production ready with Cloud SQL"
git push origin main
```

### Test Production

```bash
# Test health endpoint
curl https://notebook-lm.vercel.app/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-05-07T...",
#   "database": "connected"
# }
```

---

## Troubleshooting

### Connection Still Timing Out?

1. **Check authorized networks**:
   ```bash
   gcloud sql instances describe my-demo-db \
     --project=burnished-treat-482906-f4 \
     | grep authorizedNetworks
   ```

2. **Verify instance is running**:
   ```bash
   gcloud sql instances describe my-demo-db \
     --project=burnished-treat-482906-f4 \
     | grep state
   ```
   Should show: `state: RUNNABLE`

3. **Test port connectivity**:
   ```bash
   # Windows PowerShell
   Test-NetConnection -ComputerName 34.93.143.147 -Port 5432
   ```

### Password Authentication Failed?

Make sure password doesn't have special characters that need escaping:
```env
# If password has special chars, URL-encode them
DATABASE_URL="postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres"
```

### Extension Not Found?

```sql
-- Connect as superuser
psql -h 34.93.143.147 -U postgres -d postgres

-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- If error, check available extensions
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```

---

## Security Best Practices

### For Development
- Add only your specific IP to authorized networks
- Use strong passwords
- Enable SSL connections

### For Production
- Use Cloud SQL Proxy instead of public IP
- Restrict to Vercel IP ranges only
- Enable automatic backups
- Set up monitoring and alerts

### Connection String with SSL

```env
DATABASE_URL="postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres?sslmode=require"
```

---

## Quick Commands

```bash
# Connect to database
psql -h 34.93.143.147 -U postgres -d postgres

# Check tables
psql -h 34.93.143.147 -U postgres -d postgres -c "\dt"

# Count documents
psql -h 34.93.143.147 -U postgres -d postgres -c "SELECT COUNT(*) FROM documents;"

# Add your IP to authorized networks
gcloud sql instances patch my-demo-db \
  --authorized-networks=$(curl -s https://api.ipify.org) \
  --project=burnished-treat-482906-f4
```

---

## Next Steps

1. ✅ Add your IP to authorized networks
2. ✅ Connect and initialize database
3. ✅ Test local connection
4. ✅ Deploy to Vercel
5. ✅ Add Vercel IPs to authorized networks
6. ✅ Test production deployment

Your app will be live! 🚀
