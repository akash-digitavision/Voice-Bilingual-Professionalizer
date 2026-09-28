# Authentication & Security Architecture (Phase 1)

## 1. Strict Policy on ChatGPT / OpenAI Authentication

### The Core Principle
**ChatGPT Website Sessions $\neq$ OpenAI API Credentials.**

The user may be currently logged into `https://chatgpt.com` in their Chrome browser. Under no circumstances does this application:
1. Scrape or extract session cookies from `chatgpt.com` (e.g., `__Secure-next-auth.session-token`).
2. Ask the user for their ChatGPT username or password.
3. Inject scripts into `chatgpt.com` to manipulate or impersonate the web interface.
4. Assume that an end-user ChatGPT Plus or Pro subscription automatically provides OpenAI API access.

### Why This Architecture is Enforced
- **Security & Integrity:** Accessing third-party browser session cookies violates browser isolation boundaries, is fragile, violates OpenAI terms of service, and exposes user credentials to catastrophic leakage.
- **Reliability:** OpenAI does not offer an official, supported public OAuth flow for client-side Chrome extensions accessing consumer ChatGPT sessions without developer API keys.
- **Platform Compliance:** Chrome Web Store policies forbid credential harvesting and unauthorized session hijacking.

---

## 2. Selected Supported Architectures

To ensure 100% compliance, maximum reliability, and full user choice, the Voice Bilingual Professionalizer implements two officially supported architectures:

### Option A: Direct User API Key (Chrome Extension Local Mode)
- **Mechanism:** The user enters their official OpenAI API key (`sk-...`), Gemini API key, or custom endpoint key in the Extension Options / Settings panel.
- **Storage:** Persisted locally via `chrome.storage.local` within the extension's sandboxed storage boundary.
- **Isolation:** Never exposed to arbitrary web pages, never logged to the browser console, and never sent to any third-party analytics.
- **Request Path:** Directly from the extension's background or popup via HTTPS to `https://api.openai.com/v1/chat/completions` or official provider endpoints.

### Option B: Secure Backend Gateway (Web Workbench & Enterprise Companion Mode)
- **Mechanism:** For the companion web application running in AI Studio, server-side environment variables (`GEMINI_API_KEY`) are utilized via the Express backend gateway (`/api/refine`).
- **Security:** Secrets are never sent to the client browser. All calls to the AI model run on the server with user-agent telemetry `aistudio-build`.
- **Zero Friction:** Users can test voice-to-bilingual translation immediately out-of-the-box without having to input an API key first.

---

## 3. Credential Lifecycle Management
- **Validation:** Instant "Test Connection" button validates provider credentials before saving.
- **Clear / Revoke:** Single-click "Clear Stored Key" immediately wipes credentials from storage.
- **Masking:** API keys are always masked (`sk-...••••••••`) in the UI; copy or inspection of raw values is restricted.
