# Sino Operating Layer — Backend

FastAPI backend for the Sino Group agentic operating layer.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for API documentation.

## Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # Settings (env vars)
│   ├── routes/           # API endpoints
│   │   ├── health.py
│   │   ├── tenants.py
│   │   ├── buildings.py
│   │   ├── posters.py
│   │   └── chat.py
│   ├── db/               # Database layer
│   │   ├── base.py       # SQLAlchemy engine/session
│   │   └── models.py     # ORM models
│   └── agents/           # (Coming) Agentic AI layer
├── requirements.txt
└── .env.example
```

## Database Schema

- **users** — Sino Group team members (admin/designer/viewer)
- **buildings** — Sino buildings with per-building templates
- **tenants** — Tenant records (auto-synced from plug-in)
- **posters** — Generated e-directories (versioned, status-tracked)
- **chat_sessions** / **chat_messages** — Conversations with the operating layer
- **activity_logs** — Every AI action + data change for audit
