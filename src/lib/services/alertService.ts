import { getDb } from '../db';
import { TelemetryRecord, AlertRecord, AlertSeverity } from '../types';

/**
 * Evaluates telemetry record against operational thresholds and triggers alerts (Requirement 6 & 5.4)
 */
export function checkAndTriggerAlerts(record: TelemetryRecord): AlertRecord[] {
  const db = getDb();
  const triggered: AlertRecord[] = [];
  const timestamp = record.timestamp;
  const sensorId = record.sensor_id;

  // Retrieve current active threshold config
  const config = db.prepare('SELECT * FROM system_config WHERE id = 1').get() as any;
  const tempHighThreshold = config?.temp_alert_high ?? 35.0;
  const tempLowThreshold = config?.temp_alert_low ?? 5.0;
  const rhHighThreshold = config?.rh_alert_high ?? 75.0;
  const rhLowThreshold = config?.rh_alert_low ?? 25.0;

  // 1. High Temperature Alert (>35°C) (Critical)
  if (record.temperature_celsius > tempHighThreshold) {
    const dev = record.temperature_celsius - tempHighThreshold;
    createAlert(db, triggered, {
      alert_type: 'HIGH_TEMPERATURE',
      severity: 'critical',
      timestamp,
      affected_sensors: [sensorId],
      current_value: record.temperature_celsius,
      threshold_value: tempHighThreshold,
      description: `High Temperature Alert: Sensor '${sensorId}' measured ${record.temperature_celsius}°C exceeding high threshold limit of ${tempHighThreshold}°C.`,
      impact_analysis: `High ambient temperature (+${dev.toFixed(1)}°C above limit) causes excessively rapid solvent evaporation, resulting in poor paint leveling, orange peel texture, and reduced pot life.`
    });
  }

  // 2. Low Temperature Alert (<5°C) (Critical)
  if (record.temperature_celsius < tempLowThreshold) {
    const dev = tempLowThreshold - record.temperature_celsius;
    createAlert(db, triggered, {
      alert_type: 'LOW_TEMPERATURE',
      severity: 'critical',
      timestamp,
      affected_sensors: [sensorId],
      current_value: record.temperature_celsius,
      threshold_value: tempLowThreshold,
      description: `Low Temperature Alert: Sensor '${sensorId}' measured ${record.temperature_celsius}°C below low threshold limit of ${tempLowThreshold}°C.`,
      impact_analysis: `Low ambient temperature (-${dev.toFixed(1)}°C below limit) severely delays resin cross-linking, retards drying/curing times, and risks sag/run defects.`
    });
  }

  // 3. High Humidity Alert (>75% RH) (Warning)
  if (record.humidity_percent > rhHighThreshold) {
    const dev = record.humidity_percent - rhHighThreshold;
    createAlert(db, triggered, {
      alert_type: 'HIGH_HUMIDITY',
      severity: 'warning',
      timestamp,
      affected_sensors: [sensorId],
      current_value: record.humidity_percent,
      threshold_value: rhHighThreshold,
      description: `High Humidity Alert: Sensor '${sensorId}' measured ${record.humidity_percent}% RH exceeding limit of ${rhHighThreshold}% RH.`,
      impact_analysis: `Elevated humidity (+${dev.toFixed(1)}% RH above limit) retards waterborne paint evaporation, causes blushing, micro-popping, and compromises interfacial adhesion.`
    });
  }

  // 4. Low Humidity Alert (<25% RH) (Warning)
  if (record.humidity_percent < rhLowThreshold) {
    const dev = rhLowThreshold - record.humidity_percent;
    createAlert(db, triggered, {
      alert_type: 'LOW_HUMIDITY',
      severity: 'warning',
      timestamp,
      affected_sensors: [sensorId],
      current_value: record.humidity_percent,
      threshold_value: rhLowThreshold,
      description: `Low Humidity Alert: Sensor '${sensorId}' measured ${record.humidity_percent}% RH below minimum limit of ${rhLowThreshold}% RH.`,
      impact_analysis: `Dry air (-${dev.toFixed(1)}% RH below limit) induces electrostatic charge buildup, dry spray dust inclusion, and reduced coating transfer efficiency.`
    });
  }

  // 5. CQI Failure / Warning (Req 5.4 & 6.5)
  if (record.cqi_value !== undefined) {
    if (record.cqi_value < 55) {
      createAlert(db, triggered, {
        alert_type: 'QUALITY_FAILURE',
        severity: 'critical',
        timestamp,
        affected_sensors: [sensorId],
        current_value: record.cqi_value,
        threshold_value: 55,
        description: `Quality Failure Critical Alert: Coating Quality Index (CQI) dropped to ${record.cqi_value} (below critical threshold of 55).`,
        impact_analysis: `Environmental metrics are out of process tolerance. High probability of coating defects, gloss reduction, or adhesion failure.`
      });
    } else if (record.cqi_value < 70) {
      createAlert(db, triggered, {
        alert_type: 'QUALITY_WARNING',
        severity: 'warning',
        timestamp,
        affected_sensors: [sensorId],
        current_value: record.cqi_value,
        threshold_value: 70,
        description: `Quality Warning Alert: Coating Quality Index (CQI) dropped to ${record.cqi_value} (below target threshold of 70).`,
        impact_analysis: `Sub-optimal environmental conditions detected. Process monitoring advised to prevent paint batch degradation.`
      });
    }
  }

  return triggered;
}

function createAlert(
  db: any,
  triggeredList: AlertRecord[],
  alertData: {
    alert_type: string;
    severity: AlertSeverity;
    timestamp: string;
    affected_sensors: string[];
    current_value: number;
    threshold_value: number;
    description: string;
    impact_analysis: string;
  }
) {
  // Check if an identical active alert already exists for this sensor & alert_type to prevent duplicate alert spam
  const existing = db.prepare(`
    SELECT id FROM alerts 
    WHERE alert_type = ? 
      AND resolution_status = 'active' 
      AND affected_sensors LIKE ?
  `).get(alertData.alert_type, `%${alertData.affected_sensors[0]}%`);

  if (!existing) {
    const insertStmt = db.prepare(`
      INSERT INTO alerts (alert_type, severity, timestamp, affected_sensors, resolution_status, current_value, threshold_value, description, impact_analysis)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      alertData.alert_type,
      alertData.severity,
      alertData.timestamp,
      JSON.stringify(alertData.affected_sensors),
      alertData.current_value,
      alertData.threshold_value,
      alertData.description,
      alertData.impact_analysis
    );

    triggeredList.push({
      id: Number(info.lastInsertRowid),
      alert_type: alertData.alert_type,
      severity: alertData.severity,
      timestamp: alertData.timestamp,
      affected_sensors: alertData.affected_sensors,
      resolution_status: 'active',
      current_value: alertData.current_value,
      threshold_value: alertData.threshold_value,
      description: alertData.description,
      impact_analysis: alertData.impact_analysis
    });
  }
}

/**
 * Resolves an active alert with user audit (Requirement 6.6)
 */
export function resolveAlert(alertId: number, resolvedBy: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const res = db.prepare(`
    UPDATE alerts 
    SET resolution_status = 'resolved', resolved_at = ?, resolved_by = ?
    WHERE id = ? AND resolution_status = 'active'
  `).run(now, resolvedBy, alertId);

  if (res.changes > 0) {
    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(resolvedBy, now, 'ALERT_ACK', String(alertId), `Resolved alert ID ${alertId}`);
    return true;
  }
  return false;
}
