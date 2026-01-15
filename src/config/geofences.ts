// Geofenced Zone Configuration for Bangalore
// All coordinates define polygon boundaries for safety zones

export type ZoneType = 'safe' | 'caution' | 'danger';

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

// Detect which zone a point is in
export function detectZone(point: { lat: number; lng: number }): { zone: GeoZone | null; type: ZoneType | 'unknown' } {
  // Check danger zones first (highest priority)
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'danger')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return { zone, type: 'danger' };
    }
  }
  
  // Check caution zones
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'caution')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return { zone, type: 'caution' };
    }
  }
  
  // Check safe zones
  for (const zone of GEOFENCED_ZONES.filter(z => z.type === 'safe')) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return { zone, type: 'safe' };
    }
  }
  
  // Not in any defined zone
  return { zone: null, type: 'unknown' };
}
