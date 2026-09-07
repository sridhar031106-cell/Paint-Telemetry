'use client';

import React from 'react';
import { Thermometer, Droplets, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface LiveGaugeProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  type: 'temperature' | 'humidity';
  updatedAt?: string;
  isOutdated?: boolean;
}

export function LiveGauge({
  title,
  value,
  unit,
  min,
  max,
  optimalMin,
  optimalMax,
  type,
  updatedAt,
  isOutdated = false
}: LiveGaugeProps) {
  const isTemp = type === 'temperature';
  const Icon = isTemp ? Thermometer : Droplets;

  let statusText = 'Optimal';
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  if (value < min || value > max) {
    statusText = 'Critical Excursion';
    badgeVariant = 'destructive';
  } else if (value < optimalMin || value > optimalMax) {
    statusText = 'Sub-optimal';
    badgeVariant = 'secondary';
  }

  // Calculate percentage within gauge bounds
  const rangeSpan = max - min;
  const normalizedValue = Math.min(100, Math.max(0, ((value - min) / (rangeSpan || 1)) * 100));

  return (
    <Card className="flex flex-col justify-between shadow-sm">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">Target: {optimalMin}{unit} - {optimalMax}{unit}</CardDescription>
            </div>
          </div>

          <Badge variant={badgeVariant}>
            {statusText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex items-center justify-center my-3">
          <div className="text-center w-full">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">{value.toFixed(1)}</span>
              <span className="text-lg font-bold text-muted-foreground ml-1">{unit}</span>
            </div>

            <div className="mt-3 px-2">
              <Progress value={normalizedValue} className="h-2" />
            </div>

            {isOutdated ? (
              <div className="flex items-center justify-center gap-1 mt-2 text-destructive text-xs font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Outdated (&gt;15 min)</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Span: {min}{unit} to {max}{unit}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Sensor Telemetry</span>
          <span className="font-mono">{updatedAt ? new Date(updatedAt).toLocaleTimeString() : 'Just now'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
