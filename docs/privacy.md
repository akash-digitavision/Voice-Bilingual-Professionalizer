# Privacy Policy & Data Handling (Phase 1 / Phase 13)

## 1. Data Capture Policy
- **Microphone Audio:** Audio is processed solely for real-time speech recognition during active recording.
- **Audio Persistence:** Zero audio recordings are stored, cached, or written to disk. The audio buffer is immediately released upon transcription completion.
- **Transcript Transmission:** Only the normalized spoken text snippet is transmitted over TLS/HTTPS directly to the chosen AI endpoint (OpenAI or Gemini) for translation and refinement.
- **No Third-Party Analytics:** The extension contains zero tracking pixels, telemetry beacons, or third-party advertising SDKs.

## 2. Credential Security
- API keys entered by the user are stored only in the browser's sandboxed `chrome.storage.local`.
- Credentials are never logged, never emitted in error stack traces, and never synchronized across external servers.
