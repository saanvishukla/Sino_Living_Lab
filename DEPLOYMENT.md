# Deployment Guide

Deploy the Sino Operating Layer to the public internet using:

- **Backend** → [Render](https://render.com) (Docker web service + persistent disk, free tier)
- **Frontend** → [Vercel](https://vercel.com) (Next.js, free tier)

---

## Part 1 — Backend to Render

### 1. Push this repo to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create sino-operating-layer --public --source=. --push
# or manually: create repo on github.com, then:
# git remote add origin https://github.com/<you>/sino-operating-layer.git
# git push -u origin main
```

### 2. Create a new Render Blueprint

1. Log in to https://dashboard.render.com
2. Click **New +** → **Blueprint**
3. Connect your GitHub repo (`sino-operating-layer`)
4. Render will detect `render.yaml` and show the service + disk
5. Click **Apply**

### 3. Set the required env vars in the Render dashboard

After the first deploy starts, open the service and go to **Environment**. Add:

| Key | Value |
|---|---|
| `XAI_API_KEY` | Your xAI/Grok API key |
| `CORS_ORIGINS` | Your Vercel URL, e.g. `https://sino-app.vercel.app` (add it once you know it in step 2) |

`JWT_SECRET` is auto-generated. `LLM_PROVIDER`, `LLM_MODEL`, `APP_ENV` come from `render.yaml`.

### 4. Grab your backend URL

After ~3 minutes you'll get a URL like `https://sino-operating-layer-api.onrender.com`.

Test it:
```bash
curl https://sino-operating-layer-api.onrender.com/health
```

> ⚠️ **Render free tier constraints:**
> - Services spin down after 15 min of inactivity. First request after idle takes ~30 s.
> - Persistent disks require a paid plan. On free tier, the filesystem is **ephemeral** — the SQLite DB and generated posters will reset on each deploy. Data persists while the service is running.
> - For permanent persistence: either upgrade to the $7/mo Starter plan + $1/mo disk, OR switch to a free Postgres (see Part 4 below). If you skip the disk, delete the `disk:` block from `render.yaml`.

---

## Part 2 — Frontend to Vercel

### 1. Import the repo on Vercel

1. Go to https://vercel.com/new
2. Import your `sino-operating-layer` repo
3. Set **Root Directory** to `frontend`
4. Framework preset: **Next.js** (auto-detected)

### 2. Set env var

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE` | Your Render backend URL (e.g. `https://sino-operating-layer-api.onrender.com`) |

### 3. Deploy

Click **Deploy**. You'll get a URL like `https://sino-app.vercel.app`.

### 4. Update backend CORS

Back in Render's **Environment** tab, set `CORS_ORIGINS` to your Vercel URL and let the service redeploy.

---

## Part 3 — First login

1. Visit your Vercel URL
2. You'll be redirected to `/login`
3. Click **Create an account** — the first user becomes **admin**
4. You're in. Test: chat → "How many tenants are in Sino Plaza?"

---

## Operating locally vs deployed

| | Local | Deployed |
|---|---|---|
| Backend | `uvicorn app.main:app --port 8000` | Render (Docker) |
| Frontend | `npm run dev` | Vercel |
| DB | `backend/sino.db` | `/data/sino.db` on Render disk |
| Posters | `backend/generated_posters/` | `/data/posters/` on Render disk |

---

## Updating a deployment

Just `git push` — both Render and Vercel auto-redeploy on push.

---

## Part 4 — Upgrading to Postgres (optional)

SQLite works great for this prototype. If you ever need real concurrency or multi-instance scaling:

1. In Render, create a new **PostgreSQL** database (free tier available)
2. Copy the **Internal Database URL**
3. Change the scheme: replace `postgresql://` with `postgresql+asyncpg://`
4. Set it as `DATABASE_URL` in your API service env vars
5. Redeploy — SQLAlchemy creates tables on startup and re-seeds if empty
