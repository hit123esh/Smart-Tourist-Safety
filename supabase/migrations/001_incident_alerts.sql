-- ============================================================
-- Incident Alerts Table
-- Stores ML-generated anomaly alerts for the police dashboard
-- ============================================================

CREATE TABLE IF NOT EXISTS public.incident_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tourist_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Scoring
    rule_score FLOAT NOT NULL DEFAULT 0,
    anomaly_score FLOAT NOT NULL DEFAULT 0,
    hybrid_score FLOAT NOT NULL DEFAULT 0,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- Context
    triggered_rules TEXT[] DEFAULT '{}',
    feature_vector JSONB,
    latitude FLOAT,
    longitude FLOAT,
    zone_state TEXT,

    -- Status
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT FALSE,

    -- Metadata
    model_version TEXT DEFAULT 'v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_incident_alerts_tourist ON incident_alerts(tourist_id);
CREATE INDEX IF NOT EXISTS idx_incident_alerts_severity ON incident_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_incident_alerts_timestamp ON incident_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incident_alerts_unresolved ON incident_alerts(resolved) WHERE resolved = FALSE;

-- Row Level Security
ALTER TABLE incident_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Police can view all alerts"
    ON incident_alerts FOR SELECT USING (true);

CREATE POLICY "Backend can insert alerts"
    ON incident_alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Police can update alerts"
    ON incident_alerts FOR UPDATE USING (true);

-- Enable realtime for police dashboard subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE incident_alerts;


-- ============================================================
-- Feature Aggregation View (2-minute rolling window)
-- Used by the FastAPI microservice to build feature vectors
-- ============================================================

CREATE OR REPLACE VIEW public.feature_agg_2min AS
SELECT
    tourist_id,
    COUNT(*)                                                         AS event_count,
    COUNT(DISTINCT zone_state)                                       AS unique_zones,
    SUM(CASE WHEN zone_state IN ('IN_DANGER', 'NEAR_DANGER')
        THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0)            AS danger_ratio,
    SUM(CASE WHEN zone_state IN ('IN_CAUTION', 'NEAR_CAUTION')
        THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0)            AS caution_ratio,
    SUM(CASE WHEN event_type = 'PANIC' THEN 1 ELSE 0 END)          AS panic_count,
    SUM(CASE WHEN event_type IN ('ZONE_ENTER', 'ZONE_EXIT')
        THEN 1 ELSE 0 END)                                          AS zone_transitions,
    MAX(risk_timer_value)                                            AS max_risk_timer,
    AVG(risk_timer_value)                                            AS avg_risk_timer,
    COALESCE(STDDEV(latitude), 0)                                    AS lat_std,
    COALESCE(STDDEV(longitude), 0)                                   AS lng_std,
    MAX(timestamp)                                                   AS window_end,
    -- Latest position for alert geolocation
    (ARRAY_AGG(latitude ORDER BY timestamp DESC))[1]                 AS latest_latitude,
    (ARRAY_AGG(longitude ORDER BY timestamp DESC))[1]                AS latest_longitude,
    (ARRAY_AGG(zone_state ORDER BY timestamp DESC))[1]               AS latest_zone_state
FROM tourist_events
WHERE timestamp >= NOW() - INTERVAL '2 minutes'
GROUP BY tourist_id
HAVING COUNT(*) >= 3;
