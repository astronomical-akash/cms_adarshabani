-- Allow Contributors to update their own assignments
-- Specifically, we want them to be able to change status.
-- Ideally we restrict columns, but Supabase RLS policies are row-based.
-- Column-level security is harder in pure RLS unless we use triggers or check new values.
-- For now, we will allow UPDATE on rows where they are the contributor.

CREATE POLICY "Contributors can update their own assignments"
ON public.assignments
FOR UPDATE
USING (
    auth.uid() = contributor_id
)
WITH CHECK (
    auth.uid() = contributor_id
);
