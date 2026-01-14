/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Loader2, Map, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  SAFETY_LOCATIONS,
  MARKER_COLORS,
  SafetyLocation,
  SafetyLevel,
} from '@/config/maps';

interface SafetyHeatMapProps {
  className?: string;
  showTitle?: boolean;
  height?: string;
}

const SafetyHeatMap = ({ className = '', showTitle = true, height = '500px' }: SafetyHeatMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const { isLoaded, loadError } = useGoogleMaps();
  const [mapReady, setMapReady] = useState(false);

  // Create custom marker icon
  const createMarkerIcon = (safetyLevel: SafetyLevel): google.maps.Symbol => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: MARKER_COLORS[safetyLevel],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  };

  // Get status label
  const getStatusLabel = (level: SafetyLevel): string => {
    switch (level) {
      case 'safe':
        return '✅ Safe Zone';
      case 'caution':
        return '⚠️ Caution Area';
      case 'unsafe':
        return '🚨 Unsafe Zone';
    }
  };

  // Create InfoWindow content
  const createInfoContent = (location: SafetyLocation): string => {
    const bgColor = 
      location.safetyLevel === 'safe' ? '#dcfce7' :
      location.safetyLevel === 'caution' ? '#fef9c3' : '#fee2e2';
    
    return `
      <div style="padding: 8px; max-width: 250px; font-family: 'Inter', sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1e293b;">
          ${location.name}
        </h3>
        <div style="
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: ${bgColor};
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 8px;
        ">
          ${getStatusLabel(location.safetyLevel)}
        </div>
        ${location.description ? `
          <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.4;">
            ${location.description}
          </p>
        ` : ''}
      </div>
    `;
  };

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

    // Create markers
    SAFETY_LOCATIONS.forEach((location) => {
      const marker = new google.maps.Marker({
        position: location.position,
        map: mapInstanceRef.current!,
        icon: createMarkerIcon(location.safetyLevel),
        title: location.name,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(createInfoContent(location));
          infoWindowRef.current.open(mapInstanceRef.current!, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Create heat map layer
    const heatmapData = SAFETY_LOCATIONS.map((loc) => ({
      location: new google.maps.LatLng(loc.position.lat, loc.position.lng),
      weight: loc.safetyLevel === 'unsafe' ? 10 : loc.safetyLevel === 'caution' ? 5 : 1,
    }));

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 50,
      opacity: 0.6,
      gradient: [
        'rgba(0, 255, 0, 0)',
        'rgba(0, 255, 0, 0.5)',
        'rgba(255, 255, 0, 0.7)',
        'rgba(255, 165, 0, 0.8)',
        'rgba(255, 0, 0, 1)',
      ],
    });

    setMapReady(true);

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [isLoaded]);

  // Loading state
  if (!isLoaded) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              Safety Heat Map
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
              Safety Heat Map
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
            Safety Heat Map - Bangalore
          </CardTitle>
          <CardDescription>
            Tourist safety zones visualization. Click markers for details.
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
          <span className="text-muted-foreground font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: MARKER_COLORS.safe }}
            />
            <span>Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: MARKER_COLORS.caution }}
            />
            <span>Caution Area</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full border border-white shadow-sm" 
              style={{ backgroundColor: MARKER_COLORS.unsafe }}
            />
            <span>Unsafe Zone</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 bg-status-observation-bg rounded-lg text-sm">
          <AlertTriangle className="text-status-observation shrink-0 mt-0.5" size={16} />
          <p className="text-muted-foreground">
            <strong className="text-foreground">Demo Data:</strong> Unsafe and caution zones shown are simulated for demonstration purposes only. 
            Real safety data will be integrated from anomaly detection systems.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyHeatMap;
