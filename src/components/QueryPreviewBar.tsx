import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Gauge, RotateCcw } from 'lucide-react';
import { BlockedItem, KeywordItem } from '../types/index.ts';
import { buildYouTubeSearchQuery } from '../services/youtubeMonitor.ts';

interface QueryPreviewBarProps {
  keywords: KeywordItem[];
  blockedWords: BlockedItem[];
  todaySearchCount: number;
  dailyLimit: number;
  onResetQuota: () => void;
}

export const QueryPreviewBar: React.FC<QueryPreviewBarProps> = ({
  keywords,
  blockedWords,
  todaySearchCount,
  dailyLimit,
  onResetQuota,
}) => {
  const [copied, setCopied] = useState(false);
  const activeKeywords = keywords.filter(k => k.enabled);
  const primaryKeyword = activeKeywords.length > 0 ? activeKeywords[0].text : 'police chase';

  const generatedQuery = buildYouTubeSearchQuery(primaryKeyword, blockedWords);

  const handleCopy = () => {
    if (!generatedQuery) return;
    navigator.clipboard.writeText(generatedQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenYouTubeSearch = () => {
    if (!generatedQuery) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(generatedQuery)}`, '_blank', 'noopener,noreferrer');
  };

  const usagePercent = Math.min(100, Math.round((todaySearchCount / dailyLimit) * 100));

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 shrink-0 text-xs">
      {/* Top line: Search Quota counter & YouTube query label */}
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200 text-[11px]">Today&apos;s Searches:</span>
          <span className="font-mono tabular-nums text-emerald-400 font-bold text-[12px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
            {todaySearchCount}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            / {dailyLimit} quota
          </span>
          <button
            onClick={onResetQuota}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Reset today's search counter"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Small progress meter */}
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(4, usagePercent)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-slate-400">
            {usagePercent}%
          </span>
        </div>
      </div>

      {/* Generated YouTube Query row */}
      <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-lg p-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 shrink-0 select-none pl-1">
          YT Query:
        </span>
        <div className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-slate-300 select-all no-scrollbar">
          {generatedQuery ? (
            <span>{generatedQuery}</span>
          ) : (
            <span className="text-slate-600">No active keywords</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Copy query to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleOpenYouTubeSearch}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-1.5 py-0.5 rounded transition-colors"
            title="Test this search directly in YouTube"
          >
            <span>Search YT</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
