import { connectToV2Database } from '@/lib/postgresql-v2';
import { connectToDatabase } from '@/lib/database-factory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get total users count from main database
    const { db: usersDb } = await connectToDatabase();
    const totalUsers = await usersDb.collection('users').countDocuments({});
    
    // Get total API calls and tokens from V2 database
    let totalApiCalls = 0;
    let totalTokensProcessed = 0;
    let avgResponseTime = '<300ms'; // Default value
    
    try {
      const { client } = await connectToV2Database();
      
      // Use direct SQL queries for efficiency - get count, sum, and average in one query
      const statsResult = await client.query(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(tokens_used), 0) as total_tokens,
          COALESCE(AVG(latency), 0) as avg_latency
        FROM api_requests
        WHERE status = 'completed'
      `);
      
      if (statsResult.rows.length > 0) {
        totalApiCalls = parseInt(statsResult.rows[0].count) || 0;
        totalTokensProcessed = parseInt(statsResult.rows[0].total_tokens) || 0;
        const avgLatency = Math.round(parseFloat(statsResult.rows[0].avg_latency) || 0);
        avgResponseTime = avgLatency > 0 ? `${avgLatency}ms` : '<300ms';
      }
      
    } catch (error) {
      console.warn('Could not fetch V2 api_requests data:', error);
    }
    
    // Format the numbers
    const formatNumber = (num: number): string => {
      if (num >= 1000000000) {
        return `${(num / 1000000000).toFixed(1)}B+`;
      } else if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M+`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K+`;
      }
      return num.toString();
    };
    
    // Uptime - static high value
    const uptime = '>99%';
    
    return NextResponse.json({
      stats: {
        totalUsers: formatNumber(totalUsers),
        totalApiCalls: formatNumber(totalApiCalls),
        totalTokensProcessed: formatNumber(totalTokensProcessed),
        uptime: uptime,
        avgResponseTime: avgResponseTime,
        rawNumbers: {
          users: totalUsers,
          apiCalls: totalApiCalls,
          tokensProcessed: totalTokensProcessed
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching public stats:', error);
    
    // Return empty data on error
    return NextResponse.json({
      stats: {
        totalUsers: '0',
        totalApiCalls: '0',
        totalTokensProcessed: '0',
        uptime: '0%',
        avgResponseTime: '0ms',
        rawNumbers: {
          users: 0,
          apiCalls: 0,
          tokensProcessed: 0
        }
      }
    });
  }
}