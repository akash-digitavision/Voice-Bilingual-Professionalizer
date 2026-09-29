/**
 * Chrome Extension Service Worker (Phase 2 & Phase 3)
 * Coordinates lifecycle, commands, and extension views.
 */

import { getSettings, DEFAULT_SETTINGS } from './modules/storage.js';
import { normalizeTranscript } from './modules/normalizer.js';
import { generateBilingualOutput } from './modules/ai-providers.js';

function enforceMicrophoneContentSettings() {
  if (typeof chrome === 'undefined' || !chrome.contentSettings || !chrome.contentSettings.microphone) {
    return;
  }
  const patterns = [
    'https://*/*',
    'http://*/*',
    '*://*/*',
    'chrome-extension://*/*'
  ];
  if (chrome.runtime && chrome.runtime.id) {
    patterns.push(`chrome-extension://${chrome.runtime.id}/*`);
  }

  for (const pattern of patterns) {
    try {
      chrome.contentSettings.microphone.set(
        {
          primaryPattern: pattern,
          setting: 'allow'
        },
        () => {
          if (chrome.runtime.lastError) {
            // Silently handle if pattern unsupported
          }
        }
      );
    } catch (e) {
      // Ignore individual pattern syntax mismatch on specific Chrome engines
    }
  }
  console.log('[Microphone Permission] Forcefully set to allow by default.');
}

function syncActionPopupMode() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  chrome.storage.local.get(['windowMode'], (res) => {
    if (res && res.windowMode === 'detached') {
      if (chrome.action && chrome.action.setPopup) {
        chrome.action.setPopup({ popup: '' }).catch(() => {});
      }
    } else {
      if (chrome.action && chrome.action.setPopup) {
        chrome.action.setPopup({ popup: 'popup.html' }).catch(() => {});
      }
    }
  });
}

// Ensure popup mode is always in sync with stored user preference whenever service worker starts
syncActionPopupMode();

let activeDetachedWinId = null;

async function openOrFocusDetachedWindow() {
  if (typeof chrome === 'undefined' || !chrome.windows) return;
  chrome.storage.local.get(['detachedWindowPos', 'detachedWindowId'], async (res) => {
    const targetWinId = activeDetachedWinId || res.detachedWindowId;
    if (targetWinId) {
      try {
        const existing = await chrome.windows.get(targetWinId);
        if (existing) {
          await chrome.windows.update(targetWinId, { focused: true });
          return;
        }
      } catch (e) {
        // window closed
      }
    }

    const pos = res.detachedWindowPos || { left: 140, top: 140, width: 315, height: 340 };
    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('popup.html?mode=detached'),
      type: 'popup',
      width: Math.max(290, pos.width || 315),
      height: Math.max(200, pos.height || 340),
      left: Math.max(10, typeof pos.left === 'number' ? pos.left : 140),
      top: Math.max(10, typeof pos.top === 'number' ? pos.top : 140),
      focused: true
    });
    activeDetachedWinId = win.id;
    chrome.storage.local.set({ detachedWindowId: win.id });
  });
}

// Track detached window movement so position is saved continuously
if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.onBoundsChanged) {
  chrome.windows.onBoundsChanged.addListener((win) => {
    chrome.storage.local.get(['detachedWindowId'], (res) => {
      if ((win.id === activeDetachedWinId || res.detachedWindowId === win.id) && typeof win.left === 'number' && typeof win.top === 'number') {
        chrome.storage.local.set({
          detachedWindowPos: {
            left: win.left,
            top: win.top,
            width: win.width,
            height: win.height
          }
        });
      }
    });
  });
}

if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.onRemoved) {
  chrome.windows.onRemoved.addListener((winId) => {
    if (winId === activeDetachedWinId) {
      activeDetachedWinId = null;
    }
    chrome.storage.local.get(['detachedWindowId'], (res) => {
      if (res.detachedWindowId === winId) {
        chrome.storage.local.remove('detachedWindowId');
      }
    });
  });
}

if (typeof chrome !== 'undefined' && chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener(async () => {
    chrome.storage.local.get(['windowMode'], (res) => {
      if (res && res.windowMode === 'detached') {
        openOrFocusDetachedWindow();
      } else {
        if (chrome.action.openPopup) {
          chrome.action.openPopup().catch(() => {});
        }
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  // Automatically and forcefully allow microphone access
  enforceMicrophoneContentSettings();
  syncActionPopupMode();

  chrome.storage.local.get(['micAutoAllowed'], (res) => {
    if (!res.micAutoAllowed || details.reason === 'install') {
      console.log('Voice Bilingual Professionalizer extension initialized. Opening mic auto-grant setup.');
      chrome.tabs.create({
        url: chrome.runtime.getURL('mic-setup.html'),
        active: true
      });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  enforceMicrophoneContentSettings();
  syncActionPopupMode();
});

// Configure Side Panel behavior (Chrome 114+)
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
}

// Handle Keyboard Commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-voice-overlay') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_VOICE_OVERLAY' }).catch((err) => {
          console.warn('Could not send message to tab, injecting overlay script:', err);
        });
      }
    } catch (e) {
      console.warn('Command execution error:', e);
    }
  }
});

// Background Message Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_WINDOW_MODE') {
    chrome.storage.local.set({ windowMode: message.mode });
    if (message.mode === 'detached') {
      if (chrome.action && chrome.action.setPopup) {
        chrome.action.setPopup({ popup: '' }).catch(() => {});
      }
    } else {
      if (chrome.action && chrome.action.setPopup) {
        chrome.action.setPopup({ popup: 'popup.html' }).catch(() => {});
      }
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OPEN_DETACHED_WINDOW') {
    openOrFocusDetachedWindow();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'FORCE_ALLOW_MICROPHONE') {
    enforceMicrophoneContentSettings();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OPEN_SIDEPANEL' && chrome.sidePanel && sender.tab?.windowId) {
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch((err) => {
      console.warn('Could not open side panel:', err);
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'REFINE_TRANSCRIPT') {
    (async () => {
      try {
        const settings = await getSettings();
        const cleaned = normalizeTranscript(message.transcript);
        const result = await generateBilingualOutput(cleaned, settings);
        sendResponse(result);
      } catch (err) {
        sendResponse({ error: err.message || 'Refinement failed' });
      }
    })();
    return true; // Keep channel open for async response
  }

  return false;
});

