import pool from '../db';
import { SUBSCRIPTION_PLANS } from '../config/plans';
import { logger } from '../utils/logger';

/**
 * Seed subscription plans into the database
 */
export async function seedPlans(): Promise<void> {
  const client = await pool.connect();

  try {
    logger.info('Seeding subscription plans...');

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
        logger.info(`Updated plan: ${planName}`);
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
        logger.info(`Created plan: ${planName}`);
      }
    }

    logger.info('Subscription plans seeded successfully');
  } catch (error) {
    logger.error('Error seeding plans:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedPlans()
    .then(() => {
      logger.info('Plans seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Plans seeding error:', error);
      process.exit(1);
    });
}

