import { Bell, AlertTriangle, AlertCircle, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSimulation } from '@/contexts/SimulationContext';

const AlertsPanel = () => {
  const { alerts, acknowledgeAlert, clearAlerts } = useSimulation();

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Police Alerts
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time zone breach notifications
            </CardDescription>
          </div>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAlerts}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts yet</p>
            <p className="text-xs mt-1">
              Alerts appear when tourists enter danger or caution zones
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    !alert.acknowledged
                      ? alert.zoneType === 'danger'
                        ? 'bg-status-alert-bg border-status-alert/50 animate-pulse'
                        : 'bg-status-observation-bg border-status-observation/50'
                      : 'bg-muted/50 border-border opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.zoneType === 'danger' ? (
                      <AlertTriangle className="w-5 h-5 text-status-alert shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-status-observation shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={alert.zoneType === 'danger' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.zoneType.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {alert.touristName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Entered: {alert.zoneName}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {alert.position.lat.toFixed(4)}, {alert.position.lng.toFixed(4)}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;
