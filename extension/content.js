/**
 * In-Page Content Script & Draggable Floating Overlay Widget
 * Movable anywhere on screen with permanent position memory in chrome.storage.local.
 * Activated by Ctrl + Shift + X or extension commands.
 */

(function () {
  if (window.__voiceBilingualExtensionInjected) return;
  window.__voiceBilingualExtensionInjected = true;

  let overlayHost = null;
  let shadowRoot = null;
  let recognition = null;
  let isRecording = false;
  let currentTranscript = '';
  let timerInterval = null;
  let startTime = null;

  // Draggable state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  async function createOverlay() {
    if (overlayHost) return;

    // Load saved position
    let savedPos = null;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await new Promise((res) => chrome.storage.local.get(['overlayPos', 'provider'], res));
        if (stored && stored.overlayPos) {
          savedPos = stored.overlayPos;
        }
      }
    } catch (e) {
      console.warn('Could not read overlayPos:', e);
    }

    overlayHost = document.createElement('div');
    overlayHost.id = 'voice-bilingual-professionalizer-host';
    overlayHost.style.position = 'fixed';
    overlayHost.style.zIndex = '2147483647';
    overlayHost.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Position setup: restored from memory or clamped default
    if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
      const maxX = Math.max(10, window.innerWidth - 380);
      const maxY = Math.max(10, window.innerHeight - 320);
      const clampedX = Math.min(Math.max(10, savedPos.x), maxX);
      const clampedY = Math.min(Math.max(10, savedPos.y), maxY);
      overlayHost.style.left = clampedX + 'px';
      overlayHost.style.top = clampedY + 'px';
    } else {
      // Default: bottom-right
      overlayHost.style.right = '24px';
      overlayHost.style.bottom = '24px';
    }

    shadowRoot = overlayHost.attachShadow({ mode: 'closed' });

    shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .widget {
          width: 360px;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
          color: #f8fafc;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: floatIn 0.2s ease-out;
        }
        @keyframes floatIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
          cursor: grab;
          user-select: none;
        }
        .header:active { cursor: grabbing; }
        .title-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }
        .move-pill {
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 4px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .close-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
        
        .api-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #0d1527;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
        }
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          margin-right: 5px;
          box-shadow: 0 0 6px #10b981;
        }
        .api-name { font-weight: 700; color: #34d399; }
        .shortcut-hint { font-size: 10px; color: #64748b; font-family: monospace; }

        .recording-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #10192e;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .rec-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ef4444;
          animation: blink 1s infinite;
        }
        @keyframes blink { 50% { opacity: 0.3; } }
        .timer { font-family: monospace; font-size: 13px; font-weight: 700; color: #38bdf8; }
        .status { font-size: 11px; color: #94a3b8; flex: 1; }

        .transcript-container {
          display: flex;
          flex-direction: column;
          background: #10192e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .transcript-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .header-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mini-copy, .mini-expand {
          background: transparent;
          border: none;
          color: #38bdf8;
          cursor: pointer;
          font-size: 10px;
          font-weight: 600;
        }
        .mini-copy:hover, .mini-expand:hover { text-decoration: underline; color: #fff; }
        .transcript {
          padding: 6px 8px;
          font-size: 11.5px;
          line-height: 1.35;
          min-height: 32px;
          max-height: 38px;
          overflow-y: hidden;
          color: #e2e8f0;
          user-select: text;
          transition: all 0.2s ease;
        }
        .transcript-container.is-expanded .transcript {
          min-height: 110px;
          max-height: 170px;
          overflow-y: auto;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .btn-col {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .btn-row {
          display: flex;
          gap: 6px;
        }
        .btn {
          width: 100%;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .btn-stop { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; }
        .btn-stop:hover:not(:disabled) { background: #ef4444; color: #fff; }
        .btn-copy { background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); color: #38bdf8; }
        .btn-copy:hover:not(:disabled) { background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; }
        .btn-refine { background: #0284c7; color: #fff; }
        .btn-refine:hover:not(:disabled) { background: #0369a1; }
        .btn-cancel { background: #1e293b; color: #94a3b8; }
        .btn-cancel:hover { background: #334155; color: #fff; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .results {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .card {
          background: #10192e;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 10px;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .lang-tag { font-size: 11px; font-weight: 600; color: #94a3b8; }
        .copy-pill {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #38bdf8;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .copy-pill:hover { background: rgba(56, 189, 248, 0.15); }
        .card-text { font-size: 12px; line-height: 1.4; color: #f8fafc; }
      </style>
      <div class="widget">
        <!-- Draggable Header -->
        <div class="header" id="widget-header" title="Drag to move this popup anywhere on screen">
          <div class="title-left">
            <span class="title">🎙 Voice Professionalizer</span>
            <span class="move-pill">Movable ⤢</span>
          </div>
          <button class="close-btn" id="close-widget">&times;</button>
        </div>

        <!-- Active Running API Bar -->
        <div class="api-badge">
          <div>
            <span class="live-dot"></span>
            <span>Running API Key: <strong id="widget-api-name" class="api-name">Active</strong></span>
          </div>
          <span class="shortcut-hint">Ctrl+Shift+X</span>
        </div>

        <!-- Recording Section -->
        <div id="rec-section">
          <div class="recording-box">
            <div class="rec-dot" id="widget-rec-dot"></div>
            <span class="timer" id="widget-timer">00:00</span>
          </div>

          <div class="transcript-container is-expanded" id="widget-transcript-box" style="margin-top: 8px;">
            <div class="transcript-header">
              <span>Voice Input</span>
              <div class="header-btns">
                <button class="mini-copy" id="widget-copy-orig-header" title="Copy original voice">📋 Copy</button>
                <button class="mini-expand" id="widget-expand-transcript" title="Collapse text view">⤡</button>
              </div>
            </div>
            <div class="transcript" id="widget-transcript"></div>
          </div>

          <div class="controls-grid" style="margin-top: 8px;">
            <!-- Left Column: Copy & Refine -->
            <div class="btn-col">
              <button class="btn btn-copy" id="widget-copy-orig">📋 Copy</button>
              <button class="btn btn-refine" id="widget-refine">✨ Refine</button>
            </div>
            <!-- Right Column: Stop & Cancel -->
            <div class="btn-col">
              <button class="btn btn-stop" id="widget-stop">■ Stop</button>
              <button class="btn btn-cancel" id="widget-cancel">✕ Cancel</button>
            </div>
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #94a3b8;">
            <span>Developed by <strong style="color: #38bdf8;">Akash</strong></span>
            <span style="font-family: monospace; font-size: 8.5px; color: #64748b;">Ctrl+Shift+X</span>
          </div>
        </div>

        <!-- Results Section -->
        <div id="res-section" style="display: none;">
          <div class="results">
            <div class="card">
              <div class="card-top">
                <span class="lang-tag">🇧🇩 Bangla Professional</span>
                <button class="copy-pill" id="copy-bn">Copy</button>
              </div>
              <div class="card-text" id="text-bn"></div>
            </div>
            <div class="card">
              <div class="card-top">
                <span class="lang-tag">🇬🇧 English Professional</span>
                <button class="copy-pill" id="copy-en">Copy</button>
              </div>
              <div class="card-text" id="text-en"></div>
            </div>
          </div>
          <div class="btn-row" style="margin-top: 8px;">
            <button class="btn btn-refine" id="widget-again">↻ Record Again</button>
            <button class="btn btn-copy" id="copy-both">Copy Both</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayHost);

    // Bind Dragging on header
    const headerEl = shadowRoot.getElementById('widget-header');
    headerEl.addEventListener('mousedown', onDragStart);

    // Bind actions
    shadowRoot.getElementById('close-widget').addEventListener('click', closeOverlay);
    shadowRoot.getElementById('widget-stop').addEventListener('click', handleWidgetStop);
    shadowRoot.getElementById('widget-refine').addEventListener('click', handleWidgetRefine);
    shadowRoot.getElementById('widget-copy-orig').addEventListener('click', copyOriginalVoice);
    shadowRoot.getElementById('widget-copy-orig-header').addEventListener('click', copyOriginalVoice);
    shadowRoot.getElementById('widget-cancel').addEventListener('click', closeOverlay);

    const expandBtn = shadowRoot.getElementById('widget-expand-transcript');
    const transcriptBoxEl = shadowRoot.getElementById('widget-transcript-box');
    let isWidgetTranscriptExpanded = true;
    if (expandBtn && transcriptBoxEl) {
      expandBtn.addEventListener('click', () => {
        isWidgetTranscriptExpanded = !isWidgetTranscriptExpanded;
        transcriptBoxEl.classList.toggle('is-expanded', isWidgetTranscriptExpanded);
        expandBtn.textContent = isWidgetTranscriptExpanded ? '⤡' : '⤢';
        expandBtn.title = isWidgetTranscriptExpanded ? 'Collapse text view' : 'Expand full text view';
      });
    }

    shadowRoot.getElementById('widget-again').addEventListener('click', () => {
      shadowRoot.getElementById('res-section').style.display = 'none';
      shadowRoot.getElementById('rec-section').style.display = 'block';
      startRecording();
    });

    // Populate active API name in overlay
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['provider', 'geminiKey', 'openaiKey', 'customKey', 'openaiModel', 'geminiModel', 'customModel'], (res) => {
        const isGoogle = Boolean(res.geminiKey && res.geminiKey.trim().length > 0);
        const isOpenAI = Boolean(res.openaiKey && res.openaiKey.trim().length > 0);
        const isCustom = Boolean(res.customKey && res.customKey.trim().length > 0);

        let effective = 'none';
        if (res.provider === 'gemini' && isGoogle) effective = 'gemini';
        else if (res.provider === 'openai' && isOpenAI) effective = 'openai';
        else if (res.provider === 'custom' && isCustom) effective = 'custom';
        else if (isGoogle) effective = 'gemini';
        else if (isOpenAI) effective = 'openai';
        else if (isCustom) effective = 'custom';

        const nameEl = shadowRoot.getElementById('widget-api-name');
        const liveDot = shadowRoot.querySelector('.api-badge .live-dot');
        const nameMap = { openai: 'OpenAI', gemini: 'Google Gemini', custom: 'Custom API' };

        if (nameEl) {
          if (effective === 'none') {
            nameEl.textContent = 'None (Configure in Settings)';
            nameEl.style.color = '#94a3b8';
            if (liveDot) {
              liveDot.style.background = '#64748b';
              liveDot.style.boxShadow = 'none';
            }
          } else {
            nameEl.textContent = nameMap[effective] || effective;
            nameEl.style.color = '#34d399';
            if (liveDot) {
              liveDot.style.background = '#10b981';
              liveDot.style.boxShadow = '0 0 6px #10b981';
            }
          }
        }
      });
    }
  }

  function onDragStart(e) {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = overlayHost.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    // Switch to explicit left/top coordinates
    overlayHost.style.right = 'auto';
    overlayHost.style.bottom = 'auto';
    overlayHost.style.left = initialLeft + 'px';
    overlayHost.style.top = initialTop + 'px';

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging || !overlayHost) return;
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const newLeft = Math.max(10, Math.min(window.innerWidth - 380, initialLeft + deltaX));
    const newTop = Math.max(10, Math.min(window.innerHeight - 300, initialTop + deltaY));

    overlayHost.style.left = newLeft + 'px';
    overlayHost.style.top = newTop + 'px';
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);

    // Save exact position permanently in chrome.storage.local
    if (overlayHost) {
      const finalX = parseInt(overlayHost.style.left, 10);
      const finalY = parseInt(overlayHost.style.top, 10);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ overlayPos: { x: finalX, y: finalY } });
      }
    }
  }

  function copyOriginalVoice() {
    if (!currentTranscript.trim()) return;
    navigator.clipboard.writeText(currentTranscript).then(() => {
      const btn = shadowRoot.getElementById('widget-copy-orig');
      const headerBtn = shadowRoot.getElementById('widget-copy-orig-header');
      if (btn) btn.textContent = 'Copied ✓';
      if (headerBtn) headerBtn.textContent = 'Copied ✓';
      setTimeout(() => {
        if (btn) btn.textContent = '📋 Copy Voice';
        if (headerBtn) headerBtn.textContent = 'Copy';
      }, 1500);
    });
  }

  function handleWidgetStop() {
    if (recognition && isRecording) {
      recognition.stop();
    }
    isRecording = false;
    clearInterval(timerInterval);

    const statusEl = shadowRoot.getElementById('widget-status');
    const recDot = shadowRoot.getElementById('widget-rec-dot');
    if (statusEl) statusEl.textContent = 'Recording stopped. Copy voice or click Refine.';
    if (recDot) recDot.style.animation = 'none';
  }

  function handleWidgetRefine() {
    if (recognition && isRecording) {
      recognition.stop();
      isRecording = false;
      clearInterval(timerInterval);
    }

    if (!currentTranscript.trim()) {
      alert('Please speak before refining.');
      return;
    }

    const statusEl = shadowRoot.getElementById('widget-status');
    if (statusEl) statusEl.textContent = 'Polishing into Bangla & English...';

    chrome.runtime.sendMessage(
      { type: 'REFINE_TRANSCRIPT', transcript: currentTranscript },
      (response) => {
        if (response && response.bangla && response.english) {
          shadowRoot.getElementById('rec-section').style.display = 'none';
          shadowRoot.getElementById('res-section').style.display = 'block';
          shadowRoot.getElementById('text-bn').textContent = response.bangla;
          shadowRoot.getElementById('text-en').textContent = response.english;

          shadowRoot.getElementById('copy-bn').onclick = () => {
            navigator.clipboard.writeText(response.bangla);
            shadowRoot.getElementById('copy-bn').textContent = 'Copied ✓';
            setTimeout(() => { shadowRoot.getElementById('copy-bn').textContent = 'Copy'; }, 1500);
          };

          shadowRoot.getElementById('copy-en').onclick = () => {
            navigator.clipboard.writeText(response.english);
            shadowRoot.getElementById('copy-en').textContent = 'Copied ✓';
            setTimeout(() => { shadowRoot.getElementById('copy-en').textContent = 'Copy'; }, 1500);
          };

          shadowRoot.getElementById('copy-both').onclick = () => {
            const combined = `🇧🇩 বাংলা:\n${response.bangla}\n\n🇬🇧 English:\n${response.english}`;
            navigator.clipboard.writeText(combined);
            shadowRoot.getElementById('copy-both').textContent = 'Both Copied ✓';
            setTimeout(() => { shadowRoot.getElementById('copy-both').textContent = 'Copy Both'; }, 1500);
          };
        } else {
          if (statusEl) statusEl.textContent = response?.error || 'Refinement failed.';
        }
      }
    );
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    currentTranscript = '';
    const transcriptEl = shadowRoot.getElementById('widget-transcript');
    const statusEl = shadowRoot.getElementById('widget-status');
    const recDot = shadowRoot.getElementById('widget-rec-dot');
    if (transcriptEl) transcriptEl.textContent = 'Listening...';
    if (statusEl) statusEl.textContent = 'Recording voice...';
    if (recDot) recDot.style.animation = 'blink 1s infinite';

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      currentTranscript = (final + ' ' + interim).trim();
      if (transcriptEl) transcriptEl.textContent = currentTranscript || 'Listening...';
    };

    recognition.onerror = (e) => {
      console.warn('In-page STT error:', e);
    };

    recognition.onend = () => {
      isRecording = false;
      clearInterval(timerInterval);
    };

    try {
      recognition.start();
      isRecording = true;
      startTime = Date.now();
      timerInterval = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        const timerEl = shadowRoot.getElementById('widget-timer');
        if (timerEl) timerEl.textContent = `${m}:${s}`;
      }, 500);
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }

  function closeOverlay() {
    if (recognition && isRecording) {
      recognition.abort();
    }
    isRecording = false;
    clearInterval(timerInterval);
    if (overlayHost) {
      overlayHost.remove();
      overlayHost = null;
      shadowRoot = null;
    }
  }

  // Global Keyboard Shortcut: Ctrl + Shift + X (or Cmd + Shift + X)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
      e.preventDefault();
      if (overlayHost) {
        closeOverlay();
      } else {
        createOverlay().then(startRecording);
      }
    }
  });

  // Listen for messages from background service worker
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'TOGGLE_VOICE_OVERLAY') {
        if (overlayHost) {
          closeOverlay();
        } else {
          createOverlay().then(startRecording);
        }
        sendResponse({ success: true });
      }
    });
  }
})();
