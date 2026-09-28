/**
 * Side Panel Controller (Phase 2 & Phase 4)
 */

import { SpeechService } from './modules/speech.js';
import { normalizeTranscript } from './modules/normalizer.js';
import { generateBilingualOutput } from './modules/ai-providers.js';
import { copyToClipboard } from './modules/clipboard.js';
import { getSettings } from './modules/storage.js';

// DOM Elements
const stageVoice = document.getElementById('stage-voice');
const stageLoading = document.getElementById('stage-loading');
const stageResult = document.getElementById('stage-result');
const stageError = document.getElementById('stage-error');

const btnMic = document.getElementById('btn-mic');
const micPulseRing = document.getElementById('mic-pulse-ring');
const recordingTimer = document.getElementById('recording-timer');
const statusLabel = document.getElementById('status-label');
const transcriptPreview = document.getElementById('transcript-preview');
const btnStop = document.getElementById('btn-stop');
const btnCancel = document.getElementById('btn-cancel');

const langBn = document.getElementById('lang-bn');
const langEn = document.getElementById('lang-en');

const outputBn = document.getElementById('output-bn');
const outputEn = document.getElementById('output-en');
const btnCopyBn = document.getElementById('btn-copy-bn');
const btnCopyEn = document.getElementById('btn-copy-en');
const btnCopyBoth = document.getElementById('btn-copy-both');
const btnRecordAgain = document.getElementById('btn-record-again');
const btnSettings = document.getElementById('btn-settings');

const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const btnErrorRetry = document.getElementById('btn-error-retry');
const btnErrorSettings = document.getElementById('btn-error-settings');

let currentState = 'IDLE';
let speech = null;
let timerInterval = null;
let recordingStartTime = null;
let currentTranscript = '';
let settings = null;

function setStage(stage) {
  stageVoice.classList.remove('active');
  stageLoading.classList.remove('active');
  stageResult.classList.remove('active');
  stageError.classList.remove('active');

  if (stage === 'voice') stageVoice.classList.add('active');
  if (stage === 'loading') stageLoading.classList.add('active');
  if (stage === 'result') stageResult.classList.add('active');
  if (stage === 'error') stageError.classList.add('active');
}

function updateTimer() {
  if (!recordingStartTime) return;
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  recordingTimer.textContent = `${mins}:${secs}`;
}

function startTimer() {
  recordingStartTime = Date.now();
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function initSpeech() {
  const selectedLang = langBn.checked ? 'bn-BD' : 'en-US';

  speech = new SpeechService({
    language: selectedLang,
    continuous: true,
    interimResults: true,
    onStart: () => {
      currentState = 'RECORDING';
      btnMic.classList.add('recording');
      micPulseRing.classList.add('recording');
      statusLabel.textContent = 'Listening... Speak naturally';
      btnStop.disabled = false;
      startTimer();
    },
    onResult: (result) => {
      currentTranscript = result.full;
      if (currentTranscript.trim()) {
        transcriptPreview.classList.remove('empty');
        transcriptPreview.textContent = currentTranscript;
      }
    },
    onError: (err) => {
      console.warn('Speech error:', err);
      stopTimer();
      currentState = 'ERROR';
      btnMic.classList.remove('recording');
      micPulseRing.classList.remove('recording');
      if (!currentTranscript.trim()) {
        showError('Microphone Notice', err.message);
      }
    },
    onEnd: () => {
      btnMic.classList.remove('recording');
      micPulseRing.classList.remove('recording');
      stopTimer();

      if (currentState === 'STOPPING') {
        processTranscript();
      } else if (currentState === 'RECORDING') {
        currentState = 'IDLE';
        statusLabel.textContent = 'Recording stopped. Click mic to speak.';
      }
    }
  });
}

function startRecording() {
  if (speech && speech.isRecording) return;
  initSpeech();
  currentTranscript = '';
  transcriptPreview.classList.add('empty');
  transcriptPreview.textContent = 'Listening... speak naturally in Bangla, English or Banglish';
  speech.start();
}

function stopRecording() {
  if (!speech || !speech.isRecording) {
    if (currentTranscript.trim()) {
      processTranscript();
    }
    return;
  }
  currentState = 'STOPPING';
  statusLabel.textContent = 'Finishing audio capture...';
  speech.stop();
}

function cancelRecording() {
  if (speech) speech.abort();
  stopTimer();
  currentState = 'IDLE';
  btnMic.classList.remove('recording');
  micPulseRing.classList.remove('recording');
  btnStop.disabled = true;
  statusLabel.textContent = 'Cancelled. Click microphone to speak.';
  recordingTimer.textContent = '00:00';
  transcriptPreview.classList.add('empty');
  transcriptPreview.textContent = 'Listening... speak naturally in Bangla, English or Banglish';
}

async function processTranscript() {
  currentState = 'GENERATING';
  setStage('loading');

  const normalized = normalizeTranscript(currentTranscript);

  if (!normalized) {
    showError('No Speech Detected', 'No clear voice input was detected. Please try recording again.');
    return;
  }

  try {
    settings = await getSettings();

    if (settings.provider === 'openai' && !settings.openaiKey) {
      showError('OpenAI Key Required', 'Please configure your OpenAI API Key in Settings.');
      return;
    }

    if (settings.provider === 'gemini' && !settings.geminiKey) {
      showError('Gemini Key Required', 'Please configure your Gemini API Key in Settings.');
      return;
    }

    const result = await generateBilingualOutput(normalized, settings);

    outputBn.value = result.bangla;
    outputEn.value = result.english;
    currentState = 'RESULT';
    setStage('result');
  } catch (err) {
    console.error('Refinement failed:', err);
    showError('Refinement Notice', err.message || 'Unable to refine transcript.');
  }
}

function showError(title, message) {
  currentState = 'ERROR';
  errorTitle.textContent = title;
  errorDesc.textContent = message;
  setStage('error');
}

function handleCopy(btn, textarea) {
  const text = textarea.value.trim();
  if (!text) return;

  copyToClipboard(text).then((success) => {
    if (success) {
      const originalText = btn.querySelector('.copy-text').textContent;
      btn.classList.add('copied');
      btn.querySelector('.copy-text').textContent = 'Copied ✓';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('.copy-text').textContent = originalText;
      }, 1800);
    }
  });
}

// Event Listeners
btnMic.addEventListener('click', () => {
  if (currentState === 'RECORDING') {
    stopRecording();
  } else {
    startRecording();
  }
});

btnStop.addEventListener('click', stopRecording);
btnCancel.addEventListener('click', cancelRecording);

langBn.addEventListener('change', () => {
  if (speech && speech.isRecording) speech.setLanguage('bn-BD');
});

langEn.addEventListener('change', () => {
  if (speech && speech.isRecording) speech.setLanguage('en-US');
});

btnCopyBn.addEventListener('click', () => handleCopy(btnCopyBn, outputBn));
btnCopyEn.addEventListener('click', () => handleCopy(btnCopyEn, outputEn));

btnCopyBoth.addEventListener('click', () => {
  const combined = `🇧🇩 Bangla:\n${outputBn.value.trim()}\n\n🇬🇧 English:\n${outputEn.value.trim()}`;
  copyToClipboard(combined).then((success) => {
    if (success) {
      btnCopyBoth.textContent = 'Both Copied ✓';
      setTimeout(() => {
        btnCopyBoth.textContent = 'Copy Both';
      }, 1800);
    }
  });
});

btnRecordAgain.addEventListener('click', () => {
  setStage('voice');
  cancelRecording();
  startRecording();
});

btnErrorRetry.addEventListener('click', () => {
  setStage('voice');
  cancelRecording();
});

btnSettings.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});

btnErrorSettings.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  settings = await getSettings();
  if (settings.inputLanguage === 'en-US') {
    langEn.checked = true;
  } else {
    langBn.checked = true;
  }
});
