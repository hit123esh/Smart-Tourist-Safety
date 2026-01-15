// Predefined routes for simulation modes
// Each route is an array of waypoints the tourist will traverse

import { GEOFENCED_ZONES } from './geofences';

export type SimulationMode = 'manual' | 'safe' | 'danger';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  pauseMs?: number; // Optional pause at this waypoint
}

// Helper to create intermediate points between two waypoints for smooth animation
export function interpolatePoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  steps: number
): RouteWaypoint[] {
  const points: RouteWaypoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    });
  }
  return points;
}

// Generate a smooth route from waypoints with interpolation
export function generateSmoothRoute(waypoints: RouteWaypoint[], stepsPerSegment: number = 10): RouteWaypoint[] {
  const smoothRoute: RouteWaypoint[] = [];
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = interpolatePoints(waypoints[i], waypoints[i + 1], stepsPerSegment);
    // Add all points except the last one to avoid duplicates
    smoothRoute.push(...segment.slice(0, -1));
    
    // If there's a pause at the end waypoint, add it
    if (waypoints[i + 1].pauseMs) {
      smoothRoute.push({ ...waypoints[i + 1] });
    }
  }
  
  // Add final waypoint
  smoothRoute.push(waypoints[waypoints.length - 1]);
  
  return smoothRoute;
}

// SAFE MODE ROUTE: Travels only between safe zones
// Cubbon Park → MG Road → Lalbagh → back to Cubbon Park
export const SAFE_MODE_WAYPOINTS: RouteWaypoint[] = [
  // Start at Cubbon Park center
  { lat: 12.9763, lng: 77.5929, pauseMs: 1500 },
  // Move around Cubbon Park
  { lat: 12.9780, lng: 77.5920 },
  { lat: 12.9790, lng: 77.5950 },
  { lat: 12.9770, lng: 77.5970 },
  // Head towards MG Road (Safe)
  { lat: 12.9760, lng: 77.5990 },
  { lat: 12.9758, lng: 77.6020 },
  { lat: 12.9756, lng: 77.6064, pauseMs: 2000 }, // MG Road center
  // Explore MG Road
  { lat: 12.9770, lng: 77.6080 },
  { lat: 12.9750, lng: 77.6100 },
  { lat: 12.9740, lng: 77.6060 },
  // Head towards Lalbagh (Safe)
  { lat: 12.9700, lng: 77.6000 },
  { lat: 12.9650, lng: 77.5950 },
  { lat: 12.9580, lng: 77.5900 },
  { lat: 12.9507, lng: 77.5848, pauseMs: 2000 }, // Lalbagh center
  // Explore Lalbagh
  { lat: 12.9530, lng: 77.5850 },
  { lat: 12.9540, lng: 77.5880 },
  { lat: 12.9500, lng: 77.5870 },
  // Return to Cubbon Park
  { lat: 12.9550, lng: 77.5880 },
  { lat: 12.9620, lng: 77.5900 },
  { lat: 12.9700, lng: 77.5910 },
  { lat: 12.9763, lng: 77.5929, pauseMs: 1500 }, // Back at Cubbon Park
];

// DANGER MODE ROUTE: Erratic movement between caution and danger zones
// Includes rapid zone transitions
export const DANGER_MODE_WAYPOINTS: RouteWaypoint[] = [
  // Start near Old Market (Caution)
  { lat: 12.9650, lng: 77.5700, pauseMs: 500 },
  // Enter Old Market (Caution)
  { lat: 12.9620, lng: 77.5730 },
  { lat: 12.9600, lng: 77.5750, pauseMs: 1000 }, // Inside caution
  // Exit briefly
  { lat: 12.9560, lng: 77.5700 },
  // Head towards Industrial Area (Danger)
  { lat: 12.9520, lng: 77.5650 },
  { lat: 12.9480, lng: 77.5580 },
  { lat: 12.9460, lng: 77.5520 }, // Near danger
  { lat: 12.9430, lng: 77.5490 },
  { lat: 12.9400, lng: 77.5500, pauseMs: 1500 }, // Inside danger!
  // Brief exit
  { lat: 12.9460, lng: 77.5490 },
  // Re-enter danger
  { lat: 12.9420, lng: 77.5520 },
  { lat: 12.9400, lng: 77.5540, pauseMs: 1000 }, // Inside danger again
  // Move towards Bus Station (Caution)
  { lat: 12.9500, lng: 77.5580 },
  { lat: 12.9600, lng: 77.5650 },
  { lat: 12.9700, lng: 77.5680 },
  { lat: 12.9770, lng: 77.5700, pauseMs: 1000 }, // Bus Station
  // Erratic movement between caution zones
  { lat: 12.9750, lng: 77.5730 },
  { lat: 12.9780, lng: 77.5720 }, // Inside Bus Station
  { lat: 12.9800, lng: 77.5680 }, // Exit
  // Head to Outskirts danger zone
  { lat: 12.9780, lng: 77.5800 },
  { lat: 12.9700, lng: 77.5950 },
  { lat: 12.9620, lng: 77.6100 },
  { lat: 12.9580, lng: 77.6250 },
  { lat: 12.9560, lng: 77.6320 }, // Near Outskirts
  { lat: 12.9550, lng: 77.6350, pauseMs: 1500 }, // Inside Outskirts danger!
  // Exit and re-enter pattern
  { lat: 12.9580, lng: 77.6380 }, // Exit
  { lat: 12.9540, lng: 77.6360 },
  { lat: 12.9520, lng: 77.6350, pauseMs: 1000 }, // Re-enter danger
  // Return towards caution zones
  { lat: 12.9580, lng: 77.6300 },
  { lat: 12.9620, lng: 77.6150 },
  { lat: 12.9640, lng: 77.5900 },
  { lat: 12.9620, lng: 77.5780 },
  { lat: 12.9600, lng: 77.5750, pauseMs: 1000 }, // Old Market caution
  // Continue erratic pattern
  { lat: 12.9580, lng: 77.5730 },
  { lat: 12.9620, lng: 77.5760 },
  { lat: 12.9650, lng: 77.5700, pauseMs: 500 }, // Back to start
];

// Animation configuration
export const ANIMATION_CONFIG = {
  // Interval between position updates (ms)
  updateIntervalMs: 600,
  // Steps to interpolate between waypoints for smooth animation
  stepsPerSegment: 8,
};

// Generate the complete smooth routes
export const SAFE_MODE_ROUTE = generateSmoothRoute(SAFE_MODE_WAYPOINTS, ANIMATION_CONFIG.stepsPerSegment);
export const DANGER_MODE_ROUTE = generateSmoothRoute(DANGER_MODE_WAYPOINTS, ANIMATION_CONFIG.stepsPerSegment);
