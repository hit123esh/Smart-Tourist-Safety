// Geofenced Zone Configuration for Bangalore
// All coordinates define polygon boundaries for safety zones

export type ZoneType = 'safe' | 'caution' | 'danger';

// Enhanced risk status with proximity detection
export type RiskStatus = 'SAFE' | 'NEAR_CAUTION' | 'IN_CAUTION' | 'NEAR_DANGER' | 'IN_DANGER';

export interface GeoZone {
  id: string;
  name: string;
  type: ZoneType;
  // Polygon coordinates (array of lat/lng points)
  coordinates: { lat: number; lng: number }[];
  // Center point for display purposes
  center: { lat: number; lng: number };
  description?: string;
}

export const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string; markerColor: string }> = {
  safe: {
    fill: 'rgba(34, 197, 94, 0.3)',
    stroke: '#22c55e',
    markerColor: '#22c55e',
  },
  caution: {
    fill: 'rgba(234, 179, 8, 0.3)',
    stroke: '#eab308',
    markerColor: '#eab308',
  },
  danger: {
    fill: 'rgba(239, 68, 68, 0.3)',
    stroke: '#ef4444',
    markerColor: '#ef4444',
  },
};

// Risk status colors for markers
export const RISK_STATUS_COLORS: Record<RiskStatus, string> = {
  SAFE: '#22c55e',
  NEAR_CAUTION: '#fbbf24',
  IN_CAUTION: '#f59e0b',
  NEAR_DANGER: '#f97316',
  IN_DANGER: '#ef4444',
};

// Buffer radius in meters for "near zone" detection
export const PROXIMITY_BUFFER_METERS = 200;

// Predefined geofenced zones in Bangalore
export const GEOFENCED_ZONES: GeoZone[] = [
  // Safe Zones
  {
    id: 'safe-cubbon-park',
    name: 'Cubbon Park',
    type: 'safe',
    center: { lat: 12.9763, lng: 77.5929 },
    coordinates: [
      { lat: 12.9800, lng: 77.5880 },
      { lat: 12.9800, lng: 77.5980 },
      { lat: 12.9720, lng: 77.5980 },
      { lat: 12.9720, lng: 77.5880 },
    ],
    description: 'Well-patrolled tourist area with good lighting',
  },
  {
    id: 'safe-lalbagh',
    name: 'Lalbagh Botanical Garden',
    type: 'safe',
    center: { lat: 12.9507, lng: 77.5848 },
    coordinates: [
      { lat: 12.9550, lng: 77.5800 },
      { lat: 12.9550, lng: 77.5900 },
      { lat: 12.9460, lng: 77.5900 },
      { lat: 12.9460, lng: 77.5800 },
    ],
    description: 'Popular tourist destination with security presence',
  },
  {
    id: 'safe-mg-road',
    name: 'MG Road Shopping District',
    type: 'safe',
    center: { lat: 12.9756, lng: 77.6064 },
    coordinates: [
      { lat: 12.9780, lng: 77.6020 },
      { lat: 12.9780, lng: 77.6110 },
      { lat: 12.9730, lng: 77.6110 },
      { lat: 12.9730, lng: 77.6020 },
    ],
    description: 'Busy commercial area with CCTV coverage',
  },

  // Caution Zones
  {
    id: 'caution-market-area',
    name: 'Old Market District',
    type: 'caution',
    center: { lat: 12.9600, lng: 77.5750 },
    coordinates: [
      { lat: 12.9640, lng: 77.5710 },
      { lat: 12.9640, lng: 77.5790 },
      { lat: 12.9560, lng: 77.5790 },
      { lat: 12.9560, lng: 77.5710 },
    ],
    description: 'Crowded area - exercise caution with belongings',
  },
  {
    id: 'caution-bus-stand',
    name: 'Majestic Bus Station',
    type: 'caution',
    center: { lat: 12.9770, lng: 77.5700 },
    coordinates: [
      { lat: 12.9800, lng: 77.5660 },
      { lat: 12.9800, lng: 77.5740 },
      { lat: 12.9740, lng: 77.5740 },
      { lat: 12.9740, lng: 77.5660 },
    ],
    description: 'High foot traffic - watch for pickpockets',
  },

  // Danger Zones
  {
    id: 'danger-industrial',
    name: 'Industrial Area (Demo)',
    type: 'danger',
    center: { lat: 12.9400, lng: 77.5500 },
    coordinates: [
      { lat: 12.9450, lng: 77.5450 },
      { lat: 12.9450, lng: 77.5550 },
      { lat: 12.9350, lng: 77.5550 },
      { lat: 12.9350, lng: 77.5450 },
    ],
    description: '🚨 DEMO: Simulated high-risk zone',
  },
  {
    id: 'danger-outskirts',
    name: 'Outskirts Zone (Demo)',
    type: 'danger',
    center: { lat: 12.9550, lng: 77.6350 },
    coordinates: [
      { lat: 12.9590, lng: 77.6310 },
      { lat: 12.9590, lng: 77.6390 },
      { lat: 12.9510, lng: 77.6390 },
      { lat: 12.9510, lng: 77.6310 },
    ],
    description: '🚨 DEMO: Simulated isolated area',
  },
];

// Predefined tourist positions for demo
export const PRESET_POSITIONS: { name: string; position: { lat: number; lng: number }; zone: ZoneType }[] = [
  { name: 'Cubbon Park (Safe)', position: { lat: 12.9763, lng: 77.5929 }, zone: 'safe' },
  { name: 'Lalbagh Garden (Safe)', position: { lat: 12.9507, lng: 77.5848 }, zone: 'safe' },
  { name: 'MG Road (Safe)', position: { lat: 12.9756, lng: 77.6064 }, zone: 'safe' },
  { name: 'Old Market (Caution)', position: { lat: 12.9600, lng: 77.5750 }, zone: 'caution' },
  { name: 'Bus Station (Caution)', position: { lat: 12.9770, lng: 77.5700 }, zone: 'caution' },
  { name: 'Industrial Area (Danger)', position: { lat: 12.9400, lng: 77.5500 }, zone: 'danger' },
  { name: 'Outskirts (Danger)', position: { lat: 12.9550, lng: 77.6350 }, zone: 'danger' },
  // Near zone positions for testing proximity
  { name: 'Near Industrial (Test)', position: { lat: 12.9460, lng: 77.5490 }, zone: 'safe' },
  { name: 'Near Old Market (Test)', position: { lat: 12.9650, lng: 77.5700 }, zone: 'safe' },
];

// Point-in-polygon detection using ray casting algorithm
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Calculate distance in meters between two lat/lng points (Haversine formula)
export function calculateDistanceMeters(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate minimum distance from a point to a polygon edge
export function distanceToPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const distance = distanceToLineSegment(point, polygon[i], polygon[j]);
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

// Calculate distance from a point to a line segment
function distanceToLineSegment(
  point: { lat: number; lng: number },
  lineStart: { lat: number; lng: number },
  lineEnd: { lat: number; lng: number }
): number {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let closestLat: number;
  let closestLng: number;

  if (param < 0) {
    closestLat = lineStart.lat;
    closestLng = lineStart.lng;
  } else if (param > 1) {
    closestLat = lineEnd.lat;
    closestLng = lineEnd.lng;
  } else {
    closestLat = lineStart.lat + param * C;
    closestLng = lineStart.lng + param * D;
  }

  return calculateDistanceMeters(point, { lat: closestLat, lng: closestLng });
}

// Enhanced zone detection with proximity awareness
export interface ZoneDetectionResult {
  zone: GeoZone | null;
  type: ZoneType | 'unknown';
  riskStatus: RiskStatus;
  nearestRiskZone: GeoZone | null;
  distanceToNearestRisk: number | null;
}

// Detect zone and proximity status
export function detectZoneWithProximity(point: { lat: number; lng: number }): ZoneDetectionResult {
  // Check if inside any danger zone first (highest priority)
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'danger')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return {
        zone,
        type: 'danger',
        riskStatus: 'IN_DANGER',
        nearestRiskZone: zone,
        distanceToNearestRisk: 0,
      };
    }
  }
  
  // Check if inside any caution zone
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'caution')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return {
        zone,
        type: 'caution',
        riskStatus: 'IN_CAUTION',
        nearestRiskZone: zone,
        distanceToNearestRisk: 0,
      };
    }
  }
  
  // Not inside any risk zone - check proximity to danger zones
  let nearestDangerZone: GeoZone | null = null;
  let nearestDangerDistance = Infinity;
  
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'danger')) {
    const distance = distanceToPolygon(point, zone.coordinates);
    if (distance < nearestDangerDistance) {
      nearestDangerDistance = distance;
      nearestDangerZone = zone;
    }
  }
  
  // Check if near danger zone
  if (nearestDangerDistance <= PROXIMITY_BUFFER_METERS) {
    // Check if inside safe zone while near danger
    const safeZone = GEOFENCED_ZONES.filter(z => z.type === 'safe')
      .find(z => isPointInPolygon(point, z.coordinates));
    
    return {
      zone: safeZone || null,
      type: safeZone ? 'safe' : 'unknown',
      riskStatus: 'NEAR_DANGER',
      nearestRiskZone: nearestDangerZone,
      distanceToNearestRisk: nearestDangerDistance,
    };
  }
  
  // Check proximity to caution zones
  let nearestCautionZone: GeoZone | null = null;
  let nearestCautionDistance = Infinity;
  
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'caution')) {
    const distance = distanceToPolygon(point, zone.coordinates);
    if (distance < nearestCautionDistance) {
      nearestCautionDistance = distance;
      nearestCautionZone = zone;
    }
  }
  
  if (nearestCautionDistance <= PROXIMITY_BUFFER_METERS) {
    const safeZone = GEOFENCED_ZONES.filter(z => z.type === 'safe')
      .find(z => isPointInPolygon(point, z.coordinates));
    
    return {
      zone: safeZone || null,
      type: safeZone ? 'safe' : 'unknown',
      riskStatus: 'NEAR_CAUTION',
      nearestRiskZone: nearestCautionZone,
      distanceToNearestRisk: nearestCautionDistance,
    };
  }
  
  // Check safe zones
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'safe')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return {
        zone,
        type: 'safe',
        riskStatus: 'SAFE',
        nearestRiskZone: null,
        distanceToNearestRisk: null,
      };
    }
  }
  
  // Not in any defined zone - completely safe
  return {
    zone: null,
    type: 'unknown',
    riskStatus: 'SAFE',
    nearestRiskZone: null,
    distanceToNearestRisk: null,
  };
}

// Legacy function for backward compatibility
export function detectZone(point: { lat: number; lng: number }): { zone: GeoZone | null; type: ZoneType | 'unknown' } {
  const result = detectZoneWithProximity(point);
  return { zone: result.zone, type: result.type };
}
