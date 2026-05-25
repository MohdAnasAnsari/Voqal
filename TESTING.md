# Voqal Voice AI Agent — Local Testing & Deployment Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Docker Desktop | ≥ 24 |
| docker-compose | ≥ 2.20 |
| Node.js | ≥ 20 (for frontend dev) |
| Python | ≥ 3.11 (for backend dev) |
| kubectl + minikube | latest (for K8s) |

---

## Phase 6.1 — Local Testing with Docker Compose

### 1. Environment setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```env
SECRET_KEY=any-32-char-random-string
ENCRYPTION_KEY=base64-32-byte-fernet-key
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://voqal_user:voqal_password@db:5432/voqal_db
REDIS_URL=redis://redis:6379/0
```

Generate a valid Fernet key:
```python
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 2. Start all services

```bash
cd backend
docker-compose up --build
```

Services started:
| Service  | URL                          |
|----------|------------------------------|
| Backend  | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| Frontend | http://localhost:3000        |
| Postgres | localhost:5432               |
| Redis    | localhost:6379               |

### 3. Verify services

```bash
# Health check
curl http://localhost:8000/health

# API docs reachable
curl -s http://localhost:8000/openapi.json | python -m json.tool | head -20
```

### 4. Test API endpoints

```bash
# Register an inbound call
curl -X POST http://localhost:8000/api/v1/calls/receive \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15550100001", "caller_name": "Test Caller"}'

# List active calls
curl http://localhost:8000/api/v1/calls/active

# Dashboard metrics
curl http://localhost:8000/api/v1/analytics/dashboard

# List leads
curl http://localhost:8000/api/v1/leads/

# CRM status
curl http://localhost:8000/api/v1/crm/status
```

Or run the automated smoke test script:

```bash
bash scripts/smoke-test.sh http://localhost:8000
```

### 5. Test the frontend

Navigate to http://localhost:3000.

Checklist:
- [ ] Dashboard loads and shows metric cards
- [ ] Active calls section shows "0 ACTIVE CALLS" (or live data)
- [ ] Call History page loads
- [ ] Leads Management page loads
- [ ] Analytics page loads
- [ ] CRM Settings page loads

### 6. View logs

```bash
# Follow all service logs
docker-compose logs -f

# Individual services
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 7. Stop services

```bash
docker-compose down           # stop, keep volumes
docker-compose down -v        # stop, delete volumes (full reset)
```

---

## Phase 6.2 — Minikube Deployment

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=4096
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Build images into Minikube's Docker daemon

```bash
eval $(minikube docker-env)
docker build -t voqal-backend:latest ./backend
docker build -t voqal-frontend:latest ./frontend
```

### 3. Populate secrets

Edit `k8s/secret.yaml` and replace every `<base64-encoded-value>` with real values:

```bash
echo -n "my-secret-key" | base64
```

### 4. Deploy everything

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/database-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-hpa.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml

# Or apply all at once:
kubectl apply -f k8s/
```

### 5. Verify pods

```bash
kubectl get pods -n voice-ai -w       # watch until all Running
kubectl get svc   -n voice-ai
kubectl get hpa   -n voice-ai
```

Expected output (all pods `Running`, `READY 1/1` or `3/3`):
```
NAME                               READY   STATUS    RESTARTS
voqal-backend-xxxxxxxxx-xxxxx      1/1     Running   0
voqal-frontend-xxxxxxxx-xxxxx      1/1     Running   0
voqal-postgres-0                   1/1     Running   0
voqal-redis-xxxxxxxxx-xxxxx        1/1     Running   0
```

### 6. Access services via port-forward

```bash
# Frontend
kubectl port-forward -n voice-ai svc/voqal-frontend 3000:80 &

# Backend API
kubectl port-forward -n voice-ai svc/voqal-backend  8000:8000 &
```

Then open:
- Frontend: http://localhost:3000
- API docs:  http://localhost:8000/docs

### 7. Ingress access (Minikube)

```bash
minikube ip   # get cluster IP, e.g. 192.168.49.2
```

Add to `/etc/hosts`:
```
192.168.49.2   app.voqal.local
```

Then open http://app.voqal.local in your browser.

### 8. Teardown

```bash
kubectl delete namespace voice-ai     # removes all resources in the namespace
minikube stop
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Backend exits immediately | Check `SECRET_KEY` and `ENCRYPTION_KEY` are set in `.env` |
| DB connection refused | Wait for `db` healthcheck to pass; check `DATABASE_URL` |
| `InvalidToken` on CRM sync | `ENCRYPTION_KEY` changed; re-save CRM config |
| 401 from Groq | Check `GROQ_API_KEY` in `.env` |
| HubSpot sync returns error | Verify `HUBSPOT_API_KEY` has Contacts read/write scope |
| `Fatal error in launcher` when running `pip install ...` on Windows | Use `python -m pip ...` (or `scripts\\install-backend.cmd`); your `pip.exe` is likely from an old Python still on PATH |
| `permission denied while trying to connect to the docker API at npipe:////./pipe/docker_engine` | Start Docker Desktop (ensure the Docker Desktop Service is running) and run your terminal as the same Windows user; if needed add your user to the `docker-users` group or run PowerShell as Administrator |
| Browser shows CORS error calling `http://localhost:8000/api/v1/...` from `http://localhost:3000` | Ensure backend allows dev origins (localhost:3000/5173); rebuild backend image after changing CORS settings |
| K8s pods in `CrashLoopBackOff` | `kubectl logs -n voice-ai <pod-name>` |
| HPA not scaling | Ensure `metrics-server` addon is enabled in Minikube |
