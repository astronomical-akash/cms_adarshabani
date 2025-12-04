
import React, { useState, useEffect, useRef } from 'react';
import { CurriculumTree } from '../types';
import { getCurriculum, saveCurriculum } from '../services/storageService';
import { Plus, Trash2, ChevronRight, FolderTree, Pencil, GripVertical, Check, X } from 'lucide-react';

interface HierarchyColumnProps {
  title: string;
  items: string[];
  selected: string | null;
  onSelect: (item: string) => void;
  onDelete: (item: string) => void;
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  level: string;
  parentName?: string | null;
}

const HierarchyColumn: React.FC<HierarchyColumnProps> = ({
  title,
  items,
  selected,
  onSelect,
  onDelete,
  onAdd,
  onRename,
  onReorder,
  level,
  parentName
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const selectedRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when selection changes
  useEffect(() => {
    if (selected && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selected]);

  const handleAddSubmit = () => {
    if (newItemName.trim()) {
      onAdd(newItemName.trim());
      setNewItemName('');
      setIsAdding(false);
      setTimeout(() => {
          if (listRef.current) {
              listRef.current.scrollTop = listRef.current.scrollHeight;
          }
      }, 100);
    }
  };

  const handleRenameSubmit = () => {
    if (editingItem && editName.trim() && editName !== editingItem) {
        onRename(editingItem, editName.trim());
    }
    setEditingItem(null);
    setEditName('');
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer to be set
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // We only trigger reorder on Drop to avoid jitter, or we could do it here for live feedback
    // but React rendering might be expensive. For simplicity in this non-library solution,
    // let's do visual feedback on drop or allow dropping.
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="flex-1 min-w-[240px] max-w-[320px] border-r border-gray-200 flex flex-col bg-white first:rounded-l-lg last:rounded-r-lg last:border-r-0 transition-all duration-300 animate-in slide-in-from-left-4 fade-in">
      <div className="p-4 bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 flex flex-col gap-1 sticky top-0 z-10">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {title}
                <span className="bg-white border border-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{items.length}</span>
            </h3>
            <button
                onClick={() => setIsAdding(!isAdding)}
                className={`p-1.5 rounded-md transition-colors ${isAdding ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title={`Add ${title}`}
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
        {parentName && (
            <div className="text-xs text-gray-400 truncate flex items-center gap-1" title={`Parent: ${parentName}`}>
                <span className="text-gray-300">↳</span> {parentName}
            </div>
        )}
      </div>

      {isAdding && (
        <div className="p-3 bg-indigo-50/30 border-b border-indigo-100 animate-in slide-in-from-top-2">
            <input
                autoFocus
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubmit()}
                placeholder={`Name...`}
                className="w-full text-sm border border-indigo-200 rounded-md px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm bg-white"
            />
            <div className="flex gap-2 justify-end">
                <button
                    onClick={() => { setIsAdding(false); setNewItemName(''); }}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAddSubmit}
                    disabled={!newItemName.trim()}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Add
                </button>
            </div>
        </div>
      )}

      <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
        {items.map((item, index) => (
            <div
                key={item}
                ref={selected === item ? selectedRef : null}
                draggable={!editingItem}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => !editingItem && onSelect(item)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-sm border-l-[3px] transition-all duration-200 ${
                    selected === item
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-medium shadow-sm'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200'
                } ${editingItem ? '' : 'cursor-pointer'} ${draggedIndex === index ? 'opacity-50 border-dashed border-gray-400 bg-gray-50' : ''}`}
            >
                {editingItem === item ? (
                    <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <input 
                            autoFocus
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full text-xs border rounded px-1.5 py-1 focus:outline-indigo-500"
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') setEditingItem(null);
                            }}
                        />
                        <button onClick={handleRenameSubmit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-3 h-3" /></button>
                        <button onClick={() => setEditingItem(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X className="w-3 h-3" /></button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 truncate flex-1">
                             <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing" />
                             <span className="truncate" title={item}>{item}</span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditName(item); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 p-1.5 rounded hover:bg-blue-50 transition-all"
                                title="Rename"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-all mr-1"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                             {level !== 'subtopic' && (
                                <ChevronRight className={`w-4 h-4 ${selected === item ? 'text-indigo-400' : 'text-gray-200 group-hover:text-gray-300'}`} />
                             )}
                        </div>
                    </>
                )}
            </div>
        ))}
        {items.length === 0 && !isAdding && (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                <FolderTree className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">Empty</p>
                <button onClick={() => setIsAdding(true)} className="mt-2 text-xs text-indigo-500 hover:underline">Add Item</button>
            </div>
        )}
      </div>
    </div>
  );
};

export const HierarchyManager: React.FC = () => {
  const [curriculum, setCurriculum] = useState<CurriculumTree>({});
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    setCurriculum(getCurriculum());
  }, []);

  const handleSave = (updated: CurriculumTree) => {
    setCurriculum(updated);
    saveCurriculum(updated);
  };

  // Helper to reorder keys in an object
  const reorderObjectKeys = (obj: any, dragIndex: number, hoverIndex: number) => {
    const keys = Object.keys(obj);
    const result: any = {};
    const [removed] = keys.splice(dragIndex, 1);
    keys.splice(hoverIndex, 0, removed);
    keys.forEach(key => {
        result[key] = obj[key];
    });
    return result;
  };

  // Helper to rename a key in an object, preserving order
  const renameObjectKey = (obj: any, oldKey: string, newKey: string) => {
    const keys = Object.keys(obj);
    const result: any = {};
    keys.forEach(key => {
        if (key === oldKey) {
            result[newKey] = obj[oldKey];
        } else {
            result[key] = obj[key];
        }
    });
    return result;
  };

  const handleReorder = (level: string, dragIndex: number, hoverIndex: number) => {
     let updated = JSON.parse(JSON.stringify(curriculum));

     if (level === 'class') {
         updated = reorderObjectKeys(updated, dragIndex, hoverIndex);
     } else if (level === 'subject' && selectedClass) {
         updated[selectedClass] = reorderObjectKeys(updated[selectedClass], dragIndex, hoverIndex);
     } else if (level === 'chapter' && selectedClass && selectedSubject) {
         updated[selectedClass][selectedSubject] = reorderObjectKeys(updated[selectedClass][selectedSubject], dragIndex, hoverIndex);
     } else if (level === 'topic' && selectedClass && selectedSubject && selectedChapter) {
         updated[selectedClass][selectedSubject][selectedChapter] = reorderObjectKeys(updated[selectedClass][selectedSubject][selectedChapter], dragIndex, hoverIndex);
     } else if (level === 'subtopic' && selectedClass && selectedSubject && selectedChapter && selectedTopic) {
         // Array reorder is simpler
         const arr = updated[selectedClass][selectedSubject][selectedChapter][selectedTopic];
         const [removed] = arr.splice(dragIndex, 1);
         arr.splice(hoverIndex, 0, removed);
     }
     handleSave(updated);
  };

  const handleRename = (level: string, oldName: string, newName: string) => {
     let updated = JSON.parse(JSON.stringify(curriculum));

     if (level === 'class') {
         if (updated[newName]) { alert("Name already exists!"); return; }
         updated = renameObjectKey(updated, oldName, newName);
         if (selectedClass === oldName) setSelectedClass(newName);
     } else if (level === 'subject' && selectedClass) {
         if (updated[selectedClass][newName]) { alert("Name already exists!"); return; }
         updated[selectedClass] = renameObjectKey(updated[selectedClass], oldName, newName);
         if (selectedSubject === oldName) setSelectedSubject(newName);
     } else if (level === 'chapter' && selectedClass && selectedSubject) {
         if (updated[selectedClass][selectedSubject][newName]) { alert("Name already exists!"); return; }
         updated[selectedClass][selectedSubject] = renameObjectKey(updated[selectedClass][selectedSubject], oldName, newName);
         if (selectedChapter === oldName) setSelectedChapter(newName);
     } else if (level === 'topic' && selectedClass && selectedSubject && selectedChapter) {
         if (updated[selectedClass][selectedSubject][selectedChapter][newName]) { alert("Name already exists!"); return; }
         updated[selectedClass][selectedSubject][selectedChapter] = renameObjectKey(updated[selectedClass][selectedSubject][selectedChapter], oldName, newName);
         if (selectedTopic === oldName) setSelectedTopic(newName);
     } else if (level === 'subtopic' && selectedClass && selectedSubject && selectedChapter && selectedTopic) {
         const arr = updated[selectedClass][selectedSubject][selectedChapter][selectedTopic];
         if (arr.includes(newName)) { alert("Name already exists!"); return; }
         const index = arr.indexOf(oldName);
         if (index !== -1) arr[index] = newName;
     }

     handleSave(updated);
  };

  const handleAddItem = (level: string, name: string) => {
    const updated = JSON.parse(JSON.stringify(curriculum));

    if (level === 'class') {
      if (!updated[name]) updated[name] = {};
    } else if (level === 'subject' && selectedClass) {
      if (!updated[selectedClass][name]) updated[selectedClass][name] = {};
    } else if (level === 'chapter' && selectedClass && selectedSubject) {
      if (!updated[selectedClass][selectedSubject][name]) updated[selectedClass][selectedSubject][name] = {};
    } else if (level === 'topic' && selectedClass && selectedSubject && selectedChapter) {
      if (!updated[selectedClass][selectedSubject][selectedChapter][name]) updated[selectedClass][selectedSubject][selectedChapter][name] = [];
    } else if (level === 'subtopic' && selectedClass && selectedSubject && selectedChapter && selectedTopic) {
      // Avoid duplicates
      if (!updated[selectedClass][selectedSubject][selectedChapter][selectedTopic].includes(name)) {
        updated[selectedClass][selectedSubject][selectedChapter][selectedTopic].push(name);
      }
    }

    handleSave(updated);
  };

  const handleDeleteItem = (level: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all its sub-items.`)) return;
    
    const updated = JSON.parse(JSON.stringify(curriculum));
    
    if (level === 'class') {
        delete updated[name];
        if (selectedClass === name) setSelectedClass(null);
    } else if (level === 'subject' && selectedClass) {
        delete updated[selectedClass][name];
        if (selectedSubject === name) setSelectedSubject(null);
    } else if (level === 'chapter' && selectedClass && selectedSubject) {
        delete updated[selectedClass][selectedSubject][name];
        if (selectedChapter === name) setSelectedChapter(null);
    } else if (level === 'topic' && selectedClass && selectedSubject && selectedChapter) {
        delete updated[selectedClass][selectedSubject][selectedChapter][name];
        if (selectedTopic === name) setSelectedTopic(null);
    } else if (level === 'subtopic' && selectedClass && selectedSubject && selectedChapter && selectedTopic) {
        const arr = updated[selectedClass][selectedSubject][selectedChapter][selectedTopic];
        updated[selectedClass][selectedSubject][selectedChapter][selectedTopic] = arr.filter((s: string) => s !== name);
    }

    handleSave(updated);
  };

  // Derived Lists
  const classes = Object.keys(curriculum);
  const subjects = selectedClass ? Object.keys(curriculum[selectedClass] || {}) : [];
  const chapters = (selectedClass && selectedSubject) ? Object.keys(curriculum[selectedClass][selectedSubject] || {}) : [];
  const topics = (selectedClass && selectedSubject && selectedChapter) ? Object.keys(curriculum[selectedClass][selectedSubject][selectedChapter] || {}) : [];
  const subtopics = (selectedClass && selectedSubject && selectedChapter && selectedTopic) ? (curriculum[selectedClass][selectedSubject][selectedChapter][selectedTopic] || []) : [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
        <div className="mb-4 flex items-end justify-between px-1">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Hierarchy</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Select items to navigate, drag to reorder, or click pencil to rename.
                </p>
            </div>
        </div>

        <div className="flex-1 border border-gray-200 rounded-xl shadow-lg bg-gray-50/50 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex h-full min-w-max">
                <HierarchyColumn
                    title="Class"
                    level="class"
                    items={classes}
                    selected={selectedClass}
                    onSelect={(i) => { setSelectedClass(i); setSelectedSubject(null); setSelectedChapter(null); setSelectedTopic(null); }}
                    onAdd={(name) => handleAddItem('class', name)}
                    onDelete={(name) => handleDeleteItem('class', name)}
                    onRename={(oldN, newN) => handleRename('class', oldN, newN)}
                    onReorder={(d, h) => handleReorder('class', d, h)}
                />
                
                {selectedClass && (
                    <HierarchyColumn
                        title="Subject"
                        level="subject"
                        parentName={selectedClass}
                        items={subjects}
                        selected={selectedSubject}
                        onSelect={(i) => { setSelectedSubject(i); setSelectedChapter(null); setSelectedTopic(null); }}
                        onAdd={(name) => handleAddItem('subject', name)}
                        onDelete={(name) => handleDeleteItem('subject', name)}
                        onRename={(oldN, newN) => handleRename('subject', oldN, newN)}
                        onReorder={(d, h) => handleReorder('subject', d, h)}
                    />
                )}
                
                {selectedSubject && (
                    <HierarchyColumn
                        title="Chapter"
                        level="chapter"
                        parentName={selectedSubject}
                        items={chapters}
                        selected={selectedChapter}
                        onSelect={(i) => { setSelectedChapter(i); setSelectedTopic(null); }}
                        onAdd={(name) => handleAddItem('chapter', name)}
                        onDelete={(name) => handleDeleteItem('chapter', name)}
                        onRename={(oldN, newN) => handleRename('chapter', oldN, newN)}
                        onReorder={(d, h) => handleReorder('chapter', d, h)}
                    />
                )}
                
                {selectedChapter && (
                    <HierarchyColumn
                        title="Topic"
                        level="topic"
                        parentName={selectedChapter}
                        items={topics}
                        selected={selectedTopic}
                        onSelect={(i) => { setSelectedTopic(i); }}
                        onAdd={(name) => handleAddItem('topic', name)}
                        onDelete={(name) => handleDeleteItem('topic', name)}
                        onRename={(oldN, newN) => handleRename('topic', oldN, newN)}
                        onReorder={(d, h) => handleReorder('topic', d, h)}
                    />
                )}
                
                {selectedTopic && (
                    <HierarchyColumn
                        title="Subtopic"
                        level="subtopic"
                        parentName={selectedTopic}
                        items={subtopics}
                        selected={null}
                        onSelect={() => {}}
                        onAdd={(name) => handleAddItem('subtopic', name)}
                        onDelete={(name) => handleDeleteItem('subtopic', name)}
                        onRename={(oldN, newN) => handleRename('subtopic', oldN, newN)}
                        onReorder={(d, h) => handleReorder('subtopic', d, h)}
                    />
                )}
            </div>
        </div>
    </div>
  );
};
