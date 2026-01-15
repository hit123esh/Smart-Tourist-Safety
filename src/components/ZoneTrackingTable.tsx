import { AlertTriangle, AlertCircle, MapPin } from 'lucide-react';
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

const ZoneTrackingTable = () => {
  const { tourist, alerts } = useSimulation();

  // Get tourists currently in danger or caution zones
  const touristsAtRisk: {
    tourist: SimulatedTourist;
    zoneType: 'danger' | 'caution';
    lastAlert: Date | null;
  }[] = [];

  if (tourist.currentZone === 'danger' || tourist.currentZone === 'caution') {
    const lastAlertForTourist = alerts
      .filter(a => a.touristId === tourist.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    touristsAtRisk.push({
      tourist,
      zoneType: tourist.currentZone as 'danger' | 'caution',
      lastAlert: lastAlertForTourist?.timestamp || null,
    });
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin size={20} />
          Tourists in Risk Zones
        </CardTitle>
        <CardDescription>
          Real-time tracking of tourists in danger or caution areas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {touristsAtRisk.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">All tourists are in safe zones</p>
            <p className="text-xs mt-1">
              This table updates when tourists enter danger or caution zones
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">User ID</TableHead>
                  <TableHead className="font-semibold">Current Location</TableHead>
                  <TableHead className="font-semibold">Coordinates</TableHead>
                  <TableHead className="font-semibold">Zone Type</TableHead>
                  <TableHead className="font-semibold">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {touristsAtRisk.map(({ tourist, zoneType, lastAlert }) => (
                  <TableRow
                    key={tourist.id}
                    className={
                      zoneType === 'danger'
                        ? 'bg-status-alert-bg hover:bg-status-alert-bg/80'
                        : 'bg-status-observation-bg hover:bg-status-observation-bg/80'
                    }
                  >
                    <TableCell>
                      {zoneType === 'danger' ? (
                        <AlertTriangle className="w-5 h-5 text-status-alert animate-pulse" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-status-observation" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {tourist.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {tourist.zoneName || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {tourist.position.lat.toFixed(4)}, {tourist.position.lng.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={zoneType === 'danger' ? 'destructive' : 'secondary'}
                        className="font-medium"
                      >
                        {zoneType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastAlert ? formatTime(lastAlert) : formatTime(tourist.lastUpdated)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Alert History Summary */}
        {alerts.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Alert History:</span>{' '}
              {alerts.filter(a => a.zoneType === 'danger').length} danger alerts,{' '}
              {alerts.filter(a => a.zoneType === 'caution').length} caution alerts recorded
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ZoneTrackingTable;
