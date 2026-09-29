# Phase 1 — Baseline Specification & Verification
**Date:** 2026-09-28  
**Project:** Voice Bilingual Professionalizer  

---

## 1. Baseline Metadata
- **Current Version:** `1.0.0`
- **Manifest Format:** Chrome Manifest V3
- **Build Command:** `npm run build` (executes `vite build && node scripts/package-extension.js`)
- **Lint / Typecheck Command:** `npm run lint` (`tsc --noEmit`)
- **Package Command:** `npm run package-ext` (`node scripts/package-extension.js`)
- **Dev Server Command:** `npm run dev` (`tsx server.ts` running Express on port 3000)

---

## 2. Baseline Architecture

### 2.1 AI Providers
- **Supported Providers:**
  1. `openai`: Direct OpenAI API (`api.openai.com/v1/chat/completions`) using user API Key with models:
     - `gpt-4o-mini` (Fast & Recommended)
     - `gpt-4o` (Flagship Multilingual)
     - `o3-mini` (High-Accuracy Reasoning)
     - `chatgpt-4o-latest` (Dynamic Flagship Alias)
  2. `gemini`: Google Gemini API using user key or server gateway (`server.ts` with `@google/genai`):
     - `gemini-3.8-flash` (Fast Bilingual Recommended)
     - `gemini-3.1-flash-lite` (Cost Efficient)
     - `gemini-3.1-pro-preview` (Complex Nuance)
     - `gemini-flash-latest` (Dynamic Alias)
  3. `custom`: User-specified OpenAI-compatible base URL and endpoint.

### 2.2 Voice Input & Speech-to-Text
- **Implementation:** Browser Web Speech API (`webkitSpeechRecognition`).
- **Locales Supported:**
  - `bn-BD`: Bengali (Bangladesh)
  - `en-US`: English (United States)
- **Features:** Continuous streaming, interim updates, visual audio ring animation, automatic restart on speech boundary pauses.

### 2.3 User Interface
- **Popup:** 380px compact dark-themed card (`#090e1a`) with single-click copy buttons for Bangla, English, and Combined outputs.
- **Side Panel:** Chrome 114+ persistent companion panel for drafting long emails and documents.
- **Options Page:** Clean settings tabs for provider credentials, model selection, default tones, and real-time connectivity testing.
- **In-Page Floating Bar:** Keyboard-shortcut-triggered (`Alt+Shift+V`) floating pill with instant insertion into web page fields.
- **Web Workbench:** Full-featured developer test harness with audio recorder, waveform visualizer, and code inspector.

### 2.4 Known Issues / Migration Status
- Legacy model `gemini-2.5-flash` deprecation has been completely resolved across the codebase and runtime.
- Automatic storage migration upgrades any stored `gemini-2.5-flash` settings to `gemini-3.8-flash`.

---

## 3. Baseline Verification Checkpoint
- **Linter Output:** 0 errors (`tsc --noEmit` exits with 0).
- **Compilation:** `npm run build` succeeds; ZIP package created at `public/voice-bilingual-professionalizer-v1.0.0.zip` (31.0 KB).
- **Backend API Gateway:** Live `/api/refine` test verifies 200 OK with accurate JSON response.
- **Status:** Baseline PASSED and locked.
