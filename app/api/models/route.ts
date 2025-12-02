import { NextRequest, NextResponse } from 'next/server';
import { getFullUserProfile, getUserById as getV1UserById } from '@/lib/postgresql-users';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Ensure this API is always dynamic and never cached at build time
export const dynamic = 'force-dynamic';

/**
 * External response types from VoidAI API
 */
interface ExternalModel {
  id: string;
  object: string;
  owned_by: string;
  endpoints: string[];
  plan_requirements?: string[]; // New field name from upstream API
  cost_type?: string;           // New field name from upstream API
  base_cost?: number;
  multiplier?: number;
  supports_streaming?: boolean;
  supports_tool_calling?: boolean;
}

interface ExternalModelsResponse {
  object: string;
  data: ExternalModel[];
}

/**
 * Internal model shape expected by our frontend
 */
interface Model {
  id: string;
  object: string;
  owned_by: string;
  endpoints: string[];
  permission: string[]; // mapped from plan_requirements
  cost: string;         // mapped from cost_type
  multiplier: number;
}

export async function GET(req: NextRequest) {
  try {
    // Fetch all models from VoidAI API (no auth required)
    const response = await fetch('https://api.voidai.app/v1/models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      // Prevent Next.js caching of this request
      next: { revalidate: 0 } as any,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch models from VoidAI API. Status: ${response.status}, Body: ${errorBody}`);
      return NextResponse.json(
        { message: `Failed to fetch models data (Status: ${response.status})` },
        { status: response.status }
      );
    }

    // Parse as the external (upstream) schema
    const external: ExternalModelsResponse = await response.json();

    // Determine user plan (default to 'free' when unauthenticated/invalid token)
    const token = (await cookies()).get('auth_token')?.value;
    let userPlan = 'free';
  
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85'
        ) as {
          userId: string;
          mongoUserId?: string;
          plan?: string;
        };
  
        // Use the same source of truth as /api/auth/me
        const userIdToUse = decoded.mongoUserId || decoded.userId;
        const profile = await getFullUserProfile(userIdToUse);
        
        // Resolve plan with robust fallbacks:
        // 1) Combined (V1 source of truth) from getFullUserProfile
        // 2) Direct V1 DB lookup (avoids failing when V2 is unreachable)
        // 3) JWT claim (stale but better than nothing)
        let resolvedPlan: string | null = null;
        
        if (profile?.combined?.plan) {
          resolvedPlan = String(profile.combined.plan);
        }
        
        if (!resolvedPlan) {
          try {
            const v1 = await getV1UserById(userIdToUse);
            if (v1?.plan) {
              resolvedPlan = String(v1.plan);
            }
          } catch (e) {
            console.log('V1 plan fallback failed:', e);
          }
        }
        
        if (!resolvedPlan && (decoded as any)?.plan) {
          resolvedPlan = String((decoded as any).plan);
        }
        
        if (resolvedPlan) {
          userPlan = resolvedPlan.toLowerCase();
        }
      } catch {
        // If token is invalid, just use free plan
        console.log('Invalid token, using free plan');
      }
    }

    // Transform upstream models to the internal shape the UI expects
    const internalModels: Model[] = (external.data || []).map((m) => ({
      id: m.id,
      object: m.object,
      owned_by: m.owned_by,
      endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
      permission: Array.isArray(m.plan_requirements) ? m.plan_requirements : [],
      cost: m.cost_type || 'per_token',
      multiplier: typeof m.multiplier === 'number' ? m.multiplier : 1,
    }));

    // Filter models based on user plan permissions
    // Only include if the user's plan is explicitly allowed
    const filteredModels = internalModels.filter((model) => {
      if (userPlan === 'admin') return true; // admins can see all models
      return Array.isArray(model.permission) && model.permission.includes(userPlan);
    });

    // Return filtered models
    return NextResponse.json(
      {
        object: external.object || 'list',
        data: filteredModels,
        userPlan,
      },
      {
        headers: {
          // Prevent CDN/browser caching of user-specific response
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching models data:', error);
    return NextResponse.json(
      { message: error?.message || 'Internal server error fetching models data' },
      { status: 500 }
    );
  }
}