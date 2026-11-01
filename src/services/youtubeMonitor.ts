import { AlertItem, AppSettings, KeywordItem } from '../types/index.ts';
import { soundService } from './soundService.ts';
import { speechService } from './speechService.ts';
import { notificationService } from './notificationService.ts';

const STORAGE_KEYWORDS_KEY = 'yt_alert_keywords_v1';
const STORAGE_ALERTS_KEY = 'yt_alert_history_v1';
const STORAGE_SEEN_IDS_KEY = 'yt_alert_seen_video_ids_v1';
const STORAGE_SETTINGS_KEY = 'yt_alert_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundType: 'android_chime',
  volume: 0.85,
  vibrationEnabled: true,
  speechEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVoiceURI: '',
  speechIncludeKeyword: true,
  notificationsEnabled: true,
  checkIntervalSeconds: 30,
  deviceViewMode: 'phone',
};

// Initial keywords requested by user or common breaking topics
export const INITIAL_KEYWORDS: KeywordItem[] = [
  {
    id: 'kw-1',
    text: 'police chase',
    enabled: true,
    createdAt: Date.now() - 3600000,
    matchCount: 1,
    lastMatchedAt: Date.now() - 600000,
    color: '#ef4444', // red
  },
  {
    id: 'kw-2',
    text: 'market crash injury',
    enabled: true,
    createdAt: Date.now() - 3500000,
    matchCount: 1,
    lastMatchedAt: Date.now() - 1200000,
    color: '#f59e0b', // amber
  },
  {
    id: 'kw-3',
    text: 'breaking news live',
    enabled: true,
    createdAt: Date.now() - 3000000,
    matchCount: 0,
    color: '#3b82f6', // blue
  }
];

export const INITIAL_SAMPLE_ALERTS: AlertItem[] = [
  {
    id: 'demo-video-1',
    title: 'LIVE: Suspect in stolen sports car flees highway patrol at 130mph through metro corridor',
    keyword: 'police chase',
    timeFormatted: '10:32 AM',
    timestamp: Date.now() - 240000,
    channel: 'Metro Scanner Live',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    isRead: false,
  },
  {
    id: 'demo-video-2',
    title: 'Flash Market Crash: NYSE triggers Level 1 circuit breaker amid rapid algorithmic selloff',
    keyword: 'market crash injury',
    timeFormatted: '10:18 AM',
    timestamp: Date.now() - 1080000,
    channel: 'Financial Pulse 24/7',
    url: 'https://www.youtube.com/watch?v=V1bFr2SWP1I',
    isRead: true,
  }
];

export class YouTubeMonitorManager {
  private keywords: KeywordItem[] = [];
  private alerts: AlertItem[] = [];
  private seenIds: Set<string> = new Set();
  private settings: AppSettings = DEFAULT_SETTINGS;
  private timer: number | null = null;
  private isChecking: boolean = false;
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;

    try {
      const savedKeywords = localStorage.getItem(STORAGE_KEYWORDS_KEY);
      this.keywords = savedKeywords ? JSON.parse(savedKeywords) : INITIAL_KEYWORDS;

      const savedAlerts = localStorage.getItem(STORAGE_ALERTS_KEY);
      this.alerts = savedAlerts ? JSON.parse(savedAlerts) : INITIAL_SAMPLE_ALERTS;

      const savedSeen = localStorage.getItem(STORAGE_SEEN_IDS_KEY);
      const parsedSeen: string[] = savedSeen ? JSON.parse(savedSeen) : [];
      this.seenIds = new Set(parsedSeen);
      
      // Ensure initial demo alerts are marked seen so they are never re-alerted
      this.alerts.forEach(a => this.seenIds.add(a.id));

      const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.error('Error loading YouTube Alert storage:', e);
      this.keywords = INITIAL_KEYWORDS;
      this.alerts = INITIAL_SAMPLE_ALERTS;
      this.settings = DEFAULT_SETTINGS;
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYWORDS_KEY, JSON.stringify(this.keywords));
      localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_SEEN_IDS_KEY, JSON.stringify(Array.from(this.seenIds)));
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notify() {
    this.changeListeners.forEach(fn => fn());
  }

  public getKeywords(): KeywordItem[] {
    return [...this.keywords];
  }

  public getAlerts(): AlertItem[] {
    return [...this.alerts];
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
    this.restartTimer();
  }

  public addKeyword(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Check duplicate
    if (this.keywords.some(k => k.text.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const assignedColor = colors[this.keywords.length % colors.length];

    const newKeyword: KeywordItem = {
      id: 'kw-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: trimmed,
      enabled: true,
      createdAt: Date.now(),
      matchCount: 0,
      color: assignedColor,
    };

    this.keywords = [newKeyword, ...this.keywords];
    this.saveState();

    // Trigger an immediate check for this new keyword
    this.checkKeywordForVideos(newKeyword);
    return true;
  }

  public removeKeyword(id: string) {
    this.keywords = this.keywords.filter(k => k.id !== id);
    this.saveState();
  }

  public toggleKeyword(id: string) {
    this.keywords = this.keywords.map(k => {
      if (k.id === id) {
        return { ...k, enabled: !k.enabled };
      }
      return k;
    });
    this.saveState();
  }

  public clearAlerts() {
    this.alerts = [];
    this.saveState();
  }

  public markAlertAsRead(id: string) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, isRead: true } : a);
    this.saveState();
  }

  public markAllAsRead() {
    this.alerts = this.alerts.map(a => ({ ...a, isRead: true }));
    this.saveState();
  }

  /**
   * Dispatches incoming alert with audio, speech aloud, and notification
   */
  public triggerNewAlert(alert: AlertItem, announce: boolean = true) {
    // Strict NO REPEATS verification
    if (this.seenIds.has(alert.id)) {
      return false;
    }

    this.seenIds.add(alert.id);
    this.alerts = [alert, ...this.alerts];

    // Update keyword stats
    this.keywords = this.keywords.map(kw => {
      if (kw.text.toLowerCase() === alert.keyword.toLowerCase()) {
        return {
          ...kw,
          matchCount: kw.matchCount + 1,
          lastMatchedAt: Date.now()
        };
      }
      return kw;
    });

    this.saveState();

    if (announce) {
      // 1. Play alert chime sound
      if (this.settings.soundEnabled) {
        soundService.playAlertSound(this.settings.soundType, this.settings.volume);
      }

      // 2. Trigger haptic vibration on mobile
      if (this.settings.vibrationEnabled) {
        soundService.vibrate();
      }

      // 3. Announce title out loud via Text-to-Speech
      if (this.settings.speechEnabled) {
        speechService.speakAlert(alert.title, alert.keyword, {
          rate: this.settings.speechRate,
          pitch: this.settings.speechPitch,
          voiceURI: this.settings.speechVoiceURI,
          includeKeyword: this.settings.speechIncludeKeyword,
        });
      }

      // 4. Send Push Notification / In-App Notification Banner
      notificationService.sendAlertNotification(alert, this.settings.notificationsEnabled);
    }

    return true;
  }

  /**
   * Helper to simulate or test an incoming alert instantly
   */
  public simulateIncomingVideo(preferredKeyword?: string) {
    const activeKeywords = this.keywords.filter(k => k.enabled);
    const targetKeyword = preferredKeyword || 
      (activeKeywords.length > 0 ? activeKeywords[Math.floor(Math.random() * activeKeywords.length)].text : 'police chase');

    const timestamp = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uniqueId = 'live-sim-' + timestamp + '-' + Math.random().toString(36).slice(2, 6);

    const simulationLibrary: Record<string, string[]> = {
      'police chase': [
        'BREAKING: Multiple Patrol Units in Pursuit of Evading Vehicle on Interstate 10 Freeway',
        'Air Unit Live Feed: High-Speed Police Chase Enters Residential Neighborhood',
        'Suspect in Stolen Commercial Van Refuses to Stop: Live Traffic Cam Coverage',
        'Troopers Deploy Spike Strips in Ongoing High-Speed Pursuit on Route 66',
        'Dramatic PIT Maneuver Ends Dangerous 45-Minute Vehicle Pursuit'
      ],
      'market crash injury': [
        'Stock Market Flash Crash Alert: Dow Drops 800 Points in 10 Minutes',
        'Trading Halted on Wall Street: Emergency Circuit Breaker Activated Worldwide',
        'Breaking: Massive Tech Selloff Triggers Global Market Freefall and Liquidity Squeeze',
        'Market Panic: Federal Reserve Convenes Emergency Briefing Following Steep Losses'
      ],
      'default': [
        `Live Alert: Breaking updates regarding ${targetKeyword} just uploaded to YouTube`,
        `Special Eyewitness Report: Developing coverage for ${targetKeyword}`,
        `Emergency Dispatch Broadcast: ${targetKeyword} situation in progress`
      ]
    };

    const candidates = simulationLibrary[targetKeyword.toLowerCase()] || simulationLibrary['default'];
    const chosenTitle = candidates[Math.floor(Math.random() * candidates.length)];
    const channelNames = ['Action News 24', 'Live Chase Hub', 'Global News Live', 'MarketWatch Daily', 'Eagle Eye Helicams'];
    const channel = channelNames[Math.floor(Math.random() * channelNames.length)];

    const simulatedAlert: AlertItem = {
      id: uniqueId,
      title: chosenTitle,
      keyword: targetKeyword,
      timeFormatted,
      timestamp,
      channel,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetKeyword)}`,
      isRead: false,
    };

    this.triggerNewAlert(simulatedAlert, true);
    return simulatedAlert;
  }

  private async checkKeywordForVideos(keyword: KeywordItem) {
    if (!keyword.enabled) return;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(keyword.text)}`);
      if (!res.ok) return;
      const data = await res.json();
      const videos = data.videos || [];

      // Check each video, filter out any repeats
      for (const video of videos) {
        if (!this.seenIds.has(video.id)) {
          const alertItem: AlertItem = {
            id: video.id,
            title: video.title,
            keyword: keyword.text,
            timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            channel: video.channel || 'YouTube',
            url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail,
            isRead: false,
          };

          this.triggerNewAlert(alertItem, true);
          // Only announce the most immediate new video per check to avoid voice cascade
          break;
        }
      }
    } catch (err) {
      console.warn(`Failed to check videos for ${keyword.text}:`, err);
    }
  }

  public async checkAllKeywordsNow() {
    if (this.isChecking) return;
    this.isChecking = true;
    this.notify();

    const active = this.keywords.filter(k => k.enabled);
    for (const kw of active) {
      await this.checkKeywordForVideos(kw);
    }

    this.isChecking = false;
    this.notify();
  }

  public getIsChecking(): boolean {
    return this.isChecking;
  }

  public startMonitoring() {
    this.restartTimer();
  }

  private restartTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const intervalMs = Math.max(10, this.settings.checkIntervalSeconds) * 1000;
    this.timer = window.setInterval(() => {
      this.checkAllKeywordsNow();
    }, intervalMs);
  }

  public stopMonitoring() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const monitorManager = new YouTubeMonitorManager();
