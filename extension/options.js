/**
 * Extension Options Controller
 * 
 * Rules:
 * 1. Active/Running status is ONLY displayed when an API key has been actually configured for that specific platform.
 * 2. If no API key has been configured for any platform, NO platform shows Running or Active.
 * 3. Moving between tabs does NOT change the active/running status; it only changes which panel is displayed.
 */

import { getSettings, saveSettings, isProviderConfigured, getEffectiveProvider } from './modules/storage.js';
import { generateBilingualOutput } from './modules/ai-providers.js';

// DOM Elements - Banner
const optionsActiveBanner = document.getElementById('options-active-banner');
const activeBannerDot = document.getElementById('active-banner-dot');
const activeBannerName = document.getElementById('active-banner-name');
const activeBannerModel = document.getElementById('active-banner-model');
const activeBannerPill = document.getElementById('active-banner-pill');

// DOM Elements - Tabs
const tabBtnGemini = document.getElementById('tab-btn-gemini');
const tabBtnOpenAI = document.getElementById('tab-btn-openai');
const tabBtnCustom = document.getElementById('tab-btn-custom');

const statusPillGemini = document.getElementById('status-pill-gemini');
const statusPillOpenAI = document.getElementById('status-pill-openai');
const statusPillCustom = document.getElementById('status-pill-custom');

// DOM Elements - Panels
const fieldsGemini = document.getElementById('fields-gemini');
const fieldsOpenAI = document.getElementById('fields-openai');
const fieldsCustom = document.getElementById('fields-custom');

const panelBadgeGemini = document.getElementById('panel-badge-gemini');
const panelBadgeOpenAI = document.getElementById('panel-badge-openai');
const panelBadgeCustom = document.getElementById('panel-badge-custom');

// Inputs - Gemini
const geminiKey = document.getElementById('gemini-key');
const geminiModel = document.getElementById('gemini-model');
const btnToggleGemini = document.getElementById('btn-toggle-gemini');
const btnSaveGemini = document.getElementById('btn-save-gemini');
const btnClearGemini = document.getElementById('btn-clear-gemini');

// Inputs - OpenAI
const openaiKey = document.getElementById('openai-key');
const openaiModel = document.getElementById('openai-model');
const btnToggleOpenAI = document.getElementById('btn-toggle-openai');
const btnSaveOpenAI = document.getElementById('btn-save-openai');
const btnClearOpenAI = document.getElementById('btn-clear-openai');

// Inputs - Custom
const customEndpoint = document.getElementById('custom-endpoint');
const customKey = document.getElementById('custom-key');
const customModel = document.getElementById('custom-model');
const btnSaveCustom = document.getElementById('btn-save-custom');
const btnClearCustom = document.getElementById('btn-clear-custom');

// Preferences
const prefLanguage = document.getElementById('pref-language');
const prefAutostart = document.getElementById('pref-autostart');
const prefTone = document.getElementById('pref-tone');
const prefConciseness = document.getElementById('pref-conciseness');

// Actions & Status
const btnTestConnection = document.getElementById('btn-test-connection');
const testStatus = document.getElementById('test-status');
const btnSaveSettings = document.getElementById('btn-save-settings');
const saveStatus = document.getElementById('save-status');

// Local controller state
let currentSettings = null;
let currentViewingTab = 'gemini'; // 'gemini' | 'openai' | 'custom'

function togglePassword(input, btn) {
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

/**
 * Updates banner, tab pills, and badges strictly based on actual configured keys
 */
function renderActiveStatus(settings) {
  const effective = getEffectiveProvider(settings);

  const isGoogle = isProviderConfigured(settings, 'gemini');
  const isOpenAI = isProviderConfigured(settings, 'openai');
  const isCustom = isProviderConfigured(settings, 'custom');

  // 1. Top Banner
  if (effective === 'none') {
    optionsActiveBanner.className = 'active-running-banner no-active';
    activeBannerDot.className = 'live-pulse-dot dot-inactive';
    activeBannerName.textContent = 'None';
    activeBannerModel.textContent = '(No key configured)';
    activeBannerPill.className = 'active-badge-pill pill-inactive';
    activeBannerPill.textContent = 'NO RUNNING ENGINE';
  } else {
    optionsActiveBanner.className = 'active-running-banner';
    activeBannerDot.className = 'live-pulse-dot';
    activeBannerPill.className = 'active-badge-pill';
    activeBannerPill.textContent = '● ACTIVE RUNNING ENGINE';

    if (effective === 'gemini') {
      activeBannerName.textContent = 'Google Gemini';
      activeBannerModel.textContent = `(${settings.geminiModel || 'gemini-3.8-flash'})`;
    } else if (effective === 'openai') {
      activeBannerName.textContent = 'OpenAI';
      activeBannerModel.textContent = `(${settings.openaiModel || 'gpt-4o-mini'})`;
    } else if (effective === 'custom') {
      activeBannerName.textContent = 'Custom API';
      activeBannerModel.textContent = `(${settings.customModel || 'llama3'})`;
    }
  }

  // 2. Google Tab & Panel Status
  tabBtnGemini.classList.remove('is-active-running');
  if (effective === 'gemini') {
    tabBtnGemini.classList.add('is-active-running');
    statusPillGemini.className = 'tab-status-pill status-active';
    statusPillGemini.textContent = '● Active / Running';
    panelBadgeGemini.className = 'panel-header-badge badge-active';
    panelBadgeGemini.innerHTML = '<span>● Google Gemini: Running Active Engine ✓</span>';
    btnClearGemini.style.display = 'inline-block';
  } else if (isGoogle) {
    statusPillGemini.className = 'tab-status-pill status-configured';
    statusPillGemini.textContent = 'Key Configured';
    panelBadgeGemini.className = 'panel-header-badge badge-configured';
    panelBadgeGemini.innerHTML = '<span>Key Saved (Inactive — click Save & Activate below to run)</span>';
    btnClearGemini.style.display = 'inline-block';
  } else {
    statusPillGemini.className = 'tab-status-pill status-empty';
    statusPillGemini.textContent = 'Not Configured';
    panelBadgeGemini.className = 'panel-header-badge badge-empty';
    panelBadgeGemini.innerHTML = '<span>No Key Configured</span>';
    btnClearGemini.style.display = 'none';
  }

  // 3. OpenAI Tab & Panel Status
  tabBtnOpenAI.classList.remove('is-active-running');
  if (effective === 'openai') {
    tabBtnOpenAI.classList.add('is-active-running');
    statusPillOpenAI.className = 'tab-status-pill status-active';
    statusPillOpenAI.textContent = '● Active / Running';
    panelBadgeOpenAI.className = 'panel-header-badge badge-active';
    panelBadgeOpenAI.innerHTML = '<span>● OpenAI: Running Active Engine ✓</span>';
    btnClearOpenAI.style.display = 'inline-block';
  } else if (isOpenAI) {
    statusPillOpenAI.className = 'tab-status-pill status-configured';
    statusPillOpenAI.textContent = 'Key Configured';
    panelBadgeOpenAI.className = 'panel-header-badge badge-configured';
    panelBadgeOpenAI.innerHTML = '<span>Key Saved (Inactive — click Save & Activate below to run)</span>';
    btnClearOpenAI.style.display = 'inline-block';
  } else {
    statusPillOpenAI.className = 'tab-status-pill status-empty';
    statusPillOpenAI.textContent = 'Not Configured';
    panelBadgeOpenAI.className = 'panel-header-badge badge-empty';
    panelBadgeOpenAI.innerHTML = '<span>No Key Configured</span>';
    btnClearOpenAI.style.display = 'none';
  }

  // 4. Custom API Tab & Panel Status
  tabBtnCustom.classList.remove('is-active-running');
  if (effective === 'custom') {
    tabBtnCustom.classList.add('is-active-running');
    statusPillCustom.className = 'tab-status-pill status-active';
    statusPillCustom.textContent = '● Active / Running';
    panelBadgeCustom.className = 'panel-header-badge badge-active';
    panelBadgeCustom.innerHTML = '<span>● Custom API: Running Active Engine ✓</span>';
    btnClearCustom.style.display = 'inline-block';
  } else if (isCustom) {
    statusPillCustom.className = 'tab-status-pill status-configured';
    statusPillCustom.textContent = 'Key Configured';
    panelBadgeCustom.className = 'panel-header-badge badge-configured';
    panelBadgeCustom.innerHTML = '<span>Key Saved (Inactive — click Save & Activate below to run)</span>';
    btnClearCustom.style.display = 'inline-block';
  } else {
    statusPillCustom.className = 'tab-status-pill status-empty';
    statusPillCustom.textContent = 'Not Configured';
    panelBadgeCustom.className = 'panel-header-badge badge-empty';
    panelBadgeCustom.innerHTML = '<span>No Key Configured</span>';
    btnClearCustom.style.display = 'none';
  }
}

/**
 * Changes which settings panel is currently displayed without altering active provider
 */
function switchTab(tab) {
  currentViewingTab = tab;

  tabBtnGemini.classList.toggle('selected-panel', tab === 'gemini');
  tabBtnOpenAI.classList.toggle('selected-panel', tab === 'openai');
  tabBtnCustom.classList.toggle('selected-panel', tab === 'custom');

  fieldsGemini.style.display = tab === 'gemini' ? 'block' : 'none';
  fieldsOpenAI.style.display = tab === 'openai' ? 'block' : 'none';
  fieldsCustom.style.display = tab === 'custom' ? 'block' : 'none';

  testStatus.className = 'test-status';
  testStatus.textContent = '';
}

async function load() {
  currentSettings = await getSettings();

  // Populate field values
  geminiKey.value = currentSettings.geminiKey || '';
  geminiModel.value = (currentSettings.geminiModel === 'gemini-2.5-flash' || !currentSettings.geminiModel)
    ? 'gemini-3.8-flash'
    : currentSettings.geminiModel;

  openaiKey.value = currentSettings.openaiKey || '';
  openaiModel.value = currentSettings.openaiModel || 'gpt-4o-mini';

  customEndpoint.value = currentSettings.customEndpoint || 'http://localhost:11434/v1/chat/completions';
  customKey.value = currentSettings.customKey || '';
  customModel.value = currentSettings.customModel || 'llama3:latest';

  prefLanguage.value = currentSettings.inputLanguage || 'bn-BD';
  prefAutostart.checked = Boolean(currentSettings.autoStartOnOpen);
  prefTone.value = currentSettings.tone || 'professional';
  prefConciseness.value = currentSettings.conciseness || 'balanced';

  // Determine initial viewing tab: effective active provider or first configured, or gemini
  const effective = getEffectiveProvider(currentSettings);
  if (effective !== 'none') {
    currentViewingTab = effective;
  } else {
    currentViewingTab = 'gemini';
  }

  switchTab(currentViewingTab);
  renderActiveStatus(currentSettings);
}

/**
 * Save & Activate a specific provider
 */
async function handleSaveAndActivate(provider) {
  let keyVal = '';
  if (provider === 'gemini') keyVal = geminiKey.value.trim();
  if (provider === 'openai') keyVal = openaiKey.value.trim();
  if (provider === 'custom') keyVal = customKey.value.trim();

  if (!keyVal) {
    testStatus.className = 'test-status error';
    testStatus.textContent = `Cannot activate ${provider.toUpperCase()}: Please enter an API key first.`;
    return;
  }

  const updatedData = {
    provider,
    geminiKey: geminiKey.value.trim(),
    geminiModel: geminiModel.value,
    openaiKey: openaiKey.value.trim(),
    openaiModel: openaiModel.value,
    customEndpoint: customEndpoint.value.trim(),
    customKey: customKey.value.trim(),
    customModel: customModel.value.trim(),
    inputLanguage: prefLanguage.value,
    autoStartOnOpen: prefAutostart.checked,
    tone: prefTone.value,
    conciseness: prefConciseness.value
  };

  currentSettings = await saveSettings(updatedData);
  renderActiveStatus(currentSettings);

  testStatus.className = 'test-status success';
  testStatus.textContent = `${provider === 'gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : 'Custom'} API key configured & running ✓`;
  setTimeout(() => { testStatus.textContent = ''; }, 3500);
}

/**
 * Clear key for a specific provider
 */
async function handleClearKey(provider) {
  if (!confirm(`Are you sure you want to remove your ${provider.toUpperCase()} API key?`)) {
    return;
  }

  const patch = {};
  if (provider === 'gemini') {
    geminiKey.value = '';
    patch.geminiKey = '';
  } else if (provider === 'openai') {
    openaiKey.value = '';
    patch.openaiKey = '';
  } else if (provider === 'custom') {
    customKey.value = '';
    patch.customKey = '';
  }

  // If removing currently running provider, reset provider
  if (currentSettings.provider === provider) {
    patch.provider = 'none';
  }

  currentSettings = await saveSettings(patch);
  renderActiveStatus(currentSettings);

  testStatus.className = 'test-status';
  testStatus.textContent = `${provider.toUpperCase()} key cleared. Platform is no longer active.`;
  setTimeout(() => { testStatus.textContent = ''; }, 2500);
}

/**
 * Save general settings
 */
async function saveGeneralSettings() {
  const updatedData = {
    geminiKey: geminiKey.value.trim(),
    geminiModel: geminiModel.value,
    openaiKey: openaiKey.value.trim(),
    openaiModel: openaiModel.value,
    customEndpoint: customEndpoint.value.trim(),
    customKey: customKey.value.trim(),
    customModel: customModel.value.trim(),
    inputLanguage: prefLanguage.value,
    autoStartOnOpen: prefAutostart.checked,
    tone: prefTone.value,
    conciseness: prefConciseness.value
  };

  currentSettings = await saveSettings(updatedData);
  renderActiveStatus(currentSettings);

  saveStatus.textContent = 'Settings saved successfully ✓';
  setTimeout(() => { saveStatus.textContent = ''; }, 2500);
}

/**
 * Test connection for currently viewed tab
 */
async function testConnection() {
  testStatus.className = 'test-status';
  testStatus.textContent = `Testing ${currentViewingTab.toUpperCase()} connection...`;

  let keyToTest = '';
  if (currentViewingTab === 'gemini') keyToTest = geminiKey.value.trim();
  if (currentViewingTab === 'openai') keyToTest = openaiKey.value.trim();
  if (currentViewingTab === 'custom') keyToTest = customKey.value.trim();

  if (!keyToTest) {
    testStatus.className = 'test-status error';
    testStatus.textContent = `Please enter an API key for ${currentViewingTab.toUpperCase()} before testing.`;
    return;
  }

  const testConfig = {
    provider: currentViewingTab,
    openaiKey: openaiKey.value.trim(),
    openaiModel: openaiModel.value,
    geminiKey: geminiKey.value.trim(),
    geminiModel: geminiModel.value,
    customEndpoint: customEndpoint.value.trim(),
    customKey: customKey.value.trim(),
    customModel: customModel.value.trim(),
    tone: 'professional',
    conciseness: 'balanced'
  };

  try {
    const result = await generateBilingualOutput('আমি কাজটি দ্রুত শেষ করতে চাই।', testConfig);
    if (result && result.bangla && result.english) {
      testStatus.className = 'test-status success';
      testStatus.textContent = `Verified! ${currentViewingTab.toUpperCase()} connection and response validated ✓`;
    } else {
      throw new Error('Unexpected response format from provider');
    }
  } catch (err) {
    testStatus.className = 'test-status error';
    testStatus.textContent = `Test failed: ${err.message || 'Check credentials and network'}`;
  }
}

// Event Listeners - Tabs (Click changes view only)
tabBtnGemini.addEventListener('click', () => switchTab('gemini'));
tabBtnOpenAI.addEventListener('click', () => switchTab('openai'));
tabBtnCustom.addEventListener('click', () => switchTab('custom'));

// Event Listeners - Save & Activate
btnSaveGemini.addEventListener('click', () => handleSaveAndActivate('gemini'));
btnSaveOpenAI.addEventListener('click', () => handleSaveAndActivate('openai'));
btnSaveCustom.addEventListener('click', () => handleSaveAndActivate('custom'));

// Event Listeners - Clear Key
btnClearGemini.addEventListener('click', () => handleClearKey('gemini'));
btnClearOpenAI.addEventListener('click', () => handleClearKey('openai'));
btnClearCustom.addEventListener('click', () => handleClearKey('custom'));

// Password toggles
btnToggleGemini.addEventListener('click', () => togglePassword(geminiKey, btnToggleGemini));
btnToggleOpenAI.addEventListener('click', () => togglePassword(openaiKey, btnToggleOpenAI));

// Test & General Save
btnTestConnection.addEventListener('click', testConnection);
btnSaveSettings.addEventListener('click', saveGeneralSettings);

window.addEventListener('DOMContentLoaded', load);
