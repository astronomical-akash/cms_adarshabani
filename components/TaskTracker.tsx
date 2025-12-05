import React, { useState, useEffect } from 'react';
import { getCurriculum } from '../services/storageService';
import { fetchAssignments, fetchContributors, upsertAssignment, Assignment } from '../services/taskService';
import { CurriculumTree, User } from '../types';
import { Save, Loader2, Calendar, User as UserIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const TaskTracker: React.FC = () => {
    const [curriculum, setCurriculum] = useState<CurriculumTree>({});
    const [contributors, setContributors] = useState<Partial<User>[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');

    // Loading States
    const [loadingData, setLoadingData] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [currData, contData] = await Promise.all([
                    getCurriculum(),
                    fetchContributors()
                ]);
                setCurriculum(currData);
                setContributors(contData);

                // Set defaults
                const classes = Object.keys(currData);
                if (classes.length > 0) {
                    setSelectedClass(classes[0]);
                    const subjects = Object.keys(currData[classes[0]] || {});
                    if (subjects.length > 0) setSelectedSubject(subjects[0]);
                }
            } catch (error) {
                console.error("Error loading initial data", error);
            } finally {
                setLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    // Fetch assignments when filters change
    useEffect(() => {
        if (selectedClass && selectedSubject) {
            const loadAssignments = async () => {
                try {
                    const data = await fetchAssignments(selectedClass, selectedSubject);
                    setAssignments(data);
                } catch (error) {
                    console.error("Error loading assignments", error);
                }
            };
            loadAssignments();
        }
    }, [selectedClass, selectedSubject]);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClass = e.target.value;
        setSelectedClass(newClass);
        const subjects = Object.keys(curriculum[newClass] || {});
        if (subjects.length > 0) setSelectedSubject(subjects[0]);
        else setSelectedSubject('');
    };

    const getAssignmentForRow = (chapter: string, topic: string) => {
        return assignments.find(a => a.chapter === chapter && a.topic === topic);
    };

    const handleSave = async (chapter: string, topic: string, data: Partial<Assignment>) => {
        const key = `${chapter}-${topic}`;
        setSavingId(key);
        try {
            const existing = getAssignmentForRow(chapter, topic);

            const payload: Partial<Assignment> = {
                ...data,
                class_name: selectedClass,
                subject: selectedSubject,
                chapter,
                topic,
                id: existing?.id // If exists, update
            };

            const saved = await upsertAssignment(payload);

            // Update local state
            setAssignments(prev => {
                if (existing) {
                    return prev.map(a => a.id === saved.id ? saved : a);
                } else {
                    return [...prev, saved];
                }
            });
        } catch (error) {
            console.error("Error saving assignment", error);
            alert("Failed to save assignment");
        } finally {
            setSavingId(null);
        }
    };

    // Render Rows
    const renderRows = () => {
        if (!selectedClass || !selectedSubject || !curriculum[selectedClass]?.[selectedSubject]) {
            return <tr><td colSpan={6} className="text-center py-8 text-gray-500">No data available</td></tr>;
        }

        const structure = curriculum[selectedClass][selectedSubject];
        const chapters = Object.keys(structure).sort();

        return chapters.flatMap(chapter => {
            const topics = Object.keys(structure[chapter]).sort();
            return topics.map(topic => {
                const assignment = getAssignmentForRow(chapter, topic);
                const uniqueKey = `${chapter}-${topic}`;
                const isSaving = savingId === uniqueKey;

                // Local state for inputs (managed here to avoid re-renders of whole list on every keystroke if properly separated, 
                // but for simplicity we might just use defaultValue or controlled components at row level.
                // To keep it simple, I'll make a Row component or just inline controlled logic carefully. 
                // Actually, uncontrolled with refs or onBlur/Save button is better for performance in big lists.
                // But "Save" button is explicitly requested.
                return (
                    <AssignmentRow
                        key={uniqueKey}
                        chapter={chapter}
                        topic={topic}
                        assignment={assignment}
                        contributors={contributors}
                        onSave={(data) => handleSave(chapter, topic, data)}
                        isSaving={isSaving}
                    />
                );
            });
        });
    };

    if (loadingData) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Task Tracker</h2>
                    <p className="text-sm text-gray-500">Assign and monitor curriculum progress</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="border rounded-md px-3 py-2 bg-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={selectedClass}
                        onChange={handleClassChange}
                    >
                        {Object.keys(curriculum).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="border rounded-md px-3 py-2 bg-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        {curriculum[selectedClass] ? Object.keys(curriculum[selectedClass]).map(s => (
                            <option key={s} value={s}>{s}</option>
                        )) : <option>No Subjects</option>}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            <th className="px-4 py-3 border-b border-r w-1/4">Chapter / Topic</th>
                            <th className="px-4 py-3 border-b w-1/6">Assigned To</th>
                            <th className="px-4 py-3 border-b w-1/6">Due Date</th>
                            <th className="px-4 py-3 border-b w-1/6">Status</th>
                            <th className="px-4 py-3 border-b w-1/4">Comments</th>
                            <th className="px-4 py-3 border-b w-[80px]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {renderRows()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Sub-component for Row to manage local state before save
const AssignmentRow: React.FC<{
    chapter: string;
    topic: string;
    assignment?: Assignment;
    contributors: Partial<User>[];
    onSave: (data: Partial<Assignment>) => void;
    isSaving: boolean;
}> = ({ chapter, topic, assignment, contributors, onSave, isSaving }) => {
    const [contributorId, setContributorId] = useState(assignment?.contributor_id || '');
    const [dueDate, setDueDate] = useState(assignment?.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '');
    const [status, setStatus] = useState<any>(assignment?.status || 'pending');
    const [comments, setComments] = useState(assignment?.comments || '');
    const [isDirty, setIsDirty] = useState(false);

    // Reset local state if assignment prop changes (e.g. after save)
    useEffect(() => {
        setContributorId(assignment?.contributor_id || '');
        setDueDate(assignment?.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '');
        setStatus(assignment?.status || 'pending');
        setComments(assignment?.comments || '');
        setIsDirty(false);
    }, [assignment]);

    const handleLocalChange = (setter: any, value: any) => {
        setter(value);
        setIsDirty(true);
    };

    const handleSaveClick = () => {
        onSave({
            contributor_id: contributorId || null,
            due_date: dueDate || null,
            status,
            comments
        });
    };

    return (
        <tr className="hover:bg-gray-50 group">
            <td className="px-4 py-3 border-r">
                <div className="font-semibold text-gray-800">{chapter}</div>
                <div className="text-xs text-gray-500">{topic}</div>
            </td>
            <td className="px-4 py-3">
                <select
                    className="w-full border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 py-1.5"
                    value={contributorId}
                    onChange={(e) => handleLocalChange(setContributorId, e.target.value)}
                >
                    <option value="">Unassigned</option>
                    {contributors.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name || u.id}</option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3">
                <input
                    type="date"
                    className="w-full border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 py-1.5"
                    value={dueDate}
                    onChange={(e) => handleLocalChange(setDueDate, e.target.value)}
                />
            </td>
            <td className="px-4 py-3">
                <select
                    className={`w-full rounded text-sm focus:ring-1 focus:ring-indigo-500 py-1.5 border-gray-200
                        ${status === 'completed' ? 'text-green-700 bg-green-50' :
                            status === 'in_progress' ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                    value={status}
                    onChange={(e) => handleLocalChange(setStatus, e.target.value)}
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </td>
            <td className="px-4 py-3">
                <input
                    type="text"
                    placeholder="Add comments..."
                    className="w-full border-gray-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 py-1.5"
                    value={comments}
                    onChange={(e) => handleLocalChange(setComments, e.target.value)}
                />
            </td>
            <td className="px-4 py-3 text-center">
                <button
                    onClick={handleSaveClick}
                    disabled={!isDirty || isSaving}
                    className={`p-2 rounded-full transition-all ${isDirty
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                    title={isDirty ? "Save Changes" : "No Changes"}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
            </td>
        </tr>
    );
};
