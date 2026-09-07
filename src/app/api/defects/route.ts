import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const defects = db.prepare('SELECT * FROM coating_defects ORDER BY timestamp DESC').all();
    return NextResponse.json({ success: true, data: defects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching defect reports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const now = new Date().toISOString();
    const id = `DEF-${Math.floor(100 + Math.random() * 900)}`;

    db.prepare(`
      INSERT INTO coating_defects (id, timestamp, defect_type, severity, location_name, batch_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, now, body.defect_type, body.severity || 'minor', body.location_name, body.batch_id || null, body.notes || '');

    db.prepare('INSERT INTO audit_logs (user_id, timestamp, action_type, affected_resource_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(body.user_id || 'engineer', now, 'CREATE', id, `Logged coating defect report '${body.defect_type}'`);

    const defect = db.prepare('SELECT * FROM coating_defects WHERE id = ?').get(id);
    return NextResponse.json({ success: true, data: defect }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error logging defect report' }, { status: 400 });
  }
}
