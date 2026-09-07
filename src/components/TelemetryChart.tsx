'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TelemetryRecord, SensorNode } from '@/lib/types';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TelemetryChartProps {
  data: TelemetryRecord[];
  sensors: SensorNode[];
  selectedSensors: string[];
  setSelectedSensors: (sensors: string[]) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  onRefresh?: () => void;
}

export function TelemetryChart({
  data,
  sensors,
  selectedSensors,
  setSelectedSensors,
  timeRange,
  setTimeRange,
  onRefresh
}: TelemetryChartProps) {
  const [metricMode, setMetricMode] = useState<'all' | 'temp' | 'humidity'>('all');

  const chartData = data.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullTimestamp: new Date(item.timestamp).toLocaleString(),
    temperature: item.temperature_celsius,
    humidity: item.humidity_percent,
    cqi: item.cqi_value ?? 0,
    sensorId: item.sensor_id,
    batchId: item.batch_id
  }));

  const handleSensorToggle = (sensorId: string) => {
    if (selectedSensors.includes(sensorId)) {
      if (selectedSensors.length > 1) {
        setSelectedSensors(selectedSensors.filter((s) => s !== sensorId));
      }
    } else {
      setSelectedSensors([...selectedSensors, sensorId]);
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <span>Environmental Telemetry Trends</span>
            <Badge variant="secondary" className="text-xs font-normal">({chartData.length} points)</Badge>
          </CardTitle>
          <CardDescription className="text-xs">Real-time and aggregated historical telemetry visualization</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <Button
              size="icon"
              variant="outline"
              onClick={onRefresh}
              className="h-8 w-8 cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <Tabs value={metricMode} onValueChange={(val) => setMetricMode(val as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs py-1 px-2.5">Both</TabsTrigger>
              <TabsTrigger value="temp" className="text-xs py-1 px-2.5">Temp (°C)</TabsTrigger>
              <TabsTrigger value="humidity" className="text-xs py-1 px-2.5">Humidity (%)</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList className="h-8">
                {['1h', '24h', '7d', '30d', '1y'].map((range) => (
                  <TabsTrigger key={range} value={range} className="text-xs uppercase py-1 px-2">
                    {range}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold whitespace-nowrap">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Sensors:</span>
          </span>
          {sensors.map((sensor) => {
            const isSelected = selectedSensors.includes(sensor.sensor_id);
            return (
              <Badge
                key={sensor.sensor_id}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => handleSensorToggle(sensor.sensor_id)}
                className="cursor-pointer whitespace-nowrap"
              >
                {sensor.sensor_id} ({sensor.location_name})
              </Badge>
            );
          })}
        </div>

        <div className="h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No telemetry data found for selected filter criteria.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" vertical={false} />
                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} domain={[-10, 80]} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--primary))" tick={{ fontSize: 11 }} domain={[0, 100]} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--card-foreground))',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                <ReferenceLine yAxisId="left" y={35} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Max Temp 35°C', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine yAxisId="left" y={75} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Max RH 75%', fill: '#f59e0b', fontSize: 10 }} />

                {(metricMode === 'all' || metricMode === 'temp') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                )}

                {(metricMode === 'all' || metricMode === 'humidity') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="humidity"
                    name="Humidity (% RH)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                )}

                {metricMode === 'all' && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cqi"
                    name="CQI Score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
