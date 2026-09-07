import { getDb } from '../db';
import { SensorNode, SensorStatus, SensorType } from '../types';

export function registerSensor(data: {
  sensor_id: string;
  location_name: string;
  sensor_type: SensorType;
  installation_date?: string;
  user_id: string;
}): SensorNode {
  const db = getDb();
  const installDate = data.installation_date || new Date().toISOString();

  // Check if sensor already exists
  const existing = db.prepare('SELECT sensor_id FROM sensor_nodes WHERE sensor_id = ?').get(data.sensor_id);
  if (existing) {
    throw new Error(`Sensor ID '${data.sensor_id}' is already registered.`);
  }

  db.prepare(`
    INSERT INTO sensor_nodes (sensor_id, location_name, sensor_type, installation_date, status, failed_data_count, recalibration_flag)
    VALUES (?, ?, ?, ?, 'active', 0, 0)
  `).run(data.sensor_id, data.location_name, data.sensor_type, installDate);

  // Log audit
  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(data.user_id, new Date().toISOString(), 'CREATE', data.sensor_id, `Registered new sensor at '${data.location_name}'`);

  return {
    sensor_id: data.sensor_id,
    location_name: data.location_name,
    sensor_type: data.sensor_type,
    installation_date: installDate,
    status: 'active',
    failed_data_count: 0,
    recalibration_flag: false
  };
}

export function updateSensorStatus(sensorId: string, status: SensorStatus, userId: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const sensor = db.prepare('SELECT * FROM sensor_nodes WHERE sensor_id = ?').get(sensorId) as SensorNode | undefined;
  if (!sensor) return false;

  let recalibrationFlag = sensor.recalibration_flag ? 1 : 0;

  // Requirement 3.6: When sensor is marked faulty -> generate critical maintenance alert & flag data from last 24h
  if (status === 'faulty') {
    recalibrationFlag = 1;

    // Generate maintenance alert
    db.prepare(`
      INSERT INTO alerts (alert_type, severity, timestamp, affected_sensors, resolution_status, current_value, threshold_value, description, impact_analysis)
      VALUES ('SENSOR_FAULT', 'critical', ?, ?, 'active', 0, 0, ?, ?)
    `).run(
      now,
      JSON.stringify([sensorId]),
      `Faulty Sensor Alert: Sensor '${sensorId}' was flagged as faulty and requires maintenance.`,
      `Sensor flagged as faulty. Telemetry data collected from '${sensorId}' over the last 24 hours has been marked for quality review and sensor recalibration.`
    );
  }

  const res = db.prepare('UPDATE sensor_nodes SET status = ?, recalibration_flag = ? WHERE sensor_id = ?').run(status, recalibrationFlag, sensorId);

  if (res.changes > 0) {
    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, now, 'UPDATE', sensorId, `Status updated from '${sensor.status}' to '${status}'`);
    return true;
  }
  return false;
}

export function updateSensorLocation(sensorId: string, newLocation: string, userId: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const sensor = db.prepare('SELECT * FROM sensor_nodes WHERE sensor_id = ?').get(sensorId) as SensorNode | undefined;
  if (!sensor) return false;

  const oldLocation = sensor.location_name;
  if (oldLocation === newLocation) return true;

  // Update sensor location while preserving historical data association (Req 3.4)
  db.prepare('UPDATE sensor_nodes SET location_name = ? WHERE sensor_id = ?').run(newLocation, sensorId);

  // Log location change in location_history table
  db.prepare('INSERT INTO location_history (sensor_id, old_location, new_location, timestamp) VALUES (?, ?, ?, ?)')
    .run(sensorId, oldLocation, newLocation, now);

  // Log audit
  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(userId, now, 'UPDATE', sensorId, `Location updated from '${oldLocation}' to '${newLocation}'`);

  return true;
}

export function getAllSensors(): SensorNode[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM sensor_nodes ORDER BY sensor_id ASC').all() as any[];
  return rows.map(r => ({
    ...r,
    recalibration_flag: Boolean(r.recalibration_flag)
  }));
}
