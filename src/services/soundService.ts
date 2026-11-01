import { SoundType } from '../types/index.ts';

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playAlertSound(type: SoundType = 'android_chime', volume: number = 0.8) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    const masterGain = Math.max(0.05, Math.min(volume, 1));

    gainNode.gain.setValueAtTime(masterGain * 0.4, now);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'android_chime': {
        // High-low-high crisp Android notification chime
        const freqs = [587.33, 880.0, 1174.66]; // D5, A5, D6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          const startTime = now + idx * 0.08;
          const duration = 0.28;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          noteGain.gain.setValueAtTime(0, startTime);
          noteGain.gain.linearRampToValueAtTime(masterGain * 0.5, startTime + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(noteGain);
          noteGain.connect(gainNode);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
        break;
      }

      case 'urgent_pulse': {
        // Emergency dual-tone warning beep
        const beeps = [880, 1760, 880, 1760];
        beeps.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          const startTime = now + idx * 0.1;
          const duration = 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          noteGain.gain.setValueAtTime(0, startTime);
          noteGain.gain.linearRampToValueAtTime(masterGain * 0.6, startTime + 0.01);
          noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(noteGain);
          noteGain.connect(gainNode);

          osc.start(startTime);
          osc.stop(startTime + duration);
        });
        break;
      }

      case 'police_scanner': {
        // Realistic dual chirp frequency burst (police scanner cue)
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(2400, now + 0.07);
        osc.frequency.setValueAtTime(1400, now + 0.09);
        osc.frequency.linearRampToValueAtTime(2800, now + 0.16);

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(masterGain * 0.35, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'subtle_ping':
      default: {
        // Pure single metallic ring
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now); // C6

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(masterGain * 0.5, now + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
    }
  }

  public vibrate() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 60, 100, 60, 200]);
      } catch {
        // Ignore if vibration not permitted
      }
    }
  }
}

export const soundService = new SoundService();
