-- Add is_approved and is_banned columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Backfill existing users to be approved
UPDATE profiles SET is_approved = TRUE WHERE is_approved IS NULL;

-- Explicitly set the specific admin user by joining with auth.users
UPDATE profiles 
SET 
  role = 'admin', 
  is_approved = TRUE,
  is_banned = FALSE
FROM auth.users
WHERE profiles.id = auth.users.id AND auth.users.email = 'skiespink55@gmail.com';

-- Update RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );

-- Allow admins to update profiles (approve/reject/ban)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin' AND is_approved = TRUE
    )
  );
