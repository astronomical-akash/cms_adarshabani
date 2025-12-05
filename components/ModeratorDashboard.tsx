
import React, { useState, useEffect } from 'react';
import { Material, MaterialStatus } from '../types';
import { getMaterials, updateMaterialStatus, deleteMaterial } from '../services/storageService';
import { Check, X, ShieldCheck, Clock, User, BarChart, Trash2 } from 'lucide-react';

export const ModeratorDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'review' | 'analytics'>('review');
    const [materials, setMaterials] = useState<Material[]>([]);

    useEffect(() => {
        const loadMaterials = async () => {
            const data = await getMaterials();
            setMaterials(data);
        };
        loadMaterials();
    }, []);

    const handleStatusUpdate = async (id: string, status: MaterialStatus) => {
        await updateMaterialStatus(id, status);
        const data = await getMaterials(); // Refresh
        setMaterials(data);
    };

    const handleReject = async (id: string) => {
        if (window.confirm('Are you sure you want to REJECT and DELETE this material? This action cannot be undone.')) {
            await deleteMaterial(id);
            const data = await getMaterials(); // Refresh
            setMaterials(data);
        }
    };

    const pendingMaterials = materials.filter(m => m.status === MaterialStatus.PENDING);

    // Analytics Computation
    const contributorStats = React.useMemo(() => {
        const stats: Record<string, { total: number; approved: number; rejected: number }> = {};

        materials.forEach(m => {
            const name = m.contributorName || 'Anonymous';
            if (!stats[name]) stats[name] = { total: 0, approved: 0, rejected: 0 };

            stats[name].total++;
            if (m.status === MaterialStatus.APPROVED) stats[name].approved++;
            if (m.status === MaterialStatus.REJECTED) stats[name].rejected++;
        });

        return Object.entries(stats).map(([name, data]) => ({
            name,
            ...data,
            rate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0
        })).sort((a, b) => b.total - a.total);
    }, [materials]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        Moderator Dashboard
                    </h2>
                    <p className="text-sm text-gray-500">Review content and monitor contributor performance.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'review' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Review Queue ({pendingMaterials.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Contributor Analytics
                    </button>
                </div>
            </div>

            {activeTab === 'review' ? (
                <div className="space-y-4">
                    {pendingMaterials.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-gray-900 font-medium">All Caught Up!</h3>
                            <p className="text-gray-500 text-sm mt-1">There are no pending items to review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pendingMaterials.map(item => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>
                                                <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        {item.contributorName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(item.uploadDate).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                                                Pending Review
                                            </span>
                                        </div>

                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm border border-gray-100">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase">Class</span>
                                                    <span className="font-medium text-gray-700">{item.className}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase">Subject</span>
                                                    <span className="font-medium text-gray-700">{item.subject}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase">Topic</span>
                                                    <span className="font-medium text-gray-700">{item.topic}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase">Level</span>
                                                    <span className="font-medium text-indigo-600">{item.bloomsLevel.split('(')[0]}</span>
                                                </div>
                                            </div>
                                            <p className="text-gray-600 italic">
                                                "{item.description}"
                                            </p>
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                                                Preview File
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col gap-2 w-full md:w-auto min-w-[120px]">
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, MaterialStatus.APPROVED)}
                                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(item.id)}
                                            className="flex-1 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 hover:border-red-300 flex items-center justify-center gap-2 transition-colors"
                                            title="Permanently Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Reject & Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Contributor</th>
                                <th className="px-6 py-4 text-center">Total Uploads</th>
                                <th className="px-6 py-4 text-center text-green-600">Approved</th>
                                <th className="px-6 py-4 text-center text-red-600">Rejected</th>
                                <th className="px-6 py-4 text-right">Approval Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {contributorStats.map((stat) => (
                                <tr key={stat.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {stat.name.charAt(0)}
                                        </div>
                                        {stat.name}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">{stat.total}</td>
                                    <td className="px-6 py-4 text-center font-mono text-green-700 bg-green-50/50">{stat.approved}</td>
                                    <td className="px-6 py-4 text-center font-mono text-red-700 bg-red-50/50">{stat.rejected}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`font-bold ${stat.rate >= 80 ? 'text-green-600' : stat.rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                {stat.rate}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${stat.rate >= 80 ? 'bg-green-500' : stat.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${stat.rate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {contributorStats.length === 0 && (
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
    );
};
