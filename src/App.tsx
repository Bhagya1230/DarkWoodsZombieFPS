/**
 * Main Application Component: Dark Woods 16-Wave Zombie FPS
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { GameEngine } from './game/GameEngine';
import { GameStatus, PlayerState, WeaponConfig } from './game/types';
import { WEAPONS } from './game/weapons';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { StartScreen } from './components/StartScreen';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [status, setStatus] = useState<GameStatus>('menu');
  const [playerState, setPlayerState] = useState<PlayerState>({
    health: 100, // Starts at 100 HP
    maxHealth: 100,
    score: 0,
    kills: 0,
    headshots: 0,
    wave: 1,
    currentWeaponIndex: 0,
    ammoCurrent: WEAPONS[0].magazineSize,
    ammoReserve: WEAPONS[0].ammoCap,
    isReloading: false,
    reloadProgress: 0,
    flashlightOn: true,
    isHit: false,
    lastDamageTime: 0,
  });

  const [activeWeapon, setActiveWeapon] = useState<WeaponConfig>(WEAPONS[0]);
  const [aliveZombies, setAliveZombies] = useState<number>(0);
  const [isHitFlash, setIsHitFlash] = useState<boolean>(false);
  const [headshotToast, setHeadshotToast] = useState<{ text: string; id: number } | null>(null);
  const [healToast, setHealToast] = useState<{ text: string; id: number } | null>(null);
  const [waveClearBanner, setWaveClearBanner] = useState<{ wave: number; weapon: WeaponConfig } | null>(null);
  const [lookSensitivity, setLookSensitivity] = useState<number>(1.0);

  // Initialize 3D WebGL Game Engine once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;

    // Connect Engine State to React
    engine.onStateSync = (state, newStatus, weapon, zombiesCount) => {
      setPlayerState({ ...state });
      setStatus(newStatus);
      setActiveWeapon(weapon);
      setAliveZombies(zombiesCount);
    };

    engine.onHeadshotEvent = (points) => {
      setHeadshotToast({ text: `HEADSHOT CRITICAL! +${points}`, id: Date.now() });
      setTimeout(() => {
        setHeadshotToast(null);
      }, 1600);
    };

    engine.onHealEvent = (amount) => {
      setHealToast({ text: `+${amount} HP RESTORED!`, id: Date.now() });
      setTimeout(() => {
        setHealToast(null);
      }, 1800);
    };

    engine.onWaveClearEvent = (newWave, weapon) => {
      setWaveClearBanner({ wave: newWave, weapon });
      setTimeout(() => {
        setWaveClearBanner(null);
      }, 3500);
    };

    engine.onDamageFlash = () => {
      setIsHitFlash(true);
      setTimeout(() => {
        setIsHitFlash(false);
      }, 250);
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Control Callbacks
  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(true);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(false);
    }
  }, []);

  const handleSensitivityChange = useCallback((val: number) => {
    setLookSensitivity(val);
    if (engineRef.current) {
      engineRef.current.setLookSensitivity(val);
    }
  }, []);

  const handleTouchMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.setTouchMove(x, y);
    }
  }, []);

  const handleTouchLook = useCallback((deltaX: number, deltaY: number) => {
    if (engineRef.current) {
      engineRef.current.applyTouchLook(deltaX, deltaY);
    }
  }, []);

  const handleFireChange = useCallback((isFiring: boolean) => {
    if (engineRef.current) {
      engineRef.current.setTouchFiring(isFiring);
    }
  }, []);

  const handleReload = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startReload();
    }
  }, []);

  const handleFlashlightToggle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleFlashlight();
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05080c] select-none touch-none">
      {/* 1. 3D WebGL Canvas Viewport Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. Heads-Up Display (HUD) */}
      {(status === 'playing' || status === 'wave_cleared' || status === 'paused') && (
        <HUD
          playerState={playerState}
          activeWeapon={activeWeapon}
          aliveZombies={aliveZombies}
          totalZombiesInWave={playerState.wave * 3}
          isHit={isHitFlash}
          headshotToast={headshotToast}
          healToast={healToast}
          waveClearBanner={waveClearBanner}
          onPauseClick={handlePause}
        />
      )}

      {/* 3. Mobile / iPad Touch Controls Overlay */}
      {(status === 'playing' || status === 'wave_cleared') && (
        <TouchControls
          onMove={handleTouchMove}
          onLook={handleTouchLook}
          onFireChange={handleFireChange}
          onReload={handleReload}
          onFlashlightToggle={handleFlashlightToggle}
          isFlashlightOn={playerState.flashlightOn}
          isReloading={playerState.isReloading}
        />
      )}

      {/* 4. Start Menu */}
      {status === 'menu' && <StartScreen onStart={handleStartGame} />}

      {/* 5. Pause Screen */}
      {status === 'paused' && (
        <PauseMenu
          playerState={playerState}
          activeWeapon={activeWeapon}
          onResume={handleResume}
          onRestart={handleRestart}
          lookSensitivity={lookSensitivity}
          onSensitivityChange={handleSensitivityChange}
        />
      )}

      {/* 6. Game Over Modal */}
      {status === 'game_over' && (
        <GameOverModal
          playerState={playerState}
          activeWeapon={activeWeapon}
          onRestart={handleRestart}
        />
      )}

      {/* 7. Wave 16 Ultimate Victory Modal */}
      {status === 'victory' && (
        <VictoryModal
          playerState={playerState}
          onRestart={handleRestart}
        />
      )}

      {/* 8. Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
