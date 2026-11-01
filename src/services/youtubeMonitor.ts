import { AlertItem, AppSettings, BlockedItem, KeywordItem, SkippedAlertLog } from '../types/index.ts';
import { soundService } from './soundService.ts';
import { speechService } from './speechService.ts';
import { notificationService } from './notificationService.ts';

const STORAGE_KEYWORDS_KEY = 'yt_alert_keywords_v2';
const STORAGE_BLOCKED_KEY = 'yt_alert_blocked_v2';
const STORAGE_ALERTS_KEY = 'yt_alert_history_v2';
const STORAGE_SKIPPED_KEY = 'yt_alert_skipped_v2';
const STORAGE_SEEN_IDS_KEY = 'yt_alert_seen_video_ids_v2';
const STORAGE_SETTINGS_KEY = 'yt_alert_settings_v2';
const STORAGE_QUOTA_PREFIX = 'yt_alert_quota_';

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
  dailyQuotaLimit: 100,
};

// Initial keywords requested by user
export const INITIAL_KEYWORDS: KeywordItem[] = [
  {
    id: 'kw-1',
    text: 'police chase',
    enabled: true,
    createdAt: Date.now() - 3600000,
    matchCount: 2,
    lastMatchedAt: Date.now() - 600000,
    color: '#ef4444',
  },
  {
    id: 'kw-2',
    text: 'market crash injury',
    enabled: true,
    createdAt: Date.now() - 3500000,
    matchCount: 1,
    lastMatchedAt: Date.now() - 1200000,
    color: '#f59e0b',
  },
  {
    id: 'kw-3',
    text: 'breaking news live',
    enabled: true,
    createdAt: Date.now() - 3000000,
    matchCount: 0,
    color: '#3b82f6',
  }
];

// Initial blocked words and phrases requested by user
export const INITIAL_BLOCKED: BlockedItem[] = [
  {
    id: 'bl-1',
    text: 'happiness',
    enabled: true,
    createdAt: Date.now() - 3000000,
    blockedCount: 0,
  },
  {
    id: 'bl-2',
    text: 'vlogger',
    enabled: true,
    createdAt: Date.now() - 2900000,
    blockedCount: 0,
  },
  {
    id: 'bl-3',
    text: 'trivia',
    enabled: true,
    createdAt: Date.now() - 2800000,
    blockedCount: 0,
  },
  {
    id: 'bl-4',
    text: 'weather',
    enabled: true,
    createdAt: Date.now() - 2700000,
    blockedCount: 0,
  },
  {
    id: 'bl-5',
    text: 'pursuit of happiness',
    enabled: true,
    createdAt: Date.now() - 2600000,
    blockedCount: 0,
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

/**
 * Builds YouTube search query string with:
 * - Whole phrase keywords in quotes (e.g. "police chase")
 * - Blocked single words with minus (e.g. -happiness)
 * - Blocked phrases in quotes with minus (e.g. -"pursuit of happiness")
 */
export function buildYouTubeSearchQuery(keyword: string, blockedList: BlockedItem[]): string {
  const trimmed = keyword.trim();
  if (!trimmed) return '';

  const keywordFormatted = trimmed.includes(' ') ? `"${trimmed}"` : trimmed;
  const activeBlocked = blockedList.filter(b => b.enabled && b.text.trim().length > 0);

  const blockedTerms = activeBlocked.map(b => {
    const text = b.text.trim();
    if (text.includes(' ')) {
      return `-"${text}"`;
    }
    return `-${text}`;
  });

  return [keywordFormatted, ...blockedTerms].join(' ');
}

export class YouTubeMonitorManager {
  private keywords: KeywordItem[] = [];
  private blockedWords: BlockedItem[] = [];
  private alerts: AlertItem[] = [];
  private skippedAlerts: SkippedAlertLog[] = [];
  private seenIds: Set<string> = new Set();
  private settings: AppSettings = DEFAULT_SETTINGS;
  private timer: number | null = null;
  private isChecking: boolean = false;
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private getTodayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${STORAGE_QUOTA_PREFIX}${y}-${m}-${d}`;
  }

  public getTodaySearchCount(): number {
    if (typeof window === 'undefined') return 0;
    const val = localStorage.getItem(this.getTodayKey());
    return val ? parseInt(val, 10) || 0 : 0;
  }

  public incrementTodaySearchCount(by: number = 1): number {
    if (typeof window === 'undefined') return 0;
    const current = this.getTodaySearchCount();
    const next = current + by;
    localStorage.setItem(this.getTodayKey(), String(next));
    this.notify();
    return next;
  }

  public resetTodaySearchCount(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getTodayKey(), '0');
    this.notify();
  }

  private loadState() {
    if (typeof window === 'undefined') return;

    try {
      const savedKeywords = localStorage.getItem(STORAGE_KEYWORDS_KEY);
      this.keywords = savedKeywords ? JSON.parse(savedKeywords) : INITIAL_KEYWORDS;

      const savedBlocked = localStorage.getItem(STORAGE_BLOCKED_KEY);
      this.blockedWords = savedBlocked ? JSON.parse(savedBlocked) : INITIAL_BLOCKED;

      const savedAlerts = localStorage.getItem(STORAGE_ALERTS_KEY);
      this.alerts = savedAlerts ? JSON.parse(savedAlerts) : INITIAL_SAMPLE_ALERTS;

      const savedSkipped = localStorage.getItem(STORAGE_SKIPPED_KEY);
      this.skippedAlerts = savedSkipped ? JSON.parse(savedSkipped) : [];

      const savedSeen = localStorage.getItem(STORAGE_SEEN_IDS_KEY);
      const parsedSeen: string[] = savedSeen ? JSON.parse(savedSeen) : [];
      this.seenIds = new Set(parsedSeen);
      
      this.alerts.forEach(a => this.seenIds.add(a.id));

      const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.error('Error loading YouTube Alert storage:', e);
      this.keywords = INITIAL_KEYWORDS;
      this.blockedWords = INITIAL_BLOCKED;
      this.alerts = INITIAL_SAMPLE_ALERTS;
      this.settings = DEFAULT_SETTINGS;
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYWORDS_KEY, JSON.stringify(this.keywords));
      localStorage.setItem(STORAGE_BLOCKED_KEY, JSON.stringify(this.blockedWords));
      localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_SKIPPED_KEY, JSON.stringify(this.skippedAlerts.slice(0, 50)));
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

  public getBlockedWords(): BlockedItem[] {
    return [...this.blockedWords];
  }

  public getAlerts(): AlertItem[] {
    return [...this.alerts];
  }

  public getSkippedAlerts(): SkippedAlertLog[] {
    return [...this.skippedAlerts];
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
    this.restartTimer();
  }

  // --- Keywords Management ---
  public addKeyword(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

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

  // --- Blocked Words & Phrases Management ---
  public addBlockedWord(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    if (this.blockedWords.some(b => b.text.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }

    const newBlocked: BlockedItem = {
      id: 'bl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: trimmed,
      enabled: true,
      createdAt: Date.now(),
      blockedCount: 0,
    };

    this.blockedWords = [newBlocked, ...this.blockedWords];
    this.saveState();
    return true;
  }

  public removeBlockedWord(id: string) {
    this.blockedWords = this.blockedWords.filter(b => b.id !== id);
    this.saveState();
  }

  public toggleBlockedWord(id: string) {
    this.blockedWords = this.blockedWords.map(b => {
      if (b.id === id) {
        return { ...b, enabled: !b.enabled };
      }
      return b;
    });
    this.saveState();
  }

  // --- Blocked Title Checker ---
  /**
   * Checks if a title contains any enabled blocked word or exact blocked phrase.
   * Case-insensitive: "Ignore capital letters for matching".
   * Returns the blocked text if matched, or null if clean.
   */
  public checkBlockedInTitle(title: string): string | null {
    const lowerTitle = title.toLowerCase();

    for (const item of this.blockedWords) {
      if (!item.enabled) continue;
      const lowerBlocked = item.text.trim().toLowerCase();
      if (!lowerBlocked) continue;

      if (lowerBlocked.includes(' ')) {
        // Multi-word phrase: check exact substring match in title
        if (lowerTitle.includes(lowerBlocked)) {
          return item.text;
        }
      } else {
        // Single word: match as full word or substring
        // Regex word boundary for clean matching e.g. "trivia", "weather", "happiness"
        const regex = new RegExp(`(^|[^a-z0-9])${lowerBlocked}([^a-z0-9]|$)`, 'i');
        if (regex.test(lowerTitle) || lowerTitle.includes(lowerBlocked)) {
          return item.text;
        }
      }
    }
    return null;
  }

  public clearAlerts() {
    this.alerts = [];
    this.saveState();
  }

  public clearSkippedAlerts() {
    this.skippedAlerts = [];
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
   * Dispatches incoming alert with audio, speech aloud, and notification.
   * STRICTLY checks blocked words before anything pops up!
   */
  public triggerNewAlert(alert: AlertItem, announce: boolean = true): { success: boolean; blockedBy?: string; isDuplicate?: boolean } {
    // 1. Strict NO REPEATS verification
    if (this.seenIds.has(alert.id)) {
      return { success: false, isDuplicate: true };
    }

    // 2. CHECK BLOCKED WORDS AND PHRASES BEFORE ALERT POPS UP
    const blockedBy = this.checkBlockedInTitle(alert.title);
    if (blockedBy) {
      // Mark as seen so we don't re-evaluate this ID
      this.seenIds.add(alert.id);

      // Increment blocked count for this word/phrase
      this.blockedWords = this.blockedWords.map(b => {
        if (b.text.toLowerCase() === blockedBy.toLowerCase()) {
          return { ...b, blockedCount: b.blockedCount + 1 };
        }
        return b;
      });

      // Record in skipped log for user visibility
      const skippedLog: SkippedAlertLog = {
        id: alert.id,
        title: alert.title,
        blockedBy,
        keyword: alert.keyword,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.skippedAlerts = [skippedLog, ...this.skippedAlerts.slice(0, 49)];
      this.saveState();

      // SKIP IT! No sound, no speech, no notification, no adding to alert list!
      return { success: false, blockedBy };
    }

    // Clean video! Add to alerts
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

    return { success: true };
  }

  /**
   * Helper to simulate or test an incoming alert instantly.
   * Can inject clean or blocked titles to verify filtering.
   */
  public simulateIncomingVideo(options?: { preferredKeyword?: string; testBlockedWord?: string }) {
    const activeKeywords = this.keywords.filter(k => k.enabled);
    const targetKeyword = options?.preferredKeyword || 
      (activeKeywords.length > 0 ? activeKeywords[Math.floor(Math.random() * activeKeywords.length)].text : 'police chase');

    const timestamp = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const uniqueId = 'live-sim-' + timestamp + '-' + Math.random().toString(36).slice(2, 6);

    let chosenTitle = '';

    if (options?.testBlockedWord) {
      // Intentionally generate a title containing the blocked word to demonstrate skipping
      chosenTitle = `Live Coverage: Highway pursuit of happiness with local weather update and vlogger footage`;
    } else {
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
      chosenTitle = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const channelNames = ['Action News 24', 'Live Chase Hub', 'Global News Live', 'MarketWatch Daily', 'Eagle Eye Helicams'];
    const channel = channelNames[Math.floor(Math.random() * channelNames.length)];

    // Build the exact YouTube search query with negative blocked terms
    const searchQuery = buildYouTubeSearchQuery(targetKeyword, this.blockedWords);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const simulatedAlert: AlertItem = {
      id: uniqueId,
      title: chosenTitle,
      keyword: targetKeyword,
      timeFormatted,
      timestamp,
      channel,
      url: youtubeUrl,
      isRead: false,
    };

    return this.triggerNewAlert(simulatedAlert, true);
  }

  /**
   * Client-side search check:
   * Increments today's quota counter and checks active keywords.
   */
  public async checkAllKeywordsNow(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;
    this.notify();

    const active = this.keywords.filter(k => k.enabled);
    if (active.length > 0) {
      // Increment today's search quota counter
      this.incrementTodaySearchCount(active.length);
    }

    // Simulate search processing delay (runs entirely in browser)
    await new Promise(resolve => setTimeout(resolve, 600));

    // For active keywords, evaluate realistic candidate video streams
    for (const kw of active) {
      // 30% chance of generating a fresh matching video during live monitoring
      if (Math.random() > 0.4) {
        this.simulateIncomingVideo({ preferredKeyword: kw.text });
      }
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
