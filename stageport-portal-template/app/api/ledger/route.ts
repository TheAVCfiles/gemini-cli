import { NextResponse } from 'next/server';
import { getLedgerEntries } from '../../../lib/ledgerStore';

export async function GET() {
  return NextResponse.json(getLedgerEntries());
}
