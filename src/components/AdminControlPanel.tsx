import { MapPin, Navigation, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSimulation } from '@/contexts/SimulationContext';
import { PRESET_POSITIONS, ZoneType } from '@/config/geofences';

const AdminControlPanel = () => {
  const { tourist, moveToPreset } = useSimulation();

  const getZoneIcon = (zone: ZoneType) => {
    switch (zone) {
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-status-safe" />;
      case 'caution':
        return <AlertCircle className="w-4 h-4 text-status-observation" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-status-alert" />;
    }
  };

  const getZoneBadgeVariant = (zone: ZoneType | 'unknown') => {
    switch (zone) {
      case 'safe':
        return 'default';
      case 'caution':
        return 'secondary';
      case 'danger':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation size={20} />
          Admin Control Panel
        </CardTitle>
        <CardDescription>
          Simulate tourist movement to test zone detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tourist Status */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tourist</span>
            <Badge variant={getZoneBadgeVariant(tourist.currentZone)}>
              {tourist.currentZone.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <span className="ml-2 font-mono">{tourist.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Zone:</span>
              <span className="ml-2">{tourist.zoneName || 'Outside zones'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Position:</span>
              <span className="ml-2 font-mono text-xs">
                {tourist.position.lat.toFixed(4)}, {tourist.position.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preset Locations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Move to Preset Location</h4>
          <div className="grid gap-2">
            {PRESET_POSITIONS.map((preset, index) => (
              <Button
                key={preset.name}
                variant="outline"
                className={`justify-start h-auto py-3 ${
                  preset.zone === 'danger' ? 'border-status-alert/50 hover:bg-status-alert-bg' :
                  preset.zone === 'caution' ? 'border-status-observation/50 hover:bg-status-observation-bg' :
                  'border-status-safe/50 hover:bg-status-safe-bg'
                }`}
                onClick={() => moveToPreset(index)}
              >
                <div className="flex items-center gap-3 w-full">
                  {getZoneIcon(preset.zone)}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {preset.position.lat.toFixed(4)}, {preset.position.lng.toFixed(4)}
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Click any location on the map to move the tourist
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            Alerts trigger when entering Danger or Caution zones
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminControlPanel;
