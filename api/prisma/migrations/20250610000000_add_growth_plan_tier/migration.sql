-- Add Growth plan tier (₦8k / 50 products)
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'growth';
