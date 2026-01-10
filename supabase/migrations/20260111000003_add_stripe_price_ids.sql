-- ============================================
-- Add Stripe Price IDs to subscription_plans
-- ============================================
-- Personal: price_1So7MZJCfqKHKOxL75JEymAX (¥499/month)
-- Pro: price_1So7NGJCfqKHKOxLWiuU4IUK (¥980/month)

-- Update Personal plan with Stripe Price ID
UPDATE subscription_plans
SET stripe_price_id_monthly = 'price_1So7MZJCfqKHKOxL75JEymAX'
WHERE name = 'personal';

-- Update Pro plan with Stripe Price ID
UPDATE subscription_plans
SET stripe_price_id_monthly = 'price_1So7NGJCfqKHKOxLWiuU4IUK'
WHERE name = 'pro';

-- Verify the update
SELECT name, display_name, price_monthly, stripe_price_id_monthly
FROM subscription_plans
ORDER BY sort_order;
