import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Users, 
  FileCheck, 
  MessageSquare, 
  Database, 
  LogOut,
  Activity,
  Calendar
} from 'lucide-react';


interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  dbMode: 'supabase' | 'mock';
  setDbModeState: (mode: 'supabase' | 'mock') => void;
  onResetDb: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout,
  dbMode,
  setDbModeState,
  onResetDb
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'events', label: 'Events', icon: <CalendarRange className="h-5 w-5" /> },
    { id: 'participants', label: 'Participants', icon: <Users className="h-5 w-5" /> },
    { id: 'registrations', label: 'Registrations', icon: <FileCheck className="h-5 w-5" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'sql-guide', label: 'Database Setup', icon: <Database className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-slate-900 bg-slate-950/60">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
            <Calendar className="h-6 w-6 absolute" />
            <Activity className="h-4 w-4 absolute text-cyan-300 animate-heartbeat scale-110 z-10" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-lg text-white leading-tight tracking-wide flex items-center gap-1">
              Event<span className="text-cyan-400">Pulse</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Track. Analyze. Engage.</p>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-slate-900 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                {/* Active Indicator Accent Line */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>
                )}
                <span className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Connection Mode & Action Panel */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50 space-y-4">
        {/* Database Status Panel */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Database Connection</span>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dbMode === 'supabase' ? 'bg-cyan-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                dbMode === 'supabase' ? 'bg-cyan-500' : 'bg-amber-500'
              }`}></span>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-200 truncate pr-1">
              {dbMode === 'supabase' ? 'Supabase Live' : 'Local Offline Mock'}
            </p>
            <button
              onClick={() => {
                const next = dbMode === 'supabase' ? 'mock' : 'supabase';
                setDbModeState(next);
              }}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-800/30 px-2 py-1 rounded-lg transition-all"
            >
              Switch
            </button>
          </div>
          
          {dbMode === 'mock' && (
            <button
              onClick={onResetDb}
              className="w-full mt-2 text-[10px] text-center text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/20 py-1 rounded-lg font-semibold transition-all"
            >
              Reset Mock DB Data
            </button>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">Administrator</p>
              <p className="text-[10px] text-slate-500 truncate">admin@eventpulse.edu</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
