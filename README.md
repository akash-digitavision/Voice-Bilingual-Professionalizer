# Voice Bilingual Professionalizer (Chrome Extension v1.0.0)

A high-performance Google Chrome Extension (Manifest V3) and companion testing workbench designed for professionals who communicate across Bangla and English.

Speak naturally in Bangla, English, Banglish, or mixed codeswitching. The extension cleans speech-to-text artifacts, repairs grammar and spelling, and produces two executive-grade versions simultaneously:
1. **Natural Professional Bangla (পেশাদার বাংলা)**
2. **Executive Professional English**

---

## 1. Quick Installation (Chrome Developer Mode)

1. **Download the ZIP package:**
   - Click **Download Extension (.zip)** in the top navigation bar of the companion app, or download `voice-bilingual-professionalizer-v1.0.0.zip` directly from the project root.
2. **Extract the ZIP file:**
   - Unpack the archive into a dedicated directory on your computer (e.g. `~/Downloads/voice-bilingual-professionalizer`).
3. **Open Chrome Extension Manager:**
   - In Google Chrome, navigate to `chrome://extensions/`.
4. **Enable Developer Mode:**
   - Toggle the **Developer mode** switch located in the upper-right corner.
5. **Load Unpacked Extension:**
   - Click the **Load unpacked** button in the upper-left corner.
   - Select the extracted folder containing `manifest.json`.
6. **Pin to Toolbar:**
   - Click the puzzle icon in Chrome’s toolbar and click the pin icon next to **Voice Bilingual Professionalizer**.

---

## 2. Authentication & Provider Setup

> **Important Security Architecture Note:**
> ChatGPT website login is separate from API access. In compliance with strict browser security and platform guidelines, this extension does NOT scrape ChatGPT web session cookies or harvest user passwords.

To configure your AI provider:
1. Right-click the extension icon in Chrome and click **Options** (or click the gear icon inside the popup).
2. Choose your provider:
   - **OpenAI (Recommended):** Enter your OpenAI API key (`sk-...`). Select `gpt-4o-mini` (fast) or `gpt-4o`.
   - **Google Gemini:** Enter your Gemini API key from Google AI Studio (`AIza...`).
   - **Custom Endpoint:** Connect to any OpenAI-compatible API endpoint (e.g. Ollama, Groq, or local gateway).
3. Click **Test Connection** to verify your credential.
4. Click **Save Settings**. Your keys are stored securely in Chrome's sandboxed `chrome.storage.local`.

---

## 3. Keyboard Shortcut Configuration

- **Default Shortcut:** `Ctrl + Shift + V` (Windows / Linux) or `⌘ + Shift + V` (Mac).
- **In-Page Floating Widget:** `Alt + Shift + V`.

### How to change the shortcut:
1. Open a new tab in Chrome and go to `chrome://extensions/shortcuts`.
2. Scroll to **Voice Bilingual Professionalizer**.
3. Click the pencil icon next to **Open Voice Professionalizer Popup**.
4. Press your desired key combination.

---

## 4. Voice Usage & Workflow

1. Press `Ctrl + Shift + V` (or click the toolbar icon).
2. The compact 380px Voice UI opens and recording activates immediately.
3. Speak naturally in Bangla, English, or mixed Banglish.
4. Click **Stop & Refine** (or press the Stop button).
5. The extension normalizes speech stutters and dispatches the transcript to the AI refinement layer.
6. The dual result cards appear:
   - Click **Copy Bangla** to copy the professional Bengali output.
   - Click **Copy English** to copy the executive English output.
   - Click **Record Again** to start a new voice session.

---

## 5. Security & Privacy Guarantees

- **No Audio Saved:** Microphone audio is converted to text in-memory via the Web Speech API and immediately destroyed. Zero audio is stored or sent to unverified endpoints.
- **Minimal Permissions:** Only `storage`, `activeTab`, and `sidePanel` are requested. No `<all_urls>`, no cookie scraping, no history tracking.
- **Local Credentials:** API credentials remain strictly inside your browser's sandboxed storage.

---

## 6. Troubleshooting

- **Microphone Permission Denied:**
  - Click the lock or camera icon in the Chrome URL bar and ensure Microphone access is set to "Allow".
- **Shortcuts Not Triggering on Chrome Web Store or chrome:// pages:**
  - Chrome restricts extensions from executing shortcuts or content scripts on internal browser pages (`chrome://*`) and the Chrome Web Store. Use the toolbar button on these pages.
- **Speech Recognition Network Error:**
  - Ensure an active internet connection is available for Google's Web Speech API.

---

## 7. Known Limitations

- Speech recognition accuracy depends on ambient noise and microphone clarity.
- Web Speech API requires Chrome Desktop and an active network connection.
