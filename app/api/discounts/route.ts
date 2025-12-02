import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/postgresql-prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

interface DecodedToken {
  userId: string;
  mongoUserId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookiesList = await cookies();
    const token = cookiesList.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'e0c51cd8b70be4c7215e7bff03e17f884ffc591aeb412d53dcbb0b16c9411d85') as DecodedToken;
    const userIdToUse = decoded.mongoUserId || decoded.userId;

    const prisma = getPrismaClient();
    const now = BigInt(Date.now());
    
    // Use raw query since the Prisma client might not be regenerated with the new model
    const discounts: any[] = await prisma.$queryRaw`
      SELECT * FROM user_discounts
      WHERE user_id = ${userIdToUse}
      AND expires_at > ${now}
    `;

    if (!discounts || discounts.length === 0) {
      return NextResponse.json({
        active_discounts: [],
        has_discount: false,
        eligible_models: [],
        next_rotation: {
          time: '6:00 PM CET',
          description: 'New discounted model selected daily'
        },
        info: {
          discount_rotation: 'Daily at 6 PM CET',
          duration: '24 hours',
          discount_range: '1.5x to 3.0x (33% - 67% off)'
        }
      });
    }

    const activeDiscounts = discounts.map((d: any) => {
      // Map raw query result fields (snake_case in DB to camelCase logic)
      // Note: $queryRaw returns columns as they are in DB (snake_case usually if mapped)
      // Schema says @map("expires_at"), so raw query result should have expires_at
      // But if we use SELECT *, it depends on the driver. Prisma usually standardizes but $queryRaw is raw.
      // Let's assume we need to handle both or check d.expires_at
      
      const expiresAt = Number(d.expires_at || d.expiresAt);
      const discountMultiplier = Number(d.discount_multiplier || d.discountMultiplier);
      const modelId = d.model_id || d.modelId;

      const timeRemaining = Math.max(0, expiresAt - Date.now());
      
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      const savingsPercent = ((1 - 1 / discountMultiplier) * 100).toFixed(1);

      return {
        model_id: modelId,
        model_name: modelId,
        model_owner: 'unknown',
        discount: {
          multiplier: discountMultiplier,
          savings_percent: `${savingsPercent}%`,
          description: `${discountMultiplier}x cheaper!`
        },
        pricing: {
          original_multiplier: 0.1,
          discounted_multiplier: 0.1 / discountMultiplier,
          cost_per_1k_tokens: {
            original: 100,
            discounted: 100 / discountMultiplier,
            you_save: 100 - (100 / discountMultiplier)
          }
        },
        expires_at: expiresAt,
        time_remaining: {
          total_seconds: Math.floor(timeRemaining / 1000),
          formatted: `${hours}h ${minutes}m ${seconds}s`,
          hours,
          minutes,
          seconds
        }
      };
    });

    return NextResponse.json({
      active_discounts: activeDiscounts,
      has_discount: activeDiscounts.length > 0,
      eligible_models: [],
      next_rotation: {
        time: '6:00 PM CET',
        description: 'New discounted model selected daily'
      },
      info: {
        discount_rotation: 'Daily at 6 PM CET',
        duration: '24 hours',
        discount_range: '1.5x to 3.0x (33% - 67% off)'
      }
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount data' },
      { status: 500 }
    );
  }
}