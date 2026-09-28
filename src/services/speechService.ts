/**
 * Speech Recognition Wrapper for Web Speech API
 */

export interface SpeechCallbacks {
  onStart?: () => void;
  onResult?: (data: { final: string; interim: string; full: string }) => void;
  onError?: (error: { code: string; message: string }) => void;
  onEnd?: (data: { final: string }) => void;
}

export class WebSpeechController {
  private recognition: any = null;
  public isRecording = false;
  public language: string;
  private callbacks: SpeechCallbacks;
  private finalTranscript = '';
  private interimTranscript = '';

  constructor(language: string = 'bn-BD', callbacks: SpeechCallbacks = {}) {
    this.language = language;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += (this.finalTranscript ? ' ' : '') + transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }
      this.interimTranscript = interim;
      this.callbacks.onResult?.({
        final: this.finalTranscript,
        interim: this.interimTranscript,
        full: (this.finalTranscript + ' ' + this.interimTranscript).trim(),
      });
    };

    this.recognition.onerror = (event: any) => {
      let friendlyMessage = 'Speech recognition error occurred.';
      if (event.error === 'not-allowed') {
        friendlyMessage = 'Microphone permission is required to capture audio.';
      } else if (event.error === 'no-speech') {
        friendlyMessage = 'No voice input was detected. Please try speaking again.';
      } else if (event.error === 'network') {
        friendlyMessage = 'Network issue with speech recognition engine.';
      } else if (event.error === 'audio-capture') {
        friendlyMessage = 'Microphone is unavailable or muted.';
      }

      this.callbacks.onError?.({
        code: event.error,
        message: friendlyMessage,
      });
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.callbacks.onEnd?.({
        final: this.finalTranscript.trim(),
      });
    };
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start() {
    if (!this.recognition) {
      this.init();
      if (!this.recognition) {
        this.callbacks.onError?.({
          code: 'UNSUPPORTED',
          message: 'Speech recognition is not supported in this browser.',
        });
        return;
      }
    }

    this.finalTranscript = '';
    this.interimTranscript = '';

    try {
      this.recognition.start();
    } catch (e) {
      try {
        this.recognition.abort();
        setTimeout(() => this.recognition?.start(), 150);
      } catch (err) {
        this.callbacks.onError?.({
          code: 'START_FAILED',
          message: 'Could not access audio device.',
        });
      }
    }
  }

  public stop() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
    }
  }

  public abort() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.abort();
      } catch (e) {
        console.warn('Recognition abort error:', e);
      }
    }
    this.isRecording = false;
  }
}
