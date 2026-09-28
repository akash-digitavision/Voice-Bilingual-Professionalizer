# Data Flow Specification (Phase 1)

## End-to-End Voice-to-Bilingual Data Flow

```
[1. User Triggers Action]
   │ - Shortcut (Ctrl+Shift+V / Cmd+Shift+V) or Toolbar Action
   ▼
[2. Voice UI Activation]
   │ - State: RECORDING
   │ - MediaStream or WebSpeechRecognition initiated
   │ - User speaks in Bangla, English, Banglish, or mixed codeswitching
   ▼
[3. Raw Speech Capture]
   │ - Web Speech API captures interim & final results
   │ - User clicks [Stop Recording] or pauses beyond silence threshold
   │ - State: TRANSCRIBING
   ▼
[4. Transcript Normalization Engine]
   │ - Remove repetitive STT stutter (e.g. "আমি আমি" → "আমি")
   │ - Clean spacing, trim stray punctuation tokens
   │ - Preserve 100% semantic factual meaning and technical terms
   │ - State: GENERATING (AI REFINEMENT)
   ▼
[5. AI Refinement Core]
   │ - System prompt enforces:
   │   * Bangladeshi native Bangla (standard professional, not literal word-for-word)
   │   * Natural executive English (concise, polite, respectful, professional)
   │   * Strict factual retention (no invented dates, names, or promises)
   │ - Dispatch request to configured AI Provider (OpenAI, Gemini, or Custom)
   ▼
[6. Structured Response Parsing]
   │ - Parse JSON { "bangla": "...", "english": "..." }
   │ - Sanitize unicode strings
   │ - State: RESULT
   ▼
[7. Presentation & 1-Click Copy]
   │ - Bangla Card: Rendered with Noto Sans Bengali typography + [Copy Bangla]
   │ - English Card: Rendered with Plus Jakarta Sans typography + [Copy English]
   │ - Optional inline editing for micro adjustments prior to copy
   │ - Visual confirmation: "Copied to clipboard ✓"
```
