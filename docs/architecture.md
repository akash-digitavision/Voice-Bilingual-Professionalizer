# Architecture Specification (Phase 1)

## 1. System Overview & Component Structure

The Voice Bilingual Professionalizer is structured into decoupled modules designed for Chrome Manifest V3 compliance and maximum code reusability across the extension and the web companion workbench:

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION LAYER                      │
│  [Keyboard Shortcut]      [Toolbar Icon]      [Web Workbench]   │
│   Ctrl/Cmd+Shift+V         Action Click       Interactive Demo  │
└───────────────┬───────────────────┬─────────────────────┬───────┘
                │                   │                     │
┌───────────────▼───────────────────▼─────────────────────▼───────┐
│                      VOICE UI COMPONENT                         │
│  - State Machine: IDLE → RECORDING → TRANSCRIBING → REFINING    │
│  - Micro Visualizer, Recording Timer, Stop/Cancel Controls      │
│  - High-Contrast Navy Design System (380px compact viewport)     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    SPEECH ABSTRACTION LAYER                     │
│  - Web Speech Provider (bn-BD / en-US / Mixed Speech)          │
│  - Audio Stream Capture (MediaDevices / Web Audio API)          │
│  - Real-time Interim Transcripts & Final Sentence Aggregation   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                 TRANSCRIPT NORMALIZATION ENGINE                 │
│  - Whitespace & Formatting Normalizer                           │
│  - Speech Recognition Stutter & Duplicate Word Stripper         │
│  - Semantic Invariant Protector (Zero Distortion of Meaning)    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    AI REFINEMENT CORE LAYER                     │
│  - Provider Abstraction Interface (OpenAI, Gemini, Custom API)  │
│  - Native Bangla & Executive English Professional Prompting     │
│  - Structured JSON Schema Validation & Error Normalizer         │
│  - Resilient Fallback Policy (No Infinite Loops)                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      RESULT & EXPORT LAYER                      │
│  - Bangla Result Card with Direct Copy & Inline Edit            │
│  - English Result Card with Direct Copy & Inline Edit           │
│  - Clipboard Handler (Preserves Unicode, Line Breaks, Format)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout & Module Responsibilities

```
/
├── extension/                       # Pure Chrome Manifest V3 Extension
│   ├── manifest.json                # MV3 Declarations, Permissions, Commands
│   ├── background.js                # Service Worker (Commands, Lifecycle)
│   ├── popup.html / popup.js        # Compact Action Popup UI
│   ├── popup.css                    # Dark Navy High-Contrast Design System
│   ├── content.js                   # Injected In-Page Shadow DOM Voice Overlay
│   ├── content.css                  # Isolated In-Page Styles
│   ├── sidepanel.html / sidepanel.js# Persistent Side Panel View
│   ├── options.html / options.js    # Settings & Provider Configuration Page
│   ├── modules/
│   │   ├── speech.js                # Speech Recognition Engine (bn-BD / en-US)
│   │   ├── normalizer.js            # Transcript Normalization Logic
│   │   ├── ai-providers.js          # Provider Adapters (OpenAI, Gemini, Custom)
│   │   ├── storage.js               # Chrome Storage Adapter
│   │   └── clipboard.js             # Unicode-Safe Copy Utilities
│   └── icons/                       # Extension Icons (16, 48, 128px SVG/PNG)
│
├── src/                             # Interactive Companion Web Workbench (React + Tailwind)
│   ├── components/
│   │   ├── VoiceInterface.tsx       # Live Voice Recording & State Machine
│   │   ├── ResultCards.tsx          # Dual Bangla/English Output with 1-Click Copy
│   │   ├── ExtensionPackager.tsx    # Live ZIP Packaging, File Inspection & Download
│   │   ├── SettingsDrawer.tsx       # API, Language & Tone Configuration
│   │   └── ArchitectureViewer.tsx   # System Architecture, Flow & Security Matrix
│   ├── services/
│   │   ├── speechService.ts         # Shared Speech-to-Text Controller
│   │   ├── normalizer.ts            # Shared Transcript Normalizer
│   │   └── aiService.ts             # Client-side AI Provider Abstraction
│   ├── App.tsx                      # Main Workbench Application
│   └── main.tsx                     # Entry Point
│
├── server.ts                        # Full-Stack Server & Secure AI Gateway (Option B)
├── docs/                            # Full Specification Documentation
└── package.json                     # Scripts & Dependencies
```

---

## 3. Chrome Manifest V3 Strategy
- **Service Worker (`background.js`):** Lightweight event-driven background script. Responds to `chrome.commands.onCommand` for shortcut `open-voice-professionalizer`, opens the side panel or injects content script message, and coordinates window focus.
- **Permissions:** Only `["storage", "activeTab", "sidePanel"]`. No `<all_urls>`, no intrusive telemetry permissions.
- **Security Invariant:** All remote AI API requests are executed over HTTPS. No secrets are stored in URLs or the DOM.
