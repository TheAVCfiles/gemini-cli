import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: unknown };

  if (typeof body.text !== 'string' || body.text.trim().length === 0) {
    return NextResponse.json({ message: "Missing or invalid 'text'" }, { status: 400 });
  }

  const sha256 = createHash('sha256').update(body.text).digest('hex');
  return NextResponse.json({ sha256 });
}
