import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Database, Activity, Radio, AlertTriangle, ArrowUpRight, ArrowDownRight, Move, Skull, RefreshCw } from 'lucide-react';
import { useRealTimeEvents } from '@/hooks/useRealTimeEvents';
import { TouristEvent } from '@/services/touristEventLogger';

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'ZONE_ENTER':
      return <ArrowUpRight className="h-3 w-3" />;
    case 'ZONE_EXIT':
      return <ArrowDownRight className="h-3 w-3" />;
    case 'PANIC':
      return <AlertTriangle className="h-3 w-3" />;
    case 'MODE_CHANGE':
      return <RefreshCw className="h-3 w-3" />;
    default:
      return <Move className="h-3 w-3" />;
  }
};

const getZoneStateBadge = (zoneState: string) => {
  switch (zoneState) {
    case 'SAFE':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">SAFE</Badge>;
    case 'NEAR_CAUTION':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-xs">NEAR CAUTION</Badge>;
    case 'IN_CAUTION':
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">IN CAUTION</Badge>;
    case 'NEAR_DANGER':
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">NEAR DANGER</Badge>;
    case 'IN_DANGER':
      return <Badge variant="outline" className="bg-red-600/20 text-red-700 border-red-600/50 text-xs animate-pulse">IN DANGER</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{zoneState}</Badge>;
  }
};

const getEventTypeBadge = (eventType: string) => {
  switch (eventType) {
    case 'ZONE_ENTER':
      return <Badge className="bg-blue-500/80 text-xs">ENTER</Badge>;
    case 'ZONE_EXIT':
      return <Badge className="bg-slate-500/80 text-xs">EXIT</Badge>;
    case 'PANIC':
      return <Badge className="bg-red-600 text-xs animate-pulse">PANIC</Badge>;
    case 'MODE_CHANGE':
      return <Badge className="bg-purple-500/80 text-xs">MODE</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">MOVE</Badge>;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
};

interface EventLogPanelProps {
  className?: string;
}

export const EventLogPanel = ({ className }: EventLogPanelProps) => {
  const { 
    events, 
    latestEvent, 
    isConnected, 
    eventCounts,
    clearEvents 
  } = useRealTimeEvents(50);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">ML Event Log</CardTitle>
            <div className="flex items-center gap-1">
              <Radio className={`h-3 w-3 ${isConnected ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearEvents}>
            Clear
          </Button>
        </div>
        <CardDescription className="text-xs">
          Real-time movement data for Isolation Forest training
        </CardDescription>
        
        {/* Event counts summary */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            Total: {eventCounts.total}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600">
            Enters: {eventCounts.zoneEnters}
          </Badge>
          <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600">
            Exits: {eventCounts.zoneExits}
          </Badge>
          {eventCounts.panics > 0 && (
            <Badge className="text-xs bg-red-600 animate-pulse">
              Panics: {eventCounts.panics}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No events recorded yet</p>
              <p className="text-xs">Move the tourist to generate data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div 
                  key={`${event.timestamp}-${index}`}
                  className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                    event.event_type === 'PANIC' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : event.event_type === 'ZONE_ENTER' || event.event_type === 'ZONE_EXIT'
                        ? 'bg-accent/50 border-accent'
                        : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border">
                    {getEventIcon(event.event_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getEventTypeBadge(event.event_type)}
                      {getZoneStateBadge(event.zone_state)}
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{event.tourist_id}</span>
                      {event.zone_id && (
                        <span className="ml-2">• {event.zone_id}</span>
                      )}
                      {event.risk_timer_value > 0 && (
                        <span className="ml-2">• Timer: {event.risk_timer_value}s</span>
                      )}
                    </div>
                    
                    {event.simulation_mode && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.simulation_mode} mode
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
