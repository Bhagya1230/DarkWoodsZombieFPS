/**
 * Mobile & iPad Touch Controls Component
 * Left: Floating Analog Movement Joystick
 * Right: Swipe Look Area + Tactile Fire, Reload, and Flashlight Buttons
 */
import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, RotateCcw, Flashlight, Compass } from 'lucide-react';

interface Props {
  onMove: (x: number, y: number) => void;
  onLook: (deltaX: number, deltaY: number) => void;
  onFireChange: (isFiring: boolean) => void;
  onReload: () => void;
  onFlashlightToggle: () => void;
  isFlashlightOn: boolean;
  isReloading: boolean;
}

export const TouchControls: React.FC<Props> = ({
  onMove,
  onLook,
  onFireChange,
  onReload,
  onFlashlightToggle,
  isFlashlightOn,
  isReloading,
}) => {
  // Left Floating Joystick State
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickBase, setJoystickBase] = useState({ x: 0, y: 0 });
  const [joystickStick, setJoystickStick] = useState({ x: 0, y: 0 });
  const moveTouchId = useRef<number | null>(null);

  // Right Swipe Look State
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number } | null>(null);

  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);

  // --- Left Half: Floating Dynamic Virtual Joystick ---
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    if (moveTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    moveTouchId.current = touch.identifier;

    setJoystickBase({ x: touch.clientX, y: touch.clientY });
    setJoystickStick({ x: touch.clientX, y: touch.clientY });
    setJoystickActive(true);
    onMove(0, 0);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === moveTouchId.current) {
        const maxRadius = 50;
        let dx = touch.clientX - joystickBase.x;
        let dy = touch.clientY - joystickBase.y;
        const dist = Math.hypot(dx, dy);

        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }

        setJoystickStick({
          x: joystickBase.x + dx,
          y: joystickBase.y + dy,
        });

        // Normalized vector: x = strafe (-1 to 1), y = forward/back (-1 forward, 1 backward)
        onMove(dx / maxRadius, dy / maxRadius);
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        moveTouchId.current = null;
        setJoystickActive(false);
        onMove(0, 0);
        break;
      }
    }
  };

  // --- Right Half: Touch-Drag Camera Look & Aim ---
  const handleRightTouchStart = (e: React.TouchEvent) => {
    // Check if touch is on one of the action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    if (lookTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId.current = touch.identifier;
    lastLookPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleRightTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current && lastLookPos.current) {
        const deltaX = touch.clientX - lastLookPos.current.x;
        const deltaY = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        onLook(deltaX, deltaY);
        break;
      }
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        lastLookPos.current = null;
        break;
      }
    }
  };

  // Cleanup touches if cancelled
  useEffect(() => {
    const handleTouchCancel = () => {
      moveTouchId.current = null;
      lookTouchId.current = null;
      setJoystickActive(false);
      onMove(0, 0);
      onFireChange(false);
    };
    window.addEventListener('touchcancel', handleTouchCancel);
    return () => window.removeEventListener('touchcancel', handleTouchCancel);
  }, [onMove, onFireChange]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none touch-none">
      {/* Left 50%: Floating Joystick Touchpad */}
      <div
        ref={leftZoneRef}
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        className="absolute top-20 bottom-0 left-0 w-1/2 pointer-events-auto"
      >
        {/* Render Floating Joystick UI when active */}
        {joystickActive && (
          <div
            className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-40 transition-opacity duration-150"
            style={{ left: `${joystickBase.x}px`, top: `${joystickBase.y}px` }}
          >
            {/* Outer Base Ring */}
            <div className="w-28 h-28 rounded-full border-2 border-white/30 bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <Compass className="w-6 h-6 text-white/20" />
            </div>

            {/* Inner Floating Thumbstick Knob */}
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-700 border-2 border-white/60 shadow-lg -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${joystickStick.x - joystickBase.x + 56}px`,
                top: `${joystickStick.y - joystickBase.y + 56}px`,
              }}
            />
          </div>
        )}
      </div>

      {/* Right 50%: Drag-to-Aim & Action Buttons */}
      <div
        ref={rightZoneRef}
        onTouchStart={handleRightTouchStart}
        onTouchMove={handleRightTouchMove}
        onTouchEnd={handleRightTouchEnd}
        className="absolute top-20 bottom-0 right-0 w-1/2 pointer-events-auto"
      >
        {/* Action Buttons Cluster (Bottom Right) */}
        <div className="absolute bottom-6 right-2 sm:right-6 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Secondary Buttons Row: Flashlight & Reload */}
          <div className="flex items-center gap-3 mr-2 mb-1">
            {/* Flashlight Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFlashlightToggle();
              }}
              className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                isFlashlightOn
                  ? 'bg-amber-500 border-amber-300 text-slate-950'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="Toggle Flashlight (F)"
            >
              <Flashlight className="w-5 h-5" />
            </button>

            {/* Reload Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReload();
              }}
              disabled={isReloading}
              className={`w-13 h-13 rounded-full border border-slate-700 bg-slate-900/90 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all ${
                isReloading ? 'opacity-50' : 'hover:bg-slate-800'
              }`}
              title="Reload Weapon (R)"
            >
              <RotateCcw className={`w-6 h-6 ${isReloading ? 'animate-spin text-amber-400' : 'text-slate-200'}`} />
            </button>
          </div>

          {/* Large Tactile Fire Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onFireChange(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onFireChange(false);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onFireChange(true);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              onFireChange(false);
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-red-700 to-rose-500 border-4 border-red-300/80 text-white flex flex-col items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] active:scale-90 active:from-red-800 active:to-rose-600 transition-all select-none"
            title="FIRE TRIGGER"
          >
            <Crosshair className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow" />
            <span className="text-[10px] font-black tracking-widest uppercase mt-0.5">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
