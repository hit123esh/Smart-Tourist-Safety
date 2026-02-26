import { Brain, Check, RefreshCw, X, AlertTriangle, Radio, Zap, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useIncidentAlerts, IncidentAlert, IncidentSeverity } from '@/hooks/useIncidentAlerts';

// -----------------------------------------------------------------------
// Severity helpers
// -----------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
    IncidentSeverity,
    { bg: string; border: string; text: string; badge: string; icon: typeof AlertTriangle }
> = {
    CRITICAL: {
        bg: 'bg-red-600/15',
        border: 'border-red-500',
        text: 'text-red-500',
        badge: 'bg-red-600 text-white',
        icon: ShieldAlert,
    },
    HIGH: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500',
        text: 'text-orange-500',
        badge: 'bg-orange-500 text-white',
        icon: AlertTriangle,
    },
    MEDIUM: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/60',
        text: 'text-yellow-500',
        badge: 'bg-yellow-500 text-black',
        icon: AlertTriangle,
    },
    LOW: {
        bg: 'bg-muted/40',
        border: 'border-border',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-foreground',
        icon: Radio,
    },
};

const RULE_LABELS: Record<string, string> = {
    R1: 'Sustained Danger',
    R2: '🚨 Panic',
    R3: 'Rapid Transition',
    R4: 'Erratic Movement',
    R5: 'Extended Danger',
    R6: 'No Exit Detected',
};

// -----------------------------------------------------------------------
// Score bar
// -----------------------------------------------------------------------

const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">{(value * 100).toFixed(0)}%</span>
        </div>
        <Progress value={value * 100} className={`h-1.5 ${color}`} />
    </div>
);

// -----------------------------------------------------------------------
// Single Alert Card
// -----------------------------------------------------------------------

const AlertCard = ({
    alert,
    onAcknowledge,
    onResolve,
}: {
    alert: IncidentAlert;
    onAcknowledge: (id: string) => void;
    onResolve: (id: string) => void;
}) => {
    const cfg = SEVERITY_CONFIG[alert.severity];
    const Icon = cfg.icon;
    const isCritical = alert.severity === 'CRITICAL';
    const ts = new Date(alert.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    return (
        <div
            className={`rounded-lg border-l-4 p-3 transition-all ${cfg.bg} ${cfg.border} ${isCritical && !alert.acknowledged ? 'animate-pulse' : ''
                }`}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.text}`} />
                    <Badge className={`text-xs font-bold ${cfg.badge}`}>
                        {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{ts}</span>
                    {alert.acknowledged && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-500/40">
                            ✓ ACK
                        </Badge>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                    {!alert.acknowledged && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            onClick={() => onAcknowledge(alert.id)}
                            title="Acknowledge"
                        >
                            <Check className="w-3 h-3" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onResolve(alert.id)}
                        title="Resolve / Dismiss"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Tourist + zone */}
            <p className="text-sm font-medium font-mono mb-1">{alert.tourist_id}</p>
            {alert.zone_state && (
                <p className="text-xs text-muted-foreground mb-2">
                    Zone: <span className="font-medium">{alert.zone_state}</span>
                    {alert.latitude && alert.longitude && (
                        <span className="ml-2">
                            📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </span>
                    )}
                </p>
            )}

            {/* Triggered rules */}
            {alert.triggered_rules.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {alert.triggered_rules.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">
                            {RULE_LABELS[r] || r}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Score bars */}
            <div className="space-y-1 mt-2 pt-2 border-t border-border/50">
                <ScoreBar label="Rule Engine" value={alert.rule_score} color="[&>div]:bg-orange-500" />
                <ScoreBar label="Isolation Forest" value={alert.anomaly_score} color="[&>div]:bg-blue-500" />
                <ScoreBar label="Hybrid Score" value={alert.hybrid_score} color="[&>div]:bg-red-500" />
            </div>

            {/* Model version */}
            <p className="text-xs text-muted-foreground mt-1 text-right">
                model: {alert.model_version}
            </p>
        </div>
    );
};

// -----------------------------------------------------------------------
// Main MLAlertsPanel component
// -----------------------------------------------------------------------

const MLAlertsPanel = () => {
    const {
        unresolvedAlerts,
        stats,
        isConnected,
        isLoading,
        hasCritical,
        acknowledgeAlert,
        resolveAlert,
        refresh,
    } = useIncidentAlerts();

    return (
        <Card className={hasCritical ? 'ring-2 ring-red-500 ring-offset-2' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className={`w-5 h-5 ${hasCritical ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                        <CardTitle className="text-base">ML Anomaly Alerts</CardTitle>

                        {/* Live indicator */}
                        <div className="flex items-center gap-1">
                            <Radio className={`h-3 w-3 ${isConnected ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                            <span className="text-xs text-muted-foreground">
                                {isConnected ? 'Live' : 'Connecting...'}
                            </span>
                        </div>

                        {/* Unread count badge */}
                        {stats.unresolved > 0 && (
                            <Badge variant="destructive" className="text-xs">
                                {stats.unresolved}
                            </Badge>
                        )}
                    </div>

                    <Button variant="ghost" size="sm" onClick={refresh} className="h-7 w-7 p-0" title="Refresh">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <CardDescription className="text-xs">
                    Hybrid Rule Engine + Isolation Forest alerts (30s cycle)
                </CardDescription>

                {/* Severity summary chips */}
                {stats.unresolved > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {stats.critical > 0 && (
                            <Badge className="bg-red-600 text-white text-xs gap-1">
                                <ShieldAlert className="w-3 h-3" /> {stats.critical} Critical
                            </Badge>
                        )}
                        {stats.high > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" /> {stats.high} High
                            </Badge>
                        )}
                        {stats.medium > 0 && (
                            <Badge className="bg-yellow-500 text-black text-xs gap-1">
                                <Zap className="w-3 h-3" /> {stats.medium} Medium
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                <ScrollArea className="h-[340px] pr-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                            <p className="text-sm">Loading alerts...</p>
                        </div>
                    ) : unresolvedAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Brain className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-sm font-medium">No active ML alerts</p>
                            <p className="text-xs mt-1">
                                Alerts appear when the backend detects anomalies (every 30s)
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {unresolvedAlerts.map((alert) => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={acknowledgeAlert}
                                    onResolve={resolveAlert}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default MLAlertsPanel;
