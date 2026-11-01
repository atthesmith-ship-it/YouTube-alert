import React, { useEffect, useState } from 'react';
import { Wifi, Bell } from 'lucide-react';

interface AndroidStatusBarProps {
  unreadCount?: number;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ unreadCount = 0 }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 w-full px-5 flex items-center justify-between text-xs font-semibold text-slate-300 select-none bg-slate-950/80 backdrop-blur-sm z-30 shrink-0">
      {/* Left: Current time & active notification badge */}
      <div className="flex items-center gap-2">
        <span className="tabular-nums tracking-tight text-[13px] text-white font-medium">{timeStr || '10:36'}</span>
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded text-[10px] font-bold">
            <Bell className="w-2.5 h-2.5 fill-red-400" />
            <span>{unreadCount}</span>
          </div>
        )}
      </div>

      {/* Center: Punch-hole camera dot */}
      <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-800 shadow-inner -translate-x-1" />

      {/* Right: Network & Battery status */}
      <div className="flex items-center gap-2.5 text-slate-300 text-[11px]">
        <span className="font-bold text-[10px] tracking-widest text-slate-400">5G</span>
        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-slate-200">98%</span>
          <div className="w-5 h-2.5 border border-slate-300 rounded-[2px] p-[1px] flex items-center">
            <div className="h-full w-[85%] bg-emerald-400 rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
