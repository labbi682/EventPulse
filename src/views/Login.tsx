import React, { useState } from 'react';
import { Activity, Calendar, Lock, Mail, Settings, ShieldAlert, Sparkles, UserPlus } from 'lucide-react';
import { supabase, saveSupabaseConfig, getSupabaseConfig, clearSupabaseConfig } from '../supabase';

interface LoginProps {
  onLoginSuccess: (mode: 'supabase' | 'mock') => void;
  onSwitchToRegister: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister, addToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Supabase dynamic config inputs
  const [showConfig, setShowConfig] = useState(false);
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig?.url || '');
  const [supabaseKey, setSupabaseKey] = useState(currentConfig?.anonKey || '');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const config = getSupabaseConfig();

    if (config) {
      // Connect using Supabase Auth
      try {
        if (!supabase) {
          throw new Error('Supabase client failed to initialize. Check your configuration.');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        addToast('Successfully authenticated with Supabase!', 'success');
        onLoginSuccess('supabase');
      } catch (err: any) {
        addToast(err.message || 'Login failed. Please check your credentials.', 'error');
        setIsLoading(false);
      }
    } else {
      // Offline fallback check: If they are logging in with mock admin details
      if (email === 'admin@eventpulse.edu' && password === 'admin123') {
        setTimeout(() => {
          addToast('Logged in as Guest Administrator (Mock Mode)', 'success');
          onLoginSuccess('mock');
          setIsLoading(false);
        }, 1000);
      } else {
        addToast('Invalid admin credentials. Use admin@eventpulse.edu / admin123 for Mock Mode.', 'error');
        setIsLoading(false);
      }
    }
  };

  const handleDemoMode = () => {
    setIsLoading(true);
    addToast('Welcome to EventPulse Demo Mode!', 'info');
    setTimeout(() => {
      onLoginSuccess('mock');
      setIsLoading(false);
    }, 800);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      addToast('Please enter both the Supabase URL and Anon Key.', 'error');
      return;
    }

    try {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      addToast('Supabase configuration saved! Refreshing connection...', 'success');
      
      // Delay slightly and reload page to re-initialize supabase client wrapper
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      addToast('Failed to save configuration.', 'error');
    }
  };

  const handleClearConfig = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    addToast('Supabase credentials cleared. Switched to Mock mode.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-dark bg-grid-glow relative p-4 overflow-hidden">
      
      {/* Visual background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Logo and Brand Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto relative flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-950/40 border-2 border-cyan-400/40 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse-glow">
            <Calendar className="h-10 w-10 absolute" />
            <Activity className="h-6 w-6 absolute text-cyan-300 animate-heartbeat scale-110 z-10" />
          </div>
          <div>
            <h2 className="font-heading font-black text-3xl tracking-tight text-white mt-4">
              Event<span className="text-cyan-400">Pulse</span>
            </h2>
            <p className="text-cyan-500/80 font-bold uppercase tracking-widest text-xs mt-1">Track. Analyze. Engage.</p>
          </div>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            College Event Analytics and Registration Management System
          </p>
        </div>

        {/* Login Form Container */}
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6 relative overflow-hidden">
          
          {/* Header indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentConfig ? 'Supabase Secure Access' : 'Demo Offline Database'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${currentConfig ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {currentConfig ? 'Connected' : 'Standalone'}
              </span>
            </span>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  placeholder="admin@eventpulse.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In as Administrator'
              )}
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={handleDemoMode}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:bg-slate-850 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Bypass Auth — Launch High-Fidelity Demo Mode
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-2">
              Note: Guest Mode stores data locally in your browser so you can test all features offline.
            </p>
          </div>
        </div>

        {/* Supabase Connection Configuration Drawer Toggle */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-cyan-500 animate-spin-slow" />
              Configure Supabase Keys (Professor Presentation)
            </span>
            <span>{showConfig ? 'Hide Settings' : 'Show Settings'}</span>
          </button>

          {showConfig && (
            <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-slate-800/60">
              <p className="text-[11px] text-slate-400">
                Supply your Supabase project keys to link the application database. This enables tables, triggers, and real-time.
              </p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  SUPABASE_PROJECT_URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="block w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="block w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:border-cyan-500/50 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-950 text-cyan-400 hover:bg-cyan-900 border border-cyan-800/40 transition-all cursor-pointer"
                >
                  Save & Connect
                </button>
                {currentConfig && (
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 border border-rose-900/20 transition-all cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Register link */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-4">
          <button
            onClick={onSwitchToRegister}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-purple-400 transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Don't have an account? <span className="text-purple-400 hover:text-purple-300">Register</span>
          </button>
        </div>

        {/* Demo login helper credentials details */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/30 border border-slate-900 rounded-xl text-center justify-center text-[10px] text-slate-500">
          <ShieldAlert className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          <span>Demo admin account: <strong className="text-slate-400">admin@eventpulse.edu</strong> / password: <strong className="text-slate-400">admin123</strong></span>
        </div>

      </div>
    </div>
  );
};
