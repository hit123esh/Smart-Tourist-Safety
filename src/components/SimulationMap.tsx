/// <reference types="@types/google.maps" />
import { useEffect, useRef, useCallback } from 'react';
import { Loader2, Map, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '@/config/maps';
import { GEOFENCED_ZONES, ZONE_COLORS, RISK_STATUS_COLORS, RiskStatus, PROXIMITY_BUFFER_METERS } from '@/config/geofences';
import { useSimulation } from '@/contexts/SimulationContext';

interface SimulationMapProps {
  className?: string;
  height?: string;
  showTitle?: boolean;
  allowClickToMove?: boolean;
  onMapClick?: (position: { lat: number; lng: number }) => void;
  centerOnPosition?: { lat: number; lng: number } | null;
}

const getRiskStatusLabel = (status: RiskStatus): string => {
  switch (status) {
    case 'IN_DANGER': return 'IN DANGER';
    case 'NEAR_DANGER': return 'NEAR DANGER';
    case 'IN_CAUTION': return 'IN CAUTION';
    case 'NEAR_CAUTION': return 'NEAR CAUTION';
    default: return 'SAFE';
  }
};

const SimulationMap = ({
  className = '',
  height = '500px',
  showTitle = true,
  allowClickToMove = false,
  onMapClick,
  centerOnPosition,
}: SimulationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const touristMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();
  const { tourist, moveTourist, formattedRiskDuration, activePanicAlert } = useSimulation();

  // Create tourist marker icon based on risk status and panic state
  const createTouristIcon = useCallback((riskStatus: RiskStatus, isPanic?: boolean): google.maps.Symbol => {
    const color = isPanic ? '#dc2626' : RISK_STATUS_COLORS[riskStatus];
    const isAtRisk = riskStatus !== 'SAFE' || isPanic;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: isPanic ? '#fef2f2' : '#ffffff',
      strokeWeight: isPanic ? 6 : isAtRisk ? 4 : 3,
      scale: isPanic ? 20 : isAtRisk ? 16 : 14,
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'simplified' }],
        },
      ],
    });

    // Create InfoWindow
    infoWindowRef.current = new google.maps.InfoWindow();

    // Draw geofenced zones
    GEOFENCED_ZONES.forEach((zone) => {
      const colors = ZONE_COLORS[zone.type];
      const polygon = new google.maps.Polygon({
        paths: zone.coordinates,
        strokeColor: colors.stroke,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: colors.fill.replace('rgba', 'rgb').split(',').slice(0, 3).join(',') + ')',
        fillOpacity: 0.35,
        map: mapInstanceRef.current!,
      });

      // Add click listener for zone info
      polygon.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (infoWindowRef.current && e.latLng) {
          const content = `
            <div style="padding: 8px; font-family: 'Inter', sans-serif;">
              <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600;">${zone.name}</h3>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                background: ${zone.type === 'safe' ? '#dcfce7' : zone.type === 'caution' ? '#fef9c3' : '#fee2e2'};
                color: ${zone.type === 'safe' ? '#166534' : zone.type === 'caution' ? '#854d0e' : '#991b1b'};
              ">${zone.type.toUpperCase()}</span>
              <p style="margin: 8px 0 4px; font-size: 11px; color: #94a3b8;">
                Proximity buffer: ${PROXIMITY_BUFFER_METERS}m
              </p>
              ${zone.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${zone.description}</p>` : ''}
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.setPosition(e.latLng);
          infoWindowRef.current.open(mapInstanceRef.current!);
        }
      });

      polygonsRef.current.push(polygon);
    });

    // Create tourist marker
    touristMarkerRef.current = new google.maps.Marker({
      position: tourist.position,
      map: mapInstanceRef.current,
      icon: createTouristIcon(tourist.riskStatus, !!activePanicAlert),
      title: 'Simulated Tourist',
      animation: google.maps.Animation.DROP,
      zIndex: 1000,
    });

    // Add click listener for map (to move tourist)
    if (allowClickToMove) {
      mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newPosition = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          moveTourist(newPosition);
          if (onMapClick) onMapClick(newPosition);
        }
      });
    }

    // Cleanup
    return () => {
      polygonsRef.current.forEach((polygon) => polygon.setMap(null));
      polygonsRef.current = [];
      if (touristMarkerRef.current) {
        touristMarkerRef.current.setMap(null);
        touristMarkerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [isLoaded, allowClickToMove, moveTourist, onMapClick, createTouristIcon, activePanicAlert]);

  // Update tourist marker when position/risk status/panic changes
  useEffect(() => {
    if (touristMarkerRef.current && isLoaded) {
      touristMarkerRef.current.setPosition(tourist.position);
      touristMarkerRef.current.setIcon(createTouristIcon(tourist.riskStatus, !!activePanicAlert));
    }
  }, [tourist.position, tourist.riskStatus, isLoaded, createTouristIcon, activePanicAlert]);

  // Center map on position when requested (for panic alerts)
  useEffect(() => {
    if (centerOnPosition && mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.panTo(centerOnPosition);
      mapInstanceRef.current.setZoom(16);
    }
  }, [centerOnPosition, isLoaded]);

  // Loading state
  if (!isLoaded) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              Safety Zone Map
            </CardTitle>
            <CardDescription>Loading map...</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center bg-muted/50 rounded-lg"
            style={{ height }}
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              Safety Zone Map
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div
            className="flex items-center justify-center bg-destructive/10 rounded-lg"
            style={{ height }}
          >
            <div className="flex flex-col items-center gap-3 text-destructive">
              <AlertTriangle size={32} />
              <p className="text-sm font-medium">Failed to load map</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAtRisk = tourist.riskStatus !== 'SAFE';
  const statusColor = RISK_STATUS_COLORS[tourist.riskStatus];

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map size={20} />
            Safety Zone Map - Bangalore
            {isAtRisk && (
              <Badge 
                variant="destructive" 
                className="ml-2 animate-pulse"
                style={{ backgroundColor: statusColor }}
              >
                {getRiskStatusLabel(tourist.riskStatus)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Live tourist tracking with geofenced safety zones and proximity detection.
            {allowClickToMove && ' Click anywhere to move the tourist.'}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Map container */}
        <div
          ref={mapRef}
          className="rounded-lg overflow-hidden border border-border"
          style={{ height }}
        />

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground font-medium">Zones:</span>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{ backgroundColor: ZONE_COLORS.safe.fill, borderColor: ZONE_COLORS.safe.stroke }}
            />
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{ backgroundColor: ZONE_COLORS.caution.fill, borderColor: ZONE_COLORS.caution.stroke }}
            />
            <span>Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded border-2"
              style={{ backgroundColor: ZONE_COLORS.danger.fill, borderColor: ZONE_COLORS.danger.stroke }}
            />
            <span>Danger</span>
          </div>
          <span className="text-muted-foreground">|</span>
          <span className="text-xs text-muted-foreground">
            Proximity: {PROXIMITY_BUFFER_METERS}m buffer
          </span>
        </div>

        {/* Current Status */}
        <div 
          className={`flex items-center justify-between p-3 rounded-lg text-sm border-2 ${isAtRisk ? 'animate-pulse' : ''}`}
          style={{ 
            backgroundColor: `${statusColor}15`,
            borderColor: `${statusColor}50`
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full border-2 border-white shadow-md"
              style={{ backgroundColor: statusColor }}
            />
            <span className="font-medium">
              Risk Status: {getRiskStatusLabel(tourist.riskStatus)}
            </span>
            {tourist.zoneName && (
              <span className="text-muted-foreground">• {tourist.zoneName}</span>
            )}
            {tourist.nearestRiskZone && tourist.distanceToRisk !== null && tourist.distanceToRisk > 0 && (
              <span className="text-muted-foreground text-xs">
                • {Math.round(tourist.distanceToRisk)}m from {tourist.nearestRiskZone}
              </span>
            )}
          </div>
          {isAtRisk && (
            <Badge variant="outline" className="font-mono">
              {formattedRiskDuration}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationMap;
