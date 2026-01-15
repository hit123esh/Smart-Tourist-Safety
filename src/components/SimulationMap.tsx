/// <reference types="@types/google.maps" />
import { useEffect, useRef, useCallback } from 'react';
import { Loader2, Map, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '@/config/maps';
import { GEOFENCED_ZONES, ZONE_COLORS, ZoneType } from '@/config/geofences';
import { useSimulation } from '@/contexts/SimulationContext';

interface SimulationMapProps {
  className?: string;
  height?: string;
  showTitle?: boolean;
  allowClickToMove?: boolean;
  onMapClick?: (position: { lat: number; lng: number }) => void;
}

const SimulationMap = ({
  className = '',
  height = '500px',
  showTitle = true,
  allowClickToMove = false,
  onMapClick,
}: SimulationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const touristMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();
  const { tourist, moveTourist } = useSimulation();

  // Get marker color based on zone type
  const getMarkerColor = (zoneType: ZoneType | 'unknown'): string => {
    switch (zoneType) {
      case 'safe':
        return ZONE_COLORS.safe.markerColor;
      case 'caution':
        return ZONE_COLORS.caution.markerColor;
      case 'danger':
        return ZONE_COLORS.danger.markerColor;
      default:
        return '#6b7280'; // Gray for unknown
    }
  };

  // Create tourist marker icon
  const createTouristIcon = useCallback((zoneType: ZoneType | 'unknown'): google.maps.Symbol => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: getMarkerColor(zoneType),
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 14,
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
              ${zone.description ? `<p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">${zone.description}</p>` : ''}
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
      icon: createTouristIcon(tourist.currentZone),
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
  }, [isLoaded, allowClickToMove, moveTourist, onMapClick, createTouristIcon]);

  // Update tourist marker when position/zone changes
  useEffect(() => {
    if (touristMarkerRef.current && isLoaded) {
      touristMarkerRef.current.setPosition(tourist.position);
      touristMarkerRef.current.setIcon(createTouristIcon(tourist.currentZone));
    }
  }, [tourist.position, tourist.currentZone, isLoaded, createTouristIcon]);

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

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map size={20} />
            Safety Zone Map - Bangalore
          </CardTitle>
          <CardDescription>
            Live tourist tracking with geofenced safety zones.
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
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-foreground border-2 border-white shadow" />
            <span>Tourist</span>
          </div>
        </div>

        {/* Current Status */}
        <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
          tourist.currentZone === 'safe' ? 'bg-status-safe-bg' :
          tourist.currentZone === 'caution' ? 'bg-status-observation-bg' :
          tourist.currentZone === 'danger' ? 'bg-status-alert-bg' :
          'bg-muted'
        }`}>
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getMarkerColor(tourist.currentZone) }}
          />
          <span className="font-medium">
            Tourist Status: {tourist.currentZone.toUpperCase()}
          </span>
          {tourist.zoneName && (
            <span className="text-muted-foreground">• {tourist.zoneName}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationMap;
