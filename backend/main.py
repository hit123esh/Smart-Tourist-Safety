"""
Tourist Safety Anomaly Detection — FastAPI Service
====================================================
Main entry point for the anomaly detection microservice.

Responsibilities:
- Scheduled 30-second analysis loop across all active tourists
- On-demand single-tourist analysis endpoint
- Model retraining endpoint (async background task)
- Health check with model status

The service:
1. Queries the ``feature_agg_2min`` view for pre-aggregated features
2. Enriches features with distance/speed (Python-side Haversine)
3. Runs the Rule Engine and Isolation Forest in parallel
4. Combines scores via Hybrid Fusion
5. Inserts alerts ≥ MEDIUM into ``incident_alerts``
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import settings
from engine.rule_engine import evaluate_rules
from engine.feature_engineer import enrich_features, FEATURE_COLUMNS
from engine.isolation_forest import AnomalyDetector
from engine.hybrid_fusion import compute_hybrid_score
from services.supabase_client import SupabaseService

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("anomaly_service")

# ---------------------------------------------------------------------------
# Global singletons
# ---------------------------------------------------------------------------

supabase_svc: SupabaseService | None = None
anomaly_detector: AnomalyDetector | None = None
scheduler = AsyncIOScheduler()


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global supabase_svc, anomaly_detector

    # Initialise Supabase client
    supabase_svc = SupabaseService(settings.supabase_url, settings.supabase_service_key)

    # Load ML model (graceful degradation if not found)
    anomaly_detector = AnomalyDetector(settings.model_path)

    # Start scheduled analysis loop
    scheduler.add_job(
        analyze_all_tourists,
        "interval",
        seconds=settings.analysis_interval_seconds,
        id="anomaly_analysis_loop",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Anomaly detection service started (interval=%ds, model_loaded=%s)",
        settings.analysis_interval_seconds,
        anomaly_detector.is_loaded,
    )

    yield

    scheduler.shutdown(wait=False)
    logger.info("Service shut down")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Tourist Safety Anomaly Detection",
    version="1.0.0",
    description="Hybrid Rule Engine + Isolation Forest anomaly detection for tourist safety",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Core analysis logic
# ---------------------------------------------------------------------------

def _analyze_single_tourist(
    agg_row: dict[str, Any],
    raw_events: list[dict[str, Any]],
) -> dict[str, Any] | None:
    """
    Run the full hybrid pipeline for one tourist.
    Returns an alert dict if severity ≥ threshold, else None.
    """
    tourist_id = agg_row["tourist_id"]

    # 1. Enrich features
    features = enrich_features(agg_row, raw_events)

    # 2. Rule Engine
    rule_output = evaluate_rules(features, raw_events)

    # 3. Isolation Forest
    ml_score = anomaly_detector.predict(features) if anomaly_detector else 0.0

    # 4. Hybrid Fusion
    fusion = compute_hybrid_score(
        rule_score=rule_output.rule_score,
        anomaly_score=ml_score,
        rule_weight=settings.rule_weight,
        ml_weight=settings.ml_weight,
        alert_threshold=settings.alert_severity_threshold,
    )

    if not fusion.should_alert:
        return None

    return {
        "tourist_id": tourist_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "rule_score": round(fusion.rule_score, 4),
        "anomaly_score": round(fusion.anomaly_score, 4),
        "hybrid_score": round(fusion.hybrid_score, 4),
        "severity": fusion.severity,
        "triggered_rules": rule_output.triggered_rules,
        "feature_vector": {k: round(v, 6) for k, v in features.items()},
        "latitude": agg_row.get("latest_latitude"),
        "longitude": agg_row.get("latest_longitude"),
        "zone_state": agg_row.get("latest_zone_state"),
        "model_version": anomaly_detector.model_version if anomaly_detector else "none",
    }


async def analyze_all_tourists():
    """
    Scheduled task: analyse every active tourist in the current 2-min window.
    """
    if supabase_svc is None:
        return

    start = time.monotonic()

    # Fetch aggregated features for all tourists with ≥ 3 events
    agg_rows = supabase_svc.get_aggregated_features()
    if not agg_rows:
        return

    alerts_generated = 0

    for agg_row in agg_rows:
        tourist_id = agg_row.get("tourist_id")
        if not tourist_id:
            continue

        # Fetch raw events for rules that need temporal analysis
        raw_events = supabase_svc.get_recent_events(
            tourist_id, window_minutes=settings.feature_window_minutes
        )

        alert = _analyze_single_tourist(agg_row, raw_events)
        if alert:
            supabase_svc.insert_incident_alert(alert)
            alerts_generated += 1

    elapsed = (time.monotonic() - start) * 1000
    logger.info(
        "Analysis cycle: tourists=%d alerts=%d duration=%.1fms",
        len(agg_rows),
        alerts_generated,
        elapsed,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check with model and service status."""
    return {
        "status": "ok",
        "model_loaded": anomaly_detector.is_loaded if anomaly_detector else False,
        "model_version": anomaly_detector.model_version if anomaly_detector else "none",
        "analysis_interval": settings.analysis_interval_seconds,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/analyze/{tourist_id}")
async def analyze_tourist(tourist_id: str):
    """On-demand analysis for a single tourist."""
    if supabase_svc is None:
        raise HTTPException(503, "Service not initialised")

    # Fetch the aggregated features
    agg_rows = supabase_svc.get_aggregated_features()
    agg_row = next((r for r in agg_rows if r.get("tourist_id") == tourist_id), None)

    if not agg_row:
        raise HTTPException(
            404,
            f"No recent activity for tourist {tourist_id} (need ≥ 3 events in 2 min)",
        )

    raw_events = supabase_svc.get_recent_events(tourist_id)
    features = enrich_features(agg_row, raw_events)
    rule_output = evaluate_rules(features, raw_events)
    ml_score = anomaly_detector.predict(features) if anomaly_detector else 0.0
    fusion = compute_hybrid_score(
        rule_score=rule_output.rule_score,
        anomaly_score=ml_score,
        rule_weight=settings.rule_weight,
        ml_weight=settings.ml_weight,
        alert_threshold=settings.alert_severity_threshold,
    )

    return {
        "tourist_id": tourist_id,
        "features": {k: round(v, 6) for k, v in features.items()},
        "rule_score": round(fusion.rule_score, 4),
        "anomaly_score": round(fusion.anomaly_score, 4),
        "hybrid_score": round(fusion.hybrid_score, 4),
        "severity": fusion.severity,
        "triggered_rules": rule_output.triggered_rules,
        "concordance": fusion.concordance,
        "should_alert": fusion.should_alert,
    }


@app.post("/retrain")
async def retrain_model(background_tasks: BackgroundTasks):
    """Trigger model retraining as a background task."""
    background_tasks.add_task(_retrain_background)
    return {"status": "retraining_started", "message": "Model retraining initiated in background"}


async def _retrain_background():
    """Background retraining task."""
    from training.train_model import train

    try:
        logger.info("Background retraining started")
        result = train(days=7)
        # Reload the model
        if anomaly_detector:
            anomaly_detector.reload()
        logger.info("Background retraining complete: %s", result)
    except Exception:
        logger.exception("Background retraining failed")


@app.get("/model/info")
async def model_info():
    """Get current model metadata."""
    if not anomaly_detector or not anomaly_detector.is_loaded:
        return {"status": "no_model", "message": "No model loaded — running in rules-only mode"}
    return {
        "model_version": anomaly_detector.model_version,
        "training_samples": anomaly_detector.training_samples,
        "threshold": anomaly_detector.threshold,
        "feature_columns": anomaly_detector.feature_columns,
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level,
    )
