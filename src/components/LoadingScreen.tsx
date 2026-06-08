import React from 'react';
import { Activity, Calendar } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-brand-dark bg-grid-glow relative">
      <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-cyan-950/40 border-2 border-cyan-400/40 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-pulse-glow">
        <Calendar className="h-12 w-12 absolute" />
        <Activity className="h-7 w-7 absolute text-cyan-300 animate-heartbeat scale-110 z-10" />
      </div>
      <h3 className="font-heading font-black text-xl text-white mt-6 tracking-wide">
        Event<span className="text-cyan-400">Pulse</span>
      </h3>
      <p className="text-xs text-slate-500 uppercase tracking-widest mt-2 animate-pulse">
        Initializing Live Dashboard...
      </p>
    </div>
  );
};
