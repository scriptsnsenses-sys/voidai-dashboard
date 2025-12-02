import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET all published changelog entries (public route)
export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    const entries = await db.collection('changelog')
      .find({ published: true })
      .sort({ date: -1, created_at: -1 })
      .project({
        created_by: 0,
        updated_by: 0,
        created_at: 0,
        updated_at: 0
      })
      .toArray();

    return NextResponse.json({ entries });

  } catch (error) {
    console.error('Error fetching public changelog entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}