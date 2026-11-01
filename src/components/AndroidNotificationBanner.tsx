import React, { useEffect, useState } from 'react';
import { AlertItem } from '../types/index.ts';
import { notificationService } from '../services/notificationService.ts';
import { ExternalLink, X, Volume2 } from 'lucide-react';

interface AndroidNotificationBannerProps {
  onOpenVideo: (url: string) => void;
}

export const AndroidNotificationBanner: React.FC<AndroidNotificationBannerProps> = ({ onOpenVideo }) => {
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((alert: AlertItem) => {
      setCurrentAlert(alert);
      setIsVisible(true);

      // Auto dismiss after 7 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 7000);

      return () => clearTimeout(timeout);
    });

    return () => unsubscribe();
  }, []);

  if (!currentAlert || !isVisible) return null;

  return (
    <div className="absolute top-9 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
      <div 
        onClick={() => {
          onOpenVideo(currentAlert.url);
          setIsVisible(false);
        }}
        className="bg-slate-900/95 border border-red-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl cursor-pointer hover:border-red-400/60 transition-all select-none"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <div className="flex items-center gap-2">
            {/* YouTube Play Icon */}
            <div className="w-5 h-5 bg-red-600 rounded-md flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-200 text-[11px] tracking-tight">YouTube Alert</span>
            <span className="text-slate-500 text-[10px]">·</span>
            <span className="text-red-400 font-semibold text-[11px] truncate max-w-[120px]">{currentAlert.keyword}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Just now</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="p-1 hover:text-white rounded-full transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Title */}
        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-2.5">
          {currentAlert.title}
        </p>

        {/* Action strip */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Volume2 className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="truncate max-w-[150px]">{currentAlert.channel}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenVideo(currentAlert.url);
              setIsVisible(false);
            }}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white font-medium text-[11px] px-2.5 py-1 rounded-lg transition-colors shadow-sm"
          >
            <span>Open in YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
