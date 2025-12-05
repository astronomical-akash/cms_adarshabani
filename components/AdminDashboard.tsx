import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { getUserStats, UserStats } from '../services/adminService';
import { Check, X, Shield, User as UserIcon, AlertCircle, Loader2, BarChart2, Users } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'requests' | 'performance'>('requests');
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [userStats, setUserStats] = useState<UserStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchPendingUsers();
        } else {
            fetchUserStats();
        }
    }, [activeTab]);

    const fetchPendingUsers = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false)
            .eq('is_banned', false);

        if (error) {
            console.error('Error fetching pending users:', error);
        } else {
            // We need to fetch emails from auth if possible, but we can't easily from client.
            // However, we can display what we have (full_name, role request).
            // For now, we'll just display the profile data.
            setPendingUsers(data as User[] || []);
        }
        setIsLoading(false);
    };

    const fetchUserStats = async () => {
        setIsLoading(true);
        const stats = await getUserStats();
        setUserStats(stats);
        setIsLoading(false);
    };

    const handleApprove = async (userId: string, role: UserRole) => {
        setActionLoading(userId);
        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: true,
                role: role
            })
            .eq('id', userId);

        if (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        } else {
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        }
        setActionLoading(null);
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Are you sure you want to reject (ban) this user?')) return;

        setActionLoading(userId);
        // We'll mark as banned instead of deleting to keep a record, or we could delete.
        // User asked to "Delete or mark as rejected". Banning is safer.
        const { error } = await supabase
            .from('profiles')
            .update({
                is_banned: true
            })
            .eq('id', userId);

        if (error) {
            console.error('Error rejecting user:', error);
            alert('Failed to reject user');
        } else {
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        }
        setActionLoading(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        Admin Dashboard
                    </h2>
                    <p className="text-sm text-gray-500">Manage user access and permissions.</p>
                </div>
                <div className="flex space-x-4 mb-6">
                    {/* Requests Tab */}
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'requests'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Pending Requests ({pendingUsers.length})
                    </button>

                    {/* Performance Tab */}
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'performance'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Contributor Performance
                    </button>
                </div>
            </div>

            {activeTab === 'requests' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Pending Approval Requests
                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                {pendingUsers.length}
                            </span>
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : pendingUsers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6" />
                            </div>
                            <p>No pending requests.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                                            {user.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{user.full_name || 'Unknown Name'}</h4>
                                            <p className="text-sm text-gray-500">Requested Role: <span className="uppercase text-xs font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{user.role}</span></p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {user.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="flex items-center gap-2 mr-2">
                                            <label className="text-xs text-gray-500">Assign:</label>
                                            <select
                                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                defaultValue={user.role}
                                                id={`role-${user.id}`}
                                            >
                                                <option value={UserRole.CONTRIBUTOR}>Contributor</option>
                                                <option value={UserRole.MODERATOR}>Moderator</option>
                                                <option value={UserRole.ADMIN}>Admin</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const select = document.getElementById(`role-${user.id}`) as HTMLSelectElement;
                                                handleApprove(user.id, select.value as UserRole);
                                            }}
                                            disabled={actionLoading === user.id}
                                            className="flex-1 md:flex-none bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Approve
                                        </button>

                                        <button
                                            onClick={() => handleReject(user.id)}
                                            disabled={actionLoading === user.id}
                                            className="flex-1 md:flex-none bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-indigo-600" />
                            Contributor Performance
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">User Name</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4 text-center">Total Uploads</th>
                                        <th className="px-6 py-4 text-center text-green-600">Approved</th>
                                        <th className="px-6 py-4 text-right">Approval Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {userStats.map((stat) => (
                                        <tr key={stat.userId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                    {stat.userName.charAt(0)}
                                                </div>
                                                {stat.userName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="uppercase text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {stat.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-gray-600">{stat.totalUploads}</td>
                                            <td className="px-6 py-4 text-center font-mono text-green-700 bg-green-50/30">{stat.approvedUploads}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`font-bold ${stat.approvalRate >= 80 ? 'text-green-600' : stat.approvalRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {stat.approvalRate}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${stat.approvalRate >= 80 ? 'bg-green-500' : stat.approvalRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${stat.approvalRate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {userStats.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                No contributor data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
