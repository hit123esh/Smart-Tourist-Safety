"""
Unit tests for the Feature Engineer and Hybrid Fusion modules.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.feature_engineer import (
    haversine_meters,
    compute_distance_traveled,
    enrich_features,
    FEATURE_COLUMNS,
)
from engine.hybrid_fusion import (
    classify_severity,
    compute_hybrid_score,
    severity_meets_threshold,
)


# ===========================================================================
# Feature Engineer Tests
# ===========================================================================

class TestHaversine:
    def test_same_point(self):
        assert haversine_meters(12.97, 77.59, 12.97, 77.59) == 0.0

    def test_known_distance(self):
        # Cubbon Park to Lalbagh ≈ ~2.8 km
        d = haversine_meters(12.9763, 77.5929, 12.9507, 77.5848)
        assert 2500 < d < 3500  # rough bounds

    def test_symmetry(self):
        d1 = haversine_meters(12.97, 77.59, 12.95, 77.58)
        d2 = haversine_meters(12.95, 77.58, 12.97, 77.59)
        assert abs(d1 - d2) < 0.01


class TestDistanceTraveled:
    def test_no_events(self):
        assert compute_distance_traveled([]) == 0.0

    def test_single_event(self):
        events = [{"latitude": 12.97, "longitude": 77.59, "timestamp": "2026-01-01T00:00:00Z"}]
        assert compute_distance_traveled(events) == 0.0

    def test_two_points(self):
        events = [
            {"latitude": 12.97, "longitude": 77.59, "timestamp": "2026-01-01T00:00:00Z"},
            {"latitude": 12.95, "longitude": 77.58, "timestamp": "2026-01-01T00:01:00Z"},
        ]
        d = compute_distance_traveled(events)
        assert d > 0


class TestEnrichFeatures:
    def test_all_columns_present(self):
        agg = {
            "event_count": 10,
            "unique_zones": 2,
            "danger_ratio": 0.1,
            "caution_ratio": 0.2,
            "panic_count": 0,
            "zone_transitions": 1,
            "max_risk_timer": 5,
            "avg_risk_timer": 2.5,
            "lat_std": 0.001,
            "lng_std": 0.002,
        }
        events = [
            {"latitude": 12.97, "longitude": 77.59, "timestamp": "2026-01-01T00:00:00Z"},
            {"latitude": 12.97, "longitude": 77.60, "timestamp": "2026-01-01T00:01:00Z"},
        ]
        features = enrich_features(agg, events)
        for col in FEATURE_COLUMNS:
            assert col in features, f"Missing feature: {col}"

    def test_distance_and_speed_computed(self):
        agg = {col: 0 for col in FEATURE_COLUMNS}
        events = [
            {"latitude": 12.97, "longitude": 77.59, "timestamp": "2026-01-01T00:00:00Z"},
            {"latitude": 12.98, "longitude": 77.60, "timestamp": "2026-01-01T00:02:00Z"},
        ]
        features = enrich_features(agg, events)
        assert features["distance_traveled"] > 0
        assert features["speed_estimate"] > 0


# ===========================================================================
# Hybrid Fusion Tests
# ===========================================================================

class TestFusionSeverity:
    def test_severity_levels(self):
        assert classify_severity(0.0) == "LOW"
        assert classify_severity(0.35) == "MEDIUM"
        assert classify_severity(0.65) == "HIGH"
        assert classify_severity(0.85) == "CRITICAL"


class TestSeverityThreshold:
    def test_medium_meets_medium(self):
        assert severity_meets_threshold("MEDIUM", "MEDIUM") is True

    def test_low_does_not_meet_medium(self):
        assert severity_meets_threshold("LOW", "MEDIUM") is False

    def test_critical_meets_low(self):
        assert severity_meets_threshold("CRITICAL", "LOW") is True


class TestHybridFusion:
    def test_both_zero(self):
        result = compute_hybrid_score(0.0, 0.0)
        assert result.hybrid_score == 0.0
        assert result.severity == "LOW"
        assert result.should_alert is False

    def test_panic_rule_only(self):
        """High rule score, low ML → RULE_ONLY concordance."""
        result = compute_hybrid_score(1.0, 0.1)
        assert result.hybrid_score > 0.5
        assert result.concordance == "RULE_ONLY"
        assert result.should_alert is True

    def test_concordance_bonus(self):
        """Both high → concordance bonus applied."""
        result = compute_hybrid_score(0.7, 0.7)
        # Without bonus: 0.6*0.7 + 0.4*0.7 = 0.7
        # With bonus: 0.7 + 0.1 = 0.8
        assert result.hybrid_score >= 0.8 - 1e-9  # float tolerance
        assert result.concordance == "AGREE_HIGH"

    def test_ml_only_dampening(self):
        """Low rule, high ML → dampened by 30%."""
        result = compute_hybrid_score(0.1, 0.9)
        # Without dampening: 0.6*0.1 + 0.4*0.9 = 0.42
        # With dampening: 0.42 * 0.7 = 0.294
        assert result.concordance == "ML_ONLY"
        assert result.hybrid_score < 0.35

    def test_both_low_no_alert(self):
        """Both low → AGREE_LOW, no alert."""
        result = compute_hybrid_score(0.1, 0.1)
        assert result.concordance == "AGREE_LOW"
        assert result.should_alert is False
