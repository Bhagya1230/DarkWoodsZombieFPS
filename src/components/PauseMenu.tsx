/**
 * Fullscreen Tactical Pause Menu
 * Resumes gameplay, adjusts audio/sensitivity, restarts, and offers PWA installation
 */
import React from 'react';
import { PlayerState, WeaponConfig } from '../game/types';
import { Play, RotateCcw, Volume2, VolumeX, Sliders, Smartphone, Monitor } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';
import { sound } from '../game/audio';

interface Props {
  playerState: PlayerState;
  activeWeapon: WeaponConfig;
  onResume: () => void;
  onRestart: () => void;
  lookSensitivity: number;
  onSensitivityChange: (val: number) => void;
}

export const PauseMenu: React.FC<Props> = ({
  playerState,
  activeWeapon,
  onResume,
  onRestart,
  lookSensitivity,
  onSensitivityChange,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const handleMuteToggle = () => {
    const next = !isMuted;
    sound.setMuted(next);
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-500">
              MISSION SUSPENDED
            </span>
            <h2 className="text-2xl font-black text-white tracking-wide">SURVIVAL PAUSED</h2>
          </div>
          <div className="text-right font-mono text-xs text-slate-400">
            <div>WAVE <span className="text-white font-bold">{playerState.wave}</span> / 16</div>
            <div>HP <span className="text-emerald-400 font-bold">{playerState.health}</span>/100</div>
          </div>
        </div>

        {/* Tactical Mission Briefing & Weapon Specs */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Active Armament</div>
            <div className="text-sm font-bold text-amber-400 truncate mt-0.5">{activeWeapon.name}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Zombies Purged</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">{playerState.kills} (Score: {playerState.score})</div>
          </div>
        </div>

        {/* Settings & Tuning */}
        <div className="space-y-4 text-xs">
          {/* Look Sensitivity Slider */}
          <div>
            <div className="flex justify-between font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Aim Look Sensitivity (Touch / Mouse)
              </span>
              <span className="font-mono text-amber-400 font-bold">{lookSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={lookSensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Sound & Controls Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleMuteToggle}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Audio Muted' : 'Audio Active'}</span>
            </button>

            {/* In-app PWA install trigger */}
            <PWAInstallModal />
          </div>
        </div>

        {/* Controls Guide Tabs */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>iPad & Mobile Controls:</span>
          </div>
          <div>Left thumb moves in 360° · Right thumb touch-drag to aim · Big RED button to Fire · R to reload.</div>
          <div className="flex items-center gap-2 text-slate-300 font-bold pt-1">
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>Desktop Controls:</span>
          </div>
          <div>Click canvas to lock mouse · WASD to walk · Left click to shoot · R to reload · F for flashlight.</div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            Resume Survival
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Wave 1
          </button>
        </div>
      </div>
    </div>
  );
};
