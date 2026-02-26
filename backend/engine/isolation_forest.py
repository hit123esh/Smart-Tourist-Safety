"""
Isolation Forest Anomaly Detector
==================================
Unsupervised behavioural anomaly detection trained exclusively on SAFE-mode
simulation data.  Events that deviate from the learned "normal tourist
behaviour" distribution are flagged as anomalies.

Key design decisions:
- Train only on SAFE data → anomalies are *deviations from normal*
- Low contamination (2 %) accounts for noise in training data
- Threshold calibrated via ``decision_function`` percentile
- Sigmoid normalisation maps raw scores to [0, 1] for fusion
- Graceful degradation: if no model is loaded, returns 0.0 (rules-only mode)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import joblib

from engine.feature_engineer import FEATURE_COLUMNS

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Wraps a trained ``IsolationForest`` model for inference."""

    def __init__(self, model_path: str = "models/isolation_forest_v1.joblib"):
        self.model = None
        self.threshold: float = 0.0
        self.feature_columns: list[str] = FEATURE_COLUMNS
        self.model_version: str = "none"
        self.training_samples: int = 0
        self._model_path = model_path
        self.load_model(model_path)

    # ------------------------------------------------------------------
    # Model lifecycle
    # ------------------------------------------------------------------

    def load_model(self, path: str) -> bool:
        """Load a persisted model bundle.  Returns True on success."""
        p = Path(path)
        if not p.exists():
            logger.warning("Model file not found at %s — running in rules-only mode", path)
            return False

        try:
            bundle = joblib.load(p)
            self.model = bundle["model"]
            self.threshold = bundle.get("threshold", 0.0)
            self.feature_columns = bundle.get("feature_columns", FEATURE_COLUMNS)
            self.model_version = bundle.get("model_version", "v1")
            self.training_samples = bundle.get("training_samples", 0)
            logger.info(
                "Model loaded: version=%s  samples=%d  threshold=%.4f",
                self.model_version,
                self.training_samples,
                self.threshold,
            )
            return True
        except Exception:
            logger.exception("Failed to load model from %s", path)
            return False

    def reload(self) -> bool:
        """Re-load the model from the original path (after retraining)."""
        return self.load_model(self._model_path)

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, features: dict[str, float]) -> float:
        """
        Compute a normalised anomaly score in [0, 1].

        Higher = more anomalous.
        Returns ``0.0`` if no model is loaded (graceful degradation).
        """
        if self.model is None:
            return 0.0

        X = np.array([[features.get(col, 0.0) for col in self.feature_columns]])
        raw_score: float = float(self.model.decision_function(X)[0])
        normalised = self._sigmoid_normalise(raw_score)

        logger.debug(
            "IF raw=%.4f normalised=%.4f (threshold=%.4f)",
            raw_score,
            normalised,
            self.threshold,
        )
        return normalised

    def predict_batch(self, feature_matrix: np.ndarray) -> np.ndarray:
        """
        Batch prediction for multiple tourists at once.

        Parameters
        ----------
        feature_matrix : np.ndarray of shape (n_tourists, n_features)

        Returns
        -------
        np.ndarray of shape (n_tourists,) with normalised anomaly scores.
        """
        if self.model is None:
            return np.zeros(feature_matrix.shape[0])

        raw_scores = self.model.decision_function(feature_matrix)
        return np.vectorize(self._sigmoid_normalise)(raw_scores)

    # ------------------------------------------------------------------
    # Normalisation
    # ------------------------------------------------------------------

    @staticmethod
    def _sigmoid_normalise(raw_score: float, steepness: float = 5.0) -> float:
        """
        Map IsolationForest ``decision_function`` output to [0, 1].

        ``decision_function`` returns:
        - positive values → more normal (inlier)
        - negative values → more anomalous (outlier)

        A sigmoid centered at 0 smoothly converts this to an anomaly
        probability where higher = more anomalous.
        """
        return float(np.clip(1.0 / (1.0 + np.exp(steepness * raw_score)), 0.0, 1.0))


# ---------------------------------------------------------------------------
# Standalone training helper (used by training/train_model.py)
# ---------------------------------------------------------------------------

def train_and_save(
    feature_df,
    output_path: str = "models/isolation_forest_v1.joblib",
    n_estimators: int = 200,
    contamination: float = 0.02,
    version: str = "v1",
) -> dict[str, Any]:
    """
    Train an IsolationForest on the provided feature DataFrame and persist it.

    Parameters
    ----------
    feature_df : pd.DataFrame
        Must contain all FEATURE_COLUMNS. Should be SAFE-only data.
    output_path : str
        Where to save the ``.joblib`` bundle.
    n_estimators : int
        Number of trees.
    contamination : float
        Expected fraction of anomalies in training set.
    version : str
        Semantic version string for this model.

    Returns
    -------
    dict with training metadata.
    """
    from sklearn.ensemble import IsolationForest

    X = feature_df[FEATURE_COLUMNS].values
    logger.info("Training IsolationForest: samples=%d features=%d", X.shape[0], X.shape[1])

    model = IsolationForest(
        n_estimators=n_estimators,
        max_samples="auto",
        contamination=contamination,
        max_features=1.0,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    # Calibrate threshold using the 5th percentile of decision scores
    scores = model.decision_function(X)
    threshold = float(np.percentile(scores, 5))

    # Persist
    bundle = {
        "model": model,
        "threshold": threshold,
        "feature_columns": FEATURE_COLUMNS,
        "model_version": version,
        "training_samples": int(X.shape[0]),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "contamination": contamination,
        "n_estimators": n_estimators,
        "score_stats": {
            "mean": float(np.mean(scores)),
            "std": float(np.std(scores)),
            "min": float(np.min(scores)),
            "max": float(np.max(scores)),
            "p5": threshold,
        },
    }

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, output_path)
    logger.info("Model saved to %s (version=%s, threshold=%.4f)", output_path, version, threshold)

    return {
        "model_version": version,
        "training_samples": int(X.shape[0]),
        "threshold": threshold,
        "output_path": output_path,
    }
