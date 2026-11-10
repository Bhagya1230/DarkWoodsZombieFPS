/**
 * Game Over Modal
 */
import React from 'react';
import { PlayerState, WeaponConfig } from '../game/types';
import { Skull, RotateCcw, Award } from 'lucide-react';

interface Props {
  playerState: PlayerState;
  activeWeapon: WeaponConfig;
  onRestart: () => void;
}

export const GameOverModal: React.FC<Props> = ({ playerState, activeWeapon, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-950 border-2 border-red-900/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center text-slate-100 flex flex-col items-center gap-5">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-700/50 flex items-center justify-center text-red-500 shadow-inner">
          <Skull className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-red-500">
            KILLED IN ACTION
          </span>
          <h2 className="text-3xl font-black text-white tracking-wide mt-1">THE HORDE CONSUMED YOU</h2>
          <p className="text-xs text-slate-400 mt-1">You fell in the misty forest depths.</p>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Wave Reached</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">Wave {playerState.wave} / 16</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Final Score</div>
            <div className="text-lg font-black text-white font-mono mt-0.5">{playerState.score}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Zombies Eliminated</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">{playerState.kills}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Headshot Precision</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{playerState.headshots}</div>
          </div>
        </div>

        <div className="text-xs text-slate-400 italic">
          Last weapon held: <span className="text-slate-200 font-semibold">{activeWeapon.name}</span>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Fight Again (Wave 1)
        </button>
      </div>
    </div>
  );
};
