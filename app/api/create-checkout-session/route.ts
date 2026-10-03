import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Paid plans are no longer available.' },
    { status: 410 }
  );
}