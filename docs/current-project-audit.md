# Phase 0 — Existing Project Audit
**Extension Name:** Voice Bilingual Professionalizer  
**Manifest Version:** Chrome Manifest V3  
**Audit Date:** 2026-09-28  

---

## 1. Executive Summary

The project is an existing, functional Chrome Extension (Manifest V3) paired with an interactive Web Companion Workbench. It enables voice-driven customer and executive communications by capturing speech (Bangla, English, Banglish, or mixed code-switching), normalizing spoken hesitations, and generating two polished, executive-ready outputs (Bangla and English) simultaneously.

---

## 2. Component-by-Component Audit

### 2.1 Manifest (`extension/manifest.json`)
- **Manifest Version:** 3
- **Name:** "Voice Bilingual Professionalizer"
- **Version:** "1.0.0"
- **Permissions:**
  - `storage`: For storing user provider preferences, model selections, and API keys securely in `chrome.storage.local`.
  - `activeTab`: For targeting the current tab for content injection and focus management.
  - `sidePanel`: For persistent side panel dictation workflow (Chrome 114+).
- **Actions & Views:**
  - `action.default_popup`: `popup.html` (380px compact floating interface).
  - `side_panel.default_path`: `sidepanel.html` (persistent multi-turn dictation).
  - `options_ui.page`: `options.html` (tab-based configuration interface).
- **Background Service Worker:**
  - `background.js` (ES Module format).
- **Content Scripts:**
  - `content.js` matches `<all_urls>`, runs at `document_idle` for in-page voice overlay and direct text insertion into active inputs/textareas/contenteditable elements.
- **Commands / Keyboard Shortcuts:**
  - `_execute_action`: `Ctrl+Shift+V` (Mac: `Command+Shift+V`) — Opens the compact popup.
  - `toggle-voice-overlay`: `Alt+Shift+V` — Injects/toggles the in-page voice floating bar.

### 2.2 Background Service Worker (`extension/background.js`)
- **Lifecycle:** Handles `chrome.runtime.onInstalled`, launches options page if no keys are configured.
- **Side Panel Coordination:** Sets panel behavior to avoid unexpected takeover of browser action.
- **Command Router:** Dispatches `toggle-voice-overlay` message to the active tab.
- **Message Router:**
  - `OPEN_OPTIONS`: Opens options page.
  - `OPEN_SIDEPANEL`: Opens Chrome side panel for the sender window.
  - `REFINE_TRANSCRIPT`: Invokes `normalizeTranscript` and `generateBilingualOutput` asynchronously.

### 2.3 Content Script (`extension/content.js`)
- Self-contained floating audio pill injected into host web pages on `Alt+Shift+V`.
- Listens for microphone input via Web Speech API, displays real-time transcript, and pastes the selected Bangla or English refinement directly into the active focused DOM field (`input`, `textarea`, or `contenteditable`).

### 2.4 User Interface Components
- **Popup (`extension/popup.html`, `popup.js`, `popup.css`):**
  - Dimensions: 380px width, responsive card layout in Deep Navy `#090e1a`.
  - State Machine: `IDLE` → `RECORDING` → `GENERATING` → `RESULT` → `ERROR`.
  - Dual-language toggle: `bn-BD` (বাংলা) and `en-US` (English).
  - Actions: Copy Bangla, Copy English, Copy Both, Record Again, Open Options, Open Side Panel.
- **Side Panel (`extension/sidepanel.html`, `sidepanel.js`):**
  - Persistent vertical panel suited for long-form email and ticket writing.
- **Options Page (`extension/options.html`, `options.js`, `options.css`):**
  - AI Provider Selection: OpenAI, Google Gemini, Custom Endpoint.
  - Model Selectors:
    - OpenAI: `gpt-4o-mini`, `gpt-4o`, `o3-mini`, `chatgpt-4o-latest`.
    - Gemini: `gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-3.1-pro-preview`, `gemini-flash-latest`.
  - Connectivity testing tool with live verification.

### 2.5 Core Modules (`extension/modules/`)
1. **`speech.js`:**
   - Web Speech API wrapper (`webkitSpeechRecognition`).
   - Supports continuous recognition, interim results, language switching (`bn-BD` / `en-US`), and auto-restart on unexpected network/audio drops.
2. **`normalizer.js`:**
   - Cleans spoken hesitations ("uh", "um", "মানে", "আর কি", "actually").
   - Collapses stuttered repetition ("আমি আমি" → "আমি").
   - Fixes spoken punctuation cues ("দাঁড়ি", "কমা", "প্রশ্নচিহ্ন", "full stop", "comma").
   - Preserves exact digits, dates, currencies, codes, and order numbers strictly.
3. **`ai-providers.js`:**
   - Provides `getSystemPrompt(tone, conciseness)` encoding the exact rules of the Bilingual Assistant.
   - Enforces JSON output strictly (`{"bangla": "...", "english": "..."}`).
   - Dispatches to `callOpenAI` or `callGemini` with fallback policies.
4. **`storage.js`:**
   - Abstracts `chrome.storage.local` with fallback to `localStorage`.
   - Built-in migration for deprecated model identifiers.
5. **`clipboard.js`:**
   - Modern `navigator.clipboard.writeText` with legacy fallback (`document.execCommand('copy')`).
   - Unicode-safe handling for Bengali glyphs.

### 2.6 Build and Packaging (`scripts/package-extension.js`)
- Packages all 22 extension files into `voice-bilingual-professionalizer-v1.0.0.zip`.
- Copies the ZIP to the public web distribution folder (`public/`).

---

## 3. Audit Checkpoint
- **Codebase Integrity:** Verified.
- **Manifest V3 Conformance:** 100% compliant.
- **Build Status:** Compiles and packages cleanly with zero errors.
