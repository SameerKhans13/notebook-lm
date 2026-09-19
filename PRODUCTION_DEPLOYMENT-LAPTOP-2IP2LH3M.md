# 🚀 Production Deployment Guide - PostgreSQL + Cloud SQL

## Your Current Setup

- **Database**: PostgreSQL with pgvector on Google Cloud SQL
- **Frontend/Backend**: Next.js deployed on Vercel
- **LLM**: Google Gemini API
- **Vector Store**: pgvector extension in Cloud SQL

---

## Environment Variables for Production

### Required Variables

```env
# Google Gemini API Key (set in Vercel dashboard)
GOOGLE_API_KEY=your_google_gemini_api_key_here

# PostgreSQL Cloud SQL Connection
DATABASE_URL=postgresql://postgres:OfficialGradeBench-2025@34.93.143.147:5432/postgres

# Production URL
NEXT_PUBLIC_API_URL=https://notebook-lm.vercel.app
```

---

## Deployment Steps

### Step 1: Verify Cloud SQL Setup

#### 1.1 Enable pgvector Extension

Connect to your Cloud SQL instance and run:

```sql
-- Connect via Cloud SQL Proxy or direct connection
psql -h 34.93.143.147 -U postgres -d postgres

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
\dx vector
```

#### 1.2 Initialize Database Tables

Run the initialization script:

```bash
# From your local machine
psql -h 34.93.143.147 -U postgres -d postgres -f init-db.sql

# Or copy-paste the SQL from init-db.sql directly in Cloud SQL console
```

#### 1.3 Configure Cloud SQL for External Access

In Google Cloud Console:

1. Go to **Cloud SQL** → Your Instance
2. Click **Connections** → **Networking**
3. Add **Authorized Networks**:
   - For Vercel: Add `0.0.0.0/0` (or use Cloud SQL Proxy)
   - For production: Use Cloud SQL Auth Proxy or Private IP

**⚠️ Security Warning**: Using `0.0.0.0/0` allows connections from anywhere. For production:
- Use **Cloud SQL Auth Proxy**
- Or restrict to specific IP ranges
- Or use **Private IP** with VPC

---

### Step 2: Deploy to Vercel

#### 2.1 Push Code to GitHub

```bash
git add .
git commit -m "Production deployment with Cloud SQL"
git push origin main
```

#### 2.2 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Click **Import**

#### 2.3 Configure Environment Variables in Vercel

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
GOOGLE_API_KEY = your_google_gemini_api_key_here
DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@YOUR_CLOUD_SQL_IP:5432/postgres
NEXT_PUBLIC_API_URL = https://your-project.vercel.app
```

3. Select **Production**, **Preview**, and **Development** for all variables
4. Click **Save**

#### 2.4 Deploy

1. Go to **Deployments** tab
2. Click **Redeploy** (or push to trigger auto-deploy)
3. Wait for build to complete
4. Visit your production URL

---

### Step 3: Fix the OAuth Error

The OAuth error you're seeing (`localhost:64747`) is from **Google Cloud SDK** trying to authenticate, NOT your application.

#### Option A: Use Service Account (Recommended for Production)

1. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create notebook-lm-sa \
     --display-name="NotebookLM Service Account"
   ```

2. **Grant Cloud SQL Client Role**:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:notebook-lm-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudsql.client"
   ```

3. **Create and Download Key**:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=notebook-lm-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Use in Vercel**:
   - Add environment variable: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Value: Paste the entire contents of `key.json`

#### Option B: Re-authenticate gcloud CLI

If you're deploying from your local machine:

```bash
# Clear existing credentials
gcloud auth revoke

# Re-authenticate
gcloud auth login

# Set application default credentials
gcloud auth application-default login
```

#### Option C: Skip gcloud (Direct Connection)

Your current setup already uses direct connection via `DATABASE_URL`. The OAuth error might be from a different tool. Check:

```bash
# See what's running on port 64747
netstat -ano | findstr :64747

# Kill the process if needed
taskkill /PID <PID> /F
```

---

### Step 4: Secure Your Production Database

#### 4.1 Use Cloud SQL Proxy (Recommended)

Instead of direct connection, use Cloud SQL Proxy:

**Update DATABASE_URL**:
```env
# Instead of public IP
DATABASE_URL=postgresql://postgres:OfficialGradeBench-2025@localhost:5432/postgres?host=/cloudsql/YOUR_PROJECT_ID:REGION:INSTANCE_NAME
```

**In Vercel**:
- Enable Cloud SQL connection in Vercel settings
- Or use Cloud SQL Auth Proxy sidecar

#### 4.2 Rotate Database Password

```bash
# In Cloud SQL Console
gcloud sql users set-password postgres \
  --instance=YOUR_INSTANCE_NAME \
  --password=NEW_SECURE_PASSWORD
```

Update `DATABASE_URL` in Vercel with new password.

#### 4.3 Enable SSL Connection

```env
DATABASE_URL=postgresql://postgres:PASSWORD@34.93.143.147:5432/postgres?sslmode=require
```

#### 4.4 Restrict IP Access

In Cloud SQL Console:
1. Remove `0.0.0.0/0` from authorized networks
2. Add only Vercel's IP ranges or use Private IP

---

### Step 5: Test Production Deployment

#### 5.1 Health Check

```bash
curl https://notebook-lm.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 5.2 Test Document Upload

```bash
curl -X POST https://notebook-lm.vercel.app/api/documents \
  -F "file=@test.pdf"
```

#### 5.3 Test Query

```bash
curl -X POST https://notebook-lm.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is this document about?",
    "documentId": "your-document-id"
  }'
```

---

## Troubleshooting Production Issues

### Issue 1: "Connection Refused" to Cloud SQL

**Cause**: Firewall blocking connection

**Solution**:
```bash
# Check Cloud SQL authorized networks
gcloud sql instances describe YOUR_INSTANCE_NAME

# Add Vercel IPs or use Cloud SQL Proxy
```

### Issue 2: "Password Authentication Failed"

**Cause**: Wrong password in DATABASE_URL

**Solution**:
1. Reset password in Cloud SQL Console
2. Update `DATABASE_URL` in Vercel
3. Redeploy

### Issue 3: "Extension 'vector' does not exist"

**Cause**: pgvector not installed

**Solution**:
```sql
-- Connect to Cloud SQL
psql -h 34.93.143.147 -U postgres -d postgres

-- Enable extension
CREATE EXTENSION vector;
```

### Issue 4: OAuth Error (localhost:64747)

**Cause**: Google Cloud SDK authentication issue

**Solution**:
```bash
# This is NOT your app - it's gcloud CLI
# Re-authenticate:
gcloud auth login

# Or ignore if not using gcloud commands
```

### Issue 5: Slow Query Performance

**Cause**: Missing indexes or large dataset

**Solution**:
```sql
-- Create IVFFLAT index for faster vector search
CREATE INDEX idx_documents_embedding_ivfflat 
ON documents USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Analyze table for query optimization
ANALYZE documents;
```

---

## Production Checklist

- [ ] pgvector extension enabled in Cloud SQL
- [ ] Database tables initialized (init-db.sql)
- [ ] Environment variables set in Vercel
- [ ] Cloud SQL authorized networks configured
- [ ] SSL connection enabled
- [ ] Database password secured (not in Git)
- [ ] Service account created (optional)
- [ ] Health check endpoint working
- [ ] Document upload tested
- [ ] Query endpoint tested
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

---

## Monitoring & Maintenance

### Database Monitoring

```sql
-- Check document count
SELECT COUNT(*) FROM documents;

-- Check storage size
SELECT pg_size_pretty(pg_total_relation_size('documents'));

-- Check recent uploads
SELECT * FROM document_metadata ORDER BY uploaded_at DESC LIMIT 10;

-- Monitor query performance
EXPLAIN ANALYZE
SELECT * FROM documents 
ORDER BY embedding <=> '[...]'::vector 
LIMIT 5;
```

### Vercel Logs

```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

### Cloud SQL Logs

In Google Cloud Console:
1. Go to **Cloud SQL** → Your Instance
2. Click **Logs**
3. Filter by severity or time range

---

## Scaling Considerations

### For Small Projects (< 1000 docs)
- Cloud SQL: db-f1-micro (shared CPU)
- Vercel: Hobby plan
- Cost: ~$10-20/month

### For Medium Projects (1000-10000 docs)
- Cloud SQL: db-n1-standard-1 (1 vCPU, 3.75 GB)
- Vercel: Pro plan
- Enable connection pooling
- Cost: ~$50-100/month

### For Large Projects (> 10000 docs)
- Cloud SQL: db-n1-standard-4+ (4+ vCPU, 15+ GB)
- Vercel: Enterprise plan
- Read replicas for scaling reads
- Connection pooling (PgBouncer)
- Cost: $200+/month

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Use `.env.local` for local development
   - Use Vercel environment variables for production

2. **Use SSL connections**
   ```env
   DATABASE_URL=postgresql://...?sslmode=require
   ```

3. **Rotate credentials regularly**
   - Change database password every 90 days
   - Rotate API keys annually

4. **Monitor access logs**
   - Enable Cloud SQL audit logs
   - Review Vercel access logs

5. **Backup database regularly**
   ```bash
   # Automated backups in Cloud SQL Console
   # Or manual backup:
   pg_dump -h 34.93.143.147 -U postgres postgres > backup.sql
   ```

---

## Support Resources

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Quick Commands Reference

```bash
# Connect to Cloud SQL
psql -h 34.93.143.147 -U postgres -d postgres

# Deploy to Vercel
vercel deploy --prod

# View logs
vercel logs --follow

# Test health endpoint
curl https://notebook-lm.vercel.app/api/health

# Backup database
pg_dump -h 34.93.143.147 -U postgres postgres > backup-$(date +%Y%m%d).sql

# Restore database
psql -h 34.93.143.147 -U postgres postgres < backup.sql
```

---

**Your app is ready for production! 🚀**

If you encounter the OAuth error again, it's likely from `gcloud` CLI, not your application. Your app uses direct PostgreSQL connection and doesn't need OAuth.
