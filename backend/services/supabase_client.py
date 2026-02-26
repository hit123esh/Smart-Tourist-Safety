"""
Supabase Client Service
=======================
Handles all database interactions with Supabase for the anomaly detection
backend: reading tourist_events, querying the feature aggregation view,
and writing incident_alerts.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any

from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseService:
    """Thin wrapper around the Supabase Python client."""

    def __init__(self, url: str, service_key: str):
        self.client: Client = create_client(url, service_key)
        logger.info("Supabase client initialised for %s", url)

    # ------------------------------------------------------------------
    # READ: Feature aggregation view
    # ------------------------------------------------------------------

    def get_aggregated_features(self) -> list[dict[str, Any]]:
        """
        Query the ``feature_agg_2min`` view which pre-aggregates the last
        2 minutes of tourist_events per tourist_id.

        Returns a list of dicts, one per tourist, with aggregated columns.
        """
        try:
            response = (
                self.client.table("feature_agg_2min")
                .select("*")
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Failed to query feature_agg_2min")
            return []

    # ------------------------------------------------------------------
    # READ: Raw events for a tourist (needed by rule engine for R3/R6)
    # ------------------------------------------------------------------

    def get_recent_events(
        self,
        tourist_id: str,
        window_minutes: int = 2,
    ) -> list[dict[str, Any]]:
        """Fetch raw events for one tourist in the last *window_minutes*."""
        since = (
            datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        ).isoformat()

        try:
            response = (
                self.client.table("tourist_events")
                .select("*")
                .eq("tourist_id", tourist_id)
                .gte("timestamp", since)
                .order("timestamp", desc=False)
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Failed to fetch events for tourist %s", tourist_id)
            return []

    # ------------------------------------------------------------------
    # READ: Historical SAFE-mode data (for training)
    # ------------------------------------------------------------------

    def get_safe_training_data(
        self,
        days: int = 7,
        limit: int = 50_000,
    ) -> list[dict[str, Any]]:
        """
        Fetch up to *limit* rows of SAFE simulation-mode data from the
        last *days* days.  Used for Isolation Forest training.
        """
        since = (
            datetime.now(timezone.utc) - timedelta(days=days)
        ).isoformat()

        try:
            response = (
                self.client.table("tourist_events")
                .select("*")
                .eq("simulation_mode", "safe")
                .gte("timestamp", since)
                .order("timestamp", desc=False)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Failed to fetch training data")
            return []

    # ------------------------------------------------------------------
    # WRITE: Insert incident alert
    # ------------------------------------------------------------------

    def insert_incident_alert(self, alert: dict[str, Any]) -> bool:
        """Insert a single row into ``incident_alerts``."""
        try:
            self.client.table("incident_alerts").insert(alert).execute()
            logger.info(
                "Alert inserted: tourist=%s severity=%s hybrid=%.2f",
                alert.get("tourist_id"),
                alert.get("severity"),
                alert.get("hybrid_score", 0),
            )
            return True
        except Exception:
            logger.exception("Failed to insert incident alert")
            return False

    # ------------------------------------------------------------------
    # WRITE: Acknowledge / resolve alert
    # ------------------------------------------------------------------

    def acknowledge_alert(self, alert_id: str, officer_id: str) -> bool:
        """Mark an incident_alert as acknowledged."""
        try:
            self.client.table("incident_alerts").update({
                "acknowledged": True,
                "acknowledged_by": officer_id,
                "acknowledged_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", alert_id).execute()
            return True
        except Exception:
            logger.exception("Failed to acknowledge alert %s", alert_id)
            return False

    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an incident_alert as resolved."""
        try:
            self.client.table("incident_alerts").update({
                "resolved": True,
            }).eq("id", alert_id).execute()
            return True
        except Exception:
            logger.exception("Failed to resolve alert %s", alert_id)
            return False
