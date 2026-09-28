# Troubleshooting & Diagnostics Guide

## 1. Microphone & Audio Issues

### Issue: "Microphone permission is required to record your voice"
- **Cause:** Chrome has blocked microphone access for the extension or webpage.
- **Resolution:**
  1. Click the lock/site settings icon in the Chrome URL bar.
  2. Toggle **Microphone** to **Allow**.
  3. Reload the tab and reopen the extension.

### Issue: "No voice input was detected"
- **Cause:** Microphone input volume is muted or system default input device is disconnected.
- **Resolution:**
  1. Verify your OS audio settings (System Settings → Sound → Input).
  2. Speak clearly within 1–2 feet of the microphone.

---

## 2. Speech-to-Text & Recognition Issues

### Issue: "Network error during speech recognition"
- **Cause:** Web Speech API uses Google's speech recognition cloud servers in Chrome, which requires active internet connectivity.
- **Resolution:**
  1. Verify internet connectivity.
  2. If using corporate VPN or proxy, verify that Google Speech endpoints are not blocked.

---

## 3. Keyboard Shortcut Issues

### Issue: Shortcut `Ctrl+Shift+V` does nothing on specific pages
- **Cause:** Google Chrome strictly prevents extensions from injecting scripts or executing commands on:
  - `chrome://*` pages (e.g. `chrome://extensions`, `chrome://settings`)
  - The Chrome Web Store (`chromewebstore.google.com`)
  - New tab blank pages before navigation
- **Resolution:**
  Navigate to any regular website (`google.com`, `gmail.com`, `docs.google.com`, etc.) or click the extension toolbar icon.

### Issue: Shortcut conflicts with another extension or OS keybinding
- **Resolution:**
  1. Navigate to `chrome://extensions/shortcuts` in Chrome.
  2. Scroll down to **Voice Bilingual Professionalizer**.
  3. Click the edit pencil icon and assign an alternative keybinding (e.g. `Alt+Shift+B` or `Ctrl+Shift+Y`).

---

## 4. AI Provider & Authentication Issues

### Issue: "Model gemini-2.5-flash is no longer available"
- **Cause:** Google has deprecated `gemini-2.5-flash` for new users in favor of the `gemini-3.8-flash` family.
- **Resolution:**
  1. The extension and companion workbench now default to `gemini-3.8-flash` (with automatic fallback to `gemini-3.1-flash-lite` or `gemini-flash-latest`).
  2. Any legacy stored preference is automatically upgraded to `gemini-3.8-flash`.

### Issue: "OpenAI API Key is missing or invalid"
- **Cause:** The API key is empty or has expired.
- **Resolution:**
  1. Right-click the extension icon and select **Options**.
  2. Enter a valid key from [platform.openai.com](https://platform.openai.com/api-keys).
  3. Click **Test Connection** to confirm authorization.
  4. Note: ChatGPT web subscriptions (Plus/Pro) do not grant API entitlements; you must use an OpenAI API key.

### Issue: "Rate limit or quota exceeded"
- **Cause:** The provider account has run out of credits or hit per-minute request limits.
- **Resolution:**
  1. Check your billing dashboard at [platform.openai.com/billing](https://platform.openai.com/billing) or Google AI Studio.
  2. Enable Provider Fallback in extension options to automatically switch to Gemini if OpenAI hits rate limits.
