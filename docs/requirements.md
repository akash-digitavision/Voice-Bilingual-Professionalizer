# Voice Bilingual Professionalizer — Requirements Matrix & Audit (Phase 0)

## 1. Project Overview
- **Project Name:** Voice Bilingual Professionalizer (Chrome Extension & Companion Workbench)
- **Target Platform:** Google Chrome Desktop (Manifest V3), optimized for 14-inch laptops and desktop displays.
- **Core Purpose:** Real-time voice capture → transcript cleanup → professional bilingual refinement into natural, native-sounding Bangla (`bn-BD`) and English (`en-US`).
- **Standard:** Google Chrome Manifest V3 compliant.

---

## 2. Requirements Matrix & Verification Mapping

| Req ID | Requirement Description | Technical Feasibility & Target Solution | Phase | Status |
|---|---|---|---|---|
| **REQ-01** | Manifest V3 Extension Foundation | Feasible via `manifest.json`, background service worker, and standard extension structure. | Phase 2 | Planned |
| **REQ-02** | Keyboard Shortcut to trigger Voice UI | Feasible via Chrome Commands API (`_execute_action` or custom command `open-voice-professionalizer`). Works across tabs. | Phase 3 | Planned |
| **REQ-03** | Compact, Dark Navy Voice UI | Feasible. Strict 360–400px compact floating UI, dark navy palette (`#0F172A`, `#1E293B`, `#0284C7`), high contrast, no visual bloat. Fits 14" screen. | Phase 4 | Planned |
| **REQ-04** | Microphone Audio & Speech-to-Text | Feasible via Web Speech API (`webkitSpeechRecognition`) supporting `bn-BD` and `en-US` with continuous fallback and interim transcript display. | Phase 5 | Planned |
| **REQ-05** | Transcript Normalization | Feasible via algorithmic normalization rules: whitespace compaction, stutter/repeat filtering, punctuation artifact cleanup without semantic mutation. | Phase 6 | Planned |
| **REQ-06** | Secure Authentication Architecture | Feasible via Option A (User-provided OpenAI / Gemini / Custom API key in local encrypted storage) and Option B (Zero-configuration backend gateway for web workbench). Absolutely NO ChatGPT cookie/session scraping. | Phase 7 | Planned |
| **REQ-07** | Bilingual AI Refinement (Bangla + English) | Feasible using curated prompt instructions ensuring natural Bangladeshi Bangla and professional executive English with structured JSON response. | Phase 8 | Planned |
| **REQ-08** | Result Card UI with 1-Click Copy | Feasible with Unicode-safe clipboard integration, line break preservation, visual copy confirmation, and optional inline editing. | Phase 9-10 | Planned |
| **REQ-09** | Settings & Customization | Feasible via `chrome.storage.local` and companion settings panel (tone, conciseness, model, language preference, provider). | Phase 11 | Planned |
| **REQ-10** | Provider Abstraction & Fallback | Feasible via unified `AIProvider` interface (OpenAI, Gemini, OpenAI-compatible endpoint) with normalized error handling (`AUTH_ERROR`, `RATE_LIMIT`, `NETWORK_ERROR`). | Phase 12 | Planned |
| **REQ-11** | Security & Privacy Hardening | Minimum necessary Chrome permissions (`activeTab`, `storage`, `commands`), no passwords, no cookie scraping, clear privacy policy. | Phase 13 | Planned |
| **REQ-12** | Production ZIP Packaging | Feasible via automated build & packaging script producing `voice-bilingual-professionalizer-v1.0.0.zip` ready for Chrome "Load unpacked" or installation. | Phase 15-16 | Planned |

---

## 3. Contradictions & Unsupported Assumptions Identified

1. **ChatGPT Session Reuse vs. Official API Authentication:**
   - *Unsupported Assumption:* "The user is logged into chatgpt.com in Chrome, so the extension can automatically use that login session."
   - *Resolution:* Official Chrome security and OpenAI terms strictly prohibit scraping `chatgpt.com` session tokens or session cookies. ChatGPT web subscriptions do not grant API entitlements. As mandated by Section 3 of the specification, the extension provides **Option A (Secure User API Key)** and **Option B (Secure Backend Gateway)**.
2. **Background Service Worker Audio Access:**
   - *Technical Constraint:* In Chrome Manifest V3, background service workers have no DOM or audio context, so `navigator.mediaDevices` or `webkitSpeechRecognition` cannot run directly inside `background.js`.
   - *Resolution:* Speech recognition runs in the Popup UI (`popup.html`), side panel (`sidepanel.html`), and in-page injected Shadow DOM overlay (`content.js`), coordinated smoothly with the background service worker.
3. **Global Keyboard Shortcuts on Restricted Chrome Pages:**
   - *Platform Limitation:* Chrome does not permit content scripts or commands to run on `chrome://` internal URLs, Chrome Web Store, or blank new tabs prior to navigation.
   - *Resolution:* Clearly documented in user guide; users can click the extension toolbar icon or use the side panel if on a restricted page.

---

## 4. Technical Risks & Mitigation
- **Risk:** Web Speech API language switching latency.
  - *Mitigation:* Support primary language selector (`Bangla (bn-BD)`, `English (en-US)`, or `Auto/Mixed`) with smart normalization and AI prompt handling codeswitched "Banglish".
- **Risk:** Unintentional modal dismissal.
  - *Mitigation:* Provide both compact action popup, in-page shadow overlay, and Side Panel option to prevent accidental closure during speech.
