import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ZoneType, detectZone, GeoZone, PRESET_POSITIONS } from '@/config/geofences';

export interface SimulatedTourist {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  currentZone: ZoneType | 'unknown';
  zoneName: string | null;
  lastUpdated: Date;
}

export interface AlertLog {
  id: string;
  touristId: string;
  touristName: string;
  zoneType: ZoneType;
  zoneName: string;
  position: { lat: number; lng: number };
  timestamp: Date;
  acknowledged: boolean;
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
  
  // Zone tracking for police dashboard
  touristsInDanger: SimulatedTourist[];
  touristsInCaution: SimulatedTourist[];
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

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize tourist at a safe location
  const [tourist, setTourist] = useState<SimulatedTourist>(() => {
    const initialPosition = PRESET_POSITIONS[0].position; // Cubbon Park (Safe)
    const detection = detectZone(initialPosition);
    return {
      id: 'TOUR-' + generateId().toUpperCase().slice(0, 8),
      name: 'Demo Tourist',
      position: initialPosition,
      currentZone: detection.type,
      zoneName: detection.zone?.name || null,
      lastUpdated: new Date(),
    };
  });

  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [previousZone, setPreviousZone] = useState<ZoneType | 'unknown'>(tourist.currentZone);

  // Track tourists in danger/caution zones
  const touristsInDanger = tourist.currentZone === 'danger' ? [tourist] : [];
  const touristsInCaution = tourist.currentZone === 'caution' ? [tourist] : [];

  // Move tourist to a new position
  const moveTourist = useCallback((position: { lat: number; lng: number }) => {
    const detection = detectZone(position);
    
    setTourist(prev => ({
      ...prev,
      position,
      currentZone: detection.type,
      zoneName: detection.zone?.name || null,
      lastUpdated: new Date(),
    }));
  }, []);

  // Move tourist to a preset position
  const moveToPreset = useCallback((presetIndex: number) => {
    const preset = PRESET_POSITIONS[presetIndex];
    if (preset) {
      moveTourist(preset.position);
    }
  }, [moveTourist]);

  // Effect to create alerts when entering danger or caution zones
  useEffect(() => {
    // Only create alert if zone changed to danger or caution
    if (tourist.currentZone !== previousZone) {
      if (tourist.currentZone === 'danger' || tourist.currentZone === 'caution') {
        const newAlert: AlertLog = {
          id: generateId(),
          touristId: tourist.id,
          touristName: tourist.name,
          zoneType: tourist.currentZone,
          zoneName: tourist.zoneName || 'Unknown Zone',
          position: tourist.position,
          timestamp: new Date(),
          acknowledged: false,
        };
        
        setAlerts(prev => [newAlert, ...prev]);
      }
      setPreviousZone(tourist.currentZone);
    }
  }, [tourist.currentZone, tourist.zoneName, tourist.position, tourist.id, tourist.name, previousZone]);

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

  return (
    <SimulationContext.Provider
      value={{
        tourist,
        moveTourist,
        moveToPreset,
        alerts,
        acknowledgeAlert,
        clearAlerts,
        touristsInDanger,
        touristsInCaution,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
