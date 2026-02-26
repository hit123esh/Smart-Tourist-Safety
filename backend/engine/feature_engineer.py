"""
Feature Engineer
================
Transforms raw ``tourist_events`` rows into the 12-dimensional feature vector
consumed by both the Rule Engine and the Isolation Forest model.

Two modes of operation:
1. **SQL-side aggregation** — the ``feature_agg_2min`` Postgres view handles
   most aggregation; this module adds `distance_traveled` and `speed_estimate`
   which require ordered-pair Haversine computation (not SQL-friendly).
2. **Python-side aggregation** — used during model training when we operate on
   pandas DataFrames instead of live Supabase queries.
"""

from __future__ import annotations

import math
import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Feature column spec (canonical ordering for the model)
# ---------------------------------------------------------------------------

FEATURE_COLUMNS: list[str] = [
    "event_count",
    "unique_zones",
    "danger_ratio",
    "caution_ratio",
    "panic_count",
    "zone_transitions",
    "max_risk_timer",
    "avg_risk_timer",
    "lat_std",
    "lng_std",
    "distance_traveled",
    "speed_estimate",
]


# ---------------------------------------------------------------------------
# Haversine
# ---------------------------------------------------------------------------

def haversine_meters(
    lat1: float, lng1: float, lat2: float, lng2: float,
) -> float:
    """Great-circle distance between two points in metres."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_distance_traveled(events: list[dict[str, Any]]) -> float:
    """Sum of consecutive Haversine distances over ordered events."""
    sorted_events = sorted(events, key=lambda e: e.get("timestamp", ""))
    total = 0.0
    for i in range(1, len(sorted_events)):
        prev, curr = sorted_events[i - 1], sorted_events[i]
        try:
            total += haversine_meters(
                prev["latitude"], prev["longitude"],
                curr["latitude"], curr["longitude"],
            )
        except (KeyError, TypeError):
            continue
    return total


# ---------------------------------------------------------------------------
# Single-tourist enrichment (live inference path)
# ---------------------------------------------------------------------------

def enrich_features(
    agg_row: dict[str, Any],
    raw_events: list[dict[str, Any]],
    window_seconds: float = 120.0,
) -> dict[str, float]:
    """
    Take an aggregated row from ``feature_agg_2min`` and the raw events,
    then compute the two remaining features: distance_traveled, speed_estimate.

    Returns a dict keyed by FEATURE_COLUMNS ready for model input.
    """
    distance = compute_distance_traveled(raw_events)
    speed = distance / window_seconds if window_seconds > 0 else 0.0

    features: dict[str, float] = {}
    for col in FEATURE_COLUMNS:
        if col == "distance_traveled":
            features[col] = distance
        elif col == "speed_estimate":
            features[col] = speed
        else:
            features[col] = float(agg_row.get(col, 0) or 0)

    return features


# ---------------------------------------------------------------------------
# Batch feature engineering (training path)
# ---------------------------------------------------------------------------

def build_feature_dataframe(
    events_df: pd.DataFrame,
    window_seconds: int = 120,
) -> pd.DataFrame:
    """
    Given a DataFrame of raw tourist_events, produce aggregated feature
    vectors using a 2-minute rolling window per tourist.

    Used during model training to create the feature matrix from historical data.

    Parameters
    ----------
    events_df : pd.DataFrame
        Must contain columns: tourist_id, timestamp, zone_state, event_type,
        risk_timer_value, latitude, longitude.
    window_seconds : int
        Width of the rolling window in seconds (default 120).

    Returns
    -------
    pd.DataFrame
        One row per (tourist_id, window) with FEATURE_COLUMNS + tourist_id.
    """
    if events_df.empty:
        return pd.DataFrame(columns=["tourist_id"] + FEATURE_COLUMNS)

    events_df = events_df.copy()
    events_df["timestamp"] = pd.to_datetime(events_df["timestamp"], utc=True)
    events_df.sort_values(["tourist_id", "timestamp"], inplace=True)

    rows: list[dict[str, Any]] = []

    for tourist_id, group in events_df.groupby("tourist_id"):
        group = group.reset_index(drop=True)
        ts_array = group["timestamp"].values

        # Slide a 2-min window with 30-s stride
        window_ns = np.timedelta64(window_seconds, "s")
        stride_ns = np.timedelta64(30, "s")
        start = ts_array[0]
        end = ts_array[-1]

        current = start
        while current <= end:
            window_end = current + window_ns
            mask = (ts_array >= current) & (ts_array < window_end)
            window_df = group.loc[mask]

            if len(window_df) >= 3:
                agg = _aggregate_window(window_df)
                agg["tourist_id"] = tourist_id
                rows.append(agg)

            current = current + stride_ns

    if not rows:
        return pd.DataFrame(columns=["tourist_id"] + FEATURE_COLUMNS)

    return pd.DataFrame(rows)[["tourist_id"] + FEATURE_COLUMNS]


def _aggregate_window(window_df: pd.DataFrame) -> dict[str, float]:
    """Aggregate a single window DataFrame into a feature dict."""
    n = len(window_df)

    danger_states = {"IN_DANGER", "NEAR_DANGER"}
    caution_states = {"IN_CAUTION", "NEAR_CAUTION"}
    transition_types = {"ZONE_ENTER", "ZONE_EXIT"}

    danger_count = window_df["zone_state"].isin(danger_states).sum()
    caution_count = window_df["zone_state"].isin(caution_states).sum()
    panic_count = (window_df["event_type"] == "PANIC").sum()
    zone_transitions = window_df["event_type"].isin(transition_types).sum()

    # Distance traveled
    lats = window_df["latitude"].values
    lngs = window_df["longitude"].values
    distance = 0.0
    for i in range(1, len(lats)):
        try:
            distance += haversine_meters(lats[i - 1], lngs[i - 1], lats[i], lngs[i])
        except (ValueError, TypeError):
            pass

    return {
        "event_count": float(n),
        "unique_zones": float(window_df["zone_state"].nunique()),
        "danger_ratio": float(danger_count) / n,
        "caution_ratio": float(caution_count) / n,
        "panic_count": float(panic_count),
        "zone_transitions": float(zone_transitions),
        "max_risk_timer": float(window_df["risk_timer_value"].max()),
        "avg_risk_timer": float(window_df["risk_timer_value"].mean()),
        "lat_std": float(window_df["latitude"].std() or 0),
        "lng_std": float(window_df["longitude"].std() or 0),
        "distance_traveled": distance,
        "speed_estimate": distance / 120.0,
    }
