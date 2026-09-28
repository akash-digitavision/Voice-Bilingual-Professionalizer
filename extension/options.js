/**
 * Extension Options Controller (Phase 7 & Phase 11)
 */

import { getSettings, saveSettings } from './modules/storage.js';
import { generateBilingualOutput } from './modules/ai-providers.js';

// DOM Elements
const provOpenAI = document.getElementById('prov-openai');
const provGemini = document.getElementById('prov-gemini');
const provCustom = document.getElementById('prov-custom');

const fieldsOpenAI = document.getElementById('fields-openai');
const fieldsGemini = document.getElementById('fields-gemini');
const fieldsCustom = document.getElementById('fields-custom');

const openaiKey = document.getElementById('openai-key');
const openaiModel = document.getElementById('openai-model');
const btnToggleOpenAI = document.getElementById('btn-toggle-openai');

const geminiKey = document.getElementById('gemini-key');
const geminiModel = document.getElementById('gemini-model');
const btnToggleGemini = document.getElementById('btn-toggle-gemini');

const customEndpoint = document.getElementById('custom-endpoint');
const customKey = document.getElementById('custom-key');
const customModel = document.getElementById('custom-model');

const prefLanguage = document.getElementById('pref-language');
const prefAutostart = document.getElementById('pref-autostart');
const prefTone = document.getElementById('pref-tone');
const prefConciseness = document.getElementById('pref-conciseness');

const btnTestConnection = document.getElementById('btn-test-connection');
const btnClearKeys = document.getElementById('btn-clear-keys');
const testStatus = document.getElementById('test-status');

const btnSaveSettings = document.getElementById('btn-save-settings');
const saveStatus = document.getElementById('save-status');

function updateProviderVisibility() {
  fieldsOpenAI.style.display = provOpenAI.checked ? 'block' : 'none';
  fieldsGemini.style.display = provGemini.checked ? 'block' : 'none';
  fieldsCustom.style.display = provCustom.checked ? 'block' : 'none';
}

function togglePassword(input, btn) {
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

async function load() {
  const settings = await getSettings();

  if (settings.provider === 'gemini') {
    provGemini.checked = true;
  } else if (settings.provider === 'custom') {
    provCustom.checked = true;
  } else {
    provOpenAI.checked = true;
  }
  updateProviderVisibility();

  openaiKey.value = settings.openaiKey || '';
  openaiModel.value = settings.openaiModel || 'gpt-4o-mini';

  geminiKey.value = settings.geminiKey || '';
  geminiModel.value = (settings.geminiModel === 'gemini-2.5-flash' || !settings.geminiModel)
    ? 'gemini-3.8-flash'
    : settings.geminiModel;

  customEndpoint.value = settings.customEndpoint || '';
  customKey.value = settings.customKey || '';
  customModel.value = settings.customModel || 'default';

  prefLanguage.value = settings.inputLanguage || 'bn-BD';
  prefAutostart.checked = Boolean(settings.autoStartOnOpen);
  prefTone.value = settings.tone || 'professional';
  prefConciseness.value = settings.conciseness || 'balanced';
}

async function save() {
  let provider = 'openai';
  if (provGemini.checked) provider = 'gemini';
  if (provCustom.checked) provider = 'custom';

  const newSettings = {
    provider,
    openaiKey: openaiKey.value.trim(),
    openaiModel: openaiModel.value,
    geminiKey: geminiKey.value.trim(),
    geminiModel: geminiModel.value,
    customEndpoint: customEndpoint.value.trim(),
    customKey: customKey.value.trim(),
    customModel: customModel.value.trim(),
    inputLanguage: prefLanguage.value,
    autoStartOnOpen: prefAutostart.checked,
    tone: prefTone.value,
    conciseness: prefConciseness.value
  };

  await saveSettings(newSettings);
  saveStatus.textContent = 'Settings saved successfully ✓';
  setTimeout(() => {
    saveStatus.textContent = '';
  }, 2500);
}

async function testConnection() {
  testStatus.className = 'test-status';
  testStatus.textContent = 'Testing connection...';

  let provider = 'openai';
  if (provGemini.checked) provider = 'gemini';
  if (provCustom.checked) provider = 'custom';

  const testConfig = {
    provider,
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
      testStatus.textContent = 'Connection verified! Provider output validated ✓';
    } else {
      throw new Error('Unexpected response structure');
    }
  } catch (err) {
    testStatus.className = 'test-status error';
    testStatus.textContent = `Test failed: ${err.message || 'Check credentials and network'}`;
  }
}

function clearKeys() {
  if (confirm('Are you sure you want to clear stored API keys?')) {
    openaiKey.value = '';
    geminiKey.value = '';
    customKey.value = '';
    save();
    testStatus.className = 'test-status';
    testStatus.textContent = 'Keys cleared.';
  }
}

// Event Listeners
provOpenAI.addEventListener('change', updateProviderVisibility);
provGemini.addEventListener('change', updateProviderVisibility);
provCustom.addEventListener('change', updateProviderVisibility);

btnToggleOpenAI.addEventListener('click', () => togglePassword(openaiKey, btnToggleOpenAI));
btnToggleGemini.addEventListener('click', () => togglePassword(geminiKey, btnToggleGemini));

btnTestConnection.addEventListener('click', testConnection);
btnClearKeys.addEventListener('click', clearKeys);
btnSaveSettings.addEventListener('click', save);

window.addEventListener('DOMContentLoaded', load);
