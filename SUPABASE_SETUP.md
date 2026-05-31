# Supabase Setup

This project can run in two modes:

- Local JSON mode: default, no Supabase credentials required.
- Supabase mode: stores the whole school system state in Supabase Postgres.

## 1. Create Supabase Table

Open your Supabase project, go to **SQL Editor**, and run:

```sql
-- Paste the contents of supabase/schema.sql
```

## 2. Configure Environment

Copy `.env.example` to `.env` in the project root:

```powershell
Copy-Item .env.example .env
```

Set:

```env
USE_SUPABASE=true
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Use the `service_role` key only on the backend. Do not place it in frontend files.

## 3. Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

## 4. Run Server

```powershell
C:\Python312\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

On first run with Supabase enabled, the backend seeds the Supabase `school_state` row automatically.
