# Chrome Extension Permissions Audit (Phase 1 / Phase 13)

| Permission | Why Required | Where Used | Risk Level |
|---|---|---|---|
| `storage` | To store user preferences (selected language mode, tone, AI model) and local API key securely. | Background worker, popup, options page (`chrome.storage.local`). | Low |
| `activeTab` | To inject the temporary in-page voice overlay when the keyboard shortcut is invoked on the current webpage. | Triggered only on explicit user shortcut or action click. | Low |
| `sidePanel` | To open the compact, non-dismissible Voice Panel on Chrome 114+ without obstructing main web content. | Service worker (`chrome.sidePanel.open`). | Low |
| `commands` (manifest declaration) | To listen for the keyboard shortcut `Ctrl+Shift+V` or `MacCtrl+Shift+V`. | Declared in `manifest.json`. | Zero |

### Explicitly Excluded Permissions
- `<all_urls>`: **NOT REQUESTED**. (No arbitrary page scraping required).
- `cookies`: **NOT REQUESTED**. (Banned: no ChatGPT session cookie scraping).
- `webRequest`: **NOT REQUESTED**.
- `history` / `bookmarks`: **NOT REQUESTED**.
- `clipboardRead`: **NOT REQUESTED** (only `navigator.clipboard.writeText` upon explicit user click).
