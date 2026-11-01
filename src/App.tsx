import { useEffect, useState, useTransition } from 'react';
import { monitorManager } from './services/youtubeMonitor.ts';
import { AppSettings, KeywordItem, AlertItem } from './types/index.ts';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { AndroidNotificationBanner } from './components/AndroidNotificationBanner.tsx';
import { CompactAlertList } from './components/CompactAlertList.tsx';
import { KeywordManager } from './components/KeywordManager.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { 
  Bell, 
  Hash, 
  Settings, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Sparkles,
  Radio
} from 'lucide-react';

export default function App() {
  const [, startTransition] = useTransition();
  const [keywords, setKeywords] = useState<KeywordItem[]>(() => monitorManager.getKeywords());
  const [alerts, setAlerts] = useState<AlertItem[]>(() => monitorManager.getAlerts());
  const [settings, setSettings] = useState<AppSettings>(() => monitorManager.getSettings());
  const [isChecking, setIsChecking] = useState<boolean>(() => monitorManager.getIsChecking());
  const [activeTab, setActiveTab] = useState<'alerts' | 'keywords'>('alerts');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    // Start background polling monitor
    monitorManager.startMonitoring();

    // Subscribe to monitor changes
    const unsubscribe = monitorManager.subscribe(() => {
      startTransition(() => {
        setKeywords(monitorManager.getKeywords());
        setAlerts(monitorManager.getAlerts());
        setSettings(monitorManager.getSettings());
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
    // Open video in YouTube
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSimulateAlert = () => {
    monitorManager.simulateIncomingVideo();
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
        {/* App Bar (One-row, 3-zone contract) */}
        <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-10">
          {/* Zone 1: Brand Wordmark */}
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

          {/* Zone 2 & 3: Quick Action Toggles & Settings */}
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
              title={settings.speechEnabled ? 'Read title out loud enabled (click to mute)' : 'Speech announcements disabled'}
            >
              {settings.speechEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Test Alert Button */}
            <button
              onClick={handleSimulateAlert}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Test new alert match"
            >
              <Sparkles className="w-4 h-4 text-red-400" />
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

        {/* Content area: Adaptive for Phone mode vs Expanded layout */}
        {isPhoneMode ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Phone Top Tab Bar */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 shrink-0">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
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
                className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === 'keywords'
                    ? 'border-red-500 text-white bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Keywords</span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({keywords.filter(k => k.enabled).length})
                </span>
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === 'alerts' ? (
                <CompactAlertList
                  alerts={alerts}
                  onOpenVideo={handleOpenVideo}
                  onClearAlerts={() => monitorManager.clearAlerts()}
                  onMarkAllRead={() => monitorManager.markAllAsRead()}
                  onSimulateAlert={handleSimulateAlert}
                  isChecking={isChecking}
                />
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <KeywordManager
                    keywords={keywords}
                    onAddKeyword={(text) => monitorManager.addKeyword(text)}
                    onRemoveKeyword={(id) => monitorManager.removeKeyword(id)}
                    onToggleKeyword={(id) => monitorManager.toggleKeyword(id)}
                    onCheckNow={() => monitorManager.checkAllKeywordsNow()}
                    isChecking={isChecking}
                  />

                  {/* Summary card inside Keywords tab */}
                  <div className="p-4 text-xs text-slate-400 space-y-2">
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <h4 className="font-semibold text-slate-200 mb-1">How Monitoring Works</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        YouTube Alert continuously scans for newly uploaded videos matching your keywords.
                        When a match occurs, it chimes, announces the title out loud, and delivers a push notification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Expanded 2-Column Desktop / Tablet Layout */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
            {/* Left Column: Keywords & Quick Config */}
            <div className="md:col-span-5 flex flex-col overflow-y-auto border border-slate-800 rounded-3xl bg-slate-900/40">
              <KeywordManager
                keywords={keywords}
                onAddKeyword={(text) => monitorManager.addKeyword(text)}
                onRemoveKeyword={(id) => monitorManager.removeKeyword(id)}
                onToggleKeyword={(id) => monitorManager.toggleKeyword(id)}
                onCheckNow={() => monitorManager.checkAllKeywordsNow()}
                isChecking={isChecking}
              />

              <div className="p-4 border-t border-slate-800 mt-auto space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-red-500" />
                    <span>Sound Chime</span>
                  </div>
                  <span className="font-semibold text-slate-400">
                    {settings.soundEnabled ? 'Enabled' : 'Muted'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-500" />
                    <span>Announce Out Loud</span>
                  </div>
                  <span className="font-semibold text-slate-400">
                    {settings.speechEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <button
                  onClick={handleSimulateAlert}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulate Incoming Alert</span>
                </button>
              </div>
            </div>

            {/* Right Column: Compact Matched Video List */}
            <div className="md:col-span-7 flex flex-col overflow-hidden border border-slate-800 rounded-3xl bg-slate-900/40">
              <CompactAlertList
                alerts={alerts}
                onOpenVideo={handleOpenVideo}
                onClearAlerts={() => monitorManager.clearAlerts()}
                onMarkAllRead={() => monitorManager.markAllAsRead()}
                onSimulateAlert={handleSimulateAlert}
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
