import { NextResponse } from 'next/server';

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
  cost: string;         // mapped from cost_type
  multiplier: number;
}

export async function GET() {
  try {
    // Fetch all models from VoidAI API (no auth required)
    const response = await fetch('https://voidai-backend.onrender.com/v1/models', {
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

    // Transform upstream models to the internal shape the UI expects
    const internalModels: Model[] = (external.data || []).map((m) => ({
      id: m.id,
      object: m.object,
      owned_by: m.owned_by,
      endpoints: Array.isArray(m.endpoints) ? m.endpoints : [],
      cost: m.cost_type || 'per_token',
      multiplier: typeof m.multiplier === 'number' ? m.multiplier : 1,
    }));

    return NextResponse.json(
      {
        object: external.object || 'list',
        data: internalModels,
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