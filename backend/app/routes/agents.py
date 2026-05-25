"""
Agent management endpoints.

CRUD for AI call agent personas plus activate/deactivate shortcuts.
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Agent
from app.models.schemas import (
    AgentCreate,
    AgentListResponse,
    AgentResponse,
    AgentUpdate,
    ErrorResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _agent_to_dict(agent: Agent) -> dict:
    return {
        "id": str(agent.id),
        "name": agent.name,
        "description": agent.description,
        "status": agent.status,
        "llm_model": agent.llm_model,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
        "system_prompt": agent.system_prompt,
        "voice_id": agent.voice_id,
        "assigned_phone_number": agent.assigned_phone_number,
        "total_calls": agent.total_calls,
        "qualified_leads": agent.qualified_leads,
        "conversion_rate": agent.conversion_rate,
        "avg_call_duration": agent.avg_call_duration,
        "created_at": agent.created_at.isoformat() if agent.created_at else None,
        "updated_at": agent.updated_at.isoformat() if agent.updated_at else None,
    }


async def _get_or_404(db: AsyncSession, agent_id: str) -> Agent:
    try:
        uid = uuid.UUID(agent_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid agent ID format")
    result = await db.execute(select(Agent).where(Agent.id == uid))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found",
        )
    return agent


# ══════════════════════════════════════════════════════════════════════════════
# GET /  — paginated list
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=AgentListResponse,
    summary="List all agents",
)
async def list_agents(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: draft|active|inactive"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Agent)
    count_query = select(func.count()).select_from(Agent)

    if status_filter:
        query = query.where(Agent.status == status_filter)
        count_query = count_query.where(Agent.status == status_filter)

    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(query.order_by(Agent.created_at.desc()).offset(offset).limit(limit))
    agents = result.scalars().all()

    return AgentListResponse(
        agents=[AgentResponse(**_agent_to_dict(a)) for a in agents],
        total_count=total,
        limit=limit,
        offset=offset,
    )


# ══════════════════════════════════════════════════════════════════════════════
# POST /  — create
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new agent",
)
async def create_agent(
    body: AgentCreate,
    db: AsyncSession = Depends(get_db),
):
    agent = Agent(
        name=body.name,
        description=body.description,
        status=body.status,
        llm_model=body.llm_model,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
        system_prompt=body.system_prompt,
        voice_id=body.voice_id,
        assigned_phone_number=body.assigned_phone_number,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    logger.info("Created agent id=%s name=%r", agent.id, agent.name)
    return AgentResponse(**_agent_to_dict(agent))


# ══════════════════════════════════════════════════════════════════════════════
# GET /{agent_id}  — detail
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Get agent by ID",
    responses={404: {"model": ErrorResponse}},
)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await _get_or_404(db, agent_id)
    return AgentResponse(**_agent_to_dict(agent))


# ══════════════════════════════════════════════════════════════════════════════
# PUT /{agent_id}  — update
# ══════════════════════════════════════════════════════════════════════════════

@router.put(
    "/{agent_id}",
    response_model=AgentResponse,
    summary="Update an agent",
    responses={404: {"model": ErrorResponse}},
)
async def update_agent(
    agent_id: str,
    body: AgentUpdate,
    db: AsyncSession = Depends(get_db),
):
    agent = await _get_or_404(db, agent_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    await db.commit()
    await db.refresh(agent)
    logger.info("Updated agent id=%s", agent.id)
    return AgentResponse(**_agent_to_dict(agent))


# ══════════════════════════════════════════════════════════════════════════════
# DELETE /{agent_id}
# ══════════════════════════════════════════════════════════════════════════════

@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an agent",
    responses={404: {"model": ErrorResponse}},
)
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await _get_or_404(db, agent_id)
    await db.delete(agent)
    await db.commit()
    logger.info("Deleted agent id=%s", agent_id)


# ══════════════════════════════════════════════════════════════════════════════
# POST /{agent_id}/activate  |  deactivate
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/{agent_id}/activate",
    response_model=AgentResponse,
    summary="Set agent status to active",
    responses={404: {"model": ErrorResponse}},
)
async def activate_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await _get_or_404(db, agent_id)
    agent.status = "active"
    await db.commit()
    await db.refresh(agent)
    logger.info("Activated agent id=%s", agent.id)
    return AgentResponse(**_agent_to_dict(agent))


@router.post(
    "/{agent_id}/deactivate",
    response_model=AgentResponse,
    summary="Set agent status to inactive",
    responses={404: {"model": ErrorResponse}},
)
async def deactivate_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await _get_or_404(db, agent_id)
    agent.status = "inactive"
    await db.commit()
    await db.refresh(agent)
    logger.info("Deactivated agent id=%s", agent.id)
    return AgentResponse(**_agent_to_dict(agent))
