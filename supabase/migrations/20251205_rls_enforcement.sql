-- Enforce RLS on Materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can read materials" ON materials;
CREATE POLICY "Approved users can read materials" ON materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = TRUE AND is_banned = FALSE
    )
  );

DROP POLICY IF EXISTS "Approved staff can upload materials" ON materials;
CREATE POLICY "Approved staff can upload materials" ON materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_approved = TRUE 
      AND is_banned = FALSE
      AND role IN ('contributor', 'moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins and Moderators can update materials" ON materials;
CREATE POLICY "Admins and Moderators can update materials" ON materials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_approved = TRUE 
      AND is_banned = FALSE
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete materials" ON materials;
CREATE POLICY "Admins can delete materials" ON materials
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_approved = TRUE 
      AND is_banned = FALSE
      AND role = 'admin'
    )
  );

-- Enforce RLS on Curriculum
ALTER TABLE curriculum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved users can read curriculum" ON curriculum;
CREATE POLICY "Approved users can read curriculum" ON curriculum
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_approved = TRUE AND is_banned = FALSE
    )
  );

DROP POLICY IF EXISTS "Admins and Moderators can manage curriculum" ON curriculum;
CREATE POLICY "Admins and Moderators can manage curriculum" ON curriculum
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_approved = TRUE 
      AND is_banned = FALSE
      AND role IN ('moderator', 'admin')
    )
  );
