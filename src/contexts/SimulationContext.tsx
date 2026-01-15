import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  ZoneType, 
  RiskStatus, 
  detectZoneWithProximity, 
  GeoZone, 
  PRESET_POSITIONS,
  ZoneDetectionResult 
} from '@/config/geofences';
import {
  SimulationMode,
  SAFE_MODE_ROUTE,
  DANGER_MODE_ROUTE,
  ANIMATION_CONFIG,
  RouteWaypoint,
} from '@/config/simulationRoutes';
import { useTouristEventLogger } from '@/hooks/useTouristEventLogger';

export interface SimulatedTourist {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  currentZone: ZoneType | 'unknown';
  zoneName: string | null;
  riskStatus: RiskStatus;
  nearestRiskZone: string | null;
  distanceToRisk: number | null;
  lastUpdated: Date;
  // Risk timer tracking
  riskStartTime: Date | null;
  riskDurationMs: number;
}

export interface AlertLog {
  id: string;
  touristId: string;
  touristName: string;
  zoneType: ZoneType | 'proximity' | 'panic';
  zoneName: string;
  riskStatus: RiskStatus;
  position: { lat: number; lng: number };
  timestamp: Date;
  acknowledged: boolean;
  isPanic?: boolean;
}

export interface ZoneTransitionLog {
  id: string;
  touristId: string;
  fromStatus: RiskStatus;
  toStatus: RiskStatus;
  zoneName: string | null;
  timestamp: Date;
}

interface SimulationContextType {
  // Tourist state
  tourist: SimulatedTourist;
  
  // Movement functions
  moveTourist: (position: { lat: number; lng: number }) => void;
  moveToPreset: (presetIndex: number) => void;
  
  // Alert logs
  alerts: AlertLog[];
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // Panic button
  triggerPanic: () => void;
  activePanicAlert: AlertLog | null;
  
  // Zone transition history
  transitionLogs: ZoneTransitionLog[];
  
  // Tourists in risk states (for police dashboard)
  touristsAtRisk: SimulatedTourist[];
  
  // Timer management
  formattedRiskDuration: string;
  
  // Simulation mode controls
  simulationMode: SimulationMode;
  setSimulationMode: (mode: SimulationMode) => void;
  isAnimating: boolean;
  currentRouteIndex: number;
  totalRoutePoints: number;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Format duration for display
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Check if status is a risk status
const isRiskStatus = (status: RiskStatus): boolean => {
  return status !== 'SAFE';
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Event logger hook
  const { logEvent, logPanicEvent, logModeChangeEvent } = useTouristEventLogger();

  // Initialize tourist at a safe location
  const [tourist, setTourist] = useState<SimulatedTourist>(() => {
    const initialPosition = PRESET_POSITIONS[0].position; // Cubbon Park (Safe)
    const detection = detectZoneWithProximity(initialPosition);
    return {
      id: 'TOUR-' + generateId().toUpperCase().slice(0, 8),
      name: 'Demo Tourist',
      position: initialPosition,
      currentZone: detection.type,
      zoneName: detection.zone?.name || null,
      riskStatus: detection.riskStatus,
      nearestRiskZone: detection.nearestRiskZone?.name || null,
      distanceToRisk: detection.distanceToNearestRisk,
      lastUpdated: new Date(),
      riskStartTime: null,
      riskDurationMs: 0,
    };
  });

  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [transitionLogs, setTransitionLogs] = useState<ZoneTransitionLog[]>([]);
  const [formattedRiskDuration, setFormattedRiskDuration] = useState('0s');
  
  // Simulation mode state
  const [simulationMode, setSimulationModeState] = useState<SimulationMode>('manual');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  
  const previousRiskStatus = useRef<RiskStatus>(tourist.riskStatus);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current route based on mode
  const getCurrentRoute = (): RouteWaypoint[] => {
    switch (simulationMode) {
      case 'safe':
        return SAFE_MODE_ROUTE;
      case 'danger':
        return DANGER_MODE_ROUTE;
      default:
        return [];
    }
  };
  
  const totalRoutePoints = getCurrentRoute().length;

  // Track tourists at risk for police dashboard
  const touristsAtRisk = isRiskStatus(tourist.riskStatus) ? [tourist] : [];

  // Update timer every second when in risk zone
  useEffect(() => {
    if (isRiskStatus(tourist.riskStatus) && tourist.riskStartTime) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - tourist.riskStartTime!.getTime();
        setTourist(prev => ({
          ...prev,
          riskDurationMs: elapsed,
        }));
        setFormattedRiskDuration(formatDuration(elapsed));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setFormattedRiskDuration('0s');
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [tourist.riskStatus, tourist.riskStartTime]);

  // Move tourist to a new position
  const moveTourist = useCallback((position: { lat: number; lng: number }) => {
    const detection = detectZoneWithProximity(position);
    const newRiskStatus = detection.riskStatus;
    const previousStatus = previousRiskStatus.current;
    
    setTourist(prev => {
      const now = new Date();
      
      // Determine timer state
      let riskStartTime = prev.riskStartTime;
      let riskDurationMs = prev.riskDurationMs;
      
      // Status changed - handle timer
      if (newRiskStatus !== previousStatus) {
        if (isRiskStatus(newRiskStatus) && !isRiskStatus(previousStatus)) {
          // Entering risk zone - start timer
          riskStartTime = now;
          riskDurationMs = 0;
        } else if (!isRiskStatus(newRiskStatus) && isRiskStatus(previousStatus)) {
          // Leaving risk zone - reset timer
          riskStartTime = null;
          riskDurationMs = 0;
        }
        // If transitioning between risk states, keep timer running
      }

      // Log event to database (async, non-blocking)
      logEvent({
        touristId: prev.id,
        position,
        riskStatus: newRiskStatus,
        zoneName: detection.zone?.name || null,
        riskTimerMs: riskDurationMs,
        simulationMode,
      });
      
      return {
        ...prev,
        position,
        currentZone: detection.type,
        zoneName: detection.zone?.name || null,
        riskStatus: newRiskStatus,
        nearestRiskZone: detection.nearestRiskZone?.name || null,
        distanceToRisk: detection.distanceToNearestRisk,
        lastUpdated: now,
        riskStartTime,
        riskDurationMs,
      };
    });
    
    // Log zone transition
    if (newRiskStatus !== previousStatus) {
      const transitionLog: ZoneTransitionLog = {
        id: generateId(),
        touristId: tourist.id,
        fromStatus: previousStatus,
        toStatus: newRiskStatus,
        zoneName: detection.zone?.name || detection.nearestRiskZone?.name || null,
        timestamp: new Date(),
      };
      setTransitionLogs(prev => [transitionLog, ...prev].slice(0, 50)); // Keep last 50 logs
      
      // Create alert for IN_DANGER status
      if (newRiskStatus === 'IN_DANGER') {
        const newAlert: AlertLog = {
          id: generateId(),
          touristId: tourist.id,
          touristName: tourist.name,
          zoneType: 'danger',
          zoneName: detection.zone?.name || 'Unknown Danger Zone',
          riskStatus: newRiskStatus,
          position,
          timestamp: new Date(),
          acknowledged: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
      
      previousRiskStatus.current = newRiskStatus;
    }
  }, [tourist.id, tourist.name, simulationMode, logEvent]);

  // Animation effect for automated modes
  useEffect(() => {
    if (simulationMode === 'manual') {
      // Stop animation when in manual mode
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      setIsAnimating(false);
      return;
    }

    const route = getCurrentRoute();
    if (route.length === 0) return;

    setIsAnimating(true);
    let index = 0;
    setCurrentRouteIndex(0);

    // Move to first position immediately
    moveTourist({ lat: route[0].lat, lng: route[0].lng });

    const animateStep = () => {
      index = (index + 1) % route.length;
      setCurrentRouteIndex(index);
      
      const waypoint = route[index];
      moveTourist({ lat: waypoint.lat, lng: waypoint.lng });

      // Schedule next step with optional pause
      const delay = waypoint.pauseMs 
        ? ANIMATION_CONFIG.updateIntervalMs + waypoint.pauseMs 
        : ANIMATION_CONFIG.updateIntervalMs;
      
      animationIntervalRef.current = setTimeout(animateStep, delay);
    };

    // Start animation loop
    animationIntervalRef.current = setTimeout(animateStep, ANIMATION_CONFIG.updateIntervalMs);

    return () => {
      if (animationIntervalRef.current) {
        clearTimeout(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [simulationMode, moveTourist]);

  // Set simulation mode
  const setSimulationMode = useCallback((mode: SimulationMode) => {
    // Log mode change event
    logModeChangeEvent({
      touristId: tourist.id,
      position: tourist.position,
      riskStatus: tourist.riskStatus,
      zoneName: tourist.zoneName,
      riskTimerMs: tourist.riskDurationMs,
      simulationMode: mode,
    });
    
    setSimulationModeState(mode);
    setCurrentRouteIndex(0);
  }, [tourist.id, tourist.position, tourist.riskStatus, tourist.zoneName, tourist.riskDurationMs, logModeChangeEvent]);

  // Move tourist to a preset position
  const moveToPreset = useCallback((presetIndex: number) => {
    const preset = PRESET_POSITIONS[presetIndex];
    if (preset) {
      // Switch to manual mode when using presets
      setSimulationMode('manual');
      moveTourist(preset.position);
    }
  }, [moveTourist, setSimulationMode]);

  // Acknowledge an alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Trigger panic alert
  const triggerPanic = useCallback(() => {
    // Log panic event to database
    logPanicEvent({
      touristId: tourist.id,
      position: tourist.position,
      riskStatus: tourist.riskStatus,
      zoneName: tourist.zoneName,
      riskTimerMs: tourist.riskDurationMs,
      simulationMode,
    });

    const panicAlert: AlertLog = {
      id: generateId(),
      touristId: tourist.id,
      touristName: tourist.name,
      zoneType: 'panic',
      zoneName: tourist.zoneName || 'Unknown Location',
      riskStatus: tourist.riskStatus,
      position: tourist.position,
      timestamp: new Date(),
      acknowledged: false,
      isPanic: true,
    };
    setAlerts(prev => [panicAlert, ...prev]);
  }, [tourist.id, tourist.name, tourist.zoneName, tourist.riskStatus, tourist.position, tourist.riskDurationMs, simulationMode, logPanicEvent]);

  // Get the active (unacknowledged) panic alert
  const activePanicAlert = alerts.find(a => a.isPanic && !a.acknowledged) || null;

  return (
    <SimulationContext.Provider
      value={{
        tourist,
        moveTourist,
        moveToPreset,
        alerts,
        acknowledgeAlert,
        clearAlerts,
        triggerPanic,
        activePanicAlert,
        transitionLogs,
        touristsAtRisk,
        formattedRiskDuration,
        simulationMode,
        setSimulationMode,
        isAnimating,
        currentRouteIndex,
        totalRoutePoints,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
