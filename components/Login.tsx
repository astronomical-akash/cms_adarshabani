
import React, { useState } from 'react';
import { UserRole } from '../types';
import { login } from '../services/authService';
import { GraduationCap, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CONTRIBUTOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    login(name, role);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ADARSHABANI</h1>
        <p className="text-gray-500 mt-2">Content Management System</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g. John Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setRole(UserRole.CONTRIBUTOR)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                role === UserRole.CONTRIBUTOR 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <User className="w-6 h-6 mb-2" />
                            <span className="font-medium text-sm">Contributor</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRole(UserRole.MODERATOR)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                role === UserRole.MODERATOR 
                                ? 'border-purple-600 bg-purple-50 text-purple-700' 
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <ShieldCheck className="w-6 h-6 mb-2" />
                            <span className="font-medium text-sm">Moderator</span>
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-gray-900 text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl transform active:scale-[0.98]"
                >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>
        </div>
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500">
                This is a demo login. No password required.
            </p>
        </div>
      </div>
    </div>
  );
};
