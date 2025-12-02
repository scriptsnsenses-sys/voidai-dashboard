import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Only allow this endpoint to be called from localhost or with the correct authorization header
    const authHeader = req.headers.get('authorization');
    const isLocalhost = req.headers.get('host')?.includes('localhost');
    
    if (!isLocalhost && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { db } = await connectToDatabase();
    
    // Check if webhook_events collection already has data
    const existingEvents = await db.collection('webhook_events').countDocuments();
    if (existingEvents > 0) {
      return NextResponse.json({ message: 'Webhook events already exist', count: existingEvents });
    }
    
    // Generate sample payment data for the last 12 months
    const sampleData = generateSamplePaymentData();
    
    // Insert sample data
    await db.collection('webhook_events').insertMany(sampleData);
    
    return NextResponse.json({ 
      message: 'Sample webhook events created successfully', 
      count: sampleData.length 
    });
  } catch (error) {
    console.error('Error in update-webhook-events cron job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSamplePaymentData() {
  const sampleData = [];
  const plans = ['basic', 'premium', 'pro', 'ultra', 'enterprise'];
  const planPrices = {
    'basic': 9.99,
    'premium': 19.99,
    'pro': 49.99,
    'ultra': 99.99,
    'enterprise': 299.99
  };
  
  // Generate data for the last 12 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  // Generate random user IDs
  const userIds = Array.from({ length: 20 }, (_, i) => `user_${i.toString().padStart(4, '0')}`);
  
  // Generate between 50 and 100 payment events
  const numEvents = Math.floor(Math.random() * 51) + 50;
  
  for (let i = 0; i < numEvents; i++) {
    // Random date between start and end date
    const eventDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    // Random plan
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const amount = planPrices[plan as keyof typeof planPrices];
    
    // Random user
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    
    // Create sample event
    sampleData.push({
      event_id: `evt_sample_${i.toString().padStart(6, '0')}`,
      event_type: 'checkout.session.completed',
      created_at: eventDate.toISOString(),
      event: {
        id: `evt_sample_${i.toString().padStart(6, '0')}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: `cs_sample_${i.toString().padStart(6, '0')}`,
            amount_total: amount * 100, // Convert to cents
            currency: 'usd',
            created: Math.floor(eventDate.getTime() / 1000),
            customer: `cus_sample_${userId.substring(5)}`,
            metadata: {
              user_id: userId,
              plan: plan,
              billing_type: Math.random() > 0.3 ? 'monthly' : 'lifetime'
            }
          }
        }
      }
    });
  }
  
  return sampleData;
} 