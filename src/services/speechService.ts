class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const updateVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      this.isInitialized = true;
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
    return this.voices;
  }

  /**
   * Announces video title out loud using SpeechSynthesis.
   * Strictly speaks alerts originated inside YouTube Alert to comply with:
   * "don't read other apps notifications"
   */
  public speakAlert(
    title: string,
    keyword?: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      includeKeyword?: boolean;
    } = {}
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported on this browser/platform.');
      return;
    }

    // Cancel current speech if any to avoid overlap
    window.speechSynthesis.cancel();

    // Prepare speech string
    const cleanTitle = title.replace(/[|•\-_]+/g, ' ').trim();
    let textToSpeak = cleanTitle;
    if (options.includeKeyword && keyword) {
      textToSpeak = `Alert for ${keyword}: ${cleanTitle}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    // Pick selected voice or natural English voice
    const voices = this.getVoices();
    if (options.voiceURI) {
      const selected = voices.find(v => v.voiceURI === options.voiceURI);
      if (selected) utterance.voice = selected;
    } else {
      // Find a crisp English voice
      const preferred = voices.find(v => (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')))) ||
                        voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
