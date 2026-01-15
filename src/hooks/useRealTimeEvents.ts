import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  subscribeToAllTouristEvents, 
  getRecentEvents,
  TouristEvent 
} from '@/services/touristEventLogger';

interface RealTimeEventsState {
  events: TouristEvent[];
  latestEvent: TouristEvent | null;
  isConnected: boolean;
  eventCounts: {
    total: number;
    moves: number;
    zoneEnters: number;
    zoneExits: number;
    panics: number;
    modeChanges: number;
  };
}

export const useRealTimeEvents = (maxEvents: number = 100) => {
  const [state, setState] = useState<RealTimeEventsState>({
    events: [],
    latestEvent: null,
    isConnected: false,
    eventCounts: {
      total: 0,
      moves: 0,
      zoneEnters: 0,
      zoneExits: 0,
      panics: 0,
      modeChanges: 0,
    },
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle new event
  const handleNewEvent = useCallback((event: TouristEvent) => {
    setState(prev => {
      const newEvents = [event, ...prev.events].slice(0, maxEvents);
      
      // Update counts based on event type
      const counts = { ...prev.eventCounts };
      counts.total += 1;
      
      switch (event.event_type) {
        case 'MOVE':
          counts.moves += 1;
          break;
        case 'ZONE_ENTER':
          counts.zoneEnters += 1;
          break;
        case 'ZONE_EXIT':
          counts.zoneExits += 1;
          break;
        case 'PANIC':
          counts.panics += 1;
          break;
        case 'MODE_CHANGE':
          counts.modeChanges += 1;
          break;
      }

      return {
        events: newEvents,
        latestEvent: event,
        isConnected: true,
        eventCounts: counts,
      };
    });
  }, [maxEvents]);

  // Subscribe to real-time events
  useEffect(() => {
    // Subscribe to real-time updates
    unsubscribeRef.current = subscribeToAllTouristEvents(handleNewEvent);
    setState(prev => ({ ...prev, isConnected: true }));

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [handleNewEvent]);

  // Load initial events
  const loadRecentEvents = useCallback(async (touristId: string) => {
    const events = await getRecentEvents(touristId, maxEvents);
    setState(prev => ({
      ...prev,
      events,
      latestEvent: events[0] || null,
    }));
  }, [maxEvents]);

  // Clear events
  const clearEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      events: [],
      latestEvent: null,
      eventCounts: {
        total: 0,
        moves: 0,
        zoneEnters: 0,
        zoneExits: 0,
        panics: 0,
        modeChanges: 0,
      },
    }));
  }, []);

  // Get events filtered by type
  const getEventsByType = useCallback((eventType: string) => {
    return state.events.filter(e => e.event_type === eventType);
  }, [state.events]);

  // Get events filtered by zone state
  const getEventsByZoneState = useCallback((zoneState: string) => {
    return state.events.filter(e => e.zone_state === zoneState);
  }, [state.events]);

  return {
    ...state,
    loadRecentEvents,
    clearEvents,
    getEventsByType,
    getEventsByZoneState,
  };
};
