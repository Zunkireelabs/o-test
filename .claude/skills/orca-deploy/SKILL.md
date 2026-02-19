---
name: orca-deploy
description: Deploy Orca to Vercel or other platforms. Use when deploying the application to production.
disable-model-invocation: true
allowed-tools: Bash(vercel *), Bash(git *), Bash(npm run build)
---

# Orca Deployment

Deploy Orca to production environments.

## Prerequisites

1. Vercel CLI installed: `npm i -g vercel`
2. Git repository configured
3. Environment variables set

## Deployment Steps

### 1. Verify Build
```bash
npm run build
```

### 2. Deploy to Vercel

**First time deployment:**
```bash
vercel
```

**Production deployment:**
```bash
vercel --prod
```

### 3. Set Environment Variables on Vercel

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## Git Workflow

### Commit and Push
```bash
git add -A
git commit -m "Deploy: $ARGUMENTS"
git push origin main
```

### Create Release Tag
```bash
git tag -a v$ARGUMENTS[0] -m "Release $ARGUMENTS[0]"
git push origin v$ARGUMENTS[0]
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] API endpoints updated for production
- [ ] No console errors in browser

## Vercel Project Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
