import { getDb } from '../db';
import { queryTelemetryHistory } from './telemetryService';

export interface CSVExportOptions {
  start_time?: string;
  end_time?: string;
  sensor_ids?: string[];
  user_id: string;
}

export function generateCSVExport(options: CSVExportOptions): { csv: string; rowCount: number } {
  const db = getDb();
  const now = new Date().toISOString();

  // Date range validation (Req 7.2)
  if (options.start_time && options.end_time) {
    const startMs = new Date(options.start_time).getTime();
    const endMs = new Date(options.end_time).getTime();
    if (startMs >= endMs) {
      throw new Error('Invalid date range: Start date must be earlier than end date.');
    }
    const maxOneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (endMs - startMs > maxOneYearMs) {
      throw new Error('Date range exceeds maximum limit of 1 year (365 days).');
    }
  }

  const records = queryTelemetryHistory({
    sensor_ids: options.sensor_ids,
    start_time: options.start_time,
    end_time: options.end_time,
    limit: 10001 // Fetch 1 extra to test 10k max limit
  });

  if (records.length > 10000) {
    throw new Error('Export request exceeds maximum allowed limit of 10,000 rows. Please narrow your date range or filter by sensor.');
  }

  // Generate CSV Header & Lines (Req 7.1 & 7.6)
  const lines: string[] = [];
  lines.push('timestamp,sensor_id,temperature_celsius,humidity_percent,cqi');

  records.forEach(r => {
    const tempStr = r.temperature_celsius.toFixed(1);
    const rhStr = r.humidity_percent.toFixed(1);
    const cqiStr = r.cqi_value !== undefined ? r.cqi_value.toFixed(0) : 'N/A';
    lines.push(`${r.timestamp},${r.sensor_id},${tempStr},${rhStr},${cqiStr}`);
  });

  // Log Audit metadata (Req 7.5 & 7.9)
  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(options.user_id, now, 'EXPORT', 'CSV_EXPORT', `Exported ${records.length} rows. Extraction TS: ${now}`);

  return {
    csv: lines.join('\n'),
    rowCount: records.length
  };
}

export function generatePDFReportSummary(options: {
  start_time?: string;
  end_time?: string;
  user_id: string;
}): any {
  const db = getDb();
  const extractionTs = new Date().toISOString();

  const records = queryTelemetryHistory({
    start_time: options.start_time,
    end_time: options.end_time,
    limit: 10000
  });

  let totalTemp = 0;
  let totalRh = 0;
  let totalCqi = 0;
  let validCqiCount = 0;

  records.forEach(r => {
    totalTemp += r.temperature_celsius;
    totalRh += r.humidity_percent;
    if (r.cqi_value !== undefined) {
      totalCqi += r.cqi_value;
      validCqiCount++;
    }
  });

  const count = records.length || 1;
  const avgTemp = (totalTemp / count).toFixed(2);
  const avgRh = (totalRh / count).toFixed(2);
  const avgCqi = validCqiCount > 0 ? (totalCqi / validCqiCount).toFixed(1) : 'N/A';

  // Audit metadata (Req 7.5, 7.9)
  const auditMetadata = {
    export_timestamp: extractionTs,
    data_extraction_timestamp: extractionTs,
    user_id: options.user_id,
    report_type: 'EXECUTIVE_QUALITY_SUMMARY'
  };

  db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(options.user_id, extractionTs, 'EXPORT', 'PDF_REPORT', `Generated PDF summary report. Records: ${records.length}`);

  return {
    summary: {
      total_records: records.length,
      avg_temperature_celsius: avgTemp,
      avg_humidity_percent: avgRh,
      avg_cqi: avgCqi,
      period_start: options.start_time || 'Earliest available',
      period_end: options.end_time || 'Latest available'
    },
    audit_metadata: auditMetadata,
    sample_records: records.slice(0, 50)
  };
}
