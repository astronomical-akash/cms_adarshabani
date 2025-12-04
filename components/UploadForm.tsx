import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BLOOMS_LEVELS, BLOOMS_DESCRIPTIONS } from '../constants';
import { Material, MaterialType, BloomsLevel, CurriculumTree, MaterialStatus } from '../types';
import { saveMaterial, getCurriculum } from '../services/storageService';
import { getCurrentUser } from '../services/authService';
import { analyzeContentForClassification } from '../services/geminiService';
import { Upload, FileText, Image as ImageIcon, Film, Loader2, Wand2 } from 'lucide-react';

interface UploadFormProps {
  onSuccess: () => void;
  initialValues?: any;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onSuccess, initialValues }) => {
  const [curriculum, setCurriculum] = useState<CurriculumTree>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Hierarchy State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [selectedBlooms, setSelectedBlooms] = useState<BloomsLevel>(BloomsLevel.LEVEL_0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await getCurriculum();
      setCurriculum(data);

      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    loadData();

    // Set initial class defaults logic moved to after data load or separate effect if needed
    // For simplicity, we'll just wait for user interaction or rely on data being loaded
  }, []);

  useEffect(() => {
    // Set initial class defaults once curriculum is loaded
    const classes = Object.keys(curriculum);
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
  }, [curriculum]);

  useEffect(() => {
    // Apply initial values if provided
    if (initialValues) {
      if (initialValues.class) setSelectedClass(initialValues.class);
      if (initialValues.subject) setSelectedSubject(initialValues.subject);
      if (initialValues.chapter) setSelectedChapter(initialValues.chapter);
      if (initialValues.topic) setSelectedTopic(initialValues.topic);
      if (initialValues.subtopic) setSelectedSubtopic(initialValues.subtopic);
      if (initialValues.bloomsLevel) setSelectedBlooms(initialValues.bloomsLevel);
    }
  }, [initialValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);

      const url = URL.createObjectURL(f);
      setPreviewUrl(url);

      if (!title) {
        setTitle(f.name.split('.')[0]);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleGeminiAutoFill = async () => {
    if (!description && !title) {
      alert("Please enter a title or description first, or select a file.");
      return;
    }

    setIsAnalyzing(true);
    try {
      let base64Image = undefined;
      let mimeType = undefined;

      if (file && file.type.startsWith('image/')) {
        base64Image = await fileToBase64(file);
        mimeType = file.type;
      }

      const result = await analyzeContentForClassification(
        file?.name || title,
        description,
        base64Image,
        mimeType
      );

      if (result) {
        // Try to match AI result to existing hierarchy where possible

        // Subject match
        const availableSubjects = Object.keys(curriculum[selectedClass] || {});
        if (result.subject && availableSubjects.includes(result.subject)) {
          setSelectedSubject(result.subject);
        }

        if (result.chapter) setSelectedChapter(result.chapter);
        if (result.topic) setSelectedTopic(result.topic);
        if (result.subtopic) setSelectedSubtopic(result.subtopic);

        // Map Bloom's
        if (result.bloomsLevel) {
          // Gemini returns the enum string value
          const level = Object.values(BloomsLevel).find(l => l === result.bloomsLevel);
          if (level) setSelectedBlooms(level);
        }

        if (result.summary) setDescription(result.summary);
      }
    } catch (err) {
      console.error(err);
      alert("AI analysis failed. Please fill manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      // Check file size (Supabase free tier limit is 50MB, paid is 5GB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 50MB limit. Please use a smaller file.`);
        return null;
      }

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setIsUploading(false);
        if (uploadError.message.includes('row-level security')) {
          alert('Upload failed: You may not have permission to upload files. Please check your authentication.');
        } else if (uploadError.message.includes('size')) {
          alert('Upload failed: File is too large.');
        } else {
          alert(`Upload failed: ${uploadError.message}`);
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      setIsUploading(false);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubject || !selectedChapter || !selectedTopic || !selectedSubtopic) {
      alert("Please fill all required hierarchy fields.");
      return;
    }

    if (isSaving || isUploading) return; // Prevent duplicate submissions

    setIsSaving(true);

    try {
      let uploadedUrl = previewUrl || 'https://picsum.photos/400/300';

      if (file) {
        const url = await handleFileUpload(file);
        if (url) {
          uploadedUrl = url;
        } else {
          throw new Error("File upload failed");
        }
      }

      const newMaterial: Material = {
        id: crypto.randomUUID(),
        title,
        description,
        type: file ? (file.type.includes('image') ? MaterialType.IMAGE : file.type.includes('pdf') ? MaterialType.PDF : MaterialType.OTHER) : MaterialType.OTHER,
        url: uploadedUrl,
        fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : undefined,
        uploadDate: new Date().toISOString(),
        className: selectedClass,
        subject: selectedSubject,
        chapter: selectedChapter,
        topic: selectedTopic,
        subtopic: selectedSubtopic,
        bloomsLevel: selectedBlooms,
        status: MaterialStatus.PENDING,
        contributorName: currentUser?.name || 'Anonymous'
      };

      await saveMaterial(newMaterial);
      setIsSaving(false);
      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to upload material. Please try again.');
      setIsSaving(false);
    }
  };

  // Derived Options
  const subjects = selectedClass ? Object.keys(curriculum[selectedClass] || {}) : [];
  const chapters = (selectedClass && selectedSubject) ? Object.keys(curriculum[selectedClass][selectedSubject] || {}) : [];
  const topics = (selectedClass && selectedSubject && selectedChapter) ? Object.keys(curriculum[selectedClass][selectedSubject][selectedChapter] || {}) : [];
  const subtopics = (selectedClass && selectedSubject && selectedChapter && selectedTopic)
    ? curriculum[selectedClass][selectedSubject][selectedChapter][selectedTopic] || []
    : [];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Upload New Material</h2>
          <p className="text-sm text-gray-500">Posting as: <span className="font-semibold text-gray-900">{currentUser?.name}</span></p>
        </div>
        <button
          type="button"
          onClick={handleGeminiAutoFill}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {isAnalyzing ? 'Analyzing...' : 'Auto-Fill with Gemini'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Col: File & Basic Info */}
          <div className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors h-48"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,video/*,.doc,.docx"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <img src={previewUrl || ''} alt="Preview" className="h-24 object-contain rounded-md shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <span className="font-medium text-xs text-gray-700 truncate w-32">{file.name}</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Click to upload file</p>
                  <p className="text-[10px] text-gray-400 mt-1">MP4, PDF, DOCX, Images</p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Introduction to Algebra"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Brief summary..."
                />
              </div>
            </div>
          </div>

          {/* Right Cols: Hierarchy */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Content Hierarchy</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                  <select
                    value={selectedClass}
                    onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {Object.keys(curriculum).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => { setSelectedSubject(e.target.value); setSelectedChapter(''); }}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!selectedClass}
                  >
                    <option value="">Select...</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Chapter</label>
                  <select
                    value={selectedChapter}
                    onChange={e => { setSelectedChapter(e.target.value); setSelectedTopic(''); }}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!selectedSubject}
                  >
                    <option value="">Select Chapter...</option>
                    {chapters.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={e => { setSelectedTopic(e.target.value); setSelectedSubtopic(''); }}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!selectedChapter}
                  >
                    <option value="">Select Topic...</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Subtopic</label>
                {subtopics.length > 0 ? (
                  <select
                    value={selectedSubtopic}
                    onChange={e => setSelectedSubtopic(e.target.value)}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!selectedTopic}
                  >
                    <option value="">Select Subtopic...</option>
                    {subtopics.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedSubtopic}
                    onChange={e => setSelectedSubtopic(e.target.value)}
                    className="w-full border rounded text-sm px-2 py-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder={selectedTopic ? "Enter Subtopic..." : "Select Topic first"}
                    disabled={!selectedTopic}
                  />
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Bloom's Taxonomy Level</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BLOOMS_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedBlooms(level)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${selectedBlooms === level
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 ring-offset-1'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                  >
                    <span className="text-xs font-bold">{level.split('(')[0]}</span>
                    <span className={`text-[10px] mt-1 ${selectedBlooms === level ? 'text-blue-100' : 'text-gray-400'}`}>
                      {BLOOMS_DESCRIPTIONS[level]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onSuccess}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-300 transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading File...</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit Material</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};