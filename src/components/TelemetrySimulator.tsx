'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Flame, Droplet, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TelemetrySimulatorProps {
  sensors: Array<{ sensor_id: string; location_name: string }>;
  onIngestTelemetry: (data: { sensor_id: string; temperature_celsius: number; humidity_percent: number; batch_id?: string }) => void;
}

export function TelemetrySimulator({ sensors, onIngestTelemetry }: TelemetrySimulatorProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [scenario, setScenario] = useState<'normal' | 'temp_spike' | 'humidity_drop' | 'batch_run'>('normal');
  const activeBatch = 'BATCH-2026-09B';

  useEffect(() => {
    if (!isRunning || sensors.length === 0) return;

    const interval = setInterval(() => {
      const sensor = sensors[Math.floor(Math.random() * sensors.length)];
      if (!sensor) return;

      let temp = 22.5 + (Math.random() * 2 - 1);
      let rh = 50.0 + (Math.random() * 4 - 2);

      if (scenario === 'temp_spike') {
        temp = 37.8 + (Math.random() * 3);
      } else if (scenario === 'humidity_drop') {
        rh = 18.5 - (Math.random() * 4);
      }

      onIngestTelemetry({
        sensor_id: sensor.sensor_id,
        temperature_celsius: Math.round(temp * 10) / 10,
        humidity_percent: Math.round(rh * 2) / 2,
        batch_id: scenario === 'batch_run' ? activeBatch : undefined
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isRunning, scenario, sensors, activeBatch, onIngestTelemetry]);

  return (
    <Card className="border-primary/20 bg-muted/30">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary border border-primary/20">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Live Telemetry Simulator</h3>
              <Badge variant={isRunning ? 'default' : 'secondary'} className="text-[10px] py-0 font-bold">
                {isRunning ? 'STREAM ACTIVE' : 'PAUSED'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Simulating real-time sensor node telemetry transmissions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={scenario === 'normal' ? 'default' : 'outline'}
            onClick={() => setScenario('normal')}
            className="cursor-pointer text-xs"
          >
            Normal Operation
          </Button>

          <Button
            size="sm"
            variant={scenario === 'temp_spike' ? 'destructive' : 'outline'}
            onClick={() => setScenario('temp_spike')}
            className="cursor-pointer text-xs flex items-center gap-1.5"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Simulate Temp Spike (&gt;35°C)</span>
          </Button>

          <Button
            size="sm"
            variant={scenario === 'humidity_drop' ? 'secondary' : 'outline'}
            onClick={() => setScenario('humidity_drop')}
            className="cursor-pointer text-xs flex items-center gap-1.5"
          >
            <Droplet className="h-3.5 w-3.5" />
            <span>Simulate Low Humidity (&lt;25%)</span>
          </Button>

          <Button
            size="sm"
            variant={scenario === 'batch_run' ? 'default' : 'outline'}
            onClick={() => setScenario('batch_run')}
            className="cursor-pointer text-xs flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Active Batch Job</span>
          </Button>

          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background ml-2">
            <Switch
              id="simulator-toggle"
              checked={isRunning}
              onCheckedChange={setIsRunning}
            />
            <Label htmlFor="simulator-toggle" className="text-xs font-semibold cursor-pointer">
              {isRunning ? 'Streaming' : 'Paused'}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
