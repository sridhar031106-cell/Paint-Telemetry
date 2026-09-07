'use client';

import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { CoatingDefectReport, TelemetryRecord, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot
} from 'recharts';

interface DefectCorrelatorProps {
  telemetry: TelemetryRecord[];
  defects: CoatingDefectReport[];
  onAddDefect: (defect: { defect_type: string; severity: string; location_name: string; batch_id?: string; notes?: string }) => void;
  userRole: UserRole;
}

export function DefectCorrelator({ telemetry, defects, onAddDefect, userRole }: DefectCorrelatorProps) {
  const [showModal, setShowModal] = useState(false);
  const [defectType, setDefectType] = useState('Orange Peel Finish');
  const [severity, setSeverity] = useState('minor');
  const [locationName, setLocationName] = useState('Spray Booth 1');
  const [batchId, setBatchId] = useState('BATCH-2026-09A');
  const [notes, setNotes] = useState('');

  const canAdd = userRole === 'engineer' || userRole === 'administrator';

  const chartData = telemetry.map((t) => {
    const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const matchingDefect = defects.find(
      (d) => Math.abs(new Date(d.timestamp).getTime() - new Date(t.timestamp).getTime()) < 30 * 60 * 1000
    );

    return {
      timestamp: timeStr,
      fullTimestamp: new Date(t.timestamp).toLocaleString(),
      cqi: t.cqi_value ?? 0,
      temp: t.temperature_celsius,
      humidity: t.humidity_percent,
      defectType: matchingDefect?.defect_type,
      defectSeverity: matchingDefect?.severity
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDefect({
      defect_type: defectType,
      severity,
      location_name: locationName,
      batch_id: batchId,
      notes
    });
    setShowModal(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <span>Coating Defect & CQI Correlation Dashboard</span>
          </h2>
          <p className="text-xs text-muted-foreground">Correlate physical paint defects with historical CQI environmental telemetry</p>
        </div>

        {canAdd && (
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Log Defect Inspection</span>
          </Button>
        )}
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-1">CQI Timeline Overlay & Defect Markers</h3>
        <p className="text-xs text-muted-foreground mb-4">CQI trend line alongside logged defect report timestamps</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--primary))" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--card-foreground))',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="cqi"
                name="CQI Score"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
              />
              {chartData
                .filter((d) => d.defectType)
                .map((d, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={d.timestamp}
                    y={d.cqi}
                    r={6}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth={2}
                    isFront
                  />
                ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Recorded Paint Defect Inspection Logs</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report ID</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Defect Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Inspection Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-muted-foreground font-sans">No defect reports logged yet.</TableCell>
              </TableRow>
            ) : (
              defects.map((defect) => (
                <TableRow key={defect.id}>
                  <TableCell className="font-mono font-bold text-primary">{defect.id}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{new Date(defect.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-foreground">{defect.defect_type}</TableCell>
                  <TableCell>
                    {defect.severity === 'critical' ? (
                      <Badge variant="destructive">Critical</Badge>
                    ) : defect.severity === 'major' ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">Major</Badge>
                    ) : (
                      <Badge variant="secondary">Minor</Badge>
                    )}
                  </TableCell>
                  <TableCell>{defect.location_name}</TableCell>
                  <TableCell className="font-mono font-bold text-amber-500">{defect.batch_id || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{defect.notes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Coating Defect Inspection</DialogTitle>
            <DialogDescription>Record paint shop defect report for CQI correlation</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="mb-1 block">Defect Classification *</Label>
              <Select value={defectType} onValueChange={setDefectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Orange Peel Finish">Orange Peel Finish</SelectItem>
                  <SelectItem value="Blistering & Pinholing">Blistering & Pinholing</SelectItem>
                  <SelectItem value="Sags and Runs">Sags and Runs</SelectItem>
                  <SelectItem value="Solvent Pop">Solvent Pop</SelectItem>
                  <SelectItem value="Loss of Gloss">Loss of Gloss</SelectItem>
                  <SelectItem value="Micro-cracking">Micro-cracking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1 block">Batch Identifier</Label>
                <Input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Facility Location</Label>
              <Input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block">Notes & Observations</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detail root cause or visual inspection observations..."
                className="w-full bg-background border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit">Submit Defect Log</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
