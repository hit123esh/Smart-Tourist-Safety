import { MapPin, Navigation, AlertTriangle, CheckCircle, AlertCircle, Clock, Radio, Play, Pause, Shield, Skull, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useSimulation } from '@/contexts/SimulationContext';
import { PRESET_POSITIONS, ZoneType, RiskStatus, PROXIMITY_BUFFER_METERS } from '@/config/geofences';
import { SimulationMode } from '@/config/simulationRoutes';

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

const getModeConfig = (mode: SimulationMode) => {
  switch (mode) {
    case 'safe':
      return {
        label: 'SAFE MODE',
        description: 'Smooth movement between safe zones only',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500',
        textColor: 'text-green-500',
        icon: Shield,
      };
    case 'danger':
      return {
        label: 'DANGER MODE',
        description: 'Erratic movement through caution & danger zones',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500',
        textColor: 'text-red-500',
        icon: Skull,
      };
    default:
      return {
        label: 'MANUAL MODE',
        description: 'Click map or use presets to move tourist',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-500',
        icon: Hand,
      };
  }
};

const AdminControlPanel = () => {
  const { 
    tourist, 
    moveToPreset, 
    formattedRiskDuration,
    simulationMode,
    setSimulationMode,
    isAnimating,
    currentRouteIndex,
    totalRoutePoints,
  } = useSimulation();

  const riskConfig = getRiskStatusConfig(tourist.riskStatus);
  const modeConfig = getModeConfig(simulationMode);
  const RiskIcon = riskConfig.icon;
  const ModeIcon = modeConfig.icon;
  const isAtRisk = tourist.riskStatus !== 'SAFE';

  const progressPercent = totalRoutePoints > 0 
    ? (currentRouteIndex / totalRoutePoints) * 100 
    : 0;

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
          Control simulation mode and tourist movement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simulation Mode Toggle */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Play size={16} />
            Simulation Mode
          </h4>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={simulationMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-3 ${
                simulationMode === 'manual' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-500/50'
              }`}
              onClick={() => setSimulationMode('manual')}
            >
              <Hand className="w-4 h-4" />
              <span className="text-xs">Manual</span>
            </Button>
            
            <Button
              variant={simulationMode === 'safe' ? 'default' : 'outline'}
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-3 ${
                simulationMode === 'safe' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500/50'
              }`}
              onClick={() => setSimulationMode('safe')}
            >
              <Shield className="w-4 h-4" />
              <span className="text-xs">Safe</span>
            </Button>
            
            <Button
              variant={simulationMode === 'danger' ? 'default' : 'outline'}
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-3 ${
                simulationMode === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500/50'
              }`}
              onClick={() => setSimulationMode('danger')}
            >
              <Skull className="w-4 h-4" />
              <span className="text-xs">Danger</span>
            </Button>
          </div>
          
          {/* Current Mode Status */}
          <div className={`p-3 rounded-lg border ${modeConfig.borderColor} ${modeConfig.bgColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <ModeIcon className={`w-4 h-4 ${modeConfig.textColor}`} />
              <span className={`font-semibold text-sm ${modeConfig.textColor}`}>
                {modeConfig.label}
              </span>
              {isAnimating && (
                <Badge variant="outline" className="ml-auto animate-pulse">
                  <Play className="w-3 h-3 mr-1" />
                  Running
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{modeConfig.description}</p>
            
            {/* Route Progress */}
            {simulationMode !== 'manual' && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Route Progress</span>
                  <span>{currentRouteIndex} / {totalRoutePoints}</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
          </div>
        </div>

        <Separator />

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

        {/* Preset Locations (only show in manual mode) */}
        {simulationMode === 'manual' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Move to Preset Location</h4>
            <div className="grid gap-2 max-h-[200px] overflow-y-auto pr-1">
              {PRESET_POSITIONS.map((preset, index) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className={`justify-start h-auto py-2 ${
                    preset.zone === 'danger' ? 'border-red-500/50 hover:bg-red-500/10' :
                    preset.zone === 'caution' ? 'border-yellow-500/50 hover:bg-yellow-500/10' :
                    'border-green-500/50 hover:bg-green-500/10'
                  }`}
                  onClick={() => moveToPreset(index)}
                >
                  <div className="flex items-center gap-3 w-full">
                    {getZoneIcon(preset.zone)}
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{preset.name}</div>
                    </div>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {simulationMode !== 'manual' && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Tourist is moving automatically.</p>
            <p className="text-xs mt-1">Switch to Manual mode to use presets or map clicks.</p>
          </div>
        )}

        <Separator />

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-green-500" />
            <strong>Safe Mode:</strong> Tours safe zones only
          </p>
          <p className="flex items-center gap-2">
            <Skull className="w-3 h-3 text-red-500" />
            <strong>Danger Mode:</strong> Enters risk zones repeatedly
          </p>
          <p className="flex items-center gap-2">
            <Radio className="w-3 h-3" />
            Proximity buffer: {PROXIMITY_BUFFER_METERS}m from zone edges
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminControlPanel;
