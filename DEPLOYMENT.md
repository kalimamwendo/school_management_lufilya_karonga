# Deployment

This app is deployable as one Docker web service. The Docker image builds the React frontend, installs the FastAPI backend, and serves both from port `8000`.

## Required Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy your project URL and service role key.

## Render Deployment

1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** from this repository, or create a Docker web service manually.
3. Add environment variables:

```env
USE_SUPABASE=true
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Deploy.

The service exposes the app on port `8000` and uses `/api/state` as the health check.

## Local Docker Test

```powershell
docker build -t lufilya-school .
docker run --env-file .env -p 8000:8000 lufilya-school
```
