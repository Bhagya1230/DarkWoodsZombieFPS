/**
 * PWA Install Modal & Action Button Component
 * Supports 1-click install on Chrome/Desktop/Android and guided iOS Safari instructions
 */
import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'button' | 'banner';
}

export const PWAInstallModal: React.FC<Props> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as PWA on home screen, do not show
  if (isInstalled) return null;

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs tracking-wide transition-all shadow-md active:scale-95 ${
          variant === 'banner'
            ? 'bg-red-600/90 hover:bg-red-600 text-white border border-red-500/40'
            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-red-400" />
        <span>Install to Desktop / iPad</span>
      </button>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/50 flex items-center justify-center text-red-500">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Install Dark Woods</h3>
                <p className="text-xs text-slate-400">Play in full screen on iPad & iPhone</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 my-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  Tap the <span className="font-semibold text-white inline-flex items-center gap-1 mx-1"><Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> Share</span> icon in your Safari toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  Scroll down the menu and tap <span className="font-semibold text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3.5 h-3.5 text-green-400 inline" /> Add to Home Screen</span>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  Tap <span className="font-semibold text-white">Add</span> in the top-right corner to launch directly from your home screen with zero browser bars!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
