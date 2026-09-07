'use client';

import React, { useState } from 'react';
import { Cpu, Plus, MapPin, ShieldAlert } from 'lucide-react';
import { SensorNode, SensorStatus, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface SensorGridProps {
  sensors: SensorNode[];
  onRegister: (data: { sensor_id: string; location_name: string; sensor_type: any }) => void;
  onUpdateStatus: (sensorId: string, status: SensorStatus) => void;
  onUpdateLocation: (sensorId: string, newLocation: string) => void;
  userRole: UserRole;
}

export function SensorGrid({
  sensors,
  onRegister,
  onUpdateStatus,
  onUpdateLocation,
  userRole
}: SensorGridProps) {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newSensorId, setNewSensorId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('combined');

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');

  const canEdit = userRole === 'administrator' || userRole === 'engineer';

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSensorId || !newLocation) return;
    onRegister({
      sensor_id: newSensorId.trim(),
      location_name: newLocation.trim(),
      sensor_type: newType
    });
    setNewSensorId('');
    setNewLocation('');
    setShowRegisterModal(false);
  };

  const handleLocationSubmit = (sensorId: string) => {
    if (!locationInput.trim()) return;
    onUpdateLocation(sensorId, locationInput.trim());
    setEditingLocationId(null);
    setLocationInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span>Industrial Sensor Node Management</span>
          </h2>
          <p className="text-xs text-muted-foreground">Register, configure location tracking, and manage operational node statuses</p>
        </div>

        {canEdit && (
          <Button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>Register New Sensor</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sensors.map((sensor) => {
          let statusBadge = <Badge variant="default">Active</Badge>;

          if (sensor.status === 'inactive') {
            statusBadge = <Badge variant="secondary">Inactive</Badge>;
          } else if (sensor.status === 'maintenance') {
            statusBadge = <Badge variant="outline">Maintenance</Badge>;
          } else if (sensor.status === 'faulty') {
            statusBadge = <Badge variant="destructive">Faulty</Badge>;
          }

          return (
            <Card key={sensor.sensor_id} className="flex flex-col justify-between">
              <CardHeader className="p-5 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-primary font-semibold">{sensor.sensor_id}</span>
                    <CardTitle className="text-base flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{sensor.location_name}</span>
                    </CardTitle>
                  </div>
                  {statusBadge}
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                <div>
                  <div className="space-y-1.5 text-xs text-foreground bg-muted/60 rounded-md p-3 border mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sensor Type:</span>
                      <span className="capitalize font-semibold">{sensor.sensor_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Installed Date:</span>
                      <span className="font-mono">{new Date(sensor.installation_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failed Packet Count:</span>
                      <span className={`font-mono font-bold ${sensor.failed_data_count > 0 ? 'text-destructive' : ''}`}>
                        {sensor.failed_data_count}
                      </span>
                    </div>
                    {sensor.last_reading_timestamp && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Telemetry:</span>
                        <span className="font-mono text-muted-foreground">{new Date(sensor.last_reading_timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {sensor.recalibration_flag && (
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium mb-4">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>Recalibration required! Last 24h data flagged for audit review.</span>
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="border-t pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Set Status:</span>
                      <Select
                        value={sensor.status}
                        onValueChange={(val) => onUpdateStatus(sensor.sensor_id, val as SensorStatus)}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="faulty">Faulty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingLocationId === sensor.sensor_id ? (
                      <div className="flex gap-1.5 mt-1">
                        <Input
                          type="text"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          placeholder="New Location..."
                          className="flex-1 h-8 text-xs"
                        />
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleLocationSubmit(sensor.sensor_id)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingLocationId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setEditingLocationId(sensor.sensor_id);
                          setLocationInput(sensor.location_name);
                        }}
                        className="text-xs text-primary p-0 h-auto flex items-center gap-1 self-start"
                      >
                        <MapPin className="h-3 w-3" />
                        <span>Update Location...</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Sensor Node</DialogTitle>
            <DialogDescription>Deploy a new physical or virtual telemetry sensor node</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <Label className="mb-1 block">Sensor Node ID *</Label>
              <Input
                type="text"
                required
                placeholder="e.g. SN-BOOTH-03"
                value={newSensorId}
                onChange={(e) => setNewSensorId(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block">Location Name *</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Mixing Bay Beta"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block">Sensor Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined (Temp + Humidity)</SelectItem>
                  <SelectItem value="temperature">Temperature Only</SelectItem>
                  <SelectItem value="humidity">Humidity Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="ghost" onClick={() => setShowRegisterModal(false)}>Cancel</Button>
              <Button type="submit">Complete Registration</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
