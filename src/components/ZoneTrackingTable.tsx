import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, MapPin, Clock, Radio } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSimulation, SimulatedTourist } from '@/contexts/SimulationContext';
import { RiskStatus } from '@/config/geofences';

const getRiskStatusConfig = (status: RiskStatus) => {
  switch (status) {
    case 'IN_DANGER':
      return {
        icon: AlertTriangle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        badgeVariant: 'destructive' as const,
        label: 'IN DANGER',
        animate: true,
      };
    case 'NEAR_DANGER':
      return {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        badgeVariant: 'secondary' as const,
        label: 'NEAR DANGER',
        animate: true,
      };
    case 'IN_CAUTION':
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        badgeVariant: 'secondary' as const,
        label: 'IN CAUTION',
        animate: false,
      };
    case 'NEAR_CAUTION':
      return {
        icon: Radio,
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        borderColor: 'border-amber-400/30',
        badgeVariant: 'outline' as const,
        label: 'NEAR CAUTION',
        animate: false,
      };
    default:
      return {
        icon: MapPin,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        badgeVariant: 'outline' as const,
        label: 'SAFE',
        animate: false,
      };
  }
};

// Live timer component for real-time updates
const LiveTimer = ({ startTime }: { startTime: Date | null }) => {
  const [elapsed, setElapsed] = useState('0s');

  useEffect(() => {
    if (!startTime) {
      setElapsed('0s');
      return;
    }

    const updateTimer = () => {
      const ms = Date.now() - startTime.getTime();
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds}s`);
      } else {
        setElapsed(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="font-mono text-sm font-medium">
      {elapsed}
    </span>
  );
};

const ZoneTrackingTable = () => {
  const { tourist, touristsAtRisk, transitionLogs } = useSimulation();

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isAtRisk = touristsAtRisk.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin size={20} />
          Real-Time Risk Tracking
          {isAtRisk && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              {touristsAtRisk.length} AT RISK
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Live tracking of tourists in or near risk zones (updates in real-time)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Risk Table */}
        {!isAtRisk ? (
          <div className="text-center py-8 text-muted-foreground bg-green-500/5 rounded-lg border border-green-500/20">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium text-green-600">All tourists are in safe zones</p>
            <p className="text-xs mt-1">
              This table shows tourists when they enter risk zones
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold w-[50px]">Status</TableHead>
                  <TableHead className="font-semibold">Tourist ID</TableHead>
                  <TableHead className="font-semibold">Coordinates</TableHead>
                  <TableHead className="font-semibold">Risk Status</TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      Time in Risk
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {touristsAtRisk.map((t) => {
                  const config = getRiskStatusConfig(t.riskStatus);
                  const IconComponent = config.icon;

                  return (
                    <TableRow
                      key={t.id}
                      className={`${config.bgColor} ${config.borderColor} border-l-4`}
                    >
                      <TableCell>
                        <IconComponent 
                          className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-pulse' : ''}`} 
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {t.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <div>
                          <span className="text-muted-foreground">Lat:</span> {t.position.lat.toFixed(4)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lng:</span> {t.position.lng.toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={config.badgeVariant} className="font-medium">
                            {config.label}
                          </Badge>
                          {t.nearestRiskZone && (
                            <p className="text-xs text-muted-foreground">
                              {t.distanceToRisk !== null && t.distanceToRisk > 0
                                ? `${Math.round(t.distanceToRisk)}m from ${t.nearestRiskZone}`
                                : t.zoneName || t.nearestRiskZone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${config.color}`}>
                          <Clock size={14} />
                          <LiveTimer startTime={t.riskStartTime} />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(t.lastUpdated)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Zone Transition Log */}
        {transitionLogs.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Recent Zone Transitions</h4>
            <div className="max-h-[200px] overflow-y-auto rounded-lg border bg-muted/20 p-2 space-y-1">
              {transitionLogs.slice(0, 10).map((log) => (
                <div 
                  key={log.id} 
                  className="text-xs font-mono flex items-center gap-2 py-1 px-2 bg-background/50 rounded"
                >
                  <span className="text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRiskStatusConfig(log.fromStatus).color}`}
                  >
                    {log.fromStatus}
                  </Badge>
                  <span>→</span>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${getRiskStatusConfig(log.toStatus).color}`}
                  >
                    {log.toStatus}
                  </Badge>
                  {log.zoneName && (
                    <span className="text-muted-foreground truncate">
                      ({log.zoneName})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ZoneTrackingTable;
