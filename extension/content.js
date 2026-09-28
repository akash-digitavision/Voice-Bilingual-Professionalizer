/**
 * In-Page Content Script & Shadow DOM Overlay (Phase 2, 3, 4)
 * Provides a floating, non-intrusive voice recording widget on any webpage.
 */

(function () {
  // Prevent duplicate injection
  if (window.__voiceBilingualExtensionInjected) return;
  window.__voiceBilingualExtensionInjected = true;

  let overlayHost = null;
  let shadowRoot = null;
  let recognition = null;
  let isRecording = false;
  let currentTranscript = '';
  let timerInterval = null;
  let startTime = null;

  function createOverlay() {
    if (overlayHost) return;

    overlayHost = document.createElement('div');
    overlayHost.id = 'voice-bilingual-professionalizer-host';
    overlayHost.style.position = 'fixed';
    overlayHost.style.bottom = '24px';
    overlayHost.style.right = '24px';
    overlayHost.style.zIndex = '2147483647';
    overlayHost.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    shadowRoot = overlayHost.attachShadow({ mode: 'closed' });

    shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .widget {
          width: 360px;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
          color: #f8fafc;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: floatIn 0.2s ease-out;
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
        }
        .title {
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 2px 6px;
        }
        .close-btn:hover { color: #fff; }
        .recording-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #10192e;
          padding: 10px 12px;
          border-radius: 8px;
        }
        .rec-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ef4444;
          animation: blink 1s infinite;
        }
        @keyframes blink { 50% { opacity: 0.3; } }
        .timer { font-family: monospace; font-size: 14px; font-weight: 600; color: #38bdf8; }
        .status { font-size: 12px; color: #94a3b8; flex: 1; }
        .transcript {
          background: #10192e;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          line-height: 1.4;
          min-height: 50px;
          max-height: 90px;
          overflow-y: auto;
        }
        .controls {
          display: flex;
          gap: 8px;
        }
        .btn {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .btn-stop { background: #0284c7; color: #fff; }
        .btn-stop:hover { background: #0369a1; }
        .btn-cancel { background: #1e293b; color: #94a3b8; }
        .btn-cancel:hover { background: #334155; color: #fff; }
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
          border: none;
          color: #38bdf8;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .card-text { font-size: 12px; line-height: 1.4; color: #f8fafc; }
      </style>
      <div class="widget">
        <div class="header">
          <span class="title">🎙 Voice Professionalizer</span>
          <button class="close-btn" id="close-widget">&times;</button>
        </div>
        <div id="rec-section">
          <div class="recording-box">
            <div class="rec-dot"></div>
            <span class="timer" id="widget-timer">00:00</span>
            <span class="status" id="widget-status">Recording voice...</span>
          </div>
          <div class="transcript" id="widget-transcript" style="margin-top: 8px;">Listening... speak in Bangla or English</div>
          <div class="controls" style="margin-top: 8px;">
            <button class="btn btn-stop" id="widget-stop">Stop & Refine</button>
            <button class="btn btn-cancel" id="widget-cancel">Cancel</button>
          </div>
        </div>
        <div id="res-section" style="display: none;">
          <div class="results">
            <div class="card">
              <div class="card-top">
                <span class="lang-tag">🇧🇩 Bangla</span>
                <button class="copy-pill" id="copy-bn">Copy</button>
              </div>
              <div class="card-text" id="text-bn"></div>
            </div>
            <div class="card">
              <div class="card-top">
                <span class="lang-tag">🇬🇧 English</span>
                <button class="copy-pill" id="copy-en">Copy</button>
              </div>
              <div class="card-text" id="text-en"></div>
            </div>
          </div>
          <div class="controls" style="margin-top: 8px;">
            <button class="btn btn-stop" id="widget-again">Record Again</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayHost);

    // Bind shadow DOM events
    shadowRoot.getElementById('close-widget').addEventListener('click', closeOverlay);
    shadowRoot.getElementById('widget-stop').addEventListener('click', stopRecording);
    shadowRoot.getElementById('widget-cancel').addEventListener('click', closeOverlay);
    shadowRoot.getElementById('widget-again').addEventListener('click', () => {
      shadowRoot.getElementById('res-section').style.display = 'none';
      shadowRoot.getElementById('rec-section').style.display = 'block';
      startRecording();
    });
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    currentTranscript = '';
    const transcriptEl = shadowRoot.getElementById('widget-transcript');
    transcriptEl.textContent = 'Listening...';

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
      transcriptEl.textContent = currentTranscript || 'Listening...';
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

  function stopRecording() {
    if (recognition && isRecording) {
      recognition.stop();
    }
    isRecording = false;
    clearInterval(timerInterval);

    const statusEl = shadowRoot.getElementById('widget-status');
    statusEl.textContent = 'Refining...';

    // Send to background for AI refinement
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
        } else {
          statusEl.textContent = 'Refinement failed or no keys configured.';
        }
      }
    );
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

  // Listen for messages from background service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_VOICE_OVERLAY') {
      if (overlayHost) {
        closeOverlay();
      } else {
        createOverlay();
        startRecording();
      }
      sendResponse({ success: true });
    }
  });
})();
