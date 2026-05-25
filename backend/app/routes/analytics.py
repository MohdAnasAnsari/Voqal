"""
Analytics and reporting endpoints.

Provides the executive dashboard summary and arbitrary-range detailed reports.
All metrics include period-over-period deltas so the frontend can render trends.
"""

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Call, Lead
from app.models.schemas import (
    AnalyticsResponse,
    AnalyticsSummary,
    DailyDataPoint,
    DashboardResponse,
    IntentBreakdown,
    ReportMetrics,
    ReportResponse,
    TrendMetric,
    TrendPoint,
)
from app.services import call_service, lead_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Shared helpers ────────────────────────────────────────────────────────────

def _trend(cur: float, prev: float) -> TrendMetric:
    """Build a TrendMetric with period-over-period delta."""
    if prev == 0:
        return TrendMetric(value=cur, change_percent=None, trend="flat")
    pct = round((cur - prev) / prev * 100, 1)
    return TrendMetric(value=cur, change_percent=pct, trend="up" if pct > 0 else ("down" if pct < 0 else "flat"))


async def _active_call_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(Call.id)).where(Call.call_status == "in_progress")
    )
    return result.scalar_one() or 0


async def _today_snapshot(db: AsyncSession) -> tuple[int, int]:
    """Return (calls_today, qualified_today) for the current UTC date."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    calls_result = await db.execute(
        select(func.count(Call.id)).where(Call.start_time >= today_start)
    )
    leads_result = await db.execute(
        select(func.count(Lead.id)).where(
            Lead.created_at >= today_start,
            Lead.lead_quality_score >= 0.5,
        )
    )
    return (calls_result.scalar_one() or 0, leads_result.scalar_one() or 0)


async def _intent_breakdown(db: AsyncSession, start: datetime, end: datetime) -> list[IntentBreakdown]:
    """Return intent distribution (top 6) for the given window."""
    result = await db.execute(
        select(Call.intent, func.count(Call.id).label("cnt"))
        .where(Call.start_time.between(start, end), Call.intent.isnot(None))
        .group_by(Call.intent)
        .order_by(func.count(Call.id).desc())
        .limit(6)
    )
    rows = result.all()
    total = sum(r.cnt for r in rows) or 1
    return [
        IntentBreakdown(intent=r.intent, count=r.cnt, percentage=round(r.cnt / total * 100, 1))
        for r in rows
    ]


async def _daily_chart(db: AsyncSession, start: datetime, end: datetime) -> list[DailyDataPoint]:
    """Build daily data-point series between start and end."""
    points: list[DailyDataPoint] = []
    delta = timedelta(days=1)
    cur = start.replace(hour=0, minute=0, second=0, microsecond=0)
    while cur <= end:
        day_end = cur.replace(hour=23, minute=59, second=59)
        call_agg = await call_service.aggregate(db, cur, day_end)
        lead_agg = await lead_service.aggregate(db, cur, day_end)
        points.append(
            DailyDataPoint(
                date=cur.strftime("%Y-%m-%d"),
                calls=int(call_agg["total_calls"]),
                qualified_leads=int(lead_agg["qualified"]),
                conversion_rate=round(lead_agg["conversion_rate"], 4),
            )
        )
        cur += delta
    return points


# ══════════════════════════════════════════════════════════════════════════════
# GET /dashboard  — executive summary
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Get live dashboard metrics",
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    """
    Return all data needed to render the executive dashboard in one request.

    Includes:
    - Today's call and lead counts (live snapshot)
    - Number of calls currently in progress
    - 7-day aggregates with trend vs the previous 7 days
    - Daily sparkline chart data for the last 7 days
    - Intent breakdown pie chart data

    This endpoint is designed to be polled every 30–60 seconds.
    """
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = week_start - timedelta(days=7)

    try:
        # Parallel aggregation
        calls_cur = await call_service.aggregate(db, week_start, now)
        calls_prev = await call_service.aggregate(db, prev_week_start, week_start)
        leads_cur = await lead_service.aggregate(db, week_start, now)
        leads_prev = await lead_service.aggregate(db, prev_week_start, week_start)

        calls_today, qualified_today = await _today_snapshot(db)
        active_count = await _active_call_count(db)
        chart = await _daily_chart(db, week_start, now)
        intents = await _intent_breakdown(db, week_start, now)

        # Revenue: lead_value sum (falls back to 0 gracefully)
        revenue_cur = leads_cur.get("revenue_impact", 0.0)
        revenue_prev = leads_prev.get("revenue_impact", 0.0)

        logger.debug("Dashboard generated: calls_today=%d qualified_today=%d", calls_today, qualified_today)

        return DashboardResponse(
            calls_today=calls_today,
            qualified_today=qualified_today,
            active_calls_now=active_count,
            qualified_leads=_trend(leads_cur["qualified"], leads_prev["qualified"]),
            conversion_rate=_trend(leads_cur["conversion_rate"], leads_prev["conversion_rate"]),
            revenue=_trend(revenue_cur, revenue_prev),
            avg_call_duration=_trend(calls_cur["avg_duration"], calls_prev["avg_duration"]),
            avg_quality_score=_trend(leads_cur["avg_score"], leads_prev["avg_score"]),
            metrics_chart=chart,
            intent_breakdown=intents,
            generated_at=now,
        )
    except Exception as exc:
        # In local dev, schema drift (persisted DB volume + model changes) is a common cause.
        # Return a safe zeroed payload so the UI can still render and the logs show the root error.
        logger.exception("Dashboard aggregation failed: %s", exc)
        msg = str(exc).lower()
        if "undefinedcolumn" in msg or "does not exist" in msg:
            return DashboardResponse(
                calls_today=0,
                qualified_today=0,
                active_calls_now=0,
                qualified_leads=_trend(0, 0),
                conversion_rate=_trend(0, 0),
                revenue=_trend(0, 0),
                avg_call_duration=_trend(0, 0),
                avg_quality_score=_trend(0, 0),
                metrics_chart=[],
                intent_breakdown=[],
                generated_at=now,
            )
        raise


# ══════════════════════════════════════════════════════════════════════════════
# GET /report  — arbitrary-range detailed report
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/report",
    response_model=ReportResponse,
    summary="Generate a detailed analytics report for a date range",
)
async def get_report(
    date_from: date = Query(..., description="Inclusive start date (YYYY-MM-DD)"),
    date_to: date = Query(..., description="Inclusive end date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """
    Generate a comprehensive analytics report for the requested date range.

    Returns:
    - `detailed_metrics` — absolute counts for every tracked KPI
    - `charts_data`      — daily trend series for each key metric (for line charts)
    - `trends`           — period-over-period deltas vs the previous equivalent period
    - `top_intents`      — most frequent call intents with counts and percentages

    Typical use: scheduled weekly/monthly reports or on-demand export.
    """
    if date_to < date_from:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail={"error_code": "INVALID_DATE_RANGE", "error_message": "date_to must be >= date_from"},
        )

    start = datetime.combine(date_from, datetime.min.time()).replace(tzinfo=timezone.utc)
    end = datetime.combine(date_to, datetime.max.time()).replace(tzinfo=timezone.utc)
    period_days = max((end - start).days, 1)
    prev_start = start - timedelta(days=period_days)
    prev_end = start

    # Current and comparison period aggregates
    calls_cur = await call_service.aggregate(db, start, end)
    calls_prev = await call_service.aggregate(db, prev_start, prev_end)
    leads_cur = await lead_service.aggregate(db, start, end)
    leads_prev = await lead_service.aggregate(db, prev_start, prev_end)

    # Detailed metrics object
    detailed = ReportMetrics(
        total_calls=int(calls_cur["total_calls"]),
        answered_calls=int(calls_cur["answered_calls"]),
        failed_calls=int(calls_cur["failed_calls"]),
        transferred_calls=int(calls_cur["transferred_calls"]),
        avg_call_duration_seconds=round(calls_cur["avg_duration"], 1),
        qualified_leads=int(leads_cur["qualified"]),
        avg_lead_quality_score=round(leads_cur["avg_score"], 3),
        leads_converted=int(leads_cur["converted"]),
        conversion_rate=round(leads_cur["conversion_rate"], 4),
        revenue_impact=round(leads_cur["revenue_impact"], 2),
        avg_sentiment_score=round(calls_cur["avg_sentiment"], 3),
        intent_accuracy=round(calls_cur["intent_accuracy"], 3),
    )

    # Daily chart series
    daily_points = await _daily_chart(db, start, end)
    charts_data: dict[str, list[TrendPoint]] = {
        "calls": [TrendPoint(date=p.date, value=p.calls) for p in daily_points],
        "qualified_leads": [TrendPoint(date=p.date, value=p.qualified_leads) for p in daily_points],
        "conversion_rate": [TrendPoint(date=p.date, value=p.conversion_rate) for p in daily_points],
    }

    # Trend deltas
    trends = {
        "total_calls": _trend(calls_cur["total_calls"], calls_prev["total_calls"]),
        "qualified_leads": _trend(leads_cur["qualified"], leads_prev["qualified"]),
        "conversion_rate": _trend(leads_cur["conversion_rate"], leads_prev["conversion_rate"]),
        "avg_call_duration": _trend(calls_cur["avg_duration"], calls_prev["avg_duration"]),
        "avg_quality_score": _trend(leads_cur["avg_score"], leads_prev["avg_score"]),
        "revenue_impact": _trend(leads_cur["revenue_impact"], leads_prev["revenue_impact"]),
    }

    # Top intents for the period
    top_intents = await _intent_breakdown(db, start, end)

    logger.info(
        "Report generated: %s → %s (%d days) calls=%d leads=%d",
        date_from, date_to, period_days, detailed.total_calls, detailed.qualified_leads,
    )

    return ReportResponse(
        date_from=date_from.isoformat(),
        date_to=date_to.isoformat(),
        period_days=period_days,
        detailed_metrics=detailed,
        charts_data=charts_data,
        trends=trends,
        top_intents=top_intents,
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /summary  — generic aggregated metrics (used internally)
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/summary",
    response_model=AnalyticsResponse,
    summary="Aggregated metrics with trend deltas",
)
async def get_summary(
    start_date: Optional[date] = Query(None, description="Inclusive start date"),
    end_date: Optional[date] = Query(None, description="Inclusive end date"),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    """Generic summary endpoint used by internal tooling (defaults to last 7 days)."""
    now = datetime.now(timezone.utc)
    _end = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc) if end_date else now
    _start = (
        datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
        if start_date
        else now - timedelta(days=7)
    )
    period_days = max((_end - _start).days, 1)
    prev_start = _start - timedelta(days=period_days)

    calls_cur = await call_service.aggregate(db, _start, _end)
    calls_prev = await call_service.aggregate(db, prev_start, _start)
    leads_cur = await lead_service.aggregate(db, _start, _end)
    leads_prev = await lead_service.aggregate(db, prev_start, _start)

    return AnalyticsResponse(
        date=_end,
        period_label=f"Last {period_days} days",
        total_calls=_trend(calls_cur["total_calls"], calls_prev["total_calls"]),
        answered_calls=_trend(calls_cur["answered_calls"], calls_prev["answered_calls"]),
        failed_calls=_trend(calls_cur["failed_calls"], calls_prev["failed_calls"]),
        transferred_calls=_trend(calls_cur["transferred_calls"], calls_prev["transferred_calls"]),
        avg_call_duration_seconds=_trend(calls_cur["avg_duration"], calls_prev["avg_duration"]),
        qualified_leads=_trend(leads_cur["qualified"], leads_prev["qualified"]),
        avg_lead_quality_score=_trend(leads_cur["avg_score"], leads_prev["avg_score"]),
        leads_converted=_trend(leads_cur["converted"], leads_prev["converted"]),
        intent_classification_accuracy=_trend(calls_cur["intent_accuracy"], calls_prev["intent_accuracy"]),
        average_sentiment_score=_trend(calls_cur["avg_sentiment"], calls_prev["avg_sentiment"]),
        revenue_impact=_trend(leads_cur["revenue_impact"], leads_prev["revenue_impact"]),
        conversion_rate=_trend(leads_cur["conversion_rate"], leads_prev["conversion_rate"]),
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /daily  — per-day summaries
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/daily",
    response_model=list[AnalyticsSummary],
    summary="Per-day analytics summaries for trend charts",
)
async def get_daily(
    days: int = Query(30, ge=1, le=365, description="Number of past days"),
    db: AsyncSession = Depends(get_db),
) -> list[AnalyticsSummary]:
    """One lightweight summary per calendar day — ideal for the main trend chart."""
    return await call_service.daily_summary(db=db, days=days)


# ══════════════════════════════════════════════════════════════════════════════
# GET /top-intents  — intent frequency chart
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/top-intents",
    response_model=list[IntentBreakdown],
    summary="Top call intents by frequency",
)
async def top_intents_endpoint(
    limit: int = Query(10, ge=1, le=20),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
) -> list[IntentBreakdown]:
    """
    Return the top N intent labels for the last `days` calendar days.

    Includes count and percentage for pie/donut chart rendering.
    """
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    return await _intent_breakdown(db, start, end)


# ══════════════════════════════════════════════════════════════════════════════
# GET /lead-funnel  — funnel stage counts
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/lead-funnel",
    response_model=dict,
    summary="Lead conversion funnel stage counts",
)
async def lead_funnel(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Return lead counts at each funnel stage (new → qualified → contacted → converted).

    Suitable for rendering a funnel or Sankey diagram on the dashboard.
    """
    counts = await lead_service.funnel_counts(db=db)
    total = sum(counts.values()) or 1
    return {
        "stages": counts,
        "total_leads": total,
        "conversion_rate": round(counts.get("converted", 0) / total, 4),
    }
