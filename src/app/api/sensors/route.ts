import { NextRequest, NextResponse } from 'next/server';
import { getAllSensors, registerSensor, updateSensorStatus, updateSensorLocation } from '@/lib/services/sensorService';

export async function GET() {
  try {
    const sensors = getAllSensors();
    return NextResponse.json({ success: true, data: sensors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching sensors' }, { status: 500 });
  }
}

import { z } from 'zod';
import { SensorType } from '@/lib/types';

const RegisterSensorSchema = z.object({
  sensor_id: z.string().min(1, "Sensor ID is required"),
  location_name: z.string().min(1, "Location name is required"),
  sensor_type: z.string().optional().default('combined'),
  user_id: z.string().optional().default('system')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = RegisterSensorSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const validatedData = validation.data;
    
    const sensor = registerSensor({
      sensor_id: validatedData.sensor_id,
      location_name: validatedData.location_name,
      sensor_type: validatedData.sensor_type as SensorType,
      user_id: validatedData.user_id
    });
    return NextResponse.json({ success: true, data: sensor }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error registering sensor' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { sensor_id, status, location_name, user_id } = body;

    if (!sensor_id) {
      return NextResponse.json({ error: 'sensor_id is required' }, { status: 400 });
    }

    let updated = false;

    if (status) {
      updated = updateSensorStatus(sensor_id, status, user_id || 'system');
    }

    if (location_name) {
      updated = updateSensorLocation(sensor_id, location_name, user_id || 'system') || updated;
    }

    if (updated) {
      return NextResponse.json({ success: true, message: `Sensor '${sensor_id}' updated successfully.` });
    } else {
      return NextResponse.json({ error: `Failed to update sensor '${sensor_id}'.` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating sensor' }, { status: 500 });
  }
}
