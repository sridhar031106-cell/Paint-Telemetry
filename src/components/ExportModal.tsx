'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export function ExportModal({ isOpen, onClose, userRole }: ExportModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [errorMsg, setErrorMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setErrorMsg('');
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (startMs >= endMs) {
      setErrorMsg('Invalid Date Range: Start date must be earlier than end date.');
      return;
    }

    const diffDays = (endMs - startMs) / (1000 * 3600 * 24);
    if (diffDays > 365) {
      setErrorMsg('Date Range Exceeded: Maximum allowed date range for export is 1 year (365 days).');
      return;
    }

    setIsExporting(true);

    try {
      if (exportFormat === 'csv') {
        const url = `/api/export/csv?start_time=${encodeURIComponent(startDate + 'T00:00:00Z')}&end_time=${encodeURIComponent(endDate + 'T23:59:59Z')}&user_id=${encodeURIComponent(userRole)}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'CSV Export failed');
        }

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `telemetry_export_${startDate}_to_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const url = `/api/export/pdf?start_time=${encodeURIComponent(startDate + 'T00:00:00Z')}&end_time=${encodeURIComponent(endDate + 'T23:59:59Z')}&user_id=${encodeURIComponent(userRole)}`;
        const res = await fetch(url);
        const data = await res.json();

        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          reportWindow.document.write(`
            <html>
              <head>
                <title>Executive Quality Summary Report</title>
                <style>
                  body { font-family: sans-serif; padding: 2rem; color: #0f172a; }
                  h1 { color: #1e3a8a; }
                  .metric { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
                  .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
                  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                  th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
                  th { background: #f1f5f9; }
                </style>
              </head>
              <body>
                <h1>PaintShop Industrial Telemetry & CQI Report</h1>
                <p><strong>Export Audit Metadata:</strong> User: ${data.data.audit_metadata.user_id} | Data Extraction TS: ${data.data.audit_metadata.data_extraction_timestamp}</p>
                <div class="card">
                  <h2>Executive Summary</h2>
                  <p>Period: ${data.data.summary.period_start} to ${data.data.summary.period_end}</p>
                  <p>Total Records Analyzed: <strong>${data.data.summary.total_records}</strong></p>
                  <p>Average Temperature: <span class="metric">${data.data.summary.avg_temperature_celsius}°C</span></p>
                  <p>Average Humidity: <span class="metric">${data.data.summary.avg_humidity_percent}% RH</span></p>
                  <p>Average Coating Quality Index (CQI): <span class="metric">${data.data.summary.avg_cqi} / 100</span></p>
                </div>
                <h3>Sample Data Snapshot</h3>
                <table>
                  <thead><tr><th>Timestamp</th><th>Sensor ID</th><th>Temp (°C)</th><th>Humidity (%)</th><th>CQI</th></tr></thead>
                  <tbody>
                    ${data.data.sample_records.map((r: any) => `<tr><td>${r.timestamp}</td><td>${r.sensor_id}</td><td>${r.temperature_celsius}</td><td>${r.humidity_percent}</td><td>${r.cqi_value}</td></tr>`).join('')}
                  </tbody>
                </table>
              </body>
            </html>
          `);
          reportWindow.document.close();
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <span>Export Environmental Telemetry Data</span>
          </DialogTitle>
          <DialogDescription>Download compliance data tables or executive summary report</DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <Label className="mb-1 block">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="h-auto p-3 justify-start flex items-center gap-2 text-left"
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">CSV Data Table</div>
                  <div className="text-[10px] opacity-80">Max 10,000 rows</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setExportFormat('pdf')}
                className="h-auto p-3 justify-start flex items-center gap-2 text-left"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">PDF Summary</div>
                  <div className="text-[10px] opacity-80">Executive Report</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-muted/60 rounded-lg border text-[11px] text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">Audit Trail Verification</div>
            <p>Export metadata (User ID: <strong className="text-foreground">{userRole}</strong>, ISO 8601 Timestamp, Data Snapshot Hash) will be stamped in compliance logs.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating Export...' : 'Download Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
