import { NextRequest, NextResponse } from 'next/server';
import { generateCSVExport } from '@/lib/services/exportService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startTime = searchParams.get('start_time') || undefined;
    const endTime = searchParams.get('end_time') || undefined;
    const sensorsParam = searchParams.get('sensors');
    const userId = searchParams.get('user_id') || 'operator';

    const sensorIds = sensorsParam ? sensorsParam.split(',') : undefined;

    const { csv, rowCount } = generateCSVExport({
      start_time: startTime,
      end_time: endTime,
      sensor_ids: sensorIds,
      user_id: userId
    });

    const filename = `telemetry_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Row-Count': String(rowCount)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CSV Export failed' }, { status: 400 });
  }
}
