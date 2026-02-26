import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabaseClient';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IncidentAlert {
    id: string;
    tourist_id: string;
    timestamp: string;
    rule_score: number;
    anomaly_score: number;
    hybrid_score: number;
    severity: IncidentSeverity;
    triggered_rules: string[];
    feature_vector: Record<string, number> | null;
    latitude: number | null;
    longitude: number | null;
    zone_state: string | null;
    acknowledged: boolean;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
    resolved: boolean;
    model_version: string;
    created_at: string;
}

export interface IncidentAlertStats {
    total: number;
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}

// -----------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------

const MAX_ALERTS = 50;

export const useIncidentAlerts = () => {
    const [alerts, setAlerts] = useState<IncidentAlert[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ------------------------------------------------------------------
    // Load initial alerts on mount
    // ------------------------------------------------------------------
    const loadInitialAlerts = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('incident_alerts')
            .select('*')
            .eq('resolved', false)
            .order('timestamp', { ascending: false })
            .limit(MAX_ALERTS);

        if (!error && data) {
            setAlerts(data as IncidentAlert[]);
        }
        setIsLoading(false);
    }, []);

    // ------------------------------------------------------------------
    // Subscribe to realtime inserts
    // ------------------------------------------------------------------
    useEffect(() => {
        loadInitialAlerts();

        // Subscribe to new alerts from the ML microservice
        channelRef.current = supabase
            .channel('incident_alerts_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'incident_alerts' },
                (payload) => {
                    const newAlert = payload.new as IncidentAlert;
                    setAlerts((prev) => [newAlert, ...prev].slice(0, MAX_ALERTS));
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'incident_alerts' },
                (payload) => {
                    const updated = payload.new as IncidentAlert;
                    setAlerts((prev) =>
                        prev.map((a) => (a.id === updated.id ? updated : a))
                    );
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [loadInitialAlerts]);

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    const acknowledgeAlert = useCallback(async (alertId: string) => {
        const { error } = await supabase
            .from('incident_alerts')
            .update({
                acknowledged: true,
                acknowledged_at: new Date().toISOString(),
            })
            .eq('id', alertId);

        if (!error) {
            setAlerts((prev) =>
                prev.map((a) =>
                    a.id === alertId
                        ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() }
                        : a
                )
            );
        }
    }, []);

    const resolveAlert = useCallback(async (alertId: string) => {
        const { error } = await supabase
            .from('incident_alerts')
            .update({ resolved: true })
            .eq('id', alertId);

        if (!error) {
            setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        }
    }, []);

    const refresh = useCallback(() => {
        loadInitialAlerts();
    }, [loadInitialAlerts]);

    // ------------------------------------------------------------------
    // Derived stats
    // ------------------------------------------------------------------
    const stats: IncidentAlertStats = {
        total: alerts.length,
        unresolved: alerts.filter((a) => !a.resolved).length,
        critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
        high: alerts.filter((a) => a.severity === 'HIGH').length,
        medium: alerts.filter((a) => a.severity === 'MEDIUM').length,
        low: alerts.filter((a) => a.severity === 'LOW').length,
    };

    const unresolvedAlerts = alerts.filter((a) => !a.resolved);
    const hasCritical = stats.critical > 0;

    return {
        alerts,
        unresolvedAlerts,
        stats,
        isConnected,
        isLoading,
        hasCritical,
        acknowledgeAlert,
        resolveAlert,
        refresh,
    };
};
