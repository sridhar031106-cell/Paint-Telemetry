import Database from 'libsql';
import path from 'path';
import fs from 'fs';
import { calculateCQI } from './utils/cqiCalculator';

const dbPath = path.join(process.cwd(), 'data', 'paintshop.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    initTables(dbInstance);
    seedInitialData(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sensor_nodes (
      sensor_id TEXT PRIMARY KEY,
      location_name TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      installation_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_reading_timestamp TEXT,
      failed_data_count INTEGER DEFAULT 0,
      recalibration_flag INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS location_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      old_location TEXT NOT NULL,
      new_location TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telemetry_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      temperature_celsius REAL NOT NULL,
      humidity_percent REAL NOT NULL,
      record_status TEXT NOT NULL DEFAULT 'valid',
      batch_id TEXT,
      cqi_value INTEGER,
      error_details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_telemetry_sensor_ts ON telemetry_records(sensor_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_telemetry_ts ON telemetry_records(timestamp);
    CREATE INDEX IF NOT EXISTS idx_telemetry_batch ON telemetry_records(batch_id);

    CREATE TABLE IF NOT EXISTS telemetry_aggregates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      interval_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      avg_temp REAL NOT NULL,
      avg_humidity REAL NOT NULL,
      reading_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      affected_sensors TEXT NOT NULL,
      resolution_status TEXT NOT NULL DEFAULT 'active',
      current_value REAL NOT NULL,
      threshold_value REAL NOT NULL,
      description TEXT NOT NULL,
      impact_analysis TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS cqi_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      window_timestamp TEXT NOT NULL,
      window_minutes INTEGER DEFAULT 15,
      cqi_score INTEGER NOT NULL,
      category TEXT NOT NULL,
      temperature_score REAL NOT NULL,
      humidity_score REAL NOT NULL,
      avg_temperature REAL NOT NULL,
      avg_humidity REAL NOT NULL,
      batch_id TEXT
    );

    CREATE TABLE IF NOT EXISTS coating_defects (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      defect_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      location_name TEXT NOT NULL,
      batch_id TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      action_type TEXT NOT NULL,
      affected_resource_id TEXT NOT NULL,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS system_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      temp_alert_high REAL DEFAULT 35.0,
      temp_alert_low REAL DEFAULT 5.0,
      temp_optimal_min REAL DEFAULT 17.5,
      temp_optimal_max REAL DEFAULT 27.5,
      rh_alert_high REAL DEFAULT 75.0,
      rh_alert_low REAL DEFAULT 25.0,
      rh_optimal_min REAL DEFAULT 40.0,
      rh_optimal_max REAL DEFAULT 60.0,
      cqi_temp_weight REAL DEFAULT 0.60,
      cqi_rh_weight REAL DEFAULT 0.40,
      retention_days INTEGER DEFAULT 1825,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );
  `);
}

function seedInitialData(db: Database.Database) {
  // Seed Config if not present
  const configCount = (db.prepare('SELECT COUNT(*) as cnt FROM system_config').get() as any).cnt;
  if (configCount === 0) {
    db.prepare(`
      INSERT INTO system_config (id, temp_alert_high, temp_alert_low, temp_optimal_min, temp_optimal_max, rh_alert_high, rh_alert_low, rh_optimal_min, rh_optimal_max, cqi_temp_weight, cqi_rh_weight, retention_days, updated_at, updated_by)
      VALUES (1, 35.0, 5.0, 17.5, 27.5, 75.0, 25.0, 40.0, 60.0, 0.60, 0.40, 1825, ?, 'system')
    `).run(new Date().toISOString());
  }

  // Seed Users
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  if (userCount === 0) {
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', 'admin123', 'administrator');
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('engineer', 'eng123', 'engineer');
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('operator', 'op123', 'operator');
  }

  // Seed Sensors
  const sensorCount = (db.prepare('SELECT COUNT(*) as cnt FROM sensor_nodes').get() as any).cnt;
  if (sensorCount === 0) {
    const now = new Date().toISOString();
    const insertSensor = db.prepare('INSERT INTO sensor_nodes (sensor_id, location_name, sensor_type, installation_date, status, last_reading_timestamp) VALUES (?, ?, ?, ?, ?, ?)');
    insertSensor.run('SN-MIX-01', 'Mixing Bay Alpha', 'combined', '2024-01-15T08:00:00Z', 'active', now);
    insertSensor.run('SN-BOOTH-01', 'Spray Booth 1', 'combined', '2024-01-15T08:30:00Z', 'active', now);
    insertSensor.run('SN-OVEN-01', 'Drying Oven C', 'combined', '2024-01-16T10:00:00Z', 'active', now);
    insertSensor.run('SN-BOOTH-02', 'Spray Booth 2', 'combined', '2024-02-01T09:00:00Z', 'maintenance', now);

    // Seed 24 hours of realistic telemetry history for demo charts
    const insertTelemetry = db.prepare('INSERT INTO telemetry_records (sensor_id, timestamp, temperature_celsius, humidity_percent, record_status, batch_id, cqi_value) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const nowMs = Date.now();
    const sensors = ['SN-MIX-01', 'SN-BOOTH-01', 'SN-OVEN-01'];
    
    // Generate data points every 15 minutes for past 24 hours
    for (let i = 96; i >= 0; i--) {
      const ts = new Date(nowMs - i * 15 * 60 * 1000).toISOString();
      const batchId = i > 40 && i < 70 ? 'BATCH-2026-09A' : undefined;

      sensors.forEach((sId, idx) => {
        const baseTemp = 22.0 + idx * 0.8 + (Math.random() * 2 - 1);
        const baseRh = 49.0 + idx * 1.5 + (Math.random() * 4 - 2);
        const cqiRes = calculateCQI(baseTemp, baseRh);

        insertTelemetry.run(sId, ts, Math.round(baseTemp * 10) / 10, Math.round(baseRh * 10) / 10, 'valid', batchId, cqiRes.cqi);
      });
    }

    // Seed sample defect reports
    const insertDefect = db.prepare('INSERT INTO coating_defects (id, timestamp, defect_type, severity, location_name, batch_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertDefect.run('DEF-101', new Date(nowMs - 12 * 3600 * 1000).toISOString(), 'Orange Peel Finish', 'minor', 'Spray Booth 1', 'BATCH-2026-09A', 'Minor texture roughness due to 2% RH shift');
    insertDefect.run('DEF-102', new Date(nowMs - 4 * 3600 * 1000).toISOString(), 'Blistering', 'major', 'Drying Oven C', 'BATCH-2026-09A', 'Curing temp spiked during drying cycle');
  }
}
