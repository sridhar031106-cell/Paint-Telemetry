'use client';

import React, { useState } from 'react';
import { Settings, Save, ShieldAlert, CheckCircle2, Sliders, Database, AlertCircle } from 'lucide-react';
import { SystemConfig, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ConfigPanelProps {
  config: SystemConfig | null;
  onSaveConfig: (updated: Partial<SystemConfig>) => void;
  userRole: UserRole;
}

export function ConfigPanel({ config, onSaveConfig, userRole }: ConfigPanelProps) {
  const isAdmin = userRole === 'administrator';

  const [tempHigh, setTempHigh] = useState(config?.temp_alert_high ?? 35.0);
  const [tempLow, setTempLow] = useState(config?.temp_alert_low ?? 5.0);
  const [rhHigh, setRhHigh] = useState(config?.rh_alert_high ?? 75.0);
  const [rhLow, setRhLow] = useState(config?.rh_alert_low ?? 25.0);

  const [tempWeightPercent, setTempWeightPercent] = useState(
    config?.cqi_temp_weight ? Math.round(config.cqi_temp_weight * 100) : 60
  );
  const [rhWeightPercent, setRhWeightPercent] = useState(
    config?.cqi_rh_weight ? Math.round(config.cqi_rh_weight * 100) : 40
  );

  const [retentionDays, setRetentionDays] = useState(config?.retention_days ?? 1825);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTempWeightChange = (val: number[]) => {
    const v = val[0];
    setTempWeightPercent(v);
    setRhWeightPercent(100 - v);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAdmin) {
      setErrorMsg('Access Denied: Only Administrator role can modify system configuration thresholds.');
      return;
    }

    if (tempWeightPercent + rhWeightPercent !== 100) {
      setErrorMsg(`CQI Weighting Error: Temperature (${tempWeightPercent}%) and Humidity (${rhWeightPercent}%) weights must sum to exactly 100%.`);
      return;
    }

    if (tempHigh < 25.0 || tempHigh > 125.0) {
      setErrorMsg('High Temperature alert limit must be between 25°C and 125°C.');
      return;
    }
    if (tempLow < -40.0 || tempLow > 15.0) {
      setErrorMsg('Low Temperature alert limit must be between -40°C and 15°C.');
      return;
    }
    if (rhHigh < 50.0 || rhHigh > 100.0) {
      setErrorMsg('High Humidity alert limit must be between 50% and 100% RH.');
      return;
    }
    if (rhLow < 0.0 || rhLow > 50.0) {
      setErrorMsg('Low Humidity alert limit must be between 0% and 50% RH.');
      return;
    }
    if (retentionDays < 180 || retentionDays > 3650) {
      setErrorMsg('Data Retention Period must be between 180 days (6 months) and 3,650 days (10 years).');
      return;
    }

    onSaveConfig({
      temp_alert_high: tempHigh,
      temp_alert_low: tempLow,
      rh_alert_high: rhHigh,
      rh_alert_low: rhLow,
      cqi_temp_weight: tempWeightPercent / 100,
      cqi_rh_weight: rhWeightPercent / 100,
      retention_days: retentionDays
    });

    setSuccessMsg('System threshold configuration updated successfully and recorded in audit log.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <span>Facility Thresholds & System Settings</span>
          </h2>
          <p className="text-xs text-muted-foreground">Configure operational environmental alarm limits, CQI weighting, and data retention policy</p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4" />
            <span>Administrator Privilege Required To Save</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span>Temperature Alarm Limits (°C)</span>
          </h3>

          <div>
            <Label className="mb-1 block">High Temperature Alert Threshold (°C)</Label>
            <Input
              type="number"
              step="0.5"
              disabled={!isAdmin}
              value={tempHigh}
              onChange={(e) => setTempHigh(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Valid range: 25°C to 125°C</span>
          </div>

          <div>
            <Label className="mb-1 block">Low Temperature Alert Threshold (°C)</Label>
            <Input
              type="number"
              step="0.5"
              disabled={!isAdmin}
              value={tempLow}
              onChange={(e) => setTempLow(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Valid range: -40°C to 15°C</span>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span>Humidity Alarm Limits (% RH)</span>
          </h3>

          <div>
            <Label className="mb-1 block">High Relative Humidity Threshold (%)</Label>
            <Input
              type="number"
              step="1"
              disabled={!isAdmin}
              value={rhHigh}
              onChange={(e) => setRhHigh(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Valid range: 50% to 100% RH</span>
          </div>

          <div>
            <Label className="mb-1 block">Low Relative Humidity Threshold (%)</Label>
            <Input
              type="number"
              step="1"
              disabled={!isAdmin}
              value={rhLow}
              onChange={(e) => setRhLow(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Valid range: 0% to 50% RH</span>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground">CQI Weighting Distribution</h3>
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              Sum: {tempWeightPercent + rhWeightPercent}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Temperature Weight: <strong className="font-mono text-foreground">{tempWeightPercent}%</strong></span>
              <span>Humidity Weight: <strong className="font-mono text-foreground">{rhWeightPercent}%</strong></span>
            </div>
            <Slider
              disabled={!isAdmin}
              value={[tempWeightPercent]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleTempWeightChange}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">CQI Formula: CQI = (Temp Score × {tempWeightPercent / 100}) + (RH Score × {rhWeightPercent / 100}). Must sum to 100%.</p>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span>Time-Series Data Retention</span>
          </h3>

          <div>
            <Label className="mb-1 block">Data Retention Period (Days)</Label>
            <Input
              type="number"
              disabled={!isAdmin}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="font-mono"
            />
            <span className="text-[10px] text-muted-foreground">Valid range: 180 days (6 months) to 3,650 days (10 years). Default: 1,825 days (5 years).</span>
          </div>
        </Card>

        {isAdmin && (
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Apply Configuration Changes</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
