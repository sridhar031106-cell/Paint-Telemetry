import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const config = db.prepare('SELECT * FROM system_config WHERE id = 1').get();
    return NextResponse.json({ success: true, data: config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching system config' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const userId = body.user_id || 'administrator';
    const now = new Date().toISOString();

    const currentConfig = db.prepare('SELECT * FROM system_config WHERE id = 1').get() as any;

    // CQI Weight Validation (Req 10.3)
    const tempWeight = body.cqi_temp_weight !== undefined ? Number(body.cqi_temp_weight) : currentConfig.cqi_temp_weight;
    const rhWeight = body.cqi_rh_weight !== undefined ? Number(body.cqi_rh_weight) : currentConfig.cqi_rh_weight;

    const sum = Math.round((tempWeight + rhWeight) * 100);
    if (sum !== 100) {
      return NextResponse.json({
        error: `Invalid CQI weighting factors: Temperature weight (${tempWeight * 100}%) and Humidity weight (${rhWeight * 100}%) must sum to exactly 100%. (Current sum: ${sum}%)`
      }, { status: 400 });
    }

    // Threshold Boundary Validations (Req 10.1 & 10.2)
    const tempHigh = body.temp_alert_high !== undefined ? Number(body.temp_alert_high) : currentConfig.temp_alert_high;
    const tempLow = body.temp_alert_low !== undefined ? Number(body.temp_alert_low) : currentConfig.temp_alert_low;
    const rhHigh = body.rh_alert_high !== undefined ? Number(body.rh_alert_high) : currentConfig.rh_alert_high;
    const rhLow = body.rh_alert_low !== undefined ? Number(body.rh_alert_low) : currentConfig.rh_alert_low;
    const retentionDays = body.retention_days !== undefined ? Number(body.retention_days) : currentConfig.retention_days;

    if (tempHigh < 25.0 || tempHigh > 125.0) {
      return NextResponse.json({ error: 'High temperature alert threshold must be between 25°C and 125°C.' }, { status: 400 });
    }
    if (tempLow < -40.0 || tempLow > 15.0) {
      return NextResponse.json({ error: 'Low temperature alert threshold must be between -40°C and 15°C.' }, { status: 400 });
    }
    if (rhHigh < 50.0 || rhHigh > 100.0) {
      return NextResponse.json({ error: 'High humidity alert threshold must be between 50% and 100% RH.' }, { status: 400 });
    }
    if (rhLow < 0.0 || rhLow > 50.0) {
      return NextResponse.json({ error: 'Low humidity alert threshold must be between 0% and 50% RH.' }, { status: 400 });
    }
    if (retentionDays < 180 || retentionDays > 3650) {
      return NextResponse.json({ error: 'Data retention period must be between 180 days (6 months) and 3,650 days (10 years).' }, { status: 400 });
    }

    // Update config
    db.prepare(`
      UPDATE system_config
      SET temp_alert_high = ?, temp_alert_low = ?, rh_alert_high = ?, rh_alert_low = ?,
          cqi_temp_weight = ?, cqi_rh_weight = ?, retention_days = ?, updated_at = ?, updated_by = ?
      WHERE id = 1
    `).run(tempHigh, tempLow, rhHigh, rhLow, tempWeight, rhWeight, retentionDays, now, userId);

    // Audit changes (Req 10.6)
    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, now, 'CONFIG_CHANGE', 'SYSTEM_CONFIG', `Updated thresholds: Temp [${tempLow}°C - ${tempHigh}°C], RH [${rhLow}% - ${rhHigh}%], CQI Weights [T:${tempWeight * 100}%, RH:${rhWeight * 100}%]`);

    const updatedConfig = db.prepare('SELECT * FROM system_config WHERE id = 1').get();
    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating system config' }, { status: 500 });
  }
}
