-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contributor_id UUID REFERENCES auth.users(id),
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter TEXT NOT NULL,
    topic TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policy for Admins and Moderators (Full Access)
CREATE POLICY "Admins and Moderators have full access to assignments"
ON public.assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'moderator')
    )
);

-- Policy for Contributors (Read Only for their own assignments)
CREATE POLICY "Contributors can view their own assignments"
ON public.assignments
FOR SELECT
USING (
    auth.uid() = contributor_id
);

-- Policy for Contributors (Update status/comments on their own assignments - Optional, but requested implies they might need to update status?)
-- The user request said "Contributors can only read rows assigned to them" in one part, but "Task Tracker... works as a Project Management dashboard" implies interaction.
-- However, User Request Point 5 says "Action: A 'Save' button... to persist the assignment" in Admin view.
-- And Point 4 says Contributor View: "Fetch... Highlight... Show tooltip". It doesn't explicitly say they can edit.
-- But usually they might mark it as done.
-- Re-reading: "1. DATABASE SCHEMA... Enable RLS: Admins/Mods have full access; Contributors can only read rows assigned to them."
-- So I will stick to READ ONLY for contributors for now as per explicit instructions.
