/**
 * Settings and Dynamic Active Provider State Manager
 * 
 * Rules:
 * 1. A provider is ONLY Active/Running if an API key has been actually configured for it.
 * 2. If no API key is configured for any platform, NO platform shows Running or Active.
 * 3. Moving between tabs does NOT change the active/running status.
 */

export type AIProvider = 'none' | 'gemini' | 'openai' | 'custom' | 'gateway';

export interface AppSettings {
  activeProvider: 'none' | 'gemini' | 'openai' | 'custom' | 'gateway';
  openaiKey: string;
  openaiModel: string;
  geminiKey: string;
  geminiModel: string;
  customEndpoint: string;
  customKey: string;
  customModel: string;
  popupPosition: { x: number; y: number };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  activeProvider: 'none',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  geminiKey: '',
  geminiModel: 'gemini-3.8-flash',
  customEndpoint: 'http://localhost:11434/v1/chat/completions',
  customKey: '',
  customModel: 'llama3:latest',
  popupPosition: { x: 0, y: 0 },
};

const SETTINGS_KEY = 'vbp_app_settings';

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_APP_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to read settings from localStorage', e);
  }
  return { ...DEFAULT_APP_SETTINGS };
}

export function saveStoredSettings(newSettings: Partial<AppSettings>): AppSettings {
  const current = getStoredSettings();
  const updated: AppSettings = { ...current, ...newSettings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('vbp-settings-changed', { detail: updated }));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
  return updated;
}

export interface ActiveProviderInfo {
  id: 'none' | 'gemini' | 'openai' | 'custom' | 'gateway';
  name: string;
  model: string;
  displayLabel: string;
  badgeColor: string;
  isCustom: boolean;
  hasKey: boolean;
  hasActive: boolean;
}

/**
 * Checks if a specific platform has a valid configured API key
 */
export function isProviderConfigured(provider: 'gemini' | 'openai' | 'custom' | 'gateway', settings: AppSettings = getStoredSettings()): boolean {
  switch (provider) {
    case 'gemini':
      return Boolean(settings.geminiKey && settings.geminiKey.trim().length > 0);
    case 'openai':
      return Boolean(settings.openaiKey && settings.openaiKey.trim().length > 0);
    case 'custom':
      return Boolean(settings.customKey && settings.customKey.trim().length > 0);
    case 'gateway':
      return false; // Gateway is not an explicit user-configured API key
    default:
      return false;
  }
}

/**
 * Returns the effective running provider.
 * A platform is ONLY active if it actually has a configured API key.
 * If no API key is configured, returns 'none'.
 */
export function getEffectiveActiveProvider(settings: AppSettings = getStoredSettings()): 'none' | 'gemini' | 'openai' | 'custom' {
  const isGoogle = isProviderConfigured('gemini', settings);
  const isOpenAI = isProviderConfigured('openai', settings);
  const isCustom = isProviderConfigured('custom', settings);

  // If the user's chosen activeProvider is configured, that one is running
  if (settings.activeProvider === 'gemini' && isGoogle) return 'gemini';
  if (settings.activeProvider === 'openai' && isOpenAI) return 'openai';
  if (settings.activeProvider === 'custom' && isCustom) return 'custom';

  // Otherwise, fall back to whichever provider actually has a configured key
  if (isGoogle) return 'gemini';
  if (isOpenAI) return 'openai';
  if (isCustom) return 'custom';

  // No key configured anywhere -> NO active provider
  return 'none';
}

export function getActiveProviderInfo(settings: AppSettings = getStoredSettings()): ActiveProviderInfo {
  const effective = getEffectiveActiveProvider(settings);

  switch (effective) {
    case 'openai':
      return {
        id: 'openai',
        name: 'OpenAI',
        model: settings.openaiModel || 'gpt-4o-mini',
        displayLabel: `Running API Key: OpenAI (${settings.openaiModel || 'gpt-4o-mini'})`,
        badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
        isCustom: false,
        hasKey: true,
        hasActive: true,
      };
    case 'gemini':
      return {
        id: 'gemini',
        name: 'Google Gemini',
        model: settings.geminiModel || 'gemini-3.8-flash',
        displayLabel: `Running API Key: Google Gemini (${settings.geminiModel || 'gemini-3.8-flash'})`,
        badgeColor: 'border-sky-500/50 bg-sky-950/60 text-sky-300',
        isCustom: false,
        hasKey: true,
        hasActive: true,
      };
    case 'custom':
      return {
        id: 'custom',
        name: 'Custom API',
        model: settings.customModel || 'llama3:latest',
        displayLabel: `Running API Key: Custom API (${settings.customModel || 'local'})`,
        badgeColor: 'border-purple-500/50 bg-purple-950/60 text-purple-300',
        isCustom: true,
        hasKey: true,
        hasActive: true,
      };
    case 'none':
    default:
      return {
        id: 'none',
        name: 'None',
        model: '',
        displayLabel: 'No API Key Configured (Click to set up)',
        badgeColor: 'border-white/10 bg-white/5 text-slate-400',
        isCustom: false,
        hasKey: false,
        hasActive: false,
      };
  }
}
