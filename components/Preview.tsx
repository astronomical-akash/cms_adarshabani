
import React from 'react';
import { Material, MaterialType } from '../types';
import { ArrowLeft, Calendar, FileText, Download } from 'lucide-react';

interface PreviewProps {
  material: Material;
  onBack: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ material, onBack }) => {
  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-64 bg-gray-100 relative flex items-center justify-center">
            {material.type === MaterialType.IMAGE ? (
                <img src={material.url} alt={material.title} className="w-full h-full object-contain" />
            ) : material.type === MaterialType.VIDEO ? (
                <div className="text-gray-500 flex flex-col items-center">
                    <span className="text-6xl">▶️</span>
                    <span className="mt-2">Video Preview Placeholder</span>
                </div>
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <FileText className="w-16 h-16" />
                    <span className="mt-2 text-sm font-medium">Document Preview</span>
                </div>
            )}
            
            <span className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {material.type.toUpperCase()}
            </span>
        </div>

        <div className="p-8">
            <div className="flex items-start justify-between">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
                     <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(material.uploadDate).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {material.bloomsLevel}
                        </span>
                     </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <Download className="w-6 h-6" />
                </button>
            </div>

            <hr className="my-6 border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                        {material.description || "No description provided."}
                    </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg h-fit space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Hierarchy Info</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="block text-xs text-gray-500">Class</span>
                            <span className="font-medium">{material.className}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Subject</span>
                            <span className="font-medium">{material.subject}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Chapter</span>
                            <span className="font-medium">{material.chapter}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Topic</span>
                            <span className="font-medium">{material.topic}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500">Subtopic</span>
                            <span className="font-medium">{material.subtopic}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
