
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UploadForm } from './components/UploadForm';
import { Preview } from './components/Preview';
import { HierarchyManager } from './components/HierarchyManager';
import { ModeratorDashboard } from './components/ModeratorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { getMaterials } from './services/storageService';
import { getCurrentUser, logout } from './services/authService';
import { Material, User, UserRole } from './types';
import { LayoutDashboard, Upload, Network, ShieldCheck, GraduationCap, LogOut, User as UserIcon, Shield } from 'lucide-react';

enum View {
  DASHBOARD = 'dashboard',
  UPLOAD = 'upload',
  PREVIEW = 'preview',
  HIERARCHY = 'hierarchy',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // State to hold pre-filled data when navigating from Dashboard to Upload
  const [uploadDefaults, setUploadDefaults] = useState<any>(null);

  useEffect(() => {
    // Check for logged in user
    const checkUser = async () => {
      const loggedInUser = await getCurrentUser();
      setUser(loggedInUser);
    };
    checkUser();
  }, []);

  // Load data function
  const loadMaterials = async () => {
    if (user) {
      const data = await getMaterials();
      setMaterials(data);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [currentView, user]);

  const handleLogin = async () => {
    const loggedInUser = await getCurrentUser();
    setUser(loggedInUser);
    setCurrentView(View.DASHBOARD);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handlePreview = (material: Material) => {
    setSelectedMaterial(material);
    setCurrentView(View.PREVIEW);
  };

  const handleNavigateToUpload = (defaults?: any) => {
    setUploadDefaults(defaults);
    setCurrentView(View.UPLOAD);
  };

  // If not logged in, show login screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard
            materials={materials}
            onNavigateToUpload={handleNavigateToUpload}
            onPreview={handlePreview}
            onRefresh={loadMaterials}
          />
        );
      case View.UPLOAD:
        return (
          <UploadForm
            onSuccess={() => {
              setUploadDefaults(null);
              setCurrentView(View.DASHBOARD);
            }}
            initialValues={uploadDefaults}
          />
        );
      case View.HIERARCHY:
        return (
          <HierarchyManager />
        );
      case View.MODERATOR:
        // Protect route
        if (user.role !== UserRole.MODERATOR && user.role !== UserRole.ADMIN) {
          return <div className="p-8 text-center text-red-500">Access Denied</div>;
        }
        return (
          <ModeratorDashboard />
        );
      case View.ADMIN:
        // Protect route
        if (user.role !== UserRole.ADMIN) {
          return <div className="p-8 text-center text-red-500">Access Denied</div>;
        }
        return (
          <AdminDashboard />
        );
      case View.PREVIEW:
        return selectedMaterial ? (
          <Preview
            material={selectedMaterial}
            onBack={() => setCurrentView(View.DASHBOARD)}
          />
        ) : (
          <div className="p-8 text-center">Material not found</div>
        );
      default:
        return <div>Not Found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <GraduationCap className="w-8 h-8 text-indigo-600 mr-2" />
          <span className="font-bold text-gray-900 tracking-tight">ADARSHABANI</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => { setUploadDefaults(null); setCurrentView(View.DASHBOARD); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.DASHBOARD && !selectedMaterial ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard Matrix
          </button>
          <button
            onClick={() => { setUploadDefaults(null); setCurrentView(View.UPLOAD); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.UPLOAD ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Upload className="w-5 h-5" />
            Upload Content
          </button>
          <button
            onClick={() => setCurrentView(View.HIERARCHY)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.HIERARCHY ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Network className="w-5 h-5" />
            Manage Hierarchy
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 flex flex-col gap-3">
          {(user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN) && (
            <button
              onClick={() => setCurrentView(View.MODERATOR)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-colors ${currentView === View.MODERATOR
                ? 'bg-purple-900 text-white border-purple-900'
                : 'bg-white text-purple-700 border-purple-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Moderator Dashboard
            </button>
          )}

          {user.role === UserRole.ADMIN && (
            <button
              onClick={() => setCurrentView(View.ADMIN)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-colors ${currentView === View.ADMIN
                ? 'bg-indigo-900 text-white border-indigo-900'
                : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </button>
          )}

          {/* User Profile Snippet */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-gray-500 uppercase truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-gray-900">ADARSHABANI</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500">Logout</button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;
