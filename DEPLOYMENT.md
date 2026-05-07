# 🚀 Deployment Guide - NotebookLM

Complete guide to deploy NotebookLM to production.

## Deployment Options

1. **Vercel** (Easiest, recommended)
2. **Docker + Cloud Run**
3. **Self-hosted Server**
4. **Railway / Heroku**

---

## Option 1: Vercel (Recommended)

### Prerequisites
- GitHub account with repository
- Vercel account

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/notebook-lm.git
git branch -M main
git push -u origin main
```

### Step 2: Create Vercel Project

1. Visit [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Click **Import**

### Step 3: Configure Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add variables:
   ```
   GOOGLE_API_KEY = your_gemini_api_key
   QDRANT_URL = https://your-qdrant-cluster.qdrant.io
   QDRANT_API_KEY = your_qdrant_api_key
   NEXT_PUBLIC_API_URL = https://your-project.vercel.app
   ```
3. Click **Save**

### Step 4: Deploy

1. Go to **Deployments**
2. Click **Deploy**
3. Wait for build to complete
4. Get your URL: `https://your-project.vercel.app`

### Step 5: Set Up Continuous Deployment

Automatic deployment on push:
```bash
# Push changes to GitHub
git add .
git commit -m "Update features"
git push origin main

# Vercel automatically deploys!
```

### Troubleshooting Vercel

**Issue: Build fails**
```
Check build logs in Vercel dashboard
Usually: missing dependencies or env vars
```

**Issue: API timeouts**
```
Increase function timeout in vercel.json
Change maxDuration: 30 to 60
```

---

## Option 2: Docker + Google Cloud Run

### Prerequisites
- Docker installed
- Google Cloud account
- gcloud CLI installed

### Step 1: Create Dockerfile

Already included! (See `Dockerfile`)

### Step 2: Build Docker Image

```bash
# Build image locally
docker build -t notebook-lm:latest .

# Test locally
docker run -p 3000:3000 \
  -e GOOGLE_API_KEY=your_key \
  -e QDRANT_URL=http://host.docker.internal:6333 \
  notebook-lm:latest
```

### Step 3: Push to Container Registry

```bash
# Set up gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Configure Docker
gcloud auth configure-docker

# Tag image
docker tag notebook-lm:latest gcr.io/YOUR_PROJECT_ID/notebook-lm:latest

# Push image
docker push gcr.io/YOUR_PROJECT_ID/notebook-lm:latest
```

### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy notebook-lm \
  --image gcr.io/YOUR_PROJECT_ID/notebook-lm:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars GOOGLE_API_KEY=your_key,QDRANT_URL=your_qdrant_url
```

### Step 5: Get Service URL

```bash
gcloud run services describe notebook-lm --platform managed
```

Your app is now live! 🎉

---

## Option 3: Railway

### Step 1: Connect Repository

1. Visit [railway.app](https://railway.app)
2. Click **New Project**
3. Select **Deploy from GitHub**
4. Authorize and select repository

### Step 2: Add Environment Variables

1. In project settings, add:
   - `GOOGLE_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`

### Step 3: Deploy

Railway automatically deploys!

---

## Option 4: Self-Hosted (VPS)

### Prerequisites
- VPS with Node.js 18+
- Domain name (optional)
- SSH access

### Step 1: Connect to Server

```bash
ssh user@your-server-ip
```

### Step 2: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/notebook-lm.git
cd notebook-lm
```

### Step 3: Install Dependencies

```bash
npm install
npm run build
```

### Step 4: Set Environment Variables

```bash
nano .env.local
# Add your variables
```

### Step 5: Run with PM2

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "notebook-lm" -- start

# Make it start on reboot
pm2 startup
pm2 save
```

### Step 6: Set Up Reverse Proxy (Nginx)

```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/notebook-lm
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/notebook-lm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] API keys secured (never in code)
- [ ] HTTPS/SSL enabled
- [ ] Qdrant database configured
- [ ] Database backup strategy
- [ ] Monitoring/logging set up
- [ ] Rate limiting configured
- [ ] Error tracking (Sentry)
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] API documentation ready

---

## Performance Optimization

### Enable Compression

```typescript
// next.config.js
module.exports = {
  compress: true,
  optimizeFonts: true,
  reactStrictMode: true,
}
```

### Caching Strategy

```typescript
// app/api/query/route.ts
response.headers.set('Cache-Control', 'public, max-age=3600')
```

### Database Optimization

```bash
# Index frequently searched fields
POST /collections/notebook-documents/index
{
  "field": "metadata.documentId"
}
```

---

## Monitoring & Debugging

### Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

### Logging

```typescript
// app/api/query/route.ts
console.log(`Query received: ${query}`)
console.log(`Retrieved ${chunks.length} chunks`)
console.log(`Response time: ${Date.now() - startTime}ms`)
```

### Health Check

```bash
# Add health endpoint
curl https://your-app.com/api/health

# Returns:
# { "status": "ok", "timestamp": "2024-01-15T..." }
```

---

## Troubleshooting Deployment

### App won't start
```bash
# Check logs
vercel logs

# Or for Cloud Run
gcloud run logs read notebook-lm
```

### Environment variables not loaded
```bash
# Verify in Vercel dashboard
# Redeploy after adding vars
```

### Slow responses
```bash
# Check database connection
curl $QDRANT_URL/health

# Scale up resources
# Increase function timeout
```

### High memory usage
```bash
# Reduce chunk size
# Limit concurrent requests
# Enable streaming responses
```

---

## Scaling Strategy

### For Small Projects (< 1000 requests/day)
- Vercel with free tier
- Qdrant Cloud free tier
- Sufficient for demos

### For Growing Projects (1000-10000 requests/day)
- Vercel Pro or Cloud Run
- Qdrant Cloud paid tier
- Add rate limiting
- Set up monitoring

### For Enterprise (> 10000 requests/day)
- Dedicated server or Kubernetes
- Self-hosted Qdrant cluster
- Load balancing
- Advanced monitoring/alerting

---

## Disaster Recovery

### Backup Strategy

```bash
# Backup Qdrant data
docker exec qdrant /bin/bash -c "cd /qdrant && tar -czf backup.tar.gz storage"
docker cp qdrant:qdrant/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```

### Recovery

```bash
# Restore from backup
docker cp backup-20240115.tar.gz qdrant:/qdrant/
docker exec qdrant /bin/bash -c "cd /qdrant && tar -xzf backup.tar.gz"
```

---

## Support

- 📚 [README.md](README.md)
- 📖 [Setup Guide](SETUP_GUIDE.md)
- 🧠 [RAG Pipeline](RAG_PIPELINE.md)
- 🐛 [Issues](https://github.com/YOUR_REPO/issues)

---

Happy deploying! 🚀
