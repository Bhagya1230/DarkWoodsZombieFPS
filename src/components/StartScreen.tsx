/**
 * Minimal & Cinematic Start Screen
 */
import React from 'react';
import { Play } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface Props {
  onStart: () => void;
}

export const StartScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-sm bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-slate-100 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
            Dark Woods
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            16-Wave First-Person Zombie Survival
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onStart}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Survival
          </button>

          <PWAInstallModal variant="banner" className="w-full py-3 justify-center" />
        </div>

        {/* Minimal 1-line control hint */}
        <p className="text-[11px] text-slate-500 leading-tight">
          Move with left thumb · Aim & shoot with right screen
        </p>
      </div>
    </div>
  );
};
