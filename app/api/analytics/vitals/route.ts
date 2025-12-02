import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract web vitals data
    const { metric, value, id, pathname } = body;
    
    // In production, you would typically:
    // 1. Store this data in a database
    // 2. Send it to an analytics service (e.g., Google Analytics, Vercel Analytics)
    // 3. Process it for performance monitoring
    
    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Web Vital received:', {
        metric,
        value,
        id,
        pathname,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}