"""
Rule-Based Risk Engine
======================
Deterministic safety trigger evaluation against a 2-minute feature window.

Rules encode domain-expert knowledge with high confidence — they are the
"hard floor" of the detection system. Each rule maps to a known danger pattern
observed in tourist safety research.

Scoring: each rule outputs a score in [0, 1]. The final rule_score is the
maximum triggered score, boosted by +0.1 for each additional concurrent rule.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class RuleResult:
    """Result of evaluating a single rule."""
    rule_id: str
    triggered: bool
    score: float
    description: str


@dataclass
class RuleEngineOutput:
    """Aggregate output from the rule engine."""
    rule_score: float = 0.0
    triggered_rules: list[str] = field(default_factory=list)
    details: list[RuleResult] = field(default_factory=list)
    severity: str = "LOW"


# ---------------------------------------------------------------------------
# Severity classification
# ---------------------------------------------------------------------------

def classify_severity(score: float) -> str:
    """Map a [0, 1] score to a severity label."""
    if score >= 0.8:
        return "CRITICAL"
    elif score >= 0.6:
        return "HIGH"
    elif score >= 0.3:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Individual rule evaluators
# ---------------------------------------------------------------------------

def _rule_r1_sustained_danger(features: dict[str, Any]) -> RuleResult:
    """R1: Tourist in IN_DANGER zone for ≥ 60 s (max_risk_timer) with high danger_ratio."""
    triggered = (
        features.get("max_risk_timer", 0) >= 60
        and features.get("danger_ratio", 0) > 0.5
    )
    return RuleResult(
        rule_id="R1",
        triggered=triggered,
        score=0.8 if triggered else 0.0,
        description="Sustained danger zone exposure (≥60s)",
    )


def _rule_r2_panic(features: dict[str, Any]) -> RuleResult:
    """R2: Panic button was pressed."""
    triggered = features.get("panic_count", 0) > 0
    return RuleResult(
        rule_id="R2",
        triggered=triggered,
        score=1.0 if triggered else 0.0,
        description="Panic button activated",
    )


def _rule_r3_rapid_transition(
    features: dict[str, Any],
    events: list[dict[str, Any]],
) -> RuleResult:
    """R3: SAFE → IN_DANGER transition within ≤ 10 seconds."""
    triggered = _has_rapid_transition(events, threshold_seconds=10)
    return RuleResult(
        rule_id="R3",
        triggered=triggered,
        score=0.7 if triggered else 0.0,
        description="Rapid safe-to-danger transition (≤10s)",
    )


def _rule_r4_erratic_movement(features: dict[str, Any]) -> RuleResult:
    """R4: ≥ 3 zone transitions in the 2-minute window (erratic behaviour)."""
    triggered = features.get("zone_transitions", 0) >= 3
    return RuleResult(
        rule_id="R4",
        triggered=triggered,
        score=0.6 if triggered else 0.0,
        description="Erratic zone transitions (≥3 in 2 min)",
    )


def _rule_r5_extended_danger(features: dict[str, Any]) -> RuleResult:
    """R5: Cumulative risk timer ≥ 120 s."""
    triggered = features.get("max_risk_timer", 0) >= 120
    return RuleResult(
        rule_id="R5",
        triggered=triggered,
        score=0.9 if triggered else 0.0,
        description="Extended danger exposure (≥120s cumulative)",
    )


def _rule_r6_danger_no_exit(
    features: dict[str, Any],
    events: list[dict[str, Any]],
) -> RuleResult:
    """R6: Currently IN_DANGER with risk_timer ≥ 30 s and no ZONE_EXIT event."""
    latest_zone = features.get("latest_zone_state", "")
    risk_timer = features.get("max_risk_timer", 0)
    has_exit = any(e.get("event_type") == "ZONE_EXIT" for e in events)
    triggered = latest_zone == "IN_DANGER" and risk_timer >= 30 and not has_exit
    return RuleResult(
        rule_id="R6",
        triggered=triggered,
        score=0.75 if triggered else 0.0,
        description="In danger zone ≥30s with no exit",
    )


# ---------------------------------------------------------------------------
# Helper: rapid transition detection
# ---------------------------------------------------------------------------

def _has_rapid_transition(
    events: list[dict[str, Any]],
    threshold_seconds: float = 10.0,
) -> bool:
    """
    Check if there is a SAFE → IN_DANGER state change within
    *threshold_seconds* in the raw event stream.
    """
    from datetime import datetime

    safe_ts: float | None = None
    for event in sorted(events, key=lambda e: e.get("timestamp", "")):
        zone = event.get("zone_state", "")
        try:
            ts = datetime.fromisoformat(
                str(event.get("timestamp", "")).replace("Z", "+00:00")
            ).timestamp()
        except (ValueError, TypeError):
            continue

        if zone == "SAFE":
            safe_ts = ts
        elif zone == "IN_DANGER" and safe_ts is not None:
            if ts - safe_ts <= threshold_seconds:
                return True
    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

ALL_RULES = [
    _rule_r1_sustained_danger,
    _rule_r2_panic,
    _rule_r3_rapid_transition,
    _rule_r4_erratic_movement,
    _rule_r5_extended_danger,
    _rule_r6_danger_no_exit,
]


def evaluate_rules(
    features: dict[str, Any],
    events: list[dict[str, Any]] | None = None,
) -> RuleEngineOutput:
    """
    Evaluate all deterministic rules against the 2-min feature window.

    Parameters
    ----------
    features : dict
        Aggregated feature vector (from ``feature_agg_2min`` view or
        `FeatureEngineer`).
    events : list[dict], optional
        Raw event rows in the window (needed by R3 & R6 for temporal checks).

    Returns
    -------
    RuleEngineOutput
        Contains the composite rule_score, triggered rule IDs, and severity.
    """
    if events is None:
        events = []

    results: list[RuleResult] = []
    for rule_fn in ALL_RULES:
        # Rules that need raw events receive them; others get features only
        try:
            if rule_fn in (_rule_r3_rapid_transition, _rule_r6_danger_no_exit):
                result = rule_fn(features, events)
            else:
                result = rule_fn(features)
            results.append(result)
        except Exception:
            logger.exception("Rule %s failed", rule_fn.__name__)

    triggered = [r for r in results if r.triggered]

    if not triggered:
        return RuleEngineOutput(
            rule_score=0.0,
            triggered_rules=[],
            details=results,
            severity="LOW",
        )

    # Composite score: max + boost for concurrent triggers
    score = max(r.score for r in triggered)
    if len(triggered) >= 2:
        score = min(1.0, score + 0.1 * (len(triggered) - 1))

    severity = classify_severity(score)
    logger.info(
        "Rules triggered: %s  score=%.2f  severity=%s",
        [r.rule_id for r in triggered],
        score,
        severity,
    )

    return RuleEngineOutput(
        rule_score=score,
        triggered_rules=[r.rule_id for r in triggered],
        details=results,
        severity=severity,
    )
