/**
 * High-Graphics FPS Heads-Up Display (HUD)
 * Health Bar (100 HP max, 15 dmg per hit), Wave (1-16), Zombies Count, Radar, Ammo, Damage Vignette
 */
import React from 'react';
import { PlayerState, WeaponConfig } from '../game/types';
import { Shield, Skull, Crosshair, Pause, Zap, Flame } from 'lucide-react';

interface Props {
  playerState: PlayerState;
  activeWeapon: WeaponConfig;
  aliveZombies: number;
  totalZombiesInWave: number;
  isHit: boolean;
  headshotToast: { text: string; id: number } | null;
  healToast: { text: string; id: number } | null;
  waveClearBanner: { wave: number; weapon: WeaponConfig } | null;
  onPauseClick: () => void;
}

export const HUD: React.FC<Props> = ({
  playerState,
  activeWeapon,
  aliveZombies,
  isHit,
  headshotToast,
  healToast,
  waveClearBanner,
  onPauseClick,
}) => {
  const isLowHealth = playerState.health <= 35 && playerState.health > 0;
  const hpPercent = Math.max(0, Math.min(100, playerState.health));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* 1. Low Health & Damage Vignette FX */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 pointer-events-none ${
          isHit
            ? 'opacity-80 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(220,38,38,0.7)_100%)]'
            : isLowHealth
            ? 'opacity-65 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(185,28,28,0.55)_100%)] animate-pulse'
            : 'opacity-0'
        }`}
      />

      {/* 2. Top Status Bar (3-Zone Clean Header) */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-start justify-between gap-4">
        {/* Left: Player Health Bar (100 HP, 15 dmg per hit) */}
        <div className="flex flex-col gap-1.5 bg-slate-950/75 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-lg pointer-events-auto backdrop-blur-md">
          <div className="flex items-center justify-between gap-6 text-xs font-bold tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className={`w-4 h-4 ${isLowHealth ? 'text-red-500 animate-bounce' : 'text-emerald-400'}`} />
              SURVIVOR HP
            </span>
            <span className="font-mono tabular-nums text-sm font-black text-white">
              {playerState.health} <span className="text-slate-500 text-xs font-medium">/ 100</span>
            </span>
          </div>

          {/* Segmented HP Meter */}
          <div className="w-44 sm:w-56 h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isLowHealth
                  ? 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
                  : hpPercent < 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Critical</span>
            <span>Stable</span>
          </div>
        </div>

        {/* Center: Wave Progression & Living Zombies Counter */}
        <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/80 px-5 py-2.5 rounded-xl shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-4 text-xs font-black tracking-widest text-slate-200">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>WAVE <span className="text-amber-400 text-sm font-mono">{playerState.wave}</span> / 16</span>
            </div>

            <span className="text-slate-700">|</span>

            <div className="flex items-center gap-1.5">
              <Skull className="w-4 h-4 text-rose-500" />
              <span>ZOMBIES: <span className="text-rose-400 font-mono text-sm">{aliveZombies}</span></span>
            </div>
          </div>

          {/* Subtitle / Kills */}
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            SCORE: <span className="text-white font-bold">{playerState.score}</span> · KILLS: <span className="text-white font-bold">{playerState.kills}</span>
          </div>
        </div>

        {/* Right: Pause Button */}
        <div className="pointer-events-auto">
          <button
            onClick={onPauseClick}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-200 shadow-lg backdrop-blur-md transition-all active:scale-95"
            title="Pause Game (ESC / P)"
          >
            <Pause className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-semibold hidden sm:inline">Pause</span>
          </button>
        </div>
      </div>

      {/* 3. Center Screen: Dynamic Crosshair Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Central Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/90 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          {/* Top Line */}
          <div className="absolute top-0 w-0.5 h-2 bg-white/70" />
          {/* Bottom Line */}
          <div className="absolute bottom-0 w-0.5 h-2 bg-white/70" />
          {/* Left Line */}
          <div className="absolute left-0 w-2 h-0.5 bg-white/70" />
          {/* Right Line */}
          <div className="absolute right-0 w-2 h-0.5 bg-white/70" />
        </div>
      </div>

      {/* 4. Headshot Critical Alert Toast */}
      {headshotToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/60 text-red-200 px-4 py-1.5 rounded-full shadow-lg text-xs font-bold tracking-wider animate-bounce flex items-center gap-1.5 backdrop-blur-sm">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          {headshotToast.text}
        </div>
      )}

      {/* 4.5 Health Restored Pickup Toast */}
      {healToast && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-2 rounded-full shadow-[0_0_25px_rgba(34,197,94,0.6)] text-xs font-black tracking-wider animate-bounce flex items-center gap-2 backdrop-blur-md">
          <Shield className="w-4 h-4 text-emerald-400" />
          {healToast.text}
        </div>
      )}

      {/* 5. Wave Cleared Banner with Weapon Upgrade */}
      {waveClearBanner && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-slate-950/95 border-2 border-amber-500/80 p-6 rounded-2xl shadow-2xl text-center backdrop-blur-xl animate-in zoom-in-95 duration-300 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black tracking-widest uppercase mb-2">
            Wave {waveClearBanner.wave - 1} Cleared!
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">WEAPON UPGRADED</h2>
          <div className="my-3 py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-bold text-lg">
            {waveClearBanner.weapon.name}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {waveClearBanner.weapon.description}
          </p>
          <div className="mt-4 text-[11px] font-mono text-emerald-400 font-semibold">
            +20 HP RESTORED · NEXT WAVE INCOMING...
          </div>
        </div>
      )}

      {/* 6. Bottom Right: Active Weapon & Ammo HUD */}
      <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 bg-slate-950/85 border border-slate-800/90 p-4 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto min-w-[190px]">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold text-slate-200 truncate max-w-[140px]">{activeWeapon.name}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            W{playerState.wave}
          </span>
        </div>

        {/* Large Tabular Ammo Display */}
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className={`text-3xl sm:text-4xl font-black ${playerState.ammoCurrent <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {playerState.ammoCurrent}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            / {playerState.ammoReserve}
          </span>
        </div>

        {/* Reloading Progress Indicator */}
        {playerState.isReloading && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-amber-400 font-bold mb-1">
              <span>RELOADING</span>
              <span>{Math.round(playerState.reloadProgress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-75"
                style={{ width: `${playerState.reloadProgress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
