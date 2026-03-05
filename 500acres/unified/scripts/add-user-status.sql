-- Add status column for user approval workflow
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Ensure all existing users are active
UPDATE "User" SET status = 'active' WHERE status IS NULL;
