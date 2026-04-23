import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center text-slate-300">
      <div className="relative">
         <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
         <Loader2 className="w-12 h-12 text-brand-primary animate-spin relative z-10" />
      </div>
      <div className="mt-8 text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 animate-pulse">
        Synchronizing with Registry...
      </div>
    </div>
  );
}
