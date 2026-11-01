import React, { useState } from 'react';
import { KeywordItem } from '../types/index.ts';
import { Plus, Trash2, Power, RefreshCw, Hash } from 'lucide-react';

interface KeywordManagerProps {
  keywords: KeywordItem[];
  onAddKeyword: (text: string) => void;
  onRemoveKeyword: (id: string) => void;
  onToggleKeyword: (id: string) => void;
  onCheckNow: () => void;
  isChecking: boolean;
}

const PRESET_SUGGESTIONS = [
  'police chase',
  'market crash injury',
  'wildfire evacuation',
  'earthquake emergency',
  'rocket launch live'
];

export const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  onToggleKeyword,
  onCheckNow,
  isChecking,
}) => {
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (keywords.some(k => k.text.toLowerCase() === text.toLowerCase())) {
      setErrorMsg('Keyword already exists in monitor list.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    onAddKeyword(text);
    setInputText('');
    setErrorMsg('');
  };

  const handleAddPreset = (preset: string) => {
    if (!keywords.some(k => k.text.toLowerCase() === preset.toLowerCase())) {
      onAddKeyword(preset);
    }
  };

  const activeCount = keywords.filter(k => k.enabled).length;

  return (
    <div className="p-4 bg-slate-900/60 border-b border-slate-800">
      {/* Title & Active Counter */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold text-white tracking-tight">Monitored Keywords</h2>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            {activeCount}/{keywords.length} active
          </span>
        </div>

        <button
          onClick={onCheckNow}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-all disabled:opacity-50"
          title="Check YouTube for new matches now"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-red-400' : ''}`} />
          <span className="text-[11px]">{isChecking ? 'Checking...' : 'Check Now'}</span>
        </button>
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Type keyword e.g. police chase, market crash..."
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </form>

      {errorMsg && (
        <p className="text-[11px] text-amber-400 mb-2">{errorMsg}</p>
      )}

      {/* Preset suggestions for quick adding */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
          Suggestions:
        </span>
        {PRESET_SUGGESTIONS.map(preset => {
          const isAdded = keywords.some(k => k.text.toLowerCase() === preset.toLowerCase());
          if (isAdded) return null;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="text-[11px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1 border border-slate-800"
            >
              <span>+</span>
              <span>{preset}</span>
            </button>
          );
        })}
      </div>

      {/* Keyword list */}
      <div className="space-y-1.5 mt-1 max-h-44 overflow-y-auto pr-1">
        {keywords.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center italic">
            No keywords added. Type one above to begin alerting!
          </p>
        ) : (
          keywords.map(kw => (
            <div
              key={kw.id}
              className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                kw.enabled
                  ? 'bg-slate-950/80 border-slate-800/90'
                  : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleKeyword(kw.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    kw.enabled
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={kw.enabled ? 'Pause alerts for this keyword' : 'Resume alerts'}
                >
                  <Power className="w-3 h-3" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {kw.text}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400 bg-slate-900 px-1 rounded">
                      {kw.matchCount} {kw.matchCount === 1 ? 'match' : 'matches'}
                    </span>
                  </div>
                  {kw.lastMatchedAt && (
                    <span className="text-[10px] text-slate-500">
                      Last matched {new Date(kw.lastMatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemoveKeyword(kw.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                title={`Remove "${kw.text}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
