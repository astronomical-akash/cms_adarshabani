import { supabase } from '../lib/supabase';
import { MaterialStatus, UserRole } from '../types';

export interface UserStats {
    userId: string;
    userName: string;
    role: UserRole;
    totalUploads: number;
    approvedUploads: number;
    approvalRate: number;
}

export const getUserStats = async (): Promise<UserStats[]> => {
    try {
        // 1. Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('is_approved', true);

        if (profilesError) throw profilesError;

        // 2. Fetch all materials (we only need id, status, contributor_id)
        // Note: This might get heavy if there are thousands of materials. 
        // Ideally, we'd use a Supabase RPC or View for aggregation, but client-side is fine for now.
        const { data: materials, error: materialsError } = await supabase
            .from('materials')
            .select('id, status, contributor_id');

        if (materialsError) throw materialsError;

        // 3. Aggregate stats
        const statsMap = new Map<string, { total: number; approved: number }>();

        materials?.forEach(m => {
            if (!m.contributor_id) return;

            const current = statsMap.get(m.contributor_id) || { total: 0, approved: 0 };
            current.total++;
            if (m.status === MaterialStatus.APPROVED) {
                current.approved++;
            }
            statsMap.set(m.contributor_id, current);
        });

        // 4. Combine with profiles
        const stats: UserStats[] = profiles?.map(profile => {
            const userStat = statsMap.get(profile.id) || { total: 0, approved: 0 };
            const rate = userStat.total > 0
                ? Math.round((userStat.approved / userStat.total) * 100)
                : 0;

            return {
                userId: profile.id,
                userName: profile.full_name || 'Unknown',
                role: profile.role as UserRole,
                totalUploads: userStat.total,
                approvedUploads: userStat.approved,
                approvalRate: rate
            };
        }) || [];

        // Sort by total uploads descending
        return stats.sort((a, b) => b.totalUploads - a.totalUploads);

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return [];
    }
};
