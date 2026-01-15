import { useCallback, useRef, useEffect } from 'react';
import { 
  logTouristEvent, 
  TouristEvent, 
  mapRiskStatusToZoneState, 
  determineEventType,
  ZoneState,
  EventType
} from '@/services/touristEventLogger';

interface LogEventParams {
  touristId: string;
  position: { lat: number; lng: number };
  riskStatus: string;
  zoneName: string | null;
  riskTimerMs: number;
  simulationMode?: string;
  isPanic?: boolean;
  isModeChange?: boolean;
}

// Throttle interval for MOVE events (don't log every frame)
const MOVE_LOG_INTERVAL_MS = 2000;

export const useTouristEventLogger = () => {
  const lastLoggedStatus = useRef<string | null>(null);
  const lastMoveLogTime = useRef<number>(0);
  const lastLoggedMode = useRef<string | null>(null);

  // Log an event with proper deduplication
  const logEvent = useCallback(async (params: LogEventParams) => {
    const { 
      touristId, 
      position, 
      riskStatus, 
      zoneName, 
      riskTimerMs, 
      simulationMode,
      isPanic,
      isModeChange 
    } = params;

    const now = Date.now();
    const zoneState = mapRiskStatusToZoneState(riskStatus);
    const eventType = determineEventType(
      lastLoggedStatus.current, 
      riskStatus, 
      isPanic, 
      isModeChange
    );

    // For MOVE events, throttle to avoid excessive logging
    if (eventType === 'MOVE') {
      if (now - lastMoveLogTime.current < MOVE_LOG_INTERVAL_MS) {
        return; // Skip this move event, too soon
      }
      lastMoveLogTime.current = now;
    }

    // Always log zone changes, panics, and mode changes immediately
    if (eventType === 'ZONE_ENTER' || eventType === 'ZONE_EXIT' || isPanic || isModeChange) {
      lastLoggedStatus.current = riskStatus;
      if (isModeChange && simulationMode) {
        lastLoggedMode.current = simulationMode;
      }
    }

    const event: TouristEvent = {
      tourist_id: touristId,
      timestamp: new Date().toISOString(),
      zone_state: zoneState,
      zone_id: zoneName,
      event_type: eventType,
      risk_timer_value: Math.floor(riskTimerMs / 1000), // Convert to seconds
      latitude: position.lat,
      longitude: position.lng,
      simulation_mode: simulationMode,
    };

    await logTouristEvent(event);
  }, []);

  // Log a panic event
  const logPanicEvent = useCallback(async (params: Omit<LogEventParams, 'isPanic'>) => {
    await logEvent({ ...params, isPanic: true });
  }, [logEvent]);

  // Log a mode change event
  const logModeChangeEvent = useCallback(async (params: Omit<LogEventParams, 'isModeChange'>) => {
    // Only log if mode actually changed
    if (params.simulationMode === lastLoggedMode.current) return;
    await logEvent({ ...params, isModeChange: true });
  }, [logEvent]);

  // Reset state (e.g., when tourist changes)
  const resetLogger = useCallback(() => {
    lastLoggedStatus.current = null;
    lastMoveLogTime.current = 0;
    lastLoggedMode.current = null;
  }, []);

  return {
    logEvent,
    logPanicEvent,
    logModeChangeEvent,
    resetLogger,
  };
};
