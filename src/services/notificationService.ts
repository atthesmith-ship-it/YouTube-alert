import { AlertItem } from '../types/index.ts';

type NotificationListener = (alert: AlertItem) => void;

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async sendAlertNotification(alert: AlertItem, systemEnabled: boolean = true): Promise<void> {
    // 1. Always trigger in-app heads-up Android banner listeners
    this.listeners.forEach((fn) => fn(alert));

    // 2. If system notifications enabled and permitted, fire system push/notification
    if (systemEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(`YouTube Alert: ${alert.keyword}`, {
            body: alert.title,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: alert.id,
            data: {
              url: alert.url
            }
          });
        } else {
          const notif = new Notification(`YouTube Alert: ${alert.keyword}`, {
            body: alert.title,
            icon: '/icon.svg',
            tag: alert.id,
          });
          notif.onclick = () => {
            window.focus();
            window.open(alert.url, '_blank');
          };
        }
      } catch (err) {
        console.warn('System notification error:', err);
      }
    }
  }
}

export const notificationService = new NotificationService();
