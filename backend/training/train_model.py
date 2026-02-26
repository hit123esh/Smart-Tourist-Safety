"""
Isolation Forest Training Script
=================================
Offline script that:
1. Pulls SAFE-mode simulation data from Supabase
2. Engineers rolling-window features
3. Trains an IsolationForest model
4. Calibrates the anomaly threshold
5. Persists the model bundle to disk

Usage
-----
    cd backend
    python -m training.train_model

Or from the FastAPI /retrain endpoint (runs as a background task).
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import pandas as pd

# Ensure the backend package root is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import settings
from engine.feature_engineer import build_feature_dataframe, FEATURE_COLUMNS
from engine.isolation_forest import train_and_save
from services.supabase_client import SupabaseService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def fetch_training_data(days: int = 7) -> pd.DataFrame:
    """Pull SAFE-mode event data from Supabase and return as a DataFrame."""
    svc = SupabaseService(settings.supabase_url, settings.supabase_service_key)
    rows = svc.get_safe_training_data(days=days)

    if not rows:
        logger.warning("No SAFE-mode training data found in the last %d days", days)
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    logger.info("Fetched %d raw events for training", len(df))
    return df


def train(
    days: int = 7,
    n_estimators: int = 200,
    contamination: float = 0.02,
    version: str = "v1",
    output_path: str | None = None,
) -> dict:
    """
    End-to-end training pipeline.

    Returns
    -------
    dict with training metadata (model_version, training_samples, threshold, etc.)
    """
    if output_path is None:
        output_path = settings.model_path

    # Step 1: Fetch data
    logger.info("=" * 60)
    logger.info("STEP 1: Fetching SAFE-mode data (last %d days)", days)
    logger.info("=" * 60)
    raw_df = fetch_training_data(days=days)
    if raw_df.empty:
        raise ValueError(
            "No training data available. Run the frontend simulation in "
            "'SAFE' mode to generate events first."
        )

    # Step 2: Feature engineering
    logger.info("=" * 60)
    logger.info("STEP 2: Feature engineering (2-min rolling windows)")
    logger.info("=" * 60)
    feature_df = build_feature_dataframe(raw_df, window_seconds=120)
    logger.info("Generated %d feature windows from %d tourists",
                len(feature_df), feature_df["tourist_id"].nunique())

    if len(feature_df) < 10:
        raise ValueError(
            f"Only {len(feature_df)} feature windows generated — need at least "
            "10 for a meaningful model.  Run more SAFE-mode simulations."
        )

    # Step 3: Print feature statistics
    logger.info("=" * 60)
    logger.info("STEP 3: Feature statistics")
    logger.info("=" * 60)
    stats = feature_df[FEATURE_COLUMNS].describe()
    logger.info("\n%s", stats.to_string())

    # Step 4: Train model
    logger.info("=" * 60)
    logger.info("STEP 4: Training IsolationForest (n_estimators=%d, contamination=%.3f)",
                n_estimators, contamination)
    logger.info("=" * 60)
    result = train_and_save(
        feature_df=feature_df,
        output_path=output_path,
        n_estimators=n_estimators,
        contamination=contamination,
        version=version,
    )

    logger.info("=" * 60)
    logger.info("✅ Training complete!")
    logger.info("   Model version : %s", result["model_version"])
    logger.info("   Samples       : %d", result["training_samples"])
    logger.info("   Threshold     : %.4f", result["threshold"])
    logger.info("   Saved to      : %s", result["output_path"])
    logger.info("=" * 60)

    return result


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Train the Isolation Forest anomaly detection model"
    )
    parser.add_argument(
        "--days", type=int, default=7,
        help="Number of days of historical data to use (default: 7)",
    )
    parser.add_argument(
        "--estimators", type=int, default=200,
        help="Number of isolation trees (default: 200)",
    )
    parser.add_argument(
        "--contamination", type=float, default=0.02,
        help="Expected anomaly fraction in training data (default: 0.02)",
    )
    parser.add_argument(
        "--version", type=str, default="v1",
        help="Model version string (default: v1)",
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Output path for the model file",
    )

    args = parser.parse_args()

    try:
        train(
            days=args.days,
            n_estimators=args.estimators,
            contamination=args.contamination,
            version=args.version,
            output_path=args.output,
        )
    except ValueError as e:
        logger.error("Training failed: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
