export interface KeywordItem {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: number;
  matchCount: number;
  lastMatchedAt?: number;
  color?: string;
}

export interface AlertItem {
  id: string; // YouTube Video ID (used to guarantee NO REPEATS)
  title: string;
  keyword: string;
  timeFormatted: string;
  timestamp: number;
  channel: string;
  url: string;
  thumbnail?: string;
  isRead: boolean;
}

export type SoundType = 'android_chime' | 'urgent_pulse' | 'police_scanner' | 'subtle_ping';

export interface AppSettings {
  soundEnabled: boolean;
  soundType: SoundType;
  volume: number; // 0 to 1
  vibrationEnabled: boolean;
  speechEnabled: boolean;
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.2
  speechVoiceURI: string;
  speechIncludeKeyword: boolean;
  notificationsEnabled: boolean;
  checkIntervalSeconds: number; // 15, 30, 60
  deviceViewMode: 'phone' | 'expanded';
}
