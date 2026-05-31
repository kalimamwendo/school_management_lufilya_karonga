# Deployment

This app is deployable as one Docker web service. The Docker image builds the React frontend, installs the FastAPI backend, and serves both from port `8000`.

## Render Deployment

1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** from this repository, or create a Docker web service manually.
3. Use the included `render.yaml`. It sets:

```env
USE_SUPABASE=false
```

4. Deploy.

The service exposes the app on port `8000` and uses `/api/state` as the health check.

## Data Note

With `USE_SUPABASE=false`, Render uses local JSON storage inside the container. This is fine for demos, but data may reset when Render rebuilds/restarts the service. For permanent production data, enable Supabase later.

## Local Docker Test

```powershell
docker build -t lufilya-school .
docker run --env-file .env -p 8000:8000 lufilya-school
```
