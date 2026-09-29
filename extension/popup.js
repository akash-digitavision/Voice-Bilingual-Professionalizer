/**
 * Popup Controller & State Machine (Phase 4, 5, 8, 9, 10)
 */

import { SpeechService } from './modules/speech.js';
import { normalizeTranscript } from './modules/normalizer.js';
import { generateBilingualOutput } from './modules/ai-providers.js';
import { copyToClipboard } from './modules/clipboard.js';
import { getSettings, getEffectiveProvider } from './modules/storage.js';

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
const transcriptBox = document.getElementById('transcript-box');
const btnExpandTranscript = document.getElementById('btn-expand-transcript');
const expandIconSvg = document.getElementById('expand-icon-svg');
const popoutLabel = document.getElementById('popout-label');
const btnStop = document.getElementById('btn-stop');
const btnCopyOriginal = document.getElementById('btn-copy-original');
const btnCopyHeader = document.getElementById('btn-copy-header');
const copyHeaderText = document.getElementById('copy-header-text');
const btnRefine = document.getElementById('btn-refine');
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
const btnSidepanel = document.getElementById('btn-sidepanel');
const popupApiName = document.getElementById('popup-api-name');
const btnPopout = document.getElementById('btn-popout');

const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const btnErrorRetry = document.getElementById('btn-error-retry');
const btnErrorSettings = document.getElementById('btn-error-settings');

// State variables
let currentState = 'IDLE'; // 'IDLE' | 'RECORDING' | 'GENERATING' | 'RESULT' | 'ERROR'
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
      if (statusLabel) statusLabel.textContent = '';
      btnStop.disabled = false;
      btnStop.classList.add('recording');
      btnRefine.disabled = true;
      btnCopyOriginal.disabled = true;
      btnCopyHeader.disabled = true;
      startTimer();
    },
    onResult: (result) => {
      currentTranscript = result.full;
      if (currentTranscript.trim()) {
        transcriptPreview.classList.remove('empty');
        transcriptPreview.textContent = currentTranscript;
        btnCopyOriginal.disabled = false;
        btnCopyHeader.disabled = false;
        btnRefine.disabled = false;
      }
    },
    onError: (err) => {
      console.warn('Speech error:', err);
      stopTimer();
      currentState = 'ERROR';
      btnMic.classList.remove('recording');
      micPulseRing.classList.remove('recording');
      btnStop.classList.remove('recording');

      // Only show error screen if we weren't just stopping
      if (!currentTranscript.trim()) {
        showError('Microphone / Recognition Notice', err.message);
      }
    },
    onEnd: () => {
      btnMic.classList.remove('recording');
      micPulseRing.classList.remove('recording');
      btnStop.classList.remove('recording');
      btnStop.disabled = true;
      stopTimer();

      if (currentState === 'RECORDING') {
        currentState = 'IDLE';
        if (statusLabel) statusLabel.textContent = '';
      }
    }
  });
}

function startRecording() {
  if (speech && speech.isRecording) return;
  initSpeech();
  currentTranscript = '';
  transcriptPreview.classList.add('empty');
  transcriptPreview.textContent = '';
  btnCopyOriginal.disabled = true;
  btnCopyHeader.disabled = true;
  btnRefine.disabled = true;
  speech.start();
}

function stopRecording() {
  if (speech && speech.isRecording) {
    speech.stop();
  }
  currentState = 'IDLE';
  btnMic.classList.remove('recording');
  micPulseRing.classList.remove('recording');
  btnStop.classList.remove('recording');
  btnStop.disabled = true;
  stopTimer();
  if (statusLabel) statusLabel.textContent = '';
  if (currentTranscript.trim()) {
    btnCopyOriginal.disabled = false;
    btnCopyHeader.disabled = false;
    btnRefine.disabled = false;
  }
}

function cancelRecording() {
  if (speech) {
    speech.abort();
  }
  stopTimer();
  currentState = 'IDLE';
  btnMic.classList.remove('recording');
  micPulseRing.classList.remove('recording');
  btnStop.classList.remove('recording');
  btnStop.disabled = true;
  btnRefine.disabled = true;
  btnCopyOriginal.disabled = true;
  btnCopyHeader.disabled = true;
  currentTranscript = '';
  if (statusLabel) statusLabel.textContent = '';
  recordingTimer.textContent = '00:00';
  transcriptPreview.classList.add('empty');
  transcriptPreview.textContent = '';
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

    // Check credential availability
    if (settings.provider === 'openai' && !settings.openaiKey) {
      showError(
        'OpenAI API Key Required',
        'Please configure your OpenAI API Key in Settings to enable professional bilingual refinement.'
      );
      return;
    }

    if (settings.provider === 'gemini' && !settings.geminiKey) {
      showError(
        'Gemini API Key Required',
        'Please configure your Gemini API Key in Settings.'
      );
      return;
    }

    const result = await generateBilingualOutput(normalized, settings);

    outputBn.value = result.bangla;
    outputEn.value = result.english;
    currentState = 'RESULT';
    setStage('result');
  } catch (err) {
    console.error('Refinement failed:', err);
    showError('Refinement Notice', err.message || 'Unable to refine transcript. Please try again.');
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

if (btnRefine) {
  btnRefine.addEventListener('click', () => {
    if (currentTranscript.trim()) {
      processTranscript();
    }
  });
}

function handleCopyOriginal() {
  if (!currentTranscript.trim()) return;
  copyToClipboard(currentTranscript).then((success) => {
    if (success) {
      if (btnCopyOriginal) {
        const origHtml = btnCopyOriginal.innerHTML;
        btnCopyOriginal.innerHTML = '<span>Copied ✓</span>';
        setTimeout(() => {
          btnCopyOriginal.innerHTML = origHtml;
        }, 1800);
      }
      if (copyHeaderText) {
        const origText = copyHeaderText.textContent;
        copyHeaderText.textContent = 'Copied ✓';
        setTimeout(() => {
          copyHeaderText.textContent = origText;
        }, 1800);
      }
    }
  });
}

if (btnCopyOriginal) {
  btnCopyOriginal.addEventListener('click', handleCopyOriginal);
}

if (btnCopyHeader) {
  btnCopyHeader.addEventListener('click', handleCopyOriginal);
}

btnCancel.addEventListener('click', cancelRecording);

langBn.addEventListener('change', () => {
  if (speech && speech.isRecording) {
    speech.setLanguage('bn-BD');
  }
});

langEn.addEventListener('change', () => {
  if (speech && speech.isRecording) {
    speech.setLanguage('en-US');
  }
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

btnSidepanel.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
  }
});

// Transcript Expand / Collapse logic (Expanded by default)
let isTranscriptExpanded = true;

function toggleTranscriptExpand() {
  isTranscriptExpanded = !isTranscriptExpanded;
  if (transcriptBox) {
    transcriptBox.classList.toggle('is-expanded', isTranscriptExpanded);
  }
  const expandLabel = document.getElementById('expand-btn-label');
  if (expandIconSvg) {
    if (isTranscriptExpanded) {
      expandIconSvg.innerHTML = '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>';
      if (btnExpandTranscript) btnExpandTranscript.title = 'Collapse text area';
      if (expandLabel) expandLabel.textContent = 'Collapse';
    } else {
      expandIconSvg.innerHTML = '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>';
      if (btnExpandTranscript) btnExpandTranscript.title = 'Expand text area';
      if (expandLabel) expandLabel.textContent = 'Expand';
    }
  }

  // If running in detached popup window, resize window accordingly
  if (isDetached && typeof window.resizeTo === 'function') {
    const targetHeight = isTranscriptExpanded ? 340 : 225;
    window.resizeTo(Math.max(290, window.outerWidth), targetHeight);
  }
}

if (btnExpandTranscript) {
  btnExpandTranscript.addEventListener('click', toggleTranscriptExpand);
}

// Detached movable popup support with permanent memory
const urlParams = new URLSearchParams(window.location.search);
const isDetached = urlParams.get('mode') === 'detached';

if (isDetached) {
  document.body.classList.add('detached-mode');
  if (popoutLabel) popoutLabel.textContent = '📌 Dock';
  if (btnPopout) btnPopout.title = 'Dock back to toolbar';

  const saveWindowBounds = () => {
    if (typeof chrome !== 'undefined' && chrome.storage && typeof window.screenX === 'number' && typeof window.screenY === 'number') {
      const screenLeft = Math.max(10, window.screenX);
      const screenTop = Math.max(10, window.screenY);
      chrome.storage.local.set({
        detachedWindowPos: {
          left: screenLeft,
          top: screenTop,
          width: window.outerWidth || 310,
          height: window.outerHeight || 215
        }
      });
    }
  };
  window.addEventListener('beforeunload', saveWindowBounds);
  window.addEventListener('resize', saveWindowBounds);
  window.addEventListener('blur', saveWindowBounds);
  const boundsTimer = setInterval(saveWindowBounds, 800);
  window.addEventListener('unload', () => clearInterval(boundsTimer));
}

if (btnPopout) {
  btnPopout.addEventListener('click', async () => {
    if (isDetached) {
      // User clicked dock back to toolbar
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ windowMode: 'attached' });
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'SET_WINDOW_MODE', mode: 'attached' });
      }
      window.close();
    } else {
      // User clicked Free Window: save mode permanently and open detached
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ windowMode: 'detached' });
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'SET_WINDOW_MODE', mode: 'detached' });
        chrome.runtime.sendMessage({ type: 'OPEN_DETACHED_WINDOW' });
      }
      window.close();
    }
  });
}

// Auto-start on popup open if configured
window.addEventListener('DOMContentLoaded', async () => {
  // If user previously chose free/independent window and this opened attached, immediately pop out
  if (!isDetached && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['windowMode'], (res) => {
      if (res && res.windowMode === 'detached') {
        chrome.runtime.sendMessage({ type: 'OPEN_DETACHED_WINDOW' });
        window.close();
        return;
      }
    });
  }

  settings = await getSettings();

  // Populate active running API name
  if (popupApiName) {
    const prov = getEffectiveProvider(settings);
    const liveDot = document.getElementById('popup-live-dot');
    if (prov === 'none') {
      popupApiName.textContent = 'None (Configure in Settings)';
      if (liveDot) {
        liveDot.style.background = '#64748b';
        liveDot.style.boxShadow = 'none';
      }
    } else {
      const nameMap = {
        openai: 'OpenAI',
        gemini: 'Google Gemini',
        custom: 'Custom API'
      };
      const mod = prov === 'openai' ? settings.openaiModel : prov === 'gemini' ? settings.geminiModel : settings.customModel;
      popupApiName.textContent = `${nameMap[prov] || prov} (${mod || 'default'})`;
      if (liveDot) {
        liveDot.style.background = '#10b981';
        liveDot.style.boxShadow = '0 0 6px #10b981';
      }
    }
  }

  if (settings.inputLanguage === 'en-US') {
    langEn.checked = true;
  } else {
    langBn.checked = true;
  }

  // Auto-start if preferred
  if (settings.autoStartOnOpen) {
    setTimeout(startRecording, 200);
  }
});
