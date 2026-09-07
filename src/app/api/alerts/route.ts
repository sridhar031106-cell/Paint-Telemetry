import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resolveAlert } from '@/lib/services/alertService';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = 'SELECT * FROM alerts';
    const params: any[] = [];

    if (status) {
      query += ' WHERE resolution_status = ?';
      params.push(status);
    }

    query += ' ORDER BY timestamp DESC LIMIT 200';
    const alerts = db.prepare(query).all(...params).map((a: any) => ({
      ...a,
      affected_sensors: JSON.parse(a.affected_sensors || '[]')
    }));

    return NextResponse.json({ success: true, data: alerts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching alerts' }, { status: 500 });
  }
}

import { z } from 'zod';

const ResolveAlertSchema = z.object({
  alert_id: z.coerce.number(),
  user_id: z.string().optional().default('operator')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ResolveAlertSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { alert_id, user_id } = validation.data;

    const success = resolveAlert(alert_id, user_id);
    if (success) {
      return NextResponse.json({ success: true, message: `Alert ${alert_id} resolved.` });
    } else {
      return NextResponse.json({ error: `Alert ${alert_id} was not active or not found.` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error resolving alert' }, { status: 500 });
  }
}
