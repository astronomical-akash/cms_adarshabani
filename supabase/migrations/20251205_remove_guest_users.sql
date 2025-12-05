-- Delete users with 'anon' role or 'Guest User' name from profiles table
DELETE FROM profiles 
WHERE role = 'anon' 
   OR full_name = 'Guest User'
   OR id IN (
       SELECT id FROM auth.users WHERE is_anonymous = true
   );

-- Note: We can't directly delete from auth.users via SQL editor usually due to permissions, 
-- but deleting from profiles cleans up the application data.
-- If you have access to the Supabase dashboard SQL editor, you can run:
-- DELETE FROM auth.users WHERE is_anonymous = true;
