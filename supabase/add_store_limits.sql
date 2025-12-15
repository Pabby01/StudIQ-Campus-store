-- Add store limits to subscription plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS max_stores INTEGER DEFAULT 1;

-- Set limits based on plan tier
UPDATE subscription_plans 
SET max_stores = CASE 
  WHEN name = 'free' THEN 1
  WHEN name = 'premium' THEN 5
  WHEN name = 'enterprise' THEN 20
  ELSE 1
END;
