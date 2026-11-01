import { useEffect, useState, useTransition } from 'react';
import { monitorManager } from './services/youtubeMonitor.ts';
import { AppSettings, KeywordItem, BlockedItem, AlertItem, SkippedAlertLog } from './types/index.ts';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { AndroidNotificationBanner } from './components/AndroidNotificationBanner.tsx';
import { CompactAlertList } from './components/CompactAlertList.tsx';
import { KeywordManager } from './components/KeywordManager.tsx';
import { BlockedWordsManager } from './components/BlockedWordsManager.tsx';
import { QueryPreviewBar } from './components/QueryPreviewBar.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { 
  Bell, 
  Hash, 
  ShieldAlert,
  Settings, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles,
  Radio,
  Ban
} from 'lucide-react';

export default function App() {
  const [, startTransition] = useTransition();
  const [keywords, setKeywords] = useState<KeywordItem[]>(() => monitorManager.getKeywords());
  const [blockedWords, setBlockedWords] = useState<BlockedItem[]>(() => monitorManager.getBlockedWords());
  const [alerts, setAlerts] = useState<AlertItem[]>(() => monitorManager.getAlerts());
  const [skippedAlerts, setSkippedAlerts] = useState<SkippedAlertLog[]>(() => monitorManager.getSkippedAlerts());
  const [settings, setSettings] = useState<AppSettings>(() => monitorManager.getSettings());
  const [todaySearchCount, setTodaySearchCount] = useState<number>(() => monitorManager.getTodaySearchCount());
  const [isChecking, setIsChecking] = useState<boolean>(() => monitorManager.getIsChecking());
  const [activeTab, setActiveTab] = useState<'alerts' | 'keywords' | 'blocked'>('alerts');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<string>('');

  useEffect(() => {
    monitorManager.startMonitoring();

    const unsubscribe = monitorManager.subscribe(() => {
      startTransition(() => {
        setKeywords(monitorManager.getKeywords());
        setBlockedWords(monitorManager.getBlockedWords());
        setAlerts(monitorManager.getAlerts());
        setSkippedAlerts(monitorManager.getSkippedAlerts());
        setSettings(monitorManager.getSettings());
        setTodaySearchCount(monitorManager.getTodaySearchCount());
        setIsChecking(monitorManager.getIsChecking());
      });
    });

    return () => {
      unsubscribe();
      monitorManager.stopMonitoring();
    };
  }, []);

  const handleOpenVideo = (url: string, id?: string) => {
    if (id) {
      monitorManager.markAlertAsRead(id);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSimulateCleanAlert = () => {
    const result = monitorManager.simulateIncomingVideo();
    if (result.success) {
      setTestFeedback('New video alert triggered!');
    } else if (result.blockedBy) {
      setTestFeedback(`Alert skipped! Contains blocked: "${result.blockedBy}"`);
    }
    setTimeout(() => setTestFeedback(''), 4000);
  };

  const handleSimulateBlockedAlert = () => {
    const result = monitorManager.simulateIncomingVideo({ testBlockedWord: 'pursuit of happiness' });
    if (!result.success && result.blockedBy) {
      setTestFeedback(`Test passed! Video containing "${result.blockedBy}" was skipped.`);
    }
    setTimeout(() => setTestFeedback(''), 4500);
  };

  const handleToggleSound = () => {
    monitorManager.updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleToggleSpeech = () => {
    monitorManager.updateSettings({ speechEnabled: !settings.speechEnabled });
  };

  const handleToggleViewMode = () => {
    const nextMode = settings.deviceViewMode === 'phone' ? 'expanded' : 'phone';
    monitorManager.updateSettings({ deviceViewMode: nextMode });
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const isPhoneMode = settings.deviceViewMode === 'phone';

  return (
    <AndroidFrame
      isPhoneMode={isPhoneMode}
      unreadCount={unreadCount}
      onToggleViewMode={handleToggleViewMode}
    >
      {/* Top in-app Heads-up Android notification banner */}
      <AndroidNotificationBanner onOpenVideo={handleOpenVideo} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* App Bar (Zone 1: Wordmark, Zone 2: Status, Zone 3: Actions) */}
        <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-900/50">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">YouTube Alert</span>
                <Radio className={`w-3 h-3 ${isChecking ? 'text-amber-400 animate-spin' : 'text-red-500'}`} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-colors ${
                settings.soundEnabled 
                  ? 'text-red-400 hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
              }`}
              title={settings.soundEnabled ? 'Alert chime enabled (click to mute)' : 'Alert chime muted'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Speech Announcement Toggle */}
            <button
              onClick={handleToggleSpeech}
              className={`p-2 rounded-xl transition-colors ${
                settings.speechEnabled 
                  ? 'text-amber-400 hover:bg-slate-800' 
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
              }`}
              title={settings.speechEnabled ? 'Read title out loud enabled' : 'Speech announcements disabled'}
            >
              {settings.speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Test Clean Alert */}
            <button
              onClick={handleSimulateCleanAlert}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Test new alert match"
            >
              <Sparkles className="w-4 h-4 text-red-400" />
            </button>

            {/* Test Blocked Title Skip */}
            <button
              onClick={handleSimulateBlockedAlert}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-colors"
              title='Test Blocked Words filter (simulates title with "pursuit of happiness")'
            >
              <Ban className="w-4 h-4 text-amber-500" />
            </button>

            {/* Settings Gear */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Search Quota and YouTube Query Preview Bar */}
        <QueryPreviewBar
          keywords={keywords}
          blockedWords={blockedWords}
          todaySearchCount={todaySearchCount}
          dailyLimit={settings.dailyQuotaLimit}
          onResetQuota={() => monitorManager.resetTodaySearchCount()}
        />

        {/* Temporary Feedback Banner for Tests */}
        {testFeedback && (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs text-amber-300 flex items-center justify-between animate-in fade-in">
            <span>{testFeedback}</span>
            <button onClick={() => setTestFeedback('')} className="text-slate-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Content area */}
        {isPhoneMode ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Phone Top Tab Bar */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 shrink-0">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-2.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'alerts'
                    ? 'border-red-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts</span>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('keywords')}
                className={`flex-1 py-2.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'keywords'
                    ? 'border-red-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Keywords</span>
                <span className="text-[10px] font-mono text-slate-500">
                  ({keywords.filter(k => k.enabled).length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('blocked')}
                className={`flex-1 py-2.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'blocked'
                    ? 'border-amber-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Blocked</span>
                <span className="text-[10px] font-mono text-amber-400/80">
                  ({blockedWords.filter(b => b.enabled).length})
                </span>
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'alerts' && (
                <CompactAlertList
                  alerts={alerts}
                  onOpenVideo={handleOpenVideo}
                  onClearAlerts={() => monitorManager.clearAlerts()}
                  onMarkAllRead={() => monitorManager.markAllAsRead()}
                  onSimulateAlert={handleSimulateCleanAlert}
                  isChecking={isChecking}
                />
              )}

              {activeTab === 'keywords' && (
                <div className="flex-1 overflow-y-auto">
                  <KeywordManager
                    keywords={keywords}
                    onAddKeyword={(text) => monitorManager.addKeyword(text)}
                    onRemoveKeyword={(id) => monitorManager.removeKeyword(id)}
                    onToggleKeyword={(id) => monitorManager.toggleKeyword(id)}
                    onCheckNow={() => monitorManager.checkAllKeywordsNow()}
                    isChecking={isChecking}
                  />

                  <div className="p-4 text-xs text-slate-400 space-y-2">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <h4 className="font-semibold text-slate-200 mb-1">Keywords Matching</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Keywords match whole phrases (e.g. &quot;police chase&quot; is searched with quotes). You can add or remove them anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'blocked' && (
                <div className="flex-1 overflow-y-auto">
                  <BlockedWordsManager
                    blockedWords={blockedWords}
                    skippedAlerts={skippedAlerts}
                    onAddBlockedWord={(text) => monitorManager.addBlockedWord(text)}
                    onRemoveBlockedWord={(id) => monitorManager.removeBlockedWord(id)}
                    onToggleBlockedWord={(id) => monitorManager.toggleBlockedWord(id)}
                    onClearSkipped={() => monitorManager.clearSkippedAlerts()}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Expanded 2-Column Desktop Layout */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
            {/* Left Column: Side-by-Side Lists (Keywords + Blocked Words) */}
            <div className="md:col-span-6 flex flex-col overflow-hidden border border-slate-800 rounded-3xl bg-slate-900/40">
              <div className="flex border-b border-slate-800 bg-slate-900/70 shrink-0">
                <div className="flex-1 px-4 py-2 text-xs font-bold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-red-500" />
                  <span>1. Keywords ({keywords.length})</span>
                </div>
                <div className="flex-1 px-4 py-2 text-xs font-bold text-white flex items-center gap-2 border-l border-slate-800">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>2. Blocked Words & Phrases ({blockedWords.length})</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 overflow-y-auto">
                <KeywordManager
                  keywords={keywords}
                  onAddKeyword={(text) => monitorManager.addKeyword(text)}
                  onRemoveKeyword={(id) => monitorManager.removeKeyword(id)}
                  onToggleKeyword={(id) => monitorManager.toggleKeyword(id)}
                  onCheckNow={() => monitorManager.checkAllKeywordsNow()}
                  isChecking={isChecking}
                />

                <BlockedWordsManager
                  blockedWords={blockedWords}
                  skippedAlerts={skippedAlerts}
                  onAddBlockedWord={(text) => monitorManager.addBlockedWord(text)}
                  onRemoveBlockedWord={(id) => monitorManager.removeBlockedWord(id)}
                  onToggleBlockedWord={(id) => monitorManager.toggleBlockedWord(id)}
                  onClearSkipped={() => monitorManager.clearSkippedAlerts()}
                />
              </div>

              {/* Quick simulation buttons footer */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex gap-2">
                <button
                  onClick={handleSimulateCleanAlert}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-md active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Clean Match</span>
                </button>
                <button
                  onClick={handleSimulateBlockedAlert}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs py-2 rounded-xl border border-amber-500/30 transition-all active:scale-98"
                  title="Simulate video with 'pursuit of happiness' to test skip"
                >
                  <Ban className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Blocked Skip</span>
                </button>
              </div>
            </div>

            {/* Right Column: Compact Matched Video List */}
            <div className="md:col-span-6 flex flex-col overflow-hidden border border-slate-800 rounded-3xl bg-slate-900/40">
              <CompactAlertList
                alerts={alerts}
                onOpenVideo={handleOpenVideo}
                onClearAlerts={() => monitorManager.clearAlerts()}
                onMarkAllRead={() => monitorManager.markAllAsRead()}
                onSimulateAlert={handleSimulateCleanAlert}
                isChecking={isChecking}
              />
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => monitorManager.updateSettings(newSettings)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </AndroidFrame>
  );
}
