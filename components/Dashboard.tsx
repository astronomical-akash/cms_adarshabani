import React, { useState, useMemo, useEffect } from 'react';
import { Material, BloomsLevel, CurriculumTree, MaterialStatus } from '../types';
import { BLOOMS_LEVELS, BLOOMS_DESCRIPTIONS } from '../constants';
import { getCurriculum, deleteMaterial } from '../services/storageService';
import { generateGapAnalysis } from '../services/geminiService';
import { getMyAssignments, Assignment } from '../services/taskService';
import { Sparkles, BarChart2, CheckCircle, Upload, Clock, Plus, X, FileText, Image, Film, ChevronRight, Eye, Trash2, Calendar, MessageSquare } from 'lucide-react';

interface DashboardProps {
  materials: Material[];
  onNavigateToUpload: (defaults?: any) => void;
  onPreview: (material: Material) => void;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ materials, onNavigateToUpload, onPreview, onRefresh }) => {
  const [curriculum, setCurriculum] = useState<CurriculumTree>({});

  // Selections
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const data = await getMyAssignments();
        setMyAssignments(data);
      } catch (e) {
        console.error("Error fetching assignments", e);
      }
    };
    fetchMyTasks();
  }, []);

  // Modal State for viewing multiple items
  const [viewingMaterials, setViewingMaterials] = useState<Material[] | null>(null);

  useEffect(() => {
    const loadCurriculum = async () => {
      const data = await getCurriculum();
      setCurriculum(data);

      // Set defaults
      const classes = Object.keys(data);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
        const subjects = Object.keys(data[classes[0]] || {});
        if (subjects.length > 0) setSelectedSubject(subjects[0]);
      }
    };
    loadCurriculum();
  }, []);

  // Handle Class Change to update Subject default
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    const subjects = Object.keys(curriculum[newClass] || {});
    if (subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    } else {
      setSelectedSubject('');
    }
    setSelectedChapter(''); // Reset chapter on class change
  };

  // Handle Subject Change
  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    setSelectedChapter(''); // Reset chapter on subject change
  };

  // Filter materials for current view
  const relevantMaterials = useMemo(() => {
    return materials.filter(m =>
      m.className === selectedClass &&
      m.subject === selectedSubject &&
      (selectedChapter === '' || m.chapter === selectedChapter)
    );
  }, [materials, selectedClass, selectedSubject, selectedChapter]);

  // Compute coverage stats
  const coverageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    BLOOMS_LEVELS.forEach(level => {
      stats[level] = relevantMaterials.filter(m => m.bloomsLevel === level && m.status === MaterialStatus.APPROVED).length;
    });
    return stats;
  }, [relevantMaterials]);

  const handleAnalyzeGaps = async () => {
    setIsAnalyzing(true);
    const result = await generateGapAnalysis(selectedSubject, selectedClass, coverageStats);
    setAnalysis(result || null);
    setIsAnalyzing(false);
  };

  const getMaterialsForCell = (chapter: string, topic: string, subtopic: string, level: BloomsLevel) => {
    // Sort by upload date descending (newest first)
    return relevantMaterials.filter(m =>
      m.chapter === chapter &&
      m.topic === topic &&
      m.subtopic === subtopic &&
      m.bloomsLevel === level
    ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  };

  const getIconForType = (type: string) => {
    if (type.includes('image')) return <Image className="w-5 h-5" />;
    if (type.includes('mp4') || type.includes('video')) return <Film className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // Get structure for table
  const currentStructure = curriculum[selectedClass]?.[selectedSubject] || {};
  // Sort chapters alphabetically for better organization
  const allChapters = Object.keys(currentStructure).sort();

  // Filter chapters based on selection
  const visibleChapters = selectedChapter ? [selectedChapter] : allChapters;


  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      try {
        await deleteMaterial(id);
        if (onRefresh) onRefresh();

        // Update local viewing materials if modal is open
        if (viewingMaterials) {
          const updated = viewingMaterials.filter(m => m.id !== id);
          if (updated.length === 0) {
            setViewingMaterials(null);
          } else {
            setViewingMaterials(updated);
          }
        }
      } catch (error) {
        alert('Failed to delete material');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">

      {/* View Modal Overlay */}
      {viewingMaterials && viewingMaterials.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Uploaded Content</h3>
                <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                  <span className="font-medium text-gray-700">
                    {viewingMaterials[0].subject} &rsaquo; {viewingMaterials[0].chapter}
                  </span>
                  <span>
                    {viewingMaterials[0].topic} &rsaquo; {viewingMaterials[0].subtopic}
                  </span>
                  <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 w-fit">
                    {viewingMaterials[0].bloomsLevel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingMaterials(null)}
                className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 border border-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto custom-scrollbar bg-gray-50/30">
              <div className="space-y-2">
                {viewingMaterials.map((material) => (
                  <div
                    key={material.id}
                    onClick={() => {
                      setViewingMaterials(null); // Close modal
                      onPreview(material);
                    }}
                    className="group bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${material.type.includes('image') ? 'bg-purple-50 text-purple-600' :
                      material.type.includes('mp4') ? 'bg-rose-50 text-rose-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                      {getIconForType(material.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-indigo-700 transition-colors">
                          {material.title}
                        </h4>
                        {material.status === MaterialStatus.APPROVED ? (
                          <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 h-fit">Approved</span>
                        ) : material.status === MaterialStatus.PENDING ? (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 h-fit">Pending</span>
                        ) : (
                          <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 h-fit">Rejected</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {material.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 uppercase">
                          {material.type}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(material.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDelete(material.id, e)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Content Matrix</h2>
          <p className="text-sm text-gray-500">Track coverage across 3 levels: Readiness, Understand, Apply</p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2 bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
          >
            {Object.keys(curriculum).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2 bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
          >
            {curriculum[selectedClass] ? Object.keys(curriculum[selectedClass]).map(s => (
              <option key={s} value={s}>{s}</option>
            )) : <option>No Subjects</option>}
          </select>
          <select
            className="border rounded-md px-3 py-2 bg-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            disabled={!selectedSubject}
          >
            <option value="">All Chapters</option>
            {allChapters.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-indigo-800 font-semibold">
            <Sparkles className="w-5 h-5" />
            <span>Gemini Insights</span>
          </div>
          <button
            onClick={handleAnalyzeGaps}
            disabled={isAnalyzing}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Gaps'}
          </button>
        </div>
        {analysis ? (
          <div className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
            {analysis}
          </div>
        ) : (
          <p className="text-sm text-indigo-400 italic">
            Click "Analyze Gaps" to get AI recommendations on your content strategy.
          </p>
        )}
      </div>

      {/* The Matrix */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        {visibleChapters.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
            <p>No curriculum data found for this selection.</p>
            <p className="text-xs">Go to "Manage Hierarchy" to add chapters.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3 border-b w-1/3">Chapter / Topic / Subtopic</th>
                {BLOOMS_LEVELS.map(level => (
                  <th key={level} className="px-4 py-3 border-b text-center min-w-[140px]">
                    <div className="flex flex-col">
                      <span>{level.split('(')[0]}</span>
                      <span className="text-[10px] text-gray-500 font-normal">{BLOOMS_DESCRIPTIONS[level]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleChapters.map(chapter => {
                const topicsObj = currentStructure[chapter];
                if (!topicsObj) return null;

                // Sort topics alphabetically
                const topicNames = Object.keys(topicsObj).sort();
                if (topicNames.length === 0) return null;

                return topicNames.map((topic) => {
                  const subtopics = topicsObj[topic];

                  // Sort subtopics alphabetically
                  return subtopics.sort().map((subtopic: string) => (
                    <tr key={`${chapter}-${topic}-${subtopic}`} className="hover:bg-gray-50 group/row">
                      <td className="px-4 py-3 border-r bg-white">
                        <div className="font-semibold text-gray-800">{chapter}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <span className="font-medium text-gray-600">{topic}</span>
                          <span>&rsaquo;</span>
                          <span>{subtopic}</span>
                        </div>

                      </td>
                      {BLOOMS_LEVELS.map(level => {
                        const cellMaterials = getMaterialsForCell(chapter, topic, subtopic, level);
                        const hasMaterial = cellMaterials.length > 0;
                        const materialCount = cellMaterials.length;

                        // Check moderation status
                        const hasPending = cellMaterials.some(m => m.status === MaterialStatus.PENDING);
                        const allApproved = cellMaterials.length > 0 && cellMaterials.every(m => m.status === MaterialStatus.APPROVED);

                        // Check assignment
                        const assignment = myAssignments.find(a =>
                          a.class_name === selectedClass &&
                          a.subject === selectedSubject &&
                          a.chapter === chapter &&
                          a.topic === topic
                        );

                        return (
                          <td key={level} className={`px-4 py-3 text-center border-r last:border-r-0 relative group/cell align-middle h-16 ${assignment ? 'bg-yellow-50/50' : ''}`}>
                            {assignment && level === BloomsLevel.LEVEL_0 && ( // Show indicator only once per row, e.g. on first cell
                              <div className="absolute top-1 left-1 text-yellow-600 z-10 group/info">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                {/* Tooltip */}
                                <div className="hidden group-hover/info:block absolute left-4 top-0 w-64 bg-white p-3 rounded-lg shadow-xl border border-yellow-200 z-[50] text-left">
                                  <div className="text-xs font-bold text-gray-900 mb-1">Assigned to You</div>
                                  <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                                    <Calendar className="w-3 h-3" />
                                    Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Date'}
                                  </div>
                                  {assignment.comments && (
                                    <div className="text-xs text-gray-500 flex items-start gap-1 p-1 bg-yellow-50 rounded">
                                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                      <span className="italic">{assignment.comments}</span>
                                    </div>
                                  )}
                                  <div className="mt-2 text-xs font-medium text-indigo-600">
                                    Status: {assignment.status.replace('_', ' ').toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-center w-full h-full">
                              {hasMaterial ? (
                                <>
                                  {/* Default View (Hidden on Hover) */}
                                  <div className="flex flex-col items-center gap-1 group-hover/cell:opacity-0 transition-opacity duration-200">
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border shadow-sm ${allApproved
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                      {allApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                      <span>View ({materialCount})</span>
                                    </div>
                                    {hasPending && <span className="text-[9px] text-amber-600/60 font-medium mt-0.5">Under Review</span>}
                                  </div>

                                  {/* Hover Options Overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 bg-white/95 backdrop-blur-[1px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingMaterials(cellMaterials);
                                      }}
                                      className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors"
                                      title="View Files"
                                    >
                                      <div className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                      <span className="font-medium text-[10px]">View</span>
                                    </button>

                                    <div className="w-px h-8 bg-gray-200"></div>

                                    <button
                                      onClick={() => onNavigateToUpload({
                                        class: selectedClass,
                                        subject: selectedSubject,
                                        chapter: chapter,
                                        topic: topic,
                                        subtopic: subtopic,
                                        bloomsLevel: level
                                      })}
                                      className="flex flex-col items-center justify-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                                      title="Add More Content"
                                    >
                                      <div className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                                        <Plus className="w-4 h-4" />
                                      </div>
                                      <span className="font-medium text-[10px]">Add</span>
                                    </button>
                                  </div>
                                </>
                              ) : (
                                /* State: Empty */
                                <>
                                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200 group-hover/cell:scale-0 transition-transform duration-200" />

                                  {/* Hover Upload Button */}
                                  <button
                                    onClick={() => onNavigateToUpload({
                                      class: selectedClass,
                                      subject: selectedSubject,
                                      chapter: chapter,
                                      topic: topic,
                                      subtopic: subtopic,
                                      bloomsLevel: level
                                    })}
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200"
                                  >
                                    <div className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded shadow-sm border border-blue-100 hover:bg-blue-100">
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="font-medium">Upload</span>
                                    </div>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ));
                });
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onNavigateToUpload()}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <BarChart2 className="w-4 h-4" />
          <span>Upload Missing Content</span>
        </button>
      </div>
    </div >
  );
};