'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Zap, Flame, Droplet, Package, Send } from 'lucide-react';
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
  const [lastEmitted, setLastEmitted] = useState<string | null>(null);
  const activeBatch = 'BATCH-2026-09B';

  const onIngestRef = useRef(onIngestTelemetry);
  useEffect(() => {
    onIngestRef.current = onIngestTelemetry;
  }, [onIngestTelemetry]);

  const activeSensors = useMemo(() => {
    return sensors.length > 0 ? sensors : [
      { sensor_id: 'SN-MIX-01', location_name: 'Mixing Bay Alpha' },
      { sensor_id: 'SN-BOOTH-01', location_name: 'Spray Booth 1' },
      { sensor_id: 'SN-OVEN-01', location_name: 'Drying Oven C' }
    ];
  }, [sensors]);

  const generateSingleReading = useCallback((overrideScenario?: typeof scenario) => {
    const activeScen = overrideScenario || scenario;
    const sensor = activeSensors[Math.floor(Math.random() * activeSensors.length)];
    if (!sensor) return;

    let temp = 22.5 + (Math.random() * 2 - 1);
    let rh = 50.0 + (Math.random() * 4 - 2);

    if (activeScen === 'temp_spike') {
      temp = 37.8 + (Math.random() * 3);
    } else if (activeScen === 'humidity_drop') {
      rh = 18.5 - (Math.random() * 4);
    }

    const payload = {
      sensor_id: sensor.sensor_id,
      temperature_celsius: Math.round(temp * 10) / 10,
      humidity_percent: Math.round(rh * 2) / 2,
      batch_id: activeScen === 'batch_run' ? activeBatch : undefined
    };

    onIngestRef.current(payload);
    setLastEmitted(`${sensor.sensor_id}: ${payload.temperature_celsius}°C / ${payload.humidity_percent}% RH`);
  }, [activeSensors, scenario, activeBatch]);

  // Handle Scenario Change with instant reading
  const handleScenarioChange = (newScenario: typeof scenario) => {
    setScenario(newScenario);
    generateSingleReading(newScenario);
  };

  // Interval loop - 2 seconds continuous streaming
  useEffect(() => {
    if (!isRunning) return;

    generateSingleReading();

    const interval = setInterval(() => {
      generateSingleReading();
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, scenario, generateSingleReading]);

  return (
    <Card className="border-primary/20 bg-card/90 backdrop-blur shadow-sm">
      <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border transition-colors ${isRunning ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
            <Zap className={`h-5 w-5 ${isRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Live Telemetry Generator</h3>
              <Badge variant={isRunning ? 'default' : 'outline'} className={`text-[10px] px-2 py-0.5 font-mono font-medium flex items-center gap-1.5 ${isRunning ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : ''}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-white animate-ping' : 'bg-muted-foreground'}`} />
                {isRunning ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
              {lastEmitted ? `Latest Transmission → ${lastEmitted}` : 'Simulating real-time sensor node telemetry transmissions'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={scenario === 'normal' ? 'default' : 'outline'}
            onClick={() => handleScenarioChange('normal')}
            className="h-8 cursor-pointer text-xs font-medium"
          >
            Normal
          </Button>

          <Button
            size="sm"
            variant={scenario === 'temp_spike' ? 'destructive' : 'outline'}
            onClick={() => handleScenarioChange('temp_spike')}
            className="h-8 cursor-pointer text-xs font-medium flex items-center gap-1.5"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Temp Spike (&gt;35°C)</span>
          </Button>

          <Button
            size="sm"
            variant={scenario === 'humidity_drop' ? 'secondary' : 'outline'}
            onClick={() => handleScenarioChange('humidity_drop')}
            className="h-8 cursor-pointer text-xs font-medium flex items-center gap-1.5"
          >
            <Droplet className="h-3.5 w-3.5" />
            <span>Low Humidity (&lt;25%)</span>
          </Button>

          <Button
            size="sm"
            variant={scenario === 'batch_run' ? 'default' : 'outline'}
            onClick={() => handleScenarioChange('batch_run')}
            className="h-8 cursor-pointer text-xs font-medium flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Batch Run</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => generateSingleReading()}
            className="h-8 cursor-pointer text-xs font-medium flex items-center gap-1 text-primary hover:bg-primary/10"
            title="Send single telemetry reading right now"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ping Now</span>
          </Button>

          <div className="flex items-center gap-2 border rounded-md px-3 h-8 bg-background shadow-xs ml-auto lg:ml-2">
            <Switch
              id="simulator-toggle"
              checked={isRunning}
              onCheckedChange={setIsRunning}
            />
            <Label htmlFor="simulator-toggle" className="text-xs font-semibold cursor-pointer select-none">
              {isRunning ? 'Active' : 'Off'}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
