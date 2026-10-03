import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { message: 'Credit balances are no longer used.' },
    { status: 410 }
  );
}