'use client';

import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Check, FileText } from 'lucide-react';
import { AlertRecord, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlertCenterProps {
  alerts: AlertRecord[];
  onResolveAlert: (alertId: number) => void;
  userRole: UserRole;
}

export function AlertCenter({ alerts, onResolveAlert, userRole }: AlertCenterProps) {
  const [filterTab, setFilterTab] = useState<'active' | 'resolved' | 'all'>('active');

  const filteredAlerts = alerts.filter((a) => {
    if (filterTab === 'active') return a.resolution_status === 'active';
    if (filterTab === 'resolved') return a.resolution_status === 'resolved';
    return true;
  });

  const activeCount = alerts.filter((a) => a.resolution_status === 'active').length;
  const canResolve = userRole === 'administrator' || userRole === 'engineer';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <span>Industrial Alarm & Alert Center</span>
          </h2>
          <p className="text-xs text-muted-foreground">Real-time operational alerts with paint quality impact analysis</p>
        </div>

        <Tabs value={filterTab} onValueChange={(val) => setFilterTab(val as any)}>
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-1.5">
              <span>Active Alerts</span>
              {activeCount > 0 && (
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                  {activeCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">Resolved History</TabsTrigger>
            <TabsTrigger value="all">All Logs</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-foreground">No active alerts recorded</p>
            <p className="text-xs text-muted-foreground mt-1">All paint shop environmental telemetry metrics are operating within threshold limits.</p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isActive = alert.resolution_status === 'active';

            return (
              <Card
                key={alert.id}
                className={`p-5 border transition-all ${
                  isActive
                    ? isCritical
                      ? 'border-destructive bg-destructive/5'
                      : 'border-amber-500/50 bg-amber-500/5'
                    : 'opacity-70'
                }`}
              >
                <CardContent className="p-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isCritical ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertOctagon className="h-3 w-3" />
                          <span>CRITICAL SEVERITY</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-500">
                          <AlertTriangle className="h-3 w-3" />
                          <span>WARNING SEVERITY</span>
                        </Badge>
                      )}

                      <Badge variant="secondary" className="font-mono">
                        {alert.alert_type}
                      </Badge>

                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">{alert.description}</h3>

                    <div className="bg-muted/80 rounded-md p-3 border text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Paint Coating Quality Impact Analysis:</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{alert.impact_analysis}</p>
                      
                      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground pt-1 border-t">
                        <span>Measured: <strong className="text-foreground font-mono">{alert.current_value}</strong></span>
                        <span>Threshold: <strong className="text-foreground font-mono">{alert.threshold_value}</strong></span>
                        <span>Affected Sensor(s): <strong className="text-primary font-mono">{alert.affected_sensors.join(', ')}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                    {isActive ? (
                      canResolve ? (
                        <Button
                          size="sm"
                          variant={isCritical ? 'destructive' : 'default'}
                          onClick={() => onResolveAlert(alert.id!)}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          <span>Acknowledge & Resolve</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">View Only (Requires Engineer/Admin to resolve)</span>
                      )
                    ) : (
                      <div className="text-right text-xs">
                        <Badge variant="secondary" className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                        </Badge>
                        <p className="text-[11px] text-muted-foreground mt-0.5">By {alert.resolved_by || 'system'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
