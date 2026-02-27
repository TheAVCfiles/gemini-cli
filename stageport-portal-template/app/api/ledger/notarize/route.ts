import { NextResponse } from 'next/server';
import { notarize } from '../../../../lib/ledgerStore';

export async function POST(request: Request) {
  const body = (await request.json()) as { documentId?: unknown; hash?: unknown; eventType?: unknown };

  if (typeof body.documentId !== 'string' || body.documentId.trim().length === 0) {
    return NextResponse.json({ message: "Missing or invalid 'documentId'" }, { status: 400 });
  }

  if (typeof body.hash !== 'string' || body.hash.trim().length === 0) {
    return NextResponse.json({ message: "Missing or invalid 'hash'" }, { status: 400 });
  }

  const safeEventType =
    typeof body.eventType === 'string' && body.eventType.trim().length > 0 ? body.eventType.trim() : 'NOTARIZE';

  return NextResponse.json(notarize(body.documentId.trim(), body.hash.trim(), safeEventType), { status: 201 });
}
