import { connectToDatabase, connectToV2Database } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
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
      const { action, userIds, data } = await req.json();

      if (!action || !userIds || userIds.length === 0) {
        return NextResponse.json({
          error: 'Invalid request: action and userIds are required'
        }, { status: 400 });
      }

      // Convert string IDs to ObjectIds
      const objectIds = userIds.map((id: string) => new ObjectId(id));

      // Prevent admins from being affected by bulk actions
      const nonAdminIds = objectIds.filter((id: ObjectId) =>
        !ADMIN_USER_IDS.includes(id.toString())
      );

      if (nonAdminIds.length === 0) {
        return NextResponse.json({
          message: 'No non-admin users selected for bulk action'
        }, { status: 200 });
      }

      let result: any;
      let message = '';

      switch (action) {
        case 'delete':
          // Delete users from both V1 and V2 databases
          const v1DeleteResult = await v1Db.collection('users').deleteMany({
            _id: { $in: nonAdminIds }
          });
          
          const v2DeleteResult = await v2Db.collection('users').deleteMany({
            _id: { $in: nonAdminIds }
          });
          
          // Delete API keys from both databases
          await v1Db.collection('api_keys').deleteMany({
            user_id: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) }
          });
          
          await v2Db.collection('keys').deleteMany({
            created_by: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) }
          });
          
          // Delete Claude applications from both databases
          await v1Db.collection('claude_applications').deleteMany({
            user_id: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) }
          });
          
          await v2Db.collection('claude_applications').deleteMany({
            user_id: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) }
          });
          
          const totalDeleted = v1DeleteResult.deletedCount + v2DeleteResult.deletedCount;
          result = { deletedCount: totalDeleted };
          message = `Successfully deleted ${totalDeleted} users from both databases (V1: ${v1DeleteResult.deletedCount}, V2: ${v2DeleteResult.deletedCount})`;
          break;

        case 'ban':
          // Ban users in both V1 and V2 databases
          const v1BanResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                status: 'banned',
                banned_at: new Date()
              }
            }
          );
          
          const v2BanResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                status: 'banned',
                banned_at: new Date()
              }
            }
          );
          
          // Disable API keys in both databases
          await v1Db.collection('api_keys').updateMany(
            { user_id: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) } },
            { $set: { is_enabled: false } }
          );
          
          await v2Db.collection('keys').updateMany(
            { created_by: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) } },
            { $set: { is_enabled: false } }
          );
          
          const totalBanned = v1BanResult.modifiedCount + v2BanResult.modifiedCount;
          result = { modifiedCount: totalBanned };
          message = `Successfully banned ${totalBanned} users in both databases`;
          break;

        case 'updatePlan':
          if (!data || !data.plan) {
            return NextResponse.json({ 
              error: 'Plan is required for updatePlan action' 
            }, { status: 400 });
          }
          
          const updateData: any = { plan: data.plan };
          
          if (data.rpm) updateData.rpm = data.rpm;
          if (data.rpd) updateData.rpd = data.rpd;
          
          // Update plans in both V1 and V2 databases
          const v1PlanResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $set: updateData }
          );
          
          const v2PlanResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $set: updateData }
          );
          
          const totalUpdated = v1PlanResult.modifiedCount + v2PlanResult.modifiedCount;
          result = { modifiedCount: totalUpdated };
          message = `Successfully updated plan for ${totalUpdated} users in both databases`;
          break;

        case 'activate':
          // Activate users in both V1 and V2 databases
          const v1ActivateResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                status: 'active',
                activated_at: new Date()
              },
              $unset: { banned_at: 1 }
            }
          );
          
          const v2ActivateResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                status: 'active',
                activated_at: new Date()
              },
              $unset: { banned_at: 1 }
            }
          );
          
          // Re-enable API keys in both databases
          await v1Db.collection('api_keys').updateMany(
            { user_id: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) } },
            { $set: { is_enabled: true } }
          );
          
          await v2Db.collection('keys').updateMany(
            { created_by: { $in: nonAdminIds.map((id: ObjectId) => id.toString()) } },
            { $set: { is_enabled: true } }
          );
          
          const totalActivated = v1ActivateResult.modifiedCount + v2ActivateResult.modifiedCount;
          result = { modifiedCount: totalActivated };
          message = `Successfully activated ${totalActivated} users in both databases`;
          break;

        case 'addTag':
          if (!data || !data.tag) {
            return NextResponse.json({ 
              error: 'Tag is required for addTag action' 
            }, { status: 400 });
          }
          
          // Add tags in both V1 and V2 databases
          const v1TagResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $addToSet: { tags: data.tag } }
          );
          
          const v2TagResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $addToSet: { tags: data.tag } }
          );
          
          const totalTagged = v1TagResult.modifiedCount + v2TagResult.modifiedCount;
          result = { modifiedCount: totalTagged };
          message = `Successfully added tag to ${totalTagged} users in both databases`;
          break;

        case 'removeTag':
          if (!data || !data.tag) {
            return NextResponse.json({ 
              error: 'Tag is required for removeTag action' 
            }, { status: 400 });
          }
          
          // Remove tags from both V1 and V2 databases
          const v1RemoveTagResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $pull: { tags: data.tag } }
          );
          
          const v2RemoveTagResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            { $pull: { tags: data.tag } }
          );
          
          const totalTagRemoved = v1RemoveTagResult.modifiedCount + v2RemoveTagResult.modifiedCount;
          result = { modifiedCount: totalTagRemoved };
          message = `Successfully removed tag from ${totalTagRemoved} users in both databases`;
          break;

        case 'removeClaudeAccess':
          // Remove Claude access from both V1 and V2 databases
          const v1ClaudeResult = await v1Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                claude_access: false,
                claude_access_removed_at: new Date()
              }
            }
          );
          
          const v2ClaudeResult = await v2Db.collection('users').updateMany(
            { _id: { $in: nonAdminIds } },
            {
              $set: {
                claude_access: false,
                claude_access_removed_at: new Date()
              }
            }
          );
          
          // Delete Claude applications from both databases
          const userIdStrings = nonAdminIds.map((id: ObjectId) => id.toString());
          
          const v1DeletedApps = await v1Db.collection('claude_applications').deleteMany({
            user_id: { $in: userIdStrings }
          });
          
          const v2DeletedApps = await v2Db.collection('claude_applications').deleteMany({
            user_id: { $in: userIdStrings }
          });
          
          const totalClaudeUpdated = v1ClaudeResult.modifiedCount + v2ClaudeResult.modifiedCount;
          const totalAppsDeleted = v1DeletedApps.deletedCount + v2DeletedApps.deletedCount;
          result = { modifiedCount: totalClaudeUpdated };
          message = `Successfully removed Claude access from ${totalClaudeUpdated} users and deleted ${totalAppsDeleted} Claude applications from both databases`;
          break;

        default:
          return NextResponse.json({
            error: `Unknown action: ${action}`
          }, { status: 400 });
      }

      return NextResponse.json({ 
        message,
        affectedCount: result?.modifiedCount || result?.deletedCount || 0
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}