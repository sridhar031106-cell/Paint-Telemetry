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
import { TelemetrySimulator } from '@/components/TelemetrySimulator';
import { UserRole, TelemetryRecord, SensorNode, AlertRecord, SystemConfig, CoatingDefectReport, AuditLog } from '@/lib/types';
import { ShieldAlert, Cpu, Thermometer, Droplets } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('operator');

  // Application Data States
  const [sensors, setSensors] = useState<SensorNode[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [defects, setDefects] = useState<CoatingDefectReport[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filter States
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['SN-MIX-01', 'SN-BOOTH-01', 'SN-OVEN-01']);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      // Fetch Sensors
      const sensorsRes = await fetch('/api/sensors');
      const sensorsJson = await sensorsRes.json();
      if (sensorsJson.success) setSensors(sensorsJson.data);

      // Fetch Telemetry History
      const telemetryRes = await fetch(`/api/telemetry?sensors=${selectedSensors.join(',')}&limit=500`);
      const telemetryJson = await telemetryRes.json();
      if (telemetryJson.success) setTelemetry(telemetryJson.data);

      // Fetch Alerts
      const alertsRes = await fetch('/api/alerts');
      const alertsJson = await alertsRes.json();
      if (alertsJson.success) setAlerts(alertsJson.data);

      // Fetch Defects
      const defectsRes = await fetch('/api/defects');
      const defectsJson = await defectsRes.json();
      if (defectsJson.success) setDefects(defectsJson.data);

      // Fetch Config
      const configRes = await fetch('/api/config');
      const configJson = await configRes.json();
      if (configJson.success) setConfig(configJson.data);

      // Fetch Audit Logs
      const auditRes = await fetch('/api/audit');
      const auditJson = await auditRes.json();
      if (auditJson.success) setAuditLogs(auditJson.data);
    } catch (err) {
      console.error('Error loading telemetry data:', err);
    }
  };

  // Setup auto-refresh polling for real-time dashboard feel
  useEffect(() => {
    fetchData(); // initial fetch
    const intervalId = setInterval(() => {
      fetchData();
    }, 3000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSensors]);

  // Sensor Handlers
  const handleRegisterSensor = async (sensorData: { sensor_id: string; location_name: string; sensor_type: string }) => {
    try {
      const res = await fetch('/api/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sensorData, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error registering sensor:', err);
    }
  };

  const handleUpdateSensorStatus = async (sensorId: string, status: string) => {
    try {
      const res = await fetch('/api/sensors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor_id: sensorId, status, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error updating sensor status:', err);
    }
  };

  const handleUpdateSensorLocation = async (sensorId: string, location_name: string) => {
    try {
      const res = await fetch('/api/sensors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensor_id: sensorId, location_name, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error updating sensor location:', err);
    }
  };

  // Alert Handlers
  const handleResolveAlert = async (alertId: number) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Defect Handlers
  const handleAddDefect = async (defectData: { defect_type: string; severity: string; location_name: string; batch_id?: string; notes?: string }) => {
    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...defectData, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error adding defect report:', err);
    }
  };

  // Config Handler
  const handleSaveConfig = async (updatedConfig: Partial<SystemConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedConfig, user_id: userRole })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  // Simulator Ingestion Handler
  const handleIngestTelemetry = useCallback(async (data: { sensor_id: string; temperature_celsius: number; humidity_percent: number; batch_id?: string }) => {
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      fetchData();
    } catch (err) {
      console.error('Error ingesting live telemetry:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <TelemetrySimulator 
              sensors={sensors} 
              onIngestTelemetry={handleIngestTelemetry} 
            />

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
              onRefresh={fetchData}
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
