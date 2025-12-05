import React, { useState, useEffect } from 'react';
import { getMyAssignments, updateAssignmentStatus, Assignment } from '../services/taskService';
import { Calendar, MessageSquare, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export const MyTasks: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            const data = await getMyAssignments();
            setAssignments(data);
        } catch (error) {
            console.error("Error loading tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const updated = await updateAssignmentStatus(id, newStatus);
            setAssignments(prev => prev.map(a => a.id === id ? updated : a));
        } catch (error) {
            console.error("Error updating status", error);
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredAssignments = assignments.filter(a => {
        if (activeTab === 'active') return a.status !== 'completed';
        return a.status === 'completed';
    });

    const isOverdue = (dateStr: string | null) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Tasks</h2>
                    <p className="text-sm text-gray-500">Manage your assigned curriculum work</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Active ({assignments.filter(a => a.status !== 'completed').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Completed ({assignments.filter(a => a.status === 'completed').length})
                    </button>
                </div>
            </div>

            {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                    <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        {activeTab === 'active' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Clock className="w-6 h-6 text-gray-400" />}
                    </div>
                    <h3 className="text-gray-900 font-medium">No {activeTab} tasks</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeTab === 'active' ? "You're all caught up!" : "No completed tasks yet."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAssignments.map(task => {
                        const overdue = task.status !== 'completed' && isOverdue(task.due_date);
                        return (
                            <div
                                key={task.id}
                                className={`bg-white rounded-lg border p-5 transition-all hover:shadow-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${overdue ? 'border-red-200 shadow-sm' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            {task.class_name}
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                                            {task.subject}
                                        </span>
                                        {overdue && (
                                            <span className="text-xs font-bold text-red-600 flex items-center gap-1 animate-pulse">
                                                <AlertCircle className="w-3 h-3" /> Overdue
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg">{task.chapter}</h3>
                                    <p className="text-indigo-600 font-medium text-sm">{task.topic}</p>

                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                                        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                                            <Calendar className="w-4 h-4" />
                                            <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}</span>
                                        </div>
                                        {task.comments && (
                                            <div className="flex items-center gap-1.5 text-gray-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <span className="italic">"{task.comments}"</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                                    <select
                                        disabled={updatingId === task.id}
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className={`w-full md:w-40 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 font-medium ${task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-white text-gray-700 border-gray-200'
                                            }`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    {updatingId === task.id && (
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
