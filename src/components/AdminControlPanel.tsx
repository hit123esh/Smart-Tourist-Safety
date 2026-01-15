import { MapPin, Navigation, AlertTriangle, CheckCircle, AlertCircle, Clock, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSimulation } from '@/contexts/SimulationContext';
import { PRESET_POSITIONS, ZoneType, RiskStatus, PROXIMITY_BUFFER_METERS } from '@/config/geofences';

const getRiskStatusConfig = (status: RiskStatus) => {
  switch (status) {
    case 'IN_DANGER':
      return {
        variant: 'destructive' as const,
        label: 'IN DANGER',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
        icon: AlertTriangle,
      };
    case 'NEAR_DANGER':
      return {
        variant: 'secondary' as const,
        label: 'NEAR DANGER',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-500',
        icon: AlertTriangle,
      };
    case 'IN_CAUTION':
      return {
        variant: 'secondary' as const,
        label: 'IN CAUTION',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
        icon: AlertCircle,
      };
    case 'NEAR_CAUTION':
      return {
        variant: 'outline' as const,
        label: 'NEAR CAUTION',
        bgColor: 'bg-amber-400/10',
        textColor: 'text-amber-400',
        icon: Radio,
      };
    default:
      return {
        variant: 'default' as const,
        label: 'SAFE',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
        icon: CheckCircle,
      };
  }
};

const AdminControlPanel = () => {
  const { tourist, moveToPreset, formattedRiskDuration } = useSimulation();

  const riskConfig = getRiskStatusConfig(tourist.riskStatus);
  const RiskIcon = riskConfig.icon;
  const isAtRisk = tourist.riskStatus !== 'SAFE';

  const getZoneIcon = (zone: ZoneType) => {
    switch (zone) {
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'caution':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
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
          Simulate tourist movement to test zone & proximity detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tourist Status */}
        <div className={`p-4 rounded-lg space-y-3 ${riskConfig.bgColor} border ${isAtRisk ? 'border-current' : 'border-transparent'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <RiskIcon className={`w-4 h-4 ${riskConfig.textColor}`} />
              Current Risk Status
            </span>
            <Badge variant={riskConfig.variant} className={isAtRisk ? 'animate-pulse' : ''}>
              {riskConfig.label}
            </Badge>
          </div>
          
          {/* Risk Timer */}
          {isAtRisk && (
            <div className={`flex items-center gap-2 text-sm ${riskConfig.textColor}`}>
              <Clock className="w-4 h-4" />
              <span className="font-medium">Time in risk zone:</span>
              <span className="font-mono font-bold">{formattedRiskDuration}</span>
            </div>
          )}
          
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
            {tourist.nearestRiskZone && tourist.distanceToRisk !== null && tourist.distanceToRisk > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Nearest Risk:</span>
                <span className="ml-2 text-xs">
                  {tourist.nearestRiskZone} ({Math.round(tourist.distanceToRisk)}m away)
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Preset Locations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Move to Preset Location</h4>
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
            {PRESET_POSITIONS.map((preset, index) => (
              <Button
                key={preset.name}
                variant="outline"
                className={`justify-start h-auto py-3 ${
                  preset.zone === 'danger' ? 'border-red-500/50 hover:bg-red-500/10' :
                  preset.zone === 'caution' ? 'border-yellow-500/50 hover:bg-yellow-500/10' :
                  'border-green-500/50 hover:bg-green-500/10'
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
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            Click any location on the map to move the tourist
          </p>
          <p className="flex items-center gap-2">
            <Radio className="w-3 h-3" />
            Proximity buffer: {PROXIMITY_BUFFER_METERS}m from zone edges
          </p>
          <p className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Timer starts when entering risk zones, resets when safe
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminControlPanel;
