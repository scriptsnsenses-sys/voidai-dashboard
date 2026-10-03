import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Paid verification is no longer available.' },
    { status: 410 }
  );
}