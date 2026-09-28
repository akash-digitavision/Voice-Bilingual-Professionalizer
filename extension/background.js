/**
 * Chrome Extension Service Worker (Phase 2 & Phase 3)
 * Coordinates lifecycle, commands, and extension views.
 */

import { getSettings, DEFAULT_SETTINGS } from './modules/storage.js';
import { normalizeTranscript } from './modules/normalizer.js';
import { generateBilingualOutput } from './modules/ai-providers.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Voice Bilingual Professionalizer extension installed.');
    const current = await getSettings();
    if (!current.openaiKey && !current.geminiKey) {
      chrome.runtime.openOptionsPage();
    }
  }
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

