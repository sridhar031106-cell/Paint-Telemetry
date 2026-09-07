'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { LiveGauge } from '@/components/LiveGauge';
import { CQICard } from '@/components/CQICard';
import { TelemetryChart } from '@/components/TelemetryChart';
import { SensorGrid } from '@/components/SensorGrid';
import { AlertCenter } from '@/components/AlertCenter';
import { DefectCorrelator } from '@/components/DefectCorrelator';
import { ConfigPanel } from '@/components/ConfigPanel';
import { AuditLogs } from '@/components/AuditLogs';
import { ExportModal } from '@/components/ExportModal';
import { UserRole, TelemetryRecord, SensorNode, AlertRecord, SystemConfig, CoatingDefectReport, AuditLog } from '@/lib/types';
import { ShieldAlert, Cpu, Thermometer, Droplets, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('operator');

  // Application Data States (Client-Side Hardcoded for Demo)
  const [sensors, setSensors] = useState<SensorNode[]>([
    { sensor_id: 'SN-MIX-01', location_name: 'Mixing Room', sensor_type: 'temperature', status: 'active', installation_date: new Date().toISOString(), failed_data_count: 0 },
    { sensor_id: 'SN-BOOTH-01', location_name: 'Paint Booth A', sensor_type: 'combined', status: 'active', installation_date: new Date().toISOString(), failed_data_count: 0 },
    { sensor_id: 'SN-OVEN-01', location_name: 'Curing Oven', sensor_type: 'temperature', status: 'active', installation_date: new Date().toISOString(), failed_data_count: 0 }
  ]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [defects, setDefects] = useState<CoatingDefectReport[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>({
    temp_alert_high: 35.0,
    temp_alert_low: 5.0,
    rh_alert_high: 75.0,
    rh_alert_low: 25.0,
    temp_optimal_min: 17.5,
    temp_optimal_max: 27.5,
    rh_optimal_min: 40.0,
    rh_optimal_max: 60.0,
    cqi_temp_weight: 0.6,
    cqi_rh_weight: 0.4,
    retention_days: 1825,
    updated_at: new Date().toISOString(),
    updated_by: 'system'
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filter States
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['SN-MIX-01', 'SN-BOOTH-01', 'SN-OVEN-01']);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Client-Side Hardware Simulator (Controlled by Demo Mode)
  useEffect(() => {
    if (!isDemoMode || !config) return;

    const simSensors = ['SN-MIX-01', 'SN-BOOTH-01', 'SN-OVEN-01'];
    
    const simulatorInterval = setInterval(() => {
      const sensorId = simSensors[Math.floor(Math.random() * simSensors.length)];
      
      let temp = 22.5 + (Math.random() * 2 - 1);
      let rh = 50.0 + (Math.random() * 4 - 2);

      let anomalyDetected = false;
      let anomalyType = '';

      // 15% chance to simulate an anomaly (spike or drop)
      if (Math.random() > 0.85) {
        anomalyDetected = true;
        if (Math.random() > 0.5) {
          // Guarantee temp exceeds 35.0 threshold
          temp = 36.0 + (Math.random() * 10);
          anomalyType = `High Temperature Spike (${temp.toFixed(1)}°C)`;
        } else {
          // Guarantee rh drops below 30.0 threshold
          rh = 15.0 + (Math.random() * 10);
          anomalyType = `Critical Humidity Drop (${rh.toFixed(1)}%)`;
        }
      }

      const newRecord: TelemetryRecord = {
        id: Math.floor(Math.random() * 1000000),
        sensor_id: sensorId,
        temperature_celsius: Math.round(temp * 10) / 10,
        humidity_percent: Math.round(rh * 2) / 2,
        timestamp: new Date().toISOString(),
        record_status: 'valid',
        cqi_value: anomalyDetected ? Math.floor(Math.random() * 30 + 40) : Math.floor(Math.random() * 10 + 90),
        batch_id: 'BATCH-SIM-01'
      };

      setTelemetry(prev => [...prev.slice(-299), newRecord]);

      if (anomalyDetected && (temp > config.temp_alert_high || rh < config.rh_optimal_min - 10)) {
        const newAlert: AlertRecord = {
          id: Math.floor(Math.random() * 1000000),
          alert_type: temp > config.temp_alert_high ? 'Temperature Exceeded' : 'Humidity Out of Bounds',
          severity: 'critical',
          description: anomalyType,
          timestamp: new Date().toISOString(),
          resolution_status: 'active',
          current_value: temp > config.temp_alert_high ? temp : rh,
          threshold_value: temp > config.temp_alert_high ? config.temp_alert_high : (config.rh_optimal_min - 10),
          impact_analysis: 'Simulated Anomaly Impact',
          affected_sensors: [sensorId]
        };
        setAlerts(prev => [newAlert, ...prev]);
        setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'CREATE', affected_resource_id: newAlert.id!.toString(), user_id: 'system', timestamp: new Date().toISOString(), details: anomalyType }, ...prev]);
      }
    }, 2500);

    return () => clearInterval(simulatorInterval);
  }, [isDemoMode, config]);

  // Sensor Handlers
  const handleRegisterSensor = async (sensorData: { sensor_id: string; location_name: string; sensor_type: string }) => {
    const newSensor: SensorNode = {
      ...sensorData,
      sensor_type: sensorData.sensor_type as any,
      status: 'active',
      installation_date: new Date().toISOString(),
      failed_data_count: 0
    };
    setSensors(prev => [...prev, newSensor]);
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'CREATE', affected_resource_id: sensorData.sensor_id, user_id: userRole, timestamp: new Date().toISOString(), details: '' }, ...prev]);
  };

  const handleUpdateSensorStatus = async (sensorId: string, status: string) => {
    setSensors(prev => prev.map(s => s.sensor_id === sensorId ? { ...s, status: status as any } : s));
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'UPDATE', affected_resource_id: sensorId, user_id: userRole, timestamp: new Date().toISOString(), details: `Status set to ${status}` }, ...prev]);
  };

  const handleUpdateSensorLocation = async (sensorId: string, location_name: string) => {
    setSensors(prev => prev.map(s => s.sensor_id === sensorId ? { ...s, location_name } : s));
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'UPDATE', affected_resource_id: sensorId, user_id: userRole, timestamp: new Date().toISOString(), details: `Location set to ${location_name}` }, ...prev]);
  };

  // Alert Handlers
  const handleResolveAlert = async (alertId: number) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolution_status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: userRole } : a));
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'ALERT_ACK', affected_resource_id: alertId.toString(), user_id: userRole, timestamp: new Date().toISOString(), details: '' }, ...prev]);
  };

  // Defect Handlers
  const handleAddDefect = async (defectData: { defect_type: string; severity: string; location_name: string; batch_id?: string; notes?: string }) => {
    const newDefect: CoatingDefectReport = {
      id: Math.floor(Math.random() * 1000000).toString(),
      ...defectData,
      severity: defectData.severity as any,
      timestamp: new Date().toISOString()
    };
    setDefects(prev => [newDefect, ...prev]);
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'CREATE', affected_resource_id: newDefect.id, user_id: userRole, timestamp: new Date().toISOString(), details: `Type: ${defectData.defect_type}` }, ...prev]);
  };

  // Config Handler
  const handleSaveConfig = async (updatedConfig: Partial<SystemConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updatedConfig, updated_at: new Date().toISOString(), updated_by: userRole } : null);
    setAuditLogs(prev => [{ id: Math.floor(Math.random() * 1000000), action_type: 'CONFIG_CHANGE', affected_resource_id: 'system', user_id: userRole, timestamp: new Date().toISOString(), details: '' }, ...prev]);
  };

  const activeAlerts = alerts.filter((a) => a.resolution_status === 'active');
  const latestTelemetry = telemetry[telemetry.length - 1];

  const avgTemp = telemetry.length > 0 ? (telemetry.slice(-10).reduce((acc, t) => acc + t.temperature_celsius, 0) / Math.min(10, telemetry.length)).toFixed(1) : '22.5';
  const avgRh = telemetry.length > 0 ? (telemetry.slice(-10).reduce((acc, t) => acc + t.humidity_percent, 0) / Math.min(10, telemetry.length)).toFixed(1) : '50.0';
  const latestCqi = latestTelemetry?.cqi_value ?? 100;
  const cqiCategory = latestCqi >= 85 ? 'Excellent' : latestCqi >= 70 ? 'Good' : latestCqi >= 55 ? 'Fair' : 'Poor';

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeAlertCount={activeAlerts.length}
      />
      
      <div className="flex flex-col flex-1 min-w-0 bg-muted/10">
        <TopNav
          currentTab={currentTab}
          userRole={userRole}
          setUserRole={setUserRole}
          openExportModal={() => setIsExportOpen(true)}
        />

        <main className="flex-1 p-6 lg:p-8 space-y-6">
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-end gap-3 bg-card p-3 rounded-xl border">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${isDemoMode ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
                <Label htmlFor="demo-mode" className="text-sm font-semibold cursor-pointer">Live Demo Simulator</Label>
              </div>
              <Switch id="demo-mode" checked={isDemoMode} onCheckedChange={setIsDemoMode} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary border">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Active Sensor Nodes</div>
                    <div className="text-xl font-bold font-mono">
                      {sensors.filter((s) => s.status === 'active').length} / {sensors.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Thermometer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Average Temperature</div>
                    <div className="text-xl font-bold font-mono">{avgTemp}°C</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Average Humidity</div>
                    <div className="text-xl font-bold font-mono">{avgRh}% RH</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${activeAlerts.length > 0 ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground font-medium">Active Alerts</div>
                    <div className={`text-xl font-bold font-mono ${activeAlerts.length > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                      {activeAlerts.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <LiveGauge
                title="Paint Shop Ambient Temp"
                value={Number(avgTemp)}
                unit="°C"
                min={-40}
                max={125}
                optimalMin={config?.temp_optimal_min ?? 17.5}
                optimalMax={config?.temp_optimal_max ?? 27.5}
                type="temperature"
                updatedAt={latestTelemetry?.timestamp}
              />

              <LiveGauge
                title="Paint Shop Relative Humidity"
                value={Number(avgRh)}
                unit="%"
                min={0}
                max={100}
                optimalMin={config?.rh_optimal_min ?? 40}
                optimalMax={config?.rh_optimal_max ?? 60}
                type="humidity"
                updatedAt={latestTelemetry?.timestamp}
              />

              <CQICard
                cqiScore={latestCqi}
                category={cqiCategory}
                batchId={latestTelemetry?.batch_id}
                tempWeight={config?.cqi_temp_weight ? Math.round(config.cqi_temp_weight * 100) : 60}
                rhWeight={config?.cqi_rh_weight ? Math.round(config.cqi_rh_weight * 100) : 40}
              />
            </div>

            <TelemetryChart
              data={telemetry}
              sensors={sensors}
              selectedSensors={selectedSensors}
              setSelectedSensors={setSelectedSensors}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              onRefresh={() => {}}
            />
          </div>
        )}

        {currentTab === 'sensors' && (
          <SensorGrid
            sensors={sensors}
            onRegister={handleRegisterSensor}
            onUpdateStatus={handleUpdateSensorStatus}
            onUpdateLocation={handleUpdateSensorLocation}
            userRole={userRole}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertCenter
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
            userRole={userRole}
          />
        )}

        {currentTab === 'cqi' && (
          <DefectCorrelator
            telemetry={telemetry}
            defects={defects}
            onAddDefect={handleAddDefect}
            userRole={userRole}
          />
        )}

        {currentTab === 'config' && (
          <div className="space-y-8">
            <ConfigPanel
              config={config}
              onSaveConfig={handleSaveConfig}
              userRole={userRole}
            />
            <AuditLogs logs={auditLogs} />
          </div>
        )}
        </main>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        userRole={userRole}
      />
    </div>
  );
}
