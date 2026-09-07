import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/services/authService';

export async function GET() {
  try {
    const logs = getAuditLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching audit logs' }, { status: 500 });
  }
}
