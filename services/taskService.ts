import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface Assignment {
    id: string;
    contributor_id: string | null;
    assigned_by: string;
    class_name: string;
    subject: string;
    chapter: string;
    topic: string;
    status: 'pending' | 'in_progress' | 'completed';
    due_date: string | null; // ISO string
    comments: string | null;
    created_at: string;
    updated_at?: string;
}

export const fetchAssignments = async (className: string, subject: string) => {
    const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_name', className)
        .eq('subject', subject);

    if (error) throw error;
    return data as Assignment[];
};

export const fetchContributors = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('is_approved', true)
        // We typically want contributors, but moderators might also be assigned tasks.
        // Fetching all approved users who are NOT admins might be safer, 
        // or just 'contributor' and 'moderator'.
        .in('role', ['contributor', 'moderator']);

    if (error) throw error;
    return data as Partial<User>[];
};

export const upsertAssignment = async (assignmentData: Partial<Assignment>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const payload: any = {
        ...assignmentData,
        updated_at: new Date().toISOString(),
    };

    // Only set assigned_by on creation if not present
    if (!assignmentData.id) {
        payload.assigned_by = user.id;
    }

    const { data, error } = await supabase
        .from('assignments')
        .upsert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMyAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('contributor_id', user.id);

    if (error) throw error;
    return data as Assignment[];
};
