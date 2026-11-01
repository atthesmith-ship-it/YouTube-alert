import React, { useState } from 'react';
import { AlertItem } from '../types/index.ts';
import { ExternalLink, Search, Trash2, CheckCheck, Play, BellOff, Sparkles } from 'lucide-react';

interface CompactAlertListProps {
  alerts: AlertItem[];
  onOpenVideo: (url: string, id: string) => void;
  onClearAlerts: () => void;
  onMarkAllRead: () => void;
  onSimulateAlert: () => void;
  isChecking: boolean;
}

export const CompactAlertList: React.FC<CompactAlertListProps> = ({
  alerts,
  onOpenVideo,
  onClearAlerts,
  onMarkAllRead,
  onSimulateAlert,
  isChecking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState<string>('all');

  // Extract unique keywords present in alerts
  const alertKeywords = Array.from(new Set(alerts.map(a => a.keyword)));

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.channel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedKeywordFilter === 'all' || alert.keyword.toLowerCase() === selectedKeywordFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header toolbar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">Matched Videos</h2>
            <span className="text-xs font-mono tabular-nums text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {filteredAlerts.length}
            </span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold text-red-400">
                ({unreadCount} new)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="p-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 rounded hover:bg-slate-800"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Mark read</span>
              </button>
            )}

            {alerts.length > 0 && (
              <button
                onClick={onClearAlerts}
                className="p-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 rounded hover:bg-slate-800"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matched titles or channels..."
            className="w-full bg-slate-950/70 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500/60"
          />
        </div>

        {/* Keyword Filter Tabs */}
        {alertKeywords.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
            <button
              onClick={() => setSelectedKeywordFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedKeywordFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              All
            </button>
            {alertKeywords.map(kw => (
              <button
                key={kw}
                onClick={() => setSelectedKeywordFilter(kw)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedKeywordFilter === kw
                    ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compact Video List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-600">
              <BellOff className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">No alerts matched yet</p>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Add keywords above or wait for background monitoring. Tap below to simulate a live match.
            </p>
            <button
              onClick={onSimulateAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate New Match Now</span>
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onOpenVideo(alert.url, alert.id)}
              className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-slate-800/60 ${
                !alert.isRead ? 'bg-slate-900/60 hover:bg-slate-800/40' : 'hover:bg-slate-900/30'
              }`}
            >
              {/* Play icon indicator */}
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-red-600/10 border border-red-600/20 group-hover:bg-red-600 group-hover:border-red-600 flex items-center justify-center text-red-400 group-hover:text-white shrink-0 transition-colors">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>

              {/* Main content: Time and Title (as required) */}
              <div className="flex-1 min-w-0">
                {/* Meta line: Time and Keyword */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span className="font-mono tabular-nums text-slate-300 text-[11px] font-medium">
                    {alert.timeFormatted}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-red-400 font-medium text-[11px] truncate">
                    {alert.keyword}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-500 text-[11px] truncate">
                    {alert.channel}
                  </span>
                  {!alert.isRead && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                      New
                    </span>
                  )}
                </div>

                {/* Video Title */}
                <h3 className="text-xs sm:text-[13px] font-semibold text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                  {alert.title}
                </h3>
              </div>

              {/* Right Open in YouTube cue */}
              <div className="mt-1 text-slate-500 group-hover:text-red-400 transition-colors shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer quick action bar */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
        <span className="text-[11px] text-slate-400">
          {isChecking ? 'Checking YouTube...' : 'Live alert monitor active'}
        </span>
        <button
          onClick={onSimulateAlert}
          className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          <span>Test Alert</span>
        </button>
      </div>
    </div>
  );
};
