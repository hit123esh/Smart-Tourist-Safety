"""
Unit tests for the Rule-Based Risk Engine.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.rule_engine import evaluate_rules, classify_severity


class TestSeverityClassification:
    def test_critical(self):
        assert classify_severity(0.8) == "CRITICAL"
        assert classify_severity(1.0) == "CRITICAL"

    def test_high(self):
        assert classify_severity(0.6) == "HIGH"
        assert classify_severity(0.79) == "HIGH"

    def test_medium(self):
        assert classify_severity(0.3) == "MEDIUM"
        assert classify_severity(0.59) == "MEDIUM"

    def test_low(self):
        assert classify_severity(0.0) == "LOW"
        assert classify_severity(0.29) == "LOW"


class TestRuleEngine:
    def test_no_rules_triggered(self):
        """All-safe features should produce score=0."""
        features = {
            "event_count": 10,
            "unique_zones": 1,
            "danger_ratio": 0.0,
            "caution_ratio": 0.0,
            "panic_count": 0,
            "zone_transitions": 0,
            "max_risk_timer": 0,
            "avg_risk_timer": 0,
            "lat_std": 0.001,
            "lng_std": 0.001,
        }
        output = evaluate_rules(features)
        assert output.rule_score == 0.0
        assert output.triggered_rules == []
        assert output.severity == "LOW"

    def test_r2_panic(self):
        """Panic button should always return score=1.0, CRITICAL."""
        features = {"panic_count": 1}
        output = evaluate_rules(features)
        assert output.rule_score == 1.0
        assert "R2" in output.triggered_rules
        assert output.severity == "CRITICAL"

    def test_r1_sustained_danger(self):
        """IN_DANGER ≥60s with high danger_ratio triggers R1."""
        features = {
            "max_risk_timer": 65,
            "danger_ratio": 0.7,
            "panic_count": 0,
            "zone_transitions": 0,
        }
        output = evaluate_rules(features)
        assert "R1" in output.triggered_rules
        assert output.rule_score >= 0.8

    def test_r4_erratic_movement(self):
        """≥3 zone transitions should fire R4."""
        features = {
            "zone_transitions": 4,
            "panic_count": 0,
            "max_risk_timer": 0,
            "danger_ratio": 0.0,
        }
        output = evaluate_rules(features)
        assert "R4" in output.triggered_rules
        assert output.rule_score >= 0.6

    def test_r5_extended_danger(self):
        """Risk timer ≥120s fires R5."""
        features = {
            "max_risk_timer": 130,
            "panic_count": 0,
            "zone_transitions": 0,
            "danger_ratio": 0.0,
        }
        output = evaluate_rules(features)
        assert "R5" in output.triggered_rules
        assert output.rule_score >= 0.9

    def test_multi_rule_boost(self):
        """Multiple rules firing should boost the score."""
        features = {
            "panic_count": 1,       # R2 → 1.0
            "max_risk_timer": 130,  # R5 → 0.9
            "zone_transitions": 5,  # R4 → 0.6
            "danger_ratio": 0.8,    # R1 → 0.8 (with max_risk_timer ≥60)
        }
        output = evaluate_rules(features)
        assert len(output.triggered_rules) >= 3
        assert output.rule_score == 1.0  # capped at 1.0

    def test_r3_rapid_transition(self):
        """SAFE → IN_DANGER in ≤10s should fire R3."""
        features = {"panic_count": 0, "zone_transitions": 0, "max_risk_timer": 0, "danger_ratio": 0.0}
        events = [
            {"zone_state": "SAFE", "timestamp": "2026-01-01T12:00:00Z", "event_type": "MOVE"},
            {"zone_state": "IN_DANGER", "timestamp": "2026-01-01T12:00:08Z", "event_type": "ZONE_ENTER"},
        ]
        output = evaluate_rules(features, events)
        assert "R3" in output.triggered_rules

    def test_r6_danger_no_exit(self):
        """IN_DANGER with timer ≥30s and no ZONE_EXIT should fire R6."""
        features = {
            "latest_zone_state": "IN_DANGER",
            "max_risk_timer": 35,
            "panic_count": 0,
            "zone_transitions": 0,
            "danger_ratio": 0.0,
        }
        events = [
            {"zone_state": "IN_DANGER", "timestamp": "2026-01-01T12:00:00Z", "event_type": "MOVE"},
            {"zone_state": "IN_DANGER", "timestamp": "2026-01-01T12:00:30Z", "event_type": "MOVE"},
        ]
        output = evaluate_rules(features, events)
        assert "R6" in output.triggered_rules
