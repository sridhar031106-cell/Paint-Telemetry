import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services/authService';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const res = authenticateUser(username, password);
    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 401 });
    }

    return NextResponse.json({ success: true, session: res.session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}
