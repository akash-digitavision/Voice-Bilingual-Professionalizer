/**
 * Storage Abstraction Module (Phase 7 & 11)
 * Manages user settings, preferences, and secure credentials.
 */

export const DEFAULT_SETTINGS = {
  provider: 'none', // 'none' | 'openai' | 'gemini' | 'custom'
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  geminiKey: '',
  geminiModel: 'gemini-3.8-flash',
  customEndpoint: '',
  customKey: '',
  customModel: 'default',
  inputLanguage: 'auto', // 'auto' | 'bn-BD' | 'en-US'
  tone: 'professional', // 'professional' | 'executive' | 'friendly'
  conciseness: 'balanced', // 'concise' | 'balanced' | 'detailed'
  autoStartOnOpen: true,
  enableFallback: true,
  fallbackProvider: 'gemini'
};

export function isProviderConfigured(settings, provider) {
  if (!settings) return false;
  if (provider === 'gemini') return Boolean(settings.geminiKey && settings.geminiKey.trim().length > 0);
  if (provider === 'openai') return Boolean(settings.openaiKey && settings.openaiKey.trim().length > 0);
  if (provider === 'custom') return Boolean(settings.customKey && settings.customKey.trim().length > 0);
  return false;
}

export function getEffectiveProvider(settings) {
  if (!settings) return 'none';
  const isGoogle = isProviderConfigured(settings, 'gemini');
  const isOpenAI = isProviderConfigured(settings, 'openai');
  const isCustom = isProviderConfigured(settings, 'custom');

  if (settings.provider === 'gemini' && isGoogle) return 'gemini';
  if (settings.provider === 'openai' && isOpenAI) return 'openai';
  if (settings.provider === 'custom' && isCustom) return 'custom';

  if (isGoogle) return 'gemini';
  if (isOpenAI) return 'openai';
  if (isCustom) return 'custom';

  return 'none';
}

export async function getSettings() {
  let settings = { ...DEFAULT_SETTINGS };

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    settings = await new Promise((resolve) => {
      chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
        resolve({ ...DEFAULT_SETTINGS, ...items });
      });
    });
  } else {
    // Fallback to localStorage in web environment
    try {
      const saved = localStorage.getItem('vbp_settings');
      if (saved) {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
  }

  // Auto-upgrade legacy / deprecated model
  if (settings.geminiModel === 'gemini-2.5-flash' || !settings.geminiModel) {
    settings.geminiModel = 'gemini-3.8-flash';
    saveSettings({ geminiModel: 'gemini-3.8-flash' });
  }

  return settings;
}

export async function saveSettings(newSettings) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set(newSettings, () => {
        resolve(true);
      });
    });
  }

  // Fallback to localStorage
  try {
    const current = await getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('vbp_settings', JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}
