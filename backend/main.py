"""FastAPI application entry point for the Voice AI Agent platform."""

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import close_db, init_db
from app.routes import agents, analytics, calls, crm, leads
from config import get_settings

settings = get_settings()

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

_API_V1 = "/api/v1"


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialise resources on startup; clean up on shutdown."""
    logger.info("Starting Voqal Voice AI Agent API (env=%s)", settings.app_env)
    await init_db()
    yield
    await close_db()
    logger.info("API shutdown complete")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Voqal Voice AI Agent",
    description=(
        "REST API for AI-powered call handling, lead qualification, and CRM integration.\n\n"
        "**Base URL for all endpoints:** `/api/v1`\n\n"
        "| Prefix | Module |\n"
        "|--------|--------|\n"
        "| `/api/v1/calls` | Call lifecycle management |\n"
        "| `/api/v1/leads` | Lead qualification & CRM sync |\n"
        "| `/api/v1/crm` | CRM configuration & webhooks |\n"
        "| `/api/v1/analytics` | Dashboard & reports |\n"
        "| `/api/v1/agents` | AI agent persona management |\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ── CORS ───────────────────────────────────────────────────────────────────────

_ALLOWED_ORIGINS = (
    # Note: When `allow_credentials=True`, CORSMiddleware cannot respond with
    # `Access-Control-Allow-Origin: *`. Use explicit dev origins instead.
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Vite dev server defaults (if running frontend outside Docker)
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    if not settings.is_production
    else ["https://app.voqal.ai", "https://dashboard.voqal.ai"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response logging middleware ──────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log each request with latency and a unique correlation ID."""
    request_id = str(uuid.uuid4())[:8]
    start = time.monotonic()

    logger.info("→ %s %s [%s]", request.method, request.url.path, request_id)

    response = await call_next(request)
    elapsed_ms = (time.monotonic() - start) * 1000

    logger.info(
        "← %s %s %d %.1fms [%s]",
        request.method, request.url.path, response.status_code, elapsed_ms, request_id,
    )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
    return response


# ── Global error handler ───────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unhandled exceptions and return a structured JSON error response."""
    logger.exception("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "error_message": "An unexpected error occurred. Please try again later.",
        },
    )


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"], summary="Liveness probe")
async def health_check() -> dict:
    """
    Returns service health status.

    Used by load balancers and container orchestrators to verify liveness.
    Always returns 200 when the process is running.
    """
    return {
        "status": "healthy",
        "environment": settings.app_env,
        "version": app.version,
    }


@app.get("/", tags=["Health"], summary="API root")
async def root() -> dict:
    """API root — redirects browsers to /docs."""
    return {
        "name": "Voqal Voice AI Agent API",
        "version": app.version,
        "docs": "/docs",
        "health": "/health",
    }


# ── Routers (all mounted under /api/v1) ───────────────────────────────────────

app.include_router(calls.router, prefix=_API_V1)
app.include_router(leads.router, prefix=_API_V1)
app.include_router(crm.router, prefix=_API_V1)
app.include_router(analytics.router, prefix=_API_V1)
app.include_router(agents.router, prefix=_API_V1)


# ── Dev entrypoint ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
