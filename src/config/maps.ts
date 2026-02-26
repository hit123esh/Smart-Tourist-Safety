/// <reference types="@types/google.maps" />
// Google Maps Configuration
// API key is publishable (browser security via domain restrictions in Google Cloud Console)

export const GOOGLE_MAPS_API_KEY = 'AIzaSyB-WXYTuTT6-KndXkOSO52q0VHHXtpQPz0';

// Bangalore, India - Default Map Center
export const DEFAULT_MAP_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
};

export const DEFAULT_ZOOM = 12;

// Safety Zone Types
export type SafetyLevel = 'safe' | 'caution' | 'unsafe';

export interface SafetyLocation {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  safetyLevel: SafetyLevel;
  description?: string;
}

// Sample Bangalore locations with safety data
// NOTE: Unsafe/caution locations are SIMULATED for demo purposes only
export const SAFETY_LOCATIONS: SafetyLocation[] = [
  // Safe - Popular Tourist Places
  {
    id: 'lalbagh',
    name: 'Lalbagh Botanical Garden',
    position: { lat: 12.9507, lng: 77.5848 },
    safetyLevel: 'safe',
    description: 'Famous botanical garden with glass house and flower shows',
  },
  {
    id: 'cubbon-park',
    name: 'Cubbon Park',
    position: { lat: 12.9763, lng: 77.5929 },
    safetyLevel: 'safe',
    description: 'Large green lung of Bangalore with walking trails',
  },
  {
    id: 'bangalore-palace',
    name: 'Bangalore Palace',
    position: { lat: 12.9988, lng: 77.5921 },
    safetyLevel: 'safe',
    description: 'Historic Tudor-style palace open to visitors',
  },
  {
    id: 'mg-road',
    name: 'M.G. Road',
    position: { lat: 12.9756, lng: 77.6064 },
    safetyLevel: 'safe',
    description: 'Popular shopping and entertainment district',
  },
  {
    id: 'ulsoor-lake',
    name: 'Ulsoor Lake',
    position: { lat: 12.9825, lng: 77.6203 },
    safetyLevel: 'safe',
    description: 'Scenic lake with boating facilities',
  },

  // Caution - Potentially Unsafe (SIMULATED DATA)
  {
    id: 'demo-caution-1',
    name: 'Demo Area A (Simulated)',
    position: { lat: 12.9450, lng: 77.5700 },
    safetyLevel: 'caution',
    description: '⚠️ DEMO: Moderate foot traffic at night',
  },
  {
    id: 'demo-caution-2',
    name: 'Demo Area B (Simulated)',
    position: { lat: 12.9600, lng: 77.6200 },
    safetyLevel: 'caution',
    description: '⚠️ DEMO: Limited street lighting reported',
  },
  {
    id: 'demo-caution-3',
    name: 'Demo Area C (Simulated)',
    position: { lat: 12.9850, lng: 77.5600 },
    safetyLevel: 'caution',
    description: '⚠️ DEMO: Crowded during peak hours',
  },

  // Unsafe - High Risk (SIMULATED DATA)
  {
    id: 'demo-unsafe-1',
    name: 'Demo Zone X (Simulated)',
    position: { lat: 12.9300, lng: 77.5500 },
    safetyLevel: 'unsafe',
    description: '🚨 DEMO: Simulated unsafe zone for demonstration',
  },
  {
    id: 'demo-unsafe-2',
    name: 'Demo Zone Y (Simulated)',
    position: { lat: 12.9550, lng: 77.6350 },
    safetyLevel: 'unsafe',
    description: '🚨 DEMO: Simulated unsafe zone for demonstration',
  },
];

// Heat map data points with weights
export const getHeatMapData = () => {
  return SAFETY_LOCATIONS.map((loc) => ({
    location: new google.maps.LatLng(loc.position.lat, loc.position.lng),
    weight: loc.safetyLevel === 'unsafe' ? 10 : loc.safetyLevel === 'caution' ? 5 : 1,
  }));
};

// Marker colors based on safety level
export const MARKER_COLORS: Record<SafetyLevel, string> = {
  safe: '#22c55e',      // Green
  caution: '#eab308',   // Yellow
  unsafe: '#ef4444',    // Red
};
