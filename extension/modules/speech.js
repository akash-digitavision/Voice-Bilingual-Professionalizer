/**
 * Speech-to-Text Abstraction Module (Phase 5)
 * Coordinates Web Speech Recognition with fallback and interim updates.
 */

export class SpeechService {
  constructor(options = {}) {
    this.language = options.language || 'bn-BD'; // 'bn-BD' or 'en-US'
    this.continuous = options.continuous !== undefined ? options.continuous : true;
    this.interimResults = options.interimResults !== undefined ? options.interimResults : true;

    this.recognition = null;
    this.isRecording = false;
    this.finalTranscript = '';
    this.interimTranscript = '';

    // Callbacks
    this.onStart = options.onStart || (() => {});
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onEnd = options.onEnd || (() => {});

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.continuous;
    this.recognition.interimResults = this.interimResults;
    this.recognition.lang = this.language;

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.onStart();
    };

    this.recognition.onresult = (event) => {
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
      this.onResult({
        final: this.finalTranscript,
        interim: this.interimTranscript,
        full: (this.finalTranscript + ' ' + this.interimTranscript).trim()
      });
    };

    this.recognition.onerror = (event) => {
      let friendlyMessage = 'Speech recognition error occurred.';
      if (event.error === 'not-allowed') {
        friendlyMessage = 'Microphone permission is required to record your voice.';
      } else if (event.error === 'no-speech') {
        friendlyMessage = 'No voice input was detected. Please try again.';
      } else if (event.error === 'network') {
        friendlyMessage = 'Network error during speech recognition. Please check your connection.';
      } else if (event.error === 'audio-capture') {
        friendlyMessage = 'Microphone hardware unavailable or muted.';
      }
      this.onError({
        code: event.error,
        message: friendlyMessage
      });
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      this.onEnd({
        final: this.finalTranscript.trim()
      });
    };
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  start() {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        this.onError({
          code: 'UNSUPPORTED',
          message: 'Speech recognition is not supported in this browser environment.'
        });
        return;
      }
    }

    this.finalTranscript = '';
    this.interimTranscript = '';

    try {
      this.recognition.start();
    } catch (e) {
      // If already started or aborting
      console.warn('Recognition start exception, attempting restart:', e);
      try {
        this.recognition.abort();
        setTimeout(() => this.recognition.start(), 150);
      } catch (err) {
        this.onError({ code: 'START_FAILED', message: 'Could not activate microphone.' });
      }
    }
  }

  stop() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }
    }
  }

  abort() {
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
