import React, { useState, useEffect } from 'react';
import { AppSettings, SoundType } from '../types/index.ts';
import { soundService } from '../services/soundService.ts';
import { speechService } from '../services/speechService.ts';
import { notificationService } from '../services/notificationService.ts';
import { 
  X, 
  Volume2, 
  Mic, 
  Bell, 
  Clock, 
  Smartphone, 
  Monitor, 
  Play, 
  Check, 
  Download 
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
    const voices = speechService.getVoices();
    setAvailableVoices(voices);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      onUpdateSettings({ notificationsEnabled: true });
    }
  };

  const handleTestSound = () => {
    soundService.playAlertSound(settings.soundType, settings.volume);
    if (settings.vibrationEnabled) {
      soundService.vibrate();
    }
  };

  const handleTestSpeech = () => {
    speechService.speakAlert(
      'Live police pursuit suspect apprehended on Interstate 10',
      'police chase',
      {
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        voiceURI: settings.speechVoiceURI,
        includeKeyword: settings.speechIncludeKeyword,
      }
    );
  };

  const handleInstallApp = async () => {
    if (installPrompt && 'prompt' in (installPrompt as unknown as Record<string, unknown>)) {
      const promptEvent = installPrompt as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
      await promptEvent.prompt();
      setInstallPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">Alert & Audio Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Alert Sounds */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">Alert Sound</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {settings.soundEnabled && (
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-medium">Sound Tone Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'android_chime', label: 'Android Chime' },
                      { id: 'urgent_pulse', label: 'Emergency Pulse' },
                      { id: 'police_scanner', label: 'Police Scanner' },
                      { id: 'subtle_ping', label: 'Subtle Ping' },
                    ].map(snd => (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ soundType: snd.id as SoundType });
                          soundService.playAlertSound(snd.id as SoundType, settings.volume);
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border text-left flex items-center justify-between transition-all ${
                          settings.soundType === snd.id
                            ? 'bg-red-600/20 border-red-500 text-white font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{snd.label}</span>
                        {settings.soundType === snd.id && <Check className="w-3.5 h-3.5 text-red-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Volume</span>
                    <span className="font-mono tabular-nums">{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.vibrationEnabled}
                      onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                      className="rounded accent-red-600"
                    />
                    <span>Haptic vibration pulse</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3 text-red-400" />
                    <span>Test Sound</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Speech Announcement (Read title aloud) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-white">Announce Title Out Loud</h3>
                  <p className="text-[11px] text-slate-400">Speaks matched video title using Text-to-Speech</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.speechEnabled}
                  onChange={(e) => onUpdateSettings({ speechEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {settings.speechEnabled && (
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
                {/* Voice select */}
                {availableVoices.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-medium">Speech Voice</label>
                    <select
                      value={settings.speechVoiceURI}
                      onChange={(e) => onUpdateSettings({ speechVoiceURI: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Default System Voice</option>
                      {availableVoices.map(v => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Speech rate */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Speech Speed</span>
                    <span className="font-mono tabular-nums">{settings.speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.speechIncludeKeyword}
                      onChange={(e) => onUpdateSettings({ speechIncludeKeyword: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <span>Prefix with &quot;Alert for [keyword]&quot;</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleTestSpeech}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3 text-amber-400" />
                    <span>Test Voice</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Push Notifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <div>
                  <h3 className="text-sm font-bold text-white">Push Notifications</h3>
                  <p className="text-[11px] text-slate-400">System alerts when new videos match</p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {permissionStatus === 'granted' ? 'Allowed' : permissionStatus === 'denied' ? 'Blocked' : 'Not Requested'}
              </span>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                {permissionStatus === 'granted' ? (
                  <p className="text-slate-400">System push alerts are active. You will receive notifications even when minimized.</p>
                ) : (
                  <p className="text-slate-400">Tap to allow browser notifications on this device.</p>
                )}
              </div>

              {permissionStatus !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shadow-sm"
                >
                  Enable Notifications
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    notificationService.sendAlertNotification({
                      id: 'test-push-' + Date.now(),
                      title: 'Police chase suspect pursued through highway 99',
                      keyword: 'police chase',
                      timeFormatted: 'Now',
                      timestamp: Date.now(),
                      channel: 'Live Alert Feed',
                      url: 'https://www.youtube.com',
                      isRead: false
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Send Test Push
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Polling Interval */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-white">Monitoring Frequency</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { sec: 15, label: '15s (Turbo)' },
                { sec: 30, label: '30s (Default)' },
                { sec: 60, label: '1 min' },
                { sec: 120, label: '2 min' },
              ].map(item => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => onUpdateSettings({ checkIntervalSeconds: item.sec })}
                  className={`py-2 px-1 text-center text-xs rounded-xl border transition-all ${
                    settings.checkIntervalSeconds === item.sec
                      ? 'bg-emerald-600/20 border-emerald-500 text-white font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: View Mode Switcher */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Display Mode</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ deviceViewMode: 'phone' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs transition-all ${
                  settings.deviceViewMode === 'phone'
                    ? 'bg-purple-600/20 border-purple-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android Phone View</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ deviceViewMode: 'expanded' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs transition-all ${
                  settings.deviceViewMode === 'expanded'
                    ? 'bg-purple-600/20 border-purple-500 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Expanded View</span>
              </button>
            </div>
          </div>

          {/* PWA Install Button if available */}
          {installPrompt && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-lg active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Install YouTube Alert on Android</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
