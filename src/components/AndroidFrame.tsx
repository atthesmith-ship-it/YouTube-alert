import React, { ReactNode } from 'react';
import { AndroidStatusBar } from './AndroidStatusBar.tsx';
import { AndroidNavBar } from './AndroidNavBar.tsx';
import { Smartphone, Monitor } from 'lucide-react';

interface AndroidFrameProps {
  children: ReactNode;
  unreadCount?: number;
  isPhoneMode: boolean;
  onToggleViewMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  unreadCount = 0,
  isPhoneMode,
  onToggleViewMode,
}) => {
  if (!isPhoneMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Top bar for expanded desktop mode */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/40">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">YouTube Alert</h1>
              <span className="text-[10px] text-slate-400">Android Monitoring System</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Switch to Android Phone Bezel View"
            >
              <Smartphone className="w-3.5 h-3.5 text-red-400" />
              <span>Android Phone View</span>
            </button>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Top quick switcher toggle on desktop */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Android Device View</span>
        <button
          onClick={onToggleViewMode}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-colors"
        >
          <Monitor className="w-3 h-3 text-slate-400" />
          <span>Switch to Expanded View</span>
        </button>
      </div>

      {/* Android Device Hardware Frame */}
      <div className="relative w-full max-w-[420px] h-[860px] max-h-[96vh] rounded-[48px] bg-slate-950 border-[9px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.06)] flex flex-col overflow-hidden ring-1 ring-slate-900">
        {/* Device metallic rim shine */}
        <div className="absolute inset-0 rounded-[40px] pointer-events-none border border-white/10 z-40" />

        {/* Hardware buttons simulation */}
        <div className="absolute -left-[12px] top-28 w-1 h-12 bg-slate-700 rounded-l-sm" />
        <div className="absolute -left-[12px] top-44 w-1 h-12 bg-slate-700 rounded-l-sm" />
        <div className="absolute -right-[12px] top-32 w-1 h-16 bg-slate-700 rounded-r-sm" />

        {/* Android Status Bar */}
        <AndroidStatusBar unreadCount={unreadCount} />

        {/* Main Phone Viewport */}
        <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-950">
          {children}
        </div>

        {/* Android Bottom Navigation Gesture Bar */}
        <AndroidNavBar />
      </div>
    </div>
  );
};
