require('dotenv').config();
const { Pool } = require('pg');

const SUBSCRIPTION_PLANS = {
  starter: {
    planName: 'starter',
    displayName: 'Starter',
    priceMonthly: 9,
    priceYearly: 90,
    maxVideosPerMonth: 10,
    features: {
      maxVideoLength: 30,
      videoQuality: ['720p'],
      customBranding: false,
      priorityProcessing: false,
      apiAccess: false,
      customTTSVoices: false,
      advancedAnalytics: false,
    },
  },
  pro: {
    planName: 'pro',
    displayName: 'Pro',
    priceMonthly: 29,
    priceYearly: 290,
    maxVideosPerMonth: 50,
    features: {
      maxVideoLength: 60,
      videoQuality: ['720p', '1080p'],
      customBranding: true,
      priorityProcessing: false,
      apiAccess: false,
      customTTSVoices: true,
      advancedAnalytics: true,
    },
  },
  enterprise: {
    planName: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 99,
    priceYearly: 990,
    maxVideosPerMonth: null,
    features: {
      maxVideoLength: 60,
      videoQuality: ['720p', '1080p', '4K'],
      customBranding: true,
      priorityProcessing: true,
      apiAccess: true,
      customTTSVoices: true,
      advancedAnalytics: true,
    },
  },
};

async function seedPlans() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('Seeding subscription plans...');

    for (const [planName, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      // Check if plan already exists
      const existing = await client.query(
        'SELECT id FROM subscription_plans WHERE plan_name = $1',
        [planName]
      );

      if (existing.rows.length > 0) {
        // Update existing plan
        await client.query(
          `UPDATE subscription_plans
           SET display_name = $1,
               price_monthly = $2,
               price_yearly = $3,
               max_videos_per_month = $4,
               max_video_length_seconds = $5,
               features = $6,
               updated_at = CURRENT_TIMESTAMP
           WHERE plan_name = $7`,
          [
            plan.displayName,
            plan.priceMonthly,
            plan.priceYearly,
            plan.maxVideosPerMonth,
            plan.features.maxVideoLength,
            JSON.stringify(plan.features),
            planName,
          ]
        );
        console.log(`✓ Updated plan: ${planName}`);
      } else {
        // Insert new plan
        await client.query(
          `INSERT INTO subscription_plans 
           (plan_name, display_name, price_monthly, price_yearly, max_videos_per_month, 
            max_video_length_seconds, features, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            planName,
            plan.displayName,
            plan.priceMonthly,
            plan.priceYearly,
            plan.maxVideosPerMonth,
            plan.features.maxVideoLength,
            JSON.stringify(plan.features),
          ]
        );
        console.log(`✓ Created plan: ${planName}`);
      }
    }

    console.log('\n✓ Subscription plans seeded successfully!');
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedPlans()
  .then(() => {
    console.log('Seeding finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  });




