import React, { useState } from 'react';
import { BlockedItem, SkippedAlertLog } from '../types/index.ts';
import { ShieldAlert, Plus, Trash2, Power, Ban, History, X } from 'lucide-react';

interface BlockedWordsManagerProps {
  blockedWords: BlockedItem[];
  skippedAlerts: SkippedAlertLog[];
  onAddBlockedWord: (text: string) => void;
  onRemoveBlockedWord: (id: string) => void;
  onToggleBlockedWord: (id: string) => void;
  onClearSkipped: () => void;
}

const PRESET_BLOCKED = [
  'happiness',
  'vlogger',
  'trivia',
  'weather',
  'pursuit of happiness'
];

export const BlockedWordsManager: React.FC<BlockedWordsManagerProps> = ({
  blockedWords,
  skippedAlerts,
  onAddBlockedWord,
  onRemoveBlockedWord,
  onToggleBlockedWord,
  onClearSkipped,
}) => {
  const [inputText, setInputText] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if (blockedWords.some(b => b.text.toLowerCase() === text.toLowerCase())) {
      setErrorMsg('Word or phrase is already in blocked list.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    onAddBlockedWord(text);
    setInputText('');
    setErrorMsg('');
  };

  const handleAddPreset = (preset: string) => {
    if (!blockedWords.some(b => b.text.toLowerCase() === preset.toLowerCase())) {
      onAddBlockedWord(preset);
    }
  };

  const activeCount = blockedWords.filter(b => b.enabled).length;

  // Real-time title test verification
  const testMatch = testTitle.trim() ? blockedWords.find(b => {
    if (!b.enabled) return false;
    const lowerB = b.text.trim().toLowerCase();
    const lowerT = testTitle.toLowerCase();
    return lowerT.includes(lowerB);
  }) : null;

  return (
    <div className="p-4 bg-slate-900/60 border-b md:border-b-0 md:border-l border-slate-800 flex flex-col h-full">
      {/* Title & Skipped Counter */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-white tracking-tight">Blocked Words & Phrases</h2>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            {activeCount}/{blockedWords.length} active
          </span>
        </div>

        {skippedAlerts.length > 0 && (
          <button
            onClick={() => setShowSkippedModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md border border-amber-500/30 transition-colors"
            title="View alerts skipped by blocked words"
          >
            <Ban className="w-3 h-3" />
            <span>{skippedAlerts.length} skipped</span>
          </button>
        )}
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
            placeholder='e.g. happiness, vlogger, "pursuit of happiness"'
            className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Block</span>
        </button>
      </form>

      {errorMsg && (
        <p className="text-[11px] text-amber-400 mb-2">{errorMsg}</p>
      )}

      {/* Preset suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
          Presets:
        </span>
        {PRESET_BLOCKED.map(preset => {
          const isAdded = blockedWords.some(b => b.text.toLowerCase() === preset.toLowerCase());
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

      {/* Blocked items list */}
      <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto pr-1 max-h-48 md:max-h-60">
        {blockedWords.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center italic">
            No blocked words or phrases yet.
          </p>
        ) : (
          blockedWords.map(b => (
            <div
              key={b.id}
              className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                b.enabled
                  ? 'bg-slate-950/80 border-slate-800/90'
                  : 'bg-slate-950/30 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleBlockedWord(b.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    b.enabled
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={b.enabled ? 'Pause blocking this word/phrase' : 'Resume blocking'}
                >
                  <Power className="w-3 h-3" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 truncate font-mono">
                      {b.text.includes(' ') ? `-"${b.text}"` : `-${b.text}`}
                    </span>
                    {b.blockedCount > 0 && (
                      <span className="text-[10px] font-mono tabular-nums text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                        {b.blockedCount} blocked
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {b.text.includes(' ') ? 'Exact phrase match' : 'Word match'}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemoveBlockedWord(b.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                title={`Remove "${b.text}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Title tester footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 bg-slate-950/40 p-2.5 rounded-xl">
        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
          Title Filter Test (Check before alert):
        </label>
        <input
          type="text"
          value={testTitle}
          onChange={(e) => setTestTitle(e.target.value)}
          placeholder="Test a title e.g. Pursuit of happiness on road..."
          className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 mb-1"
        />
        {testTitle.trim() && (
          <div className="text-[11px] mt-1">
            {testMatch ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <Ban className="w-3 h-3" />
                Will be skipped! Matches blocked: &quot;{testMatch.text}&quot;
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                Clean title — Alert would be permitted.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Skipped alerts history modal */}
      {showSkippedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Skipped Video Log</h3>
              </div>
              <button
                onClick={() => setShowSkippedModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {skippedAlerts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No skipped alerts recorded yet.</p>
              ) : (
                skippedAlerts.map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono tabular-nums">{log.timeFormatted}</span>
                      <span className="text-red-400 bg-red-400/10 px-1 rounded font-semibold">
                        Blocked by &quot;{log.blockedBy}&quot;
                      </span>
                    </div>
                    <p className="font-medium text-slate-200 line-clamp-2">{log.title}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={onClearSkipped}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                Clear log
              </button>
              <button
                onClick={() => setShowSkippedModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
