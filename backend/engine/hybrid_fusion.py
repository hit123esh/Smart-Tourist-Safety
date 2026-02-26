"""
Hybrid Fusion Module
====================
Mathematically combines the Rule Engine score and the Isolation Forest anomaly
score into a single hybrid severity assessment.

Design principles:
- **Rules dominate** (weight 0.6) because they encode high-confidence domain
  knowledge.  The ML model (weight 0.4) catches subtle behavioural deviations
  that rules cannot express.
- **Concordance bonus** (+0.1) when both systems agree on danger → high
  confidence.
- **ML-only dampening** (×0.7) when only the ML flags an anomaly → reduces
  false positives from model noise.
- **Conflict resolution** is explicit and documented for auditability.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class FusionResult:
    """Output of the hybrid fusion step."""
    hybrid_score: float
    severity: str
    rule_score: float
    anomaly_score: float
    concordance: str          # "AGREE_HIGH", "AGREE_LOW", "RULE_ONLY", "ML_ONLY", "CONFLICT"
    should_alert: bool


# ---------------------------------------------------------------------------
# Severity classification
# ---------------------------------------------------------------------------

SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
SEVERITY_THRESHOLDS = {
    "CRITICAL": 0.8,
    "HIGH": 0.6,
    "MEDIUM": 0.3,
    "LOW": 0.0,
}


def classify_severity(score: float) -> str:
    """Map a [0, 1] score to a severity label."""
    if score >= 0.8:
        return "CRITICAL"
    elif score >= 0.6:
        return "HIGH"
    elif score >= 0.3:
        return "MEDIUM"
    return "LOW"


def severity_meets_threshold(severity: str, threshold: str) -> bool:
    """Check if *severity* meets or exceeds *threshold*."""
    return SEVERITY_LEVELS.index(severity) >= SEVERITY_LEVELS.index(threshold)


# ---------------------------------------------------------------------------
# Core fusion logic
# ---------------------------------------------------------------------------

def compute_hybrid_score(
    rule_score: float,
    anomaly_score: float,
    rule_weight: float = 0.6,
    ml_weight: float = 0.4,
    alert_threshold: str = "MEDIUM",
) -> FusionResult:
    """
    Combine rule score and ML anomaly score into a hybrid assessment.

    Parameters
    ----------
    rule_score : float
        [0, 1] composite score from the Rule Engine.
    anomaly_score : float
        [0, 1] normalised anomaly score from Isolation Forest.
    rule_weight : float
        Weight for the rule component (default 0.6).
    ml_weight : float
        Weight for the ML component (default 0.4).
    alert_threshold : str
        Minimum severity to generate an alert (default "MEDIUM").

    Returns
    -------
    FusionResult
    """
    # --- Weighted average ---
    hybrid = rule_weight * rule_score + ml_weight * anomaly_score

    # --- Concordance analysis ---
    concordance = _determine_concordance(rule_score, anomaly_score)

    # --- Adjustments ---
    if concordance == "AGREE_HIGH":
        # Both agree → boost confidence
        hybrid = min(1.0, hybrid + 0.1)
    elif concordance == "ML_ONLY":
        # Only ML fires → dampen to reduce false positives
        hybrid *= 0.7
    # RULE_ONLY and AGREE_LOW: no adjustment needed

    hybrid = max(0.0, min(1.0, hybrid))

    severity = classify_severity(hybrid)
    should_alert = severity_meets_threshold(severity, alert_threshold)

    logger.info(
        "Fusion: rule=%.2f  ml=%.2f  hybrid=%.2f  severity=%s  concordance=%s  alert=%s",
        rule_score,
        anomaly_score,
        hybrid,
        severity,
        concordance,
        should_alert,
    )

    return FusionResult(
        hybrid_score=hybrid,
        severity=severity,
        rule_score=rule_score,
        anomaly_score=anomaly_score,
        concordance=concordance,
        should_alert=should_alert,
    )


# ---------------------------------------------------------------------------
# Concordance classification
# ---------------------------------------------------------------------------

def _determine_concordance(rule_score: float, anomaly_score: float) -> str:
    """
    Classify the agreement pattern between rule and ML systems.

    | Rule   | ML     | Label         |
    |--------|--------|---------------|
    | > 0.5  | > 0.5  | AGREE_HIGH    |
    | < 0.2  | < 0.3  | AGREE_LOW     |
    | > 0.5  | < 0.3  | RULE_ONLY     |
    | < 0.2  | > 0.7  | ML_ONLY       |
    | other  | other  | CONFLICT      |
    """
    if rule_score > 0.5 and anomaly_score > 0.5:
        return "AGREE_HIGH"
    if rule_score < 0.2 and anomaly_score < 0.3:
        return "AGREE_LOW"
    if rule_score > 0.5 and anomaly_score < 0.3:
        return "RULE_ONLY"
    if rule_score < 0.2 and anomaly_score > 0.7:
        return "ML_ONLY"
    return "CONFLICT"
