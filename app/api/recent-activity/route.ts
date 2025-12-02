import { connectToV2Database } from '@/lib/postgresql-v2';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToV2Database();
    
    // Get recent api_requests sorted by created_at (most recent first)
    // Use limit of 5 for live feed to show more activity
    // Only show completed requests
    const recentRequests = await db.collection('api_requests')
      .find({ status: 'completed' }, { sort: { created_at: -1 }, limit: 5 });
    
    // If no real data, return empty array to show it's actually checking
    if (recentRequests.length === 0) {
      return NextResponse.json({
        activities: [],
        message: 'No recent API requests found'
      });
    }
    
    // Format the activity data
    const activities = recentRequests.map((request: any, index: number) => {
      const modelName = request.model || 'Unknown Model';
      // PostgreSQL wrapper transforms to camelCase
      const tokensUsed = request.tokensUsed || 0;
      const creditsUsed = request.creditsUsed || 0;
      
      // Handle timestamp - createdAt is transformed to camelCase by PostgreSQL wrapper
      const createdAtValue = request.createdAt;
      let timestamp: Date;
      
      try {
        if (createdAtValue) {
          // Convert BigInt to number if needed, then create Date
          const timestampMs = typeof createdAtValue === 'bigint' ? Number(createdAtValue) : Number(createdAtValue);
          
          // Validate the timestamp is reasonable (between year 2000 and 2100)
          if (timestampMs < 946684800000 || timestampMs > 4102444800000) {
            console.warn('Invalid timestamp value:', timestampMs, 'for request:', request.id);
            timestamp = new Date();
          } else {
            timestamp = new Date(timestampMs);
          }
        } else {
          timestamp = new Date();
        }
        
        // Double-check the date is valid
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid date created from timestamp:', createdAtValue);
          timestamp = new Date();
        }
      } catch (error) {
        console.error('Error parsing timestamp:', error, 'value:', createdAtValue);
        timestamp = new Date();
      }
      
      const endpoint = request.endpoint || '/v1/chat/completions';
      
      // Determine color based on model
      let color = 'blue-400';
      if (modelName.toLowerCase().includes('claude')) {
        color = 'purple-400';
      } else if (modelName.toLowerCase().includes('gemini')) {
        color = 'green-400';
      } else if (modelName.toLowerCase().includes('gpt')) {
        color = 'blue-400';
      } else if (modelName.toLowerCase().includes('llama')) {
        color = 'orange-400';
      }
      
      // Show time elapsed since request
      const now = new Date();
      const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
      let timeAgo = '';
      if (diff < 60) {
        timeAgo = `${diff}s ago`;
      } else if (diff < 3600) {
        timeAgo = `${Math.floor(diff / 60)}m ago`;
      } else {
        timeAgo = `${Math.floor(diff / 3600)}h ago`;
      }
      
      return {
        id: request._id?.toString() || request.id || `req-${index}`,
        model: modelName,
        tokens: tokensUsed,
        credits: creditsUsed,
        timestamp: timestamp.toISOString(),
        timeAgo: timeAgo,
        color: color,
        display: `${modelName} - ${tokensUsed} tokens, ${creditsUsed} credits (${timeAgo})`
      };
    });
    
    return NextResponse.json({
      activities: activities,
      count: activities.length,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    
    // Return error indicator instead of fake data
    return NextResponse.json({
      activities: [],
      error: 'Failed to connect to V2 database',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}