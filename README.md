# Voqal — AI Voice Agent Platform

Voqal is a production-ready AI-powered voice agent platform that handles inbound phone calls, qualifies leads in real time using a large language model, and syncs results to CRM systems. It ships with a full-stack React dashboard, a FastAPI backend, PostgreSQL persistence, Redis caching, and Kubernetes manifests for cloud deployment.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start — Docker Compose](#quick-start--docker-compose)
- [Manual Setup — Backend](#manual-setup--backend)
- [Manual Setup — Frontend](#manual-setup--frontend)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Database Schema](#database-schema)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Live call monitoring** — Real-time dashboard showing active calls, transcripts, waveform visualization, and AI confidence scores
- **AI lead qualification** — Groq LLM (Llama 3.3 70B) scores every call for intent, sentiment, and lead quality on the fly
- **Automated CRM sync** — Qualified leads are pushed to HubSpot or Salesforce automatically after each call ends
- **Agent management** — Create, configure, and deploy multiple AI voice agent personas with custom prompts, voice IDs, and LLM parameters
- **Analytics & reporting** — Daily aggregated metrics, conversion funnels, revenue impact tracking, and 7-day trend sparklines
- **Call history** — Paginated, filterable history of every call with quality scores, transcripts, and lead linkage
- **Operator actions** — Dashboard buttons to qualify leads, reject, flag for manual review, copy transcripts, and transfer calls to human agents
- **Demo mode** — Ships with static mock data so the UI is fully usable without a running backend

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              React 18 + Vite (port 3000)                │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼─────────────────────────────────┐
│              FastAPI Backend (port 8000)                 │
│   routes: calls · leads · agents · crm · analytics      │
│   services: ai_service · call_service · crm_service     │
│                   · lead_service                        │
└──────┬─────────────────┬──────────────────┬─────────────┘
       │                 │                  │
  ┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐
  │PostgreSQL│    │    Redis    │   │  Groq API   │
  │  (ORM)   │    │  (session)  │   │ Llama 3.3   │
  └──────────┘    └─────────────┘   └─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite 5, Lucide Icons |
| Backend | FastAPI 0.109, Python 3.11, Uvicorn |
| ORM | SQLAlchemy 2.0 (async), Alembic migrations |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI / LLM | Groq SDK — Llama 3.3 70B Versatile |
| CRM | HubSpot API Client, Salesforce REST API |
| Containerisation | Docker, Docker Compose, Kubernetes |
| Security | python-jose (JWT), passlib (bcrypt), Fernet encryption |

---

## Project Structure

```
voqal/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── database.py        # SQLAlchemy ORM models
│   │   │   └── schemas.py         # Pydantic v2 request/response schemas
│   │   ├── routes/
│   │   │   ├── agents.py          # Agent CRUD endpoints
│   │   │   ├── analytics.py       # Dashboard & reporting endpoints
│   │   │   ├── calls.py           # Call lifecycle endpoints
│   │   │   ├── crm.py             # CRM config & sync endpoints
│   │   │   └── leads.py           # Lead management endpoints
│   │   └── services/
│   │       ├── ai_service.py      # Groq LLM integration
│   │       ├── call_service.py    # Call session processing
│   │       ├── crm_service.py     # HubSpot / Salesforce sync
│   │       └── lead_service.py    # Lead qualification logic
│   ├── database.py                # Async SQLAlchemy session factory
│   ├── config.py                  # Pydantic Settings (env vars)
│   ├── main.py                    # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example               # copy to .env and fill in secrets
│   └── .env                       # git-ignored, never committed
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Live operations console
│   │   │   ├── CallHistory.jsx    # Paginated call records
│   │   │   ├── LeadsManagement.jsx
│   │   │   ├── LeadDetails.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Agents.jsx         # Agent CRUD UI
│   │   │   ├── CRMSettings.jsx
│   │   │   └── Settings.jsx
│   │   ├── services/api.js        # Axios instance & API endpoints
│   │   ├── hooks/useApi.js        # Data-fetching hook
│   │   ├── App.jsx                # React Router setup
│   │   └── main.jsx
│   ├── design/                    # Original static HTML mockups
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example               # copy to .env and fill in values
│   └── .env                       # git-ignored, never committed
│
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── backend-hpa.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── redis-deployment.yaml
│   ├── database-statefulset.yaml
│   └── ingress.yaml
│
├── scripts/
│   ├── install-backend.ps1        # Windows: create venv & install deps
│   ├── install-backend.cmd
│   ├── doctor-python.ps1          # Windows: diagnose Python environment
│   ├── doctor-python.cmd
│   └── smoke-test.sh              # Linux/Mac: API smoke tests
│
├── .gitignore
├── LICENSE
├── README.md
└── TESTING.md
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 20+** and npm
- **PostgreSQL 16** (or Docker)
- **Redis 7** (or Docker)
- **Docker & Docker Compose** (recommended for local dev)
- **Groq API key** — free at [console.groq.com](https://console.groq.com)

---

## Quick Start — Docker Compose

This is the fastest way to run the entire stack locally.

### 1. Clone the repo

```bash
git clone https://github.com/your-username/voqal.git
cd voqal
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Open `backend/.env` and fill in at minimum:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx   # required — get from console.groq.com
SECRET_KEY=any-random-32-char-string    # required — used for JWT signing
ENCRYPTION_KEY=any-random-32-char-string
```

### 3. Start all services

```bash
cd backend
docker-compose up --build
```

Services started:

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:3000 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 4. Open the dashboard

Navigate to **http://localhost:3000** — the dashboard loads with demo data immediately, no backend required.

---

## Manual Setup — Backend

Use this if you prefer not to use Docker.

### 1. Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Alternatively, run the included helper script on Windows:
```powershell
..\scripts\install-backend.ps1
```

### 2. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Start PostgreSQL and Redis

Using Docker individually:
```bash
docker run -d --name voqal-db \
  -e POSTGRES_USER=voqal_user \
  -e POSTGRES_PASSWORD=voqal_pass \
  -e POSTGRES_DB=voqal_db \
  -p 5432:5432 postgres:16-alpine

docker run -d --name voqal-redis -p 6379:6379 redis:7-alpine
```

### 5. Run the backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API is live at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

---

## Manual Setup — Frontend

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_DEMO_MODE=true
```

Set `VITE_DEMO_MODE=false` to connect the UI to a live backend.

### 3. Start the dev server

```bash
npm run dev
```

Frontend is live at **http://localhost:5173** (Vite default) or **http://localhost:3000** when run via Docker Compose.

### 4. Build for production

```bash
npm run build
# Output in frontend/dist/
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_ENV` | No | `development` | Environment label (`development`, `production`) |
| `APP_HOST` | No | `0.0.0.0` | Bind host |
| `APP_PORT` | No | `8000` | Bind port |
| `DEBUG` | No | `true` | Enable debug mode and auto-reload |
| `SECRET_KEY` | **Yes** | — | JWT signing secret (min 16 chars) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string e.g. `postgresql+asyncpg://user:pass@localhost:5432/voqal_db` |
| `DB_POOL_SIZE` | No | `10` | SQLAlchemy connection pool size |
| `DB_MAX_OVERFLOW` | No | `20` | Max overflow connections above pool size |
| `DB_POOL_TIMEOUT` | No | `30` | Seconds to wait for a connection |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection string |
| `GROQ_API_KEY` | **Yes** | — | Groq API key — free at [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model ID |
| `VOICE_PROVIDER` | No | `twilio` | Voice provider name |
| `VOICE_PROVIDER_API_KEY` | No | — | API key for your voice provider (Twilio, etc.) |
| `VOICE_PHONE_NUMBER` | No | — | Inbound phone number e.g. `+15551234567` |
| `HUBSPOT_API_KEY` | No | — | HubSpot private app token |
| `SALESFORCE_CLIENT_ID` | No | — | Salesforce connected app client ID |
| `SALESFORCE_CLIENT_SECRET` | No | — | Salesforce connected app client secret |
| `SALESFORCE_INSTANCE_URL` | No | — | Salesforce instance URL e.g. `https://yourorg.salesforce.com` |
| `ENCRYPTION_KEY` | **Yes** | — | Fernet key for encrypting CRM credentials at rest |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000` | Backend base URL |
| `VITE_API_TIMEOUT` | No | `10000` | Request timeout in milliseconds |
| `VITE_DEMO_MODE` | No | `true` | `true` = use static mock data, `false` = live API |
| `VITE_WS_URL` | No | `ws://localhost:8000/ws` | WebSocket URL for real-time updates |
| `VITE_APP_ENV` | No | `development` | Environment label shown in the header |

> **Note:** Variables prefixed with `VITE_` are embedded into the browser bundle at build time. Never put secrets in frontend environment variables.

---

## API Reference

All endpoints are prefixed with `/api/v1`. Interactive Swagger docs available at `/docs`.

### Calls

| Method | Path | Description |
|---|---|---|
| `POST` | `/calls/receive` | Register a new inbound call. Returns `call_id`, session token, and AI greeting. |
| `POST` | `/calls/{call_id}/update` | Send a caller utterance. Returns AI response, detected intent, and live quality score. |
| `POST` | `/calls/{call_id}/end` | Finalize the call, run full AI analysis, extract lead data, and trigger CRM sync. |
| `GET` | `/calls/active` | List all currently in-progress calls. |
| `GET` | `/calls/history` | Paginated call history. Query params: `limit`, `offset`, `min_quality`, `intent`, `status`, `date_from`, `date_to`. |
| `GET` | `/calls/{call_id}` | Full detail for a single call including transcript and lead linkage. |

### Leads

| Method | Path | Description |
|---|---|---|
| `GET` | `/leads/` | Paginated lead list. Query params: `search`, `status`, `min_score`, `limit`, `offset`. |
| `GET` | `/leads/{lead_id}` | Lead detail with associated call history. |
| `GET` | `/leads/qualified` | All qualified leads with conversion metrics. |
| `POST` | `/leads/qualify` | Manually trigger AI qualification for a call. |
| `PUT` | `/leads/{lead_id}` | Update lead fields (status, notes, assigned_to, etc.). |

### Agents

| Method | Path | Description |
|---|---|---|
| `GET` | `/agents/` | List all agents with performance stats. |
| `POST` | `/agents/` | Create a new agent. |
| `GET` | `/agents/{agent_id}` | Get agent detail. |
| `PUT` | `/agents/{agent_id}` | Update agent configuration. |
| `DELETE` | `/agents/{agent_id}` | Delete an agent. |
| `POST` | `/agents/{agent_id}/activate` | Set agent status to `active`. |
| `POST` | `/agents/{agent_id}/deactivate` | Set agent status to `inactive`. |

### CRM

| Method | Path | Description |
|---|---|---|
| `POST` | `/crm/config` | Save CRM configuration (credentials are encrypted at rest). |
| `GET` | `/crm/status` | Connection status for all configured CRM integrations. |
| `POST` | `/crm/sync` | Manually push pending leads to connected CRM. |
| `POST` | `/crm/webhook` | Receive inbound webhook events from CRM (e.g. deal won/lost). |

### Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Executive summary: today's KPIs, 7-day trends, conversion funnel. |
| `GET` | `/analytics/report` | Detailed analytics for a date range. Query params: `date_from`, `date_to`. |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ "status": "healthy" }`. Used by Kubernetes liveness probes. |

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Live operations console — active calls, real-time transcript, lead scoring, operator action buttons |
| `/calls` | **Call History** | Searchable, filterable paginated table of all calls |
| `/leads` | **Leads Management** | Lead pipeline with status filters, search, and bulk actions |
| `/leads/:leadId` | **Lead Details** | Full lead profile with call history timeline |
| `/analytics` | **Analytics** | KPI charts, conversion funnel, daily/weekly trends |
| `/agents` | **Agents** | Create and manage AI agent personas — model, prompt, voice, phone number |
| `/crm` | **CRM Settings** | Connect and configure HubSpot or Salesforce integrations |
| `/settings` | **Settings** | Global voice provider config, LLM model selection, system prompt |

All pages share the same navigation bar: `DASHBOARD | CALL_HISTORY | LEADS | AGENTS | ANALYTICS | SETTINGS`.

---

## Database Schema

### `calls`
Stores every inbound and outbound call with full transcript and AI analysis output.

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `phone_number` | String | Caller E.164 number |
| `caller_name` | String | Name extracted by AI |
| `call_duration_seconds` | Float | Total call length |
| `start_time` / `end_time` | DateTime | Call timestamps |
| `transcript` | Text | Full conversation transcript |
| `transcript_summary` | Text | AI-generated summary |
| `intent` | String | Detected intent (qualify, support, book, etc.) |
| `lead_quality_score` | Float | 0.0 – 1.0 AI score |
| `sentiment` | String | positive / neutral / negative |
| `call_status` | String | active / completed / failed / transferred |
| `crm_synced` | Boolean | Whether synced to CRM |

### `leads`
One row per unique phone number. Aggregates data across multiple calls.

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `phone_number` | String (unique) | Lead's phone number |
| `email` | String | Extracted by AI |
| `company` | String | Extracted by AI |
| `lead_status` | String | new / qualified / converted / rejected |
| `lead_quality_score` | Float | Highest score across all calls |
| `call_id` | UUID FK | Most recent qualifying call |
| `crm_id` | String | ID of record in CRM |

### `agents`
AI voice agent configurations.

| Column | Type | Description |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `name` | String | Agent display name |
| `status` | String | draft / active / inactive |
| `llm_model` | String | Groq model ID |
| `temperature` | Float | LLM temperature (0.0 – 1.0) |
| `max_tokens` | Integer | Max response tokens |
| `system_prompt` | Text | Agent personality / instructions |
| `assigned_phone_number` | String | Phone number routed to this agent |
| `total_calls` | Integer | Cached performance counter |
| `conversion_rate` | Float | Cached conversion percentage |

### `crm_configs`
Encrypted CRM credentials — one row per integration type.

### `call_settings`
Singleton table for global voice provider and LLM configuration.

### `analytics`
Daily aggregated metrics — one row per calendar date.

---

## Kubernetes Deployment

The `k8s/` directory contains production-ready manifests for deploying Voqal to any Kubernetes cluster.

### Resources deployed

| Manifest | Resource | Description |
|---|---|---|
| `namespace.yaml` | Namespace | `voice-ai` namespace |
| `configmap.yaml` | ConfigMap | Non-secret configuration |
| `secret.yaml` | Secret | API keys and credentials (base64-encoded) |
| `backend-deployment.yaml` | Deployment | FastAPI — 3 replicas, rolling update strategy |
| `backend-service.yaml` | Service | ClusterIP for backend pods |
| `backend-hpa.yaml` | HPA | Auto-scales backend pods on CPU usage |
| `frontend-deployment.yaml` | Deployment | Nginx serving the React bundle |
| `frontend-service.yaml` | Service | ClusterIP for frontend pods |
| `redis-deployment.yaml` | Deployment | Redis session cache |
| `database-statefulset.yaml` | StatefulSet | PostgreSQL with persistent volume claim |
| `ingress.yaml` | Ingress | Routes `app.voqal.local` — `/` → frontend, `/api` → backend |

### Deploy to a cluster

**1. Encode your secrets**

```bash
echo -n "your-groq-api-key" | base64
```

Edit `k8s/secret.yaml` and replace placeholder values with your base64-encoded secrets.

**2. Apply all manifests**

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

**3. Verify pods are running**

```bash
kubectl get pods -n voice-ai
```

**4. Access the app**

Add `app.voqal.local` to your `/etc/hosts` pointing to the cluster ingress IP, then open `http://app.voqal.local`.

---

## Scripts

| Script | Platform | Description |
|---|---|---|
| `scripts/install-backend.ps1` | Windows | Creates Python venv in `backend/.venv` and installs all dependencies |
| `scripts/install-backend.cmd` | Windows | Batch equivalent of the above |
| `scripts/doctor-python.ps1` | Windows | Diagnoses Python installation, PATH issues, and venv health |
| `scripts/doctor-python.cmd` | Windows | Batch equivalent of the above |
| `scripts/smoke-test.sh` | Linux / Mac | Runs curl-based smoke tests against all major API endpoints |

Run smoke tests after deployment:

```bash
chmod +x scripts/smoke-test.sh
VOQAL_API=http://localhost:8000 ./scripts/smoke-test.sh
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run the smoke tests: `./scripts/smoke-test.sh`
5. Commit: `git commit -m "feat: add your feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

---

## License

This project is licensed under the terms in the [LICENSE](LICENSE) file.
