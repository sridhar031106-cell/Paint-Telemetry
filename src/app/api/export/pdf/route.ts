import { NextRequest, NextResponse } from 'next/server';
import { generatePDFReportSummary } from '@/lib/services/exportService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startTime = searchParams.get('start_time') || undefined;
    const endTime = searchParams.get('end_time') || undefined;
    const userId = searchParams.get('user_id') || 'operator';

    const reportData = generatePDFReportSummary({
      start_time: startTime,
      end_time: endTime,
      user_id: userId
    });

    return NextResponse.json({ success: true, data: reportData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'PDF report generation failed' }, { status: 500 });
  }
}
