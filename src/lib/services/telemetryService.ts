import { getDb } from '../db';
import { TelemetryRecord, SensorNode, RecordStatus } from '../types';
import { calculateCQI } from '../utils/cqiCalculator';
import { checkAndTriggerAlerts } from './alertService';

// In-memory cache for telemetry records during DB disconnect fallback (max 10,000)
const memoryCacheBuffer: TelemetryRecord[] = [];
const MAX_MEMORY_CACHE = 10000;

export interface IngestResult {
  success: boolean;
  status: RecordStatus;
  message?: string;
  telemetry?: TelemetryRecord;
}

/**
 * Validates and ingests incoming telemetry data from sensor nodes (Requirement 1 & 2)
 */
export function ingestTelemetry(input: {
  sensor_id: string;
  temperature_celsius: number;
  humidity_percent: number;
  batch_id?: string;
  timestamp?: string;
}): IngestResult {
  const db = getDb();
  const receivedTimestamp = input.timestamp || new Date().toISOString();

  // 1. Verify sensor node exists and is active (Req 1.4 & 3.3)
  const sensor = db.prepare('SELECT * FROM sensor_nodes WHERE sensor_id = ?').get(input.sensor_id) as SensorNode | undefined;
  
  if (!sensor) {
    return {
      success: false,
      status: 'invalid',
      message: `Sensor ID '${input.sensor_id}' is not registered.`
    };
  }

  if (sensor.status !== 'active') {
    db.prepare('UPDATE sensor_nodes SET failed_data_count = failed_data_count + 1 WHERE sensor_id = ?').run(input.sensor_id);
    
    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run('system', receivedTimestamp, 'UPDATE', input.sensor_id, `Rejected data transmission: Sensor status is '${sensor.status}'`);

    return {
      success: false,
      status: 'invalid',
      message: `Sensor '${input.sensor_id}' is not active (current status: ${sensor.status}).`
    };
  }

  // 2. Validate value ranges: Temp -40 to +125°C, RH 0 to 100% (Req 1.1, 1.2, 9.6)
  const isTempValid = input.temperature_celsius >= -40.0 && input.temperature_celsius <= 125.0;
  const isRhValid = input.humidity_percent >= 0.0 && input.humidity_percent <= 100.0;

  if (!isTempValid || !isRhValid) {
    const errorDetails = `Out-of-range value detected: Temp=${input.temperature_celsius}°C (valid: -40 to +125), RH=${input.humidity_percent}% (valid: 0 to 100).`;
    
    db.prepare('UPDATE sensor_nodes SET failed_data_count = failed_data_count + 1 WHERE sensor_id = ?').run(input.sensor_id);
    
    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run('system', receivedTimestamp, 'CREATE', input.sensor_id, `Data rejection: ${errorDetails}`);

    return {
      success: false,
      status: 'invalid',
      message: errorDetails
    };
  }

  // 3. Round values to required resolution (Req 1.1: 0.1°C, Req 1.2: 0.5% RH)
  const tempRounded = Math.round(input.temperature_celsius * 10) / 10;
  const rhRounded = Math.round(input.humidity_percent * 2) / 2;

  // 4. Check for duplicate telemetry (same timestamp ±1 second tolerance and identical values) (Req 2.6)
  const receivedMs = new Date(receivedTimestamp).getTime();
  const lowerBoundTs = new Date(receivedMs - 1000).toISOString();
  const upperBoundTs = new Date(receivedMs + 1000).toISOString();

  const duplicate = db.prepare(`
    SELECT id FROM telemetry_records 
    WHERE sensor_id = ? 
      AND timestamp >= ? 
      AND timestamp <= ? 
      AND temperature_celsius = ? 
      AND humidity_percent = ?
  `).get(input.sensor_id, lowerBoundTs, upperBoundTs, tempRounded, rhRounded);

  if (duplicate) {
    return {
      success: true,
      status: 'valid',
      message: 'Duplicate reading ignored.'
    };
  }

  // 5. Compute CQI (Req 5)
  const cqiRes = calculateCQI(tempRounded, rhRounded);

  // 6. Insert telemetry record into DB
  try {
    const insertStmt = db.prepare(`
      INSERT INTO telemetry_records (sensor_id, timestamp, temperature_celsius, humidity_percent, record_status, batch_id, cqi_value)
      VALUES (?, ?, ?, ?, 'valid', ?, ?)
    `);
    
    const info = insertStmt.run(input.sensor_id, receivedTimestamp, tempRounded, rhRounded, input.batch_id || null, cqiRes.cqi);

    db.prepare('UPDATE sensor_nodes SET last_reading_timestamp = ? WHERE sensor_id = ?').run(receivedTimestamp, input.sensor_id);

    const record: TelemetryRecord = {
      id: Number(info.lastInsertRowid),
      sensor_id: input.sensor_id,
      timestamp: receivedTimestamp,
      temperature_celsius: tempRounded,
      humidity_percent: rhRounded,
      record_status: 'valid',
      batch_id: input.batch_id,
      cqi_value: cqiRes.cqi
    };

    // 7. Check for alert conditions (Req 6 & Req 5.4)
    checkAndTriggerAlerts(record);

    return {
      success: true,
      status: 'valid',
      telemetry: record
    };
  } catch {
    if (memoryCacheBuffer.length < MAX_MEMORY_CACHE) {
      memoryCacheBuffer.push({
        sensor_id: input.sensor_id,
        timestamp: receivedTimestamp,
        temperature_celsius: tempRounded,
        humidity_percent: rhRounded,
        record_status: 'queued',
        batch_id: input.batch_id,
        cqi_value: cqiRes.cqi
      });
    }

    return {
      success: false,
      status: 'queued',
      message: `Database connection error. Telemetry cached in memory buffer (${memoryCacheBuffer.length} items).`
    };
  }
}

/**
 * Time-series query for historical telemetry data (Requirement 2.4)
 */
export function queryTelemetryHistory(params: {
  sensor_ids?: string[];
  start_time?: string;
  end_time?: string;
  batch_id?: string;
  limit?: number;
}): TelemetryRecord[] {
  const db = getDb();
  let query = "SELECT * FROM telemetry_records WHERE record_status = 'valid'";
  const queryParams: any[] = [];

  if (params.sensor_ids && params.sensor_ids.length > 0) {
    const placeholders = params.sensor_ids.map(() => '?').join(',');
    query += ` AND sensor_id IN (${placeholders})`;
    queryParams.push(...params.sensor_ids);
  }

  if (params.start_time) {
    query += ' AND timestamp >= ?';
    queryParams.push(params.start_time);
  }

  if (params.end_time) {
    query += ' AND timestamp <= ?';
    queryParams.push(params.end_time);
  }

  if (params.batch_id) {
    query += ' AND batch_id = ?';
    queryParams.push(params.batch_id);
  }

  query += ' ORDER BY timestamp ASC';
  if (params.limit) {
    query += ' LIMIT ?';
    queryParams.push(params.limit);
  }

  return db.prepare(query).all(...queryParams) as TelemetryRecord[];
}

/**
 * Retains telemetry up to configurable retention period (Req 10.4 & 2.1)
 */
export function purgeExpiredTelemetry(retentionDays: number = 1825): number {
  const db = getDb();
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const res = db.prepare('DELETE FROM telemetry_records WHERE timestamp < ?').run(cutoffDate);
  return res.changes;
}
