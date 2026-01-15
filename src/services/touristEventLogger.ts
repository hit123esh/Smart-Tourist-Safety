import { supabase } from './supabaseClient';

// Zone states for ML model training
export type ZoneState = 'SAFE' | 'NEAR_CAUTION' | 'IN_CAUTION' | 'NEAR_DANGER' | 'IN_DANGER';

// Event types for movement tracking
export type EventType = 'MOVE' | 'ZONE_ENTER' | 'ZONE_EXIT' | 'PANIC' | 'MODE_CHANGE';

export interface TouristEvent {
  tourist_id: string;
  timestamp: string;
  zone_state: ZoneState;
  zone_id: string | null;
  event_type: EventType;
  risk_timer_value: number;
  latitude: number;
  longitude: number;
  simulation_mode?: string;
}

// Map RiskStatus to ZoneState for ML compatibility
export const mapRiskStatusToZoneState = (riskStatus: string): ZoneState => {
  switch (riskStatus) {
    case 'SAFE':
      return 'SAFE';
    case 'NEAR_CAUTION':
      return 'NEAR_CAUTION';
    case 'IN_CAUTION':
      return 'IN_CAUTION';
    case 'NEAR_DANGER':
      return 'NEAR_DANGER';
    case 'IN_DANGER':
      return 'IN_DANGER';
    default:
      return 'SAFE';
  }
};

// Determine event type based on state changes
export const determineEventType = (
  prevStatus: string | null,
  newStatus: string,
  isPanic?: boolean,
  isModeChange?: boolean
): EventType => {
  if (isPanic) return 'PANIC';
  if (isModeChange) return 'MODE_CHANGE';
  
  if (!prevStatus || prevStatus === newStatus) {
    return 'MOVE';
  }
  
  // Check if entering a more risky zone
  const riskLevels = ['SAFE', 'NEAR_CAUTION', 'IN_CAUTION', 'NEAR_DANGER', 'IN_DANGER'];
  const prevLevel = riskLevels.indexOf(prevStatus);
  const newLevel = riskLevels.indexOf(newStatus);
  
  if (newLevel > prevLevel) {
    return 'ZONE_ENTER';
  } else {
    return 'ZONE_EXIT';
  }
};

// Log a tourist event to the database
export const logTouristEvent = async (event: TouristEvent): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tourist_events')
      .insert({
        tourist_id: event.tourist_id,
        timestamp: event.timestamp,
        zone_state: event.zone_state,
        zone_id: event.zone_id,
        event_type: event.event_type,
        risk_timer_value: event.risk_timer_value,
        latitude: event.latitude,
        longitude: event.longitude,
        simulation_mode: event.simulation_mode,
      });

    if (error) {
      console.error('Failed to log tourist event:', error.message);
      return false;
    }

    console.log(`[EventLog] ${event.event_type}: ${event.zone_state} at ${event.timestamp}`);
    return true;
  } catch (err) {
    console.error('Tourist event logging error:', err);
    return false;
  }
};

// Batch insert multiple events (for efficiency)
export const logTouristEventsBatch = async (events: TouristEvent[]): Promise<boolean> => {
  if (events.length === 0) return true;
  
  try {
    const { error } = await supabase
      .from('tourist_events')
      .insert(events);

    if (error) {
      console.error('Failed to log tourist events batch:', error.message);
      return false;
    }

    console.log(`[EventLog] Batch inserted ${events.length} events`);
    return true;
  } catch (err) {
    console.error('Tourist events batch logging error:', err);
    return false;
  }
};

// Subscribe to real-time events for a specific tourist
export const subscribeToTouristEvents = (
  touristId: string,
  onEvent: (event: TouristEvent) => void
) => {
  const channel = supabase
    .channel(`tourist_events:${touristId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tourist_events',
        filter: `tourist_id=eq.${touristId}`,
      },
      (payload) => {
        onEvent(payload.new as TouristEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to all tourist events (for police dashboard)
export const subscribeToAllTouristEvents = (
  onEvent: (event: TouristEvent) => void
) => {
  const channel = supabase
    .channel('all_tourist_events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tourist_events',
      },
      (payload) => {
        onEvent(payload.new as TouristEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Get recent events for a tourist (for debugging/display)
export const getRecentEvents = async (
  touristId: string,
  limit: number = 50
): Promise<TouristEvent[]> => {
  const { data, error } = await supabase
    .from('tourist_events')
    .select('*')
    .eq('tourist_id', touristId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent events:', error.message);
    return [];
  }

  return data || [];
};

// Get events within a time window (for ML aggregation)
export const getEventsInTimeWindow = async (
  startTime: string,
  endTime: string,
  touristId?: string
): Promise<TouristEvent[]> => {
  let query = supabase
    .from('tourist_events')
    .select('*')
    .gte('timestamp', startTime)
    .lte('timestamp', endTime)
    .order('timestamp', { ascending: true });

  if (touristId) {
    query = query.eq('tourist_id', touristId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch events in time window:', error.message);
    return [];
  }

  return data || [];
};
