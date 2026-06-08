import React, { useState } from 'react';
import { Activity, Calendar, Lock, Mail, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase, getSupabaseConfig } from '../supabase';

interface RegisterProps {
  onSwitchToLogin: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, addToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentConfig = getSupabaseConfig();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      addToast('Passwords do not match. Please try again.', 'error');
      setIsLoading(false);
      return;
    }

    // Validate minimum password length
    if (password.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      setIsLoading(false);
      return;
    }

    if (!currentConfig || !supabase) {
      addToast('Supabase is not configured. Please set up your Supabase keys on the Login page first.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[EventPulse] Attempting signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('[EventPulse] Signup response - data:', data, 'error:', error);

      if (error) {
        console.error('[EventPulse] Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw error;
      }

      if (data.user?.identities?.length === 0) {
        addToast('An account with this email already exists. Please log in instead.', 'error');
      } else if (data.session) {
        // User was auto-confirmed (email confirmation disabled in Supabase)
        addToast('Account created successfully! You can now log in.', 'success');
        // Sign them out so they go through the login flow
        await supabase.auth.signOut();
        onSwitchToLogin();
      } else {
        // Email confirmation is enabled
        addToast('Account created! Please check your email to confirm, then log in.', 'success');
        onSwitchToLogin();
      }
    } catch (err: any) {
      console.error('[EventPulse] Full signup error:', err);
      addToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-dark bg-grid-glow relative p-4 overflow-hidden">
      
      {/* Visual background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Logo and Brand Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto relative flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-950/40 border-2 border-purple-400/40 text-purple-400 shadow-[0_0_30px_rgba(139,92,246,0.15)] animate-pulse-glow" style={{ '--tw-pulse-color': 'rgba(139,92,246,0.4)' } as React.CSSProperties}>
            <Calendar className="h-10 w-10 absolute" />
            <Activity className="h-6 w-6 absolute text-purple-300 animate-heartbeat scale-110 z-10" />
          </div>
          <div>
            <h2 className="font-heading font-black text-3xl tracking-tight text-white mt-4">
              Event<span className="text-cyan-400">Pulse</span>
            </h2>
            <p className="text-purple-400/80 font-bold uppercase tracking-widest text-xs mt-1">Create Your Account</p>
          </div>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Register to access the Event Analytics and Management System
          </p>
        </div>

        {/* Registration Form Container */}
        <div className="glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-6 relative overflow-hidden">
          
          {/* Decorative accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

          {/* Header indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-purple-400" />
              New Account Registration
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${currentConfig ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {currentConfig ? 'Supabase Active' : 'Not Configured'}
              </span>
            </span>
          </div>

          {!currentConfig && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Supabase is not configured yet. Please go to the <button onClick={onSwitchToLogin} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-bold cursor-pointer">Login page</button> first and set up your Supabase keys in the configuration panel.
              </p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
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
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 transition-all outline-none"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !currentConfig}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Switch to Login */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-4">
          <button
            onClick={onSwitchToLogin}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Already have an account? <span className="text-cyan-400 hover:text-cyan-300">Sign In</span>
          </button>
        </div>

      </div>
    </div>
  );
};
