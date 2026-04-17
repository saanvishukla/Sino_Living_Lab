# Sino Operating Layer

**All-in-One Agentic AI Operating Layer for Sino Group's Brand & Design Operations**

An intelligent, autonomous system that automates the entire workflow from tenant data collection to e-directory poster generation. Sino Group team members can interact with the operating layer via natural language chat, while tenant data changes automatically trigger real-time updates.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  SINO GROUP WEB PORTAL                    │
│  ┌──────────────┐              ┌─────────────────────┐  │
│  │  Dashboard   │              │   Chat with AI      │  │
│  │  (tenants,   │              │   Operating Layer   │  │
│  │   posters)   │              │                     │  │
│  └──────────────┘              └─────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          ↕ Real-time
┌──────────────────────────────────────────────────────────┐
│              AGENTIC OPERATING LAYER                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Orchestrator Agent (LangGraph)              │ │
│  └────────────────────────────────────────────────────┘ │
│    ↓              ↓             ↓              ↓        │
│  Data         Design        Compliance      Analytics   │
│  Agent        Agent          Agent           Agent      │
└──────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL DB  │  Poster Generation  │  Tenant Plug-in  │
└──────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **AI:** Claude/OpenAI + LangGraph
- **Auth:** NextAuth.js
- **Real-time:** WebSockets

## Project Structure

```
Sino_Living_Lab/
├── frontend/            # Next.js Sino Group portal
├── backend/             # FastAPI agentic operating layer
├── docs/                # Documentation
└── README.md
```

## Getting Started

See `frontend/README.md` and `backend/README.md` for setup instructions.
