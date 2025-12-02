import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as { userId: string };

      if (!await isAdmin(decoded.userId)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { db } = await connectToDatabase();
      const { userIds } = await req.json();

      // Build query based on whether specific users are selected
      const query = userIds && userIds.length > 0 
        ? { _id: { $in: userIds } }
        : {};

      const users = await db.collection('users')
        .find(query)
        .project({
          password: 0,
          salt: 0
        })
        .toArray();

      // Create CSV content
      const headers = [
        'ID',
        'Username',
        'Email',
        'Plan',
        'Plan Expires At',
        'Created At',
        'Last Login',
        'Status',
        'RPM',
        'RPD',
        'Total API Calls'
      ];

      const csvRows = [headers.join(',')];

      // Helper function to safely format dates
      const formatDate = (dateValue: any): string => {
        if (!dateValue) return '';
        
        try {
          // Handle different date formats
          if (typeof dateValue === 'string') {
            if (dateValue.includes('T')) {
              // ISO format
              return new Date(dateValue).toISOString();
            } else if (/^\d+$/.test(dateValue)) {
              // Unix timestamp (as string)
              return new Date(parseInt(dateValue) * 1000).toISOString();
            }
          } else if (typeof dateValue === 'number') {
            // Unix timestamp (as number)
            return new Date(dateValue * 1000).toISOString();
          } else if (dateValue instanceof Date) {
            return dateValue.toISOString();
          }
          
          // Try parsing as is
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (error) {
          console.error('Date formatting error:', error, 'Value:', dateValue);
        }
        
        return '';
      };

      users.forEach(user => {
        const row = [
          user._id,
          user.username || '',
          user.email || '',
          user.plan || 'free',
          formatDate(user.plan_expires_at),
          formatDate(user.created_at),
          formatDate(user.last_login),
          user.status || 'active',
          user.rpm || '',
          user.rpd || '',
          user.total_api_calls || '0'
        ];

        // Escape values that might contain commas
        const escapedRow = row.map(value => {
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });

        csvRows.push(escapedRow.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}