/**
 * Wave 16 Ultimate Victory Modal
 */
import React, { useEffect } from 'react';
import { PlayerState } from '../game/types';
import { Trophy, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  playerState: PlayerState;
  onRestart: () => void;
}

export const VictoryModal: React.FC<Props> = ({ playerState, onRestart }) => {
  useEffect(() => {
    // Launch Victory Confetti Celebration
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
        });
      }, 500);
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
      <div className="w-full max-w-md bg-slate-950 border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.5)] text-center text-slate-100 flex flex-col items-center gap-5">
        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-2xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-inner">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            ALL 16 WAVES CONQUERED
          </span>
          <h2 className="text-3xl font-black text-white tracking-wide mt-1">DAWN IN THE DARK WOODS</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            You wielded every weapon from the M1911 Pistol to the RPG-7 Rocket Launcher and eradicated the nocturnal nightmare.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Score</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{playerState.score}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Final HP Remaining</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{playerState.health} / 100</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Zombies Eradicated</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">{playerState.kills} Kills</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Headshots</div>
            <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{playerState.headshots}</div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Survival Again
        </button>
      </div>
    </div>
  );
};
