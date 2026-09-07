export type SensorType = 'temperature' | 'humidity' | 'combined';
export type SensorStatus = 'active' | 'inactive' | 'maintenance' | 'faulty';
export type RecordStatus = 'valid' | 'invalid' | 'queued';
export type AlertSeverity = 'warning' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'cancelled';
export type CQICategory = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type UserRole = 'operator' | 'engineer' | 'administrator';
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'CONFIG_CHANGE' | 'ALERT_ACK';

export interface TelemetryRecord {
  id?: number;
  sensor_id: string;
  timestamp: string; // ISO 8601
  temperature_celsius: number;
  humidity_percent: number;
  record_status: RecordStatus;
  batch_id?: string;
  cqi_value?: number;
  error_details?: string;
}

export interface SensorNode {
  sensor_id: string;
  location_name: string;
  sensor_type: SensorType;
  installation_date: string;
  status: SensorStatus;
  last_reading_timestamp?: string;
  failed_data_count: number;
  recalibration_flag?: boolean;
}

export interface LocationHistory {
  id?: number;
  sensor_id: string;
  old_location: string;
  new_location: string;
  timestamp: string;
}

export interface AlertRecord {
  id?: number;
  alert_type: string;
  severity: AlertSeverity;
  timestamp: string;
  affected_sensors: string[]; // JSON array stored in DB
  resolution_status: AlertStatus;
  current_value: number;
  threshold_value: number;
  description: string;
  impact_analysis: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CQILog {
  id?: number;
  window_timestamp: string;
  window_minutes: number;
  cqi_score: number;
  category: CQICategory;
  temperature_score: number;
  humidity_score: number;
  avg_temperature: number;
  avg_humidity: number;
  batch_id?: string;
}

export interface CoatingDefectReport {
  id: string;
  timestamp: string;
  defect_type: string;
  severity: 'minor' | 'major' | 'critical';
  location_name: string;
  batch_id?: string;
  notes?: string;
}

export interface UserSession {
  user_id: string;
  username: string;
  role: UserRole;
  token?: string;
  login_timestamp: string;
  last_activity: string;
}

export interface SystemConfig {
  id?: number;
  temp_alert_high: number; // default 35
  temp_alert_low: number;  // default 5
  temp_optimal_min: number; // default 17.5
  temp_optimal_max: number; // default 22.5 - 27.5 center 22.5
  rh_alert_high: number;   // default 75
  rh_alert_low: number;    // default 25
  rh_optimal_min: number;   // default 40
  rh_optimal_max: number;   // default 60
  cqi_temp_weight: number;  // default 60%
  cqi_rh_weight: number;    // default 40%
  retention_days: number;   // default 1825 (5 years)
  updated_at: string;
  updated_by: string;
}

export interface AuditLog {
  id?: number;
  user_id: string;
  timestamp: string;
  action_type: ActionType;
  affected_resource_id: string;
  details?: string;
}

export interface ScheduledReport {
  id: string;
  interval: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  last_run?: string;
  next_run?: string;
  enabled: boolean;
}
