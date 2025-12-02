import { connectToDatabase, connectToV2Database } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER_IDS = ['67cc7156c48d8f091d9eb97e', '6841dcd68e5dd87c07fd43c4', '67cc75be88b956a5baebc71b', '68596ed3f17aa8b1b1e9d521', '573109812qnb'];

async function isAdmin(userId: string) {
  return ADMIN_USER_IDS.includes(userId);
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as {
        userId: string;
        mongoUserId?: string;
      };

      // Use mongoUserId for admin checks (MongoDB ObjectId), fallback to userId for backward compatibility
      const mongoUserIdToUse = decoded.mongoUserId || decoded.userId;
      if (!await isAdmin(mongoUserIdToUse)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Connect to both V1 and V2 databases
      const { db: v1Db } = await connectToDatabase();
      const { db: v2Db } = await connectToV2Database();

      const planData = await request.json();
      const { plan, rpm, rpd } = planData;

      if (!plan) {
        return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
      }

      const validPlans = ['free', 'basic', 'premium', 'ultra', 'custom'];
      if (!validPlans.includes(plan.toLowerCase()) && plan !== 'custom') {
        return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
      }

      if (plan.toLowerCase() === 'custom') {
        if (!rpm || !rpd) {
          return NextResponse.json(
            { error: 'Custom plans require RPM and RPD values' }, 
            { status: 400 }
          );
        }

        if (rpm < 1 || rpd < 1) {
          return NextResponse.json(
            { error: 'RPM and RPD must be greater than 0' }, 
            { status: 400 }
          );
        }
      }

      let updateData: any = { plan };

      if (plan.toLowerCase() === 'custom') {
        updateData.rpm = rpm;
        updateData.rpd = rpd;
      } else {

        switch (plan.toLowerCase()) {
          case 'free':
            updateData.rpm = 5;
            updateData.rpd = 100;
            break;
          case 'basic':
            updateData.rpm = 10;
            updateData.rpd = 2000;
            break;
          case 'premium':
            updateData.rpm = 35;
            updateData.rpd = 5000;
            break;
          case 'ultra':
            updateData.rpm = 100;
            updateData.rpd = 10000;
            break;
          default:

            updateData.rpm = 5;
            updateData.rpd = 100;
        }
      }

      // Update user plan in both V1 and V2 databases
      const v1Result = await v1Db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      const v2Result = await v2Db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (v1Result.matchedCount === 0 && v2Result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found in either database' }, { status: 404 });
      }

      // Update API keys in both databases
      await v1Db.collection('keys').updateMany(
        { created_by: id },
        { $set: {
            plan: updateData.plan,
            rpm: updateData.rpm,
            rpd: updateData.rpd
          }
        }
      );

      await v2Db.collection('keys').updateMany(
        { created_by: id },
        { $set: {
            plan: updateData.plan,
            rpm: updateData.rpm,
            rpd: updateData.rpd
          }
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'User plan updated successfully'
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating user plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
