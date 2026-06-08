import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Dashboard } from './views/Dashboard';
import { Events } from './views/Events';
import { Participants } from './views/Participants';
import { Registrations } from './views/Registrations';
import { FeedbackView } from './views/Feedback';
import { FeedbackPortal } from './views/FeedbackPortal';
import { SqlGuide } from './components/SqlGuide';
import { getDbMode, setDbMode, supabase } from './supabase';
import { MockDatabase } from './mockDatabase';
import { Sparkles } from 'lucide-react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('eventpulse_logged_in') === 'true';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dbMode, setDbModeState] = useState<'supabase' | 'mock'>(() => getDbMode());
  const [showFeedbackPortal, setShowFeedbackPortal] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (mode: 'supabase' | 'mock') => {
    setIsLoggedIn(true);
    setDbModeState(mode);
    setDbMode(mode);
    localStorage.setItem('eventpulse_logged_in', 'true');
  };

  const handleLogout = async () => {
    try {
      if (dbMode === 'supabase' && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoggedIn(false);
    localStorage.removeItem('eventpulse_logged_in');
    addToast('Logged out of system.', 'info');
  };

  const handleSwitchDbMode = (mode: 'supabase' | 'mock') => {
    setDbModeState(mode);
    setDbMode(mode);
    addToast(`Switched active database layer to: ${mode === 'supabase' ? 'Supabase Live' : 'Local Mock'}`, 'success');
  };

  const handleResetDb = () => {
    if (window.confirm('Reset all mock data back to clean seed values?')) {
      MockDatabase.resetDatabase();
      addToast('Mock database tables reset to default seeds!', 'success');
      // Trigger update
      window.dispatchEvent(new CustomEvent('eventpulse_db_change', { detail: { table: 'all' } }));
    }
  };

  // Render the selected view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard dbMode={dbMode} addToast={addToast} />;
      case 'events':
        return <Events dbMode={dbMode} addToast={addToast} />;
      case 'participants':
        return <Participants dbMode={dbMode} addToast={addToast} />;
      case 'registrations':
        return <Registrations dbMode={dbMode} addToast={addToast} />;
      case 'feedback':
        return <FeedbackView dbMode={dbMode} addToast={addToast} />;
      case 'sql-guide':
        return <SqlGuide addToast={addToast} />;
      default:
        return <Dashboard dbMode={dbMode} addToast={addToast} />;
    }
  };

  // If viewing the public student feedback portal
  if (showFeedbackPortal) {
    return (
      <>
        <FeedbackPortal 
          dbMode={dbMode} 
          addToast={addToast} 
          onBackToAdmin={() => setShowFeedbackPortal(false)} 
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // If not logged in
  if (!isLoggedIn) {
    return (
      <>
        {/* Floating portal access on login/register page */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowFeedbackPortal(true)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-md hover:border-cyan-500/35"
          >
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            Enter Public Feedback Portal
          </button>
        </div>

        {authView === 'register' ? (
          <Register
            onSwitchToLogin={() => setAuthView('login')}
            addToast={addToast}
          />
        ) : (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthView('register')}
            addToast={addToast}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Admin Dashboard Main Layout
  return (
    <div className="min-h-screen w-full flex bg-brand-dark text-slate-100 font-sans">
      
      {/* Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        dbMode={dbMode}
        setDbModeState={handleSwitchDbMode}
        onResetDb={handleResetDb}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="px-8 py-4 bg-slate-950/40 border-b border-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              SYSTEM MODE: {dbMode === 'supabase' ? 'LIVE DATABASE' : 'OFFLINE SIMULATOR'}
            </span>
          </div>

          <button
            onClick={() => setShowFeedbackPortal(true)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/20 border border-cyan-900/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer hover:border-cyan-500/40 shadow-sm"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Open Public Feedback Portal
          </button>
        </header>

        {/* View Frame */}
        <div className="flex-1 p-8 overflow-y-auto">
          {renderActiveView()}
        </div>

      </main>

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

    </div>
  );
}

export default App;
