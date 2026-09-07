'use client';

import React from 'react';
import { Award, CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { CQICategory } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CQICardProps {
  cqiScore: number;
  category: CQICategory;
  tempScore?: number;
  humidityScore?: number;
  batchId?: string;
  tempWeight?: number;
  rhWeight?: number;
}

export function CQICard({
  cqiScore,
  category,
  tempScore = 100,
  humidityScore = 100,
  batchId,
  tempWeight = 60,
  rhWeight = 40
}: CQICardProps) {
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let Icon = CheckCircle;
  let description = 'Optimal curing & adhesion environment';

  if (category === 'Good') {
    badgeVariant = 'secondary';
    Icon = CheckCircle;
    description = 'Stable process conditions, minor variance';
  } else if (category === 'Fair') {
    badgeVariant = 'outline';
    Icon = AlertTriangle;
    description = 'Sub-optimal environment, monitoring required';
  } else if (category === 'Poor') {
    badgeVariant = 'destructive';
    Icon = AlertOctagon;
    description = 'Quality Risk: Environmental parameters out of tolerance';
  }

  return (
    <Card className="flex flex-col justify-between shadow-sm">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Coating Quality Index (CQI)</CardTitle>
              <CardDescription className="text-xs">Calculated 15-Minute Window Metric</CardDescription>
            </div>
          </div>

          <Badge variant={badgeVariant} className="flex items-center gap-1.5 px-2.5 py-1">
            <Icon className="h-3.5 w-3.5" />
            <span>{category} ({cqiScore})</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="my-4 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono">{cqiScore}</span>
              <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>{description}</span>
            </p>
          </div>

          {batchId && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Batch</span>
              <Badge variant="outline" className="font-mono text-xs block mt-0.5">
                {batchId}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t pt-3 text-xs">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Temperature Score ({tempWeight}% Weight)</span>
              <span className="font-mono font-semibold text-foreground">{tempScore.toFixed(1)} / 100</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, tempScore))} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Humidity Score ({rhWeight}% Weight)</span>
              <span className="font-mono font-semibold text-foreground">{humidityScore.toFixed(1)} / 100</span>
            </div>
            <Progress value={Math.min(100, Math.max(0, humidityScore))} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
