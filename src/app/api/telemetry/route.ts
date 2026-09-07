import { NextRequest, NextResponse } from 'next/server';
import { ingestTelemetry, queryTelemetryHistory } from '@/lib/services/telemetryService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sensorsParam = searchParams.get('sensors');
    const startTime = searchParams.get('start_time') || undefined;
    const endTime = searchParams.get('end_time') || undefined;
    const batchId = searchParams.get('batch_id') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 1000;

    const sensorIds = sensorsParam ? sensorsParam.split(',') : undefined;

    const records = queryTelemetryHistory({
      sensor_ids: sensorIds,
      start_time: startTime,
      end_time: endTime,
      batch_id: batchId,
      limit
    });

    return NextResponse.json({ success: true, count: records.length, data: records });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error querying telemetry' }, { status: 500 });
  }
}

import { z } from 'zod';

const TelemetrySchema = z.object({
  sensor_id: z.string().min(1, "Sensor ID is required"),
  temperature_celsius: z.coerce.number(),
  humidity_percent: z.coerce.number().min(0).max(100),
  batch_id: z.string().optional(),
  timestamp: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate with Zod
    const validation = TelemetrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;

    const result = ingestTelemetry({
      sensor_id: validatedData.sensor_id,
      temperature_celsius: validatedData.temperature_celsius,
      humidity_percent: validatedData.humidity_percent,
      batch_id: validatedData.batch_id,
      timestamp: validatedData.timestamp
    });

    if (!result.success && result.status === 'invalid') {
      return NextResponse.json({ error: result.message, status: result.status }, { status: 400 });
    }

    return NextResponse.json(result, { status: result.success ? 201 : 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error ingesting telemetry' }, { status: 500 });
  }
}
