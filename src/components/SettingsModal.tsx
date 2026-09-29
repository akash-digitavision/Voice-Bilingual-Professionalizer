import React, { useState, useEffect } from 'react';
import { X, Key, Check, ShieldCheck, RefreshCw, Zap, CheckCircle2, Globe, AlertCircle, Trash2 } from 'lucide-react';
import { refineTranscript } from '../services/refinementService';
import {
  getStoredSettings,
  saveStoredSettings,
  getActiveProviderInfo,
  getEffectiveActiveProvider,
  isProviderConfigured,
  AppSettings,
} from '../services/settingsState';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  // selectedTab controls ONLY which settings panel the user is viewing/editing
  const [selectedTab, setSelectedTab] = useState<'gemini' | 'openai' | 'custom'>('gemini');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [customEndpoint, setCustomEndpoint] = useState('http://localhost:11434/v1/chat/completions');
  const [customKey, setCustomKey] = useState('');
  const [customModel, setCustomModel] = useState('llama3:latest');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = getStoredSettings();
      setSettings(current);
      const effective = getEffectiveActiveProvider(current);
      if (effective !== 'none') {
        setSelectedTab(effective);
      }
      setOpenaiKey(current.openaiKey);
      setOpenaiModel(current.openaiModel);
      setGeminiKey(current.geminiKey);
      setGeminiModel(current.geminiModel);
      setCustomEndpoint(current.customEndpoint);
      setCustomKey(current.customKey);
      setCustomModel(current.customModel);
      setTestStatus('idle');
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveActive = getEffectiveActiveProvider(settings);
  const activeInfo = getActiveProviderInfo(settings);

  // Check configuration states for each platform based on SAVED settings
  const isGoogleConfigured = isProviderConfigured('gemini', settings);
  const isOpenAIConfigured = isProviderConfigured('openai', settings);
  const isCustomConfigured = isProviderConfigured('custom', settings);

  // Save key and activate engine
  const handleSaveAndActivate = (targetProvider: 'gemini' | 'openai' | 'custom') => {
    // Validate that the key for this platform is actually provided
    let keyToCheck = '';
    if (targetProvider === 'gemini') keyToCheck = geminiKey;
    if (targetProvider === 'openai') keyToCheck = openaiKey;
    if (targetProvider === 'custom') keyToCheck = customKey;

    if (!keyToCheck.trim()) {
      setTestStatus('error');
      setStatusMessage(`Cannot activate ${targetProvider.toUpperCase()}: Please enter a valid API key first.`);
      return;
    }

    const updated = saveStoredSettings({
      activeProvider: targetProvider,
      openaiKey,
      openaiModel,
      geminiKey,
      geminiModel,
      customEndpoint,
      customKey,
      customModel,
    });
    setSettings(updated);
    setTestStatus('success');
    setStatusMessage(`${targetProvider === 'gemini' ? 'Google Gemini' : targetProvider === 'openai' ? 'OpenAI' : 'Custom'} API key configured and activated as Running Engine!`);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Remove key for a platform
  const handleRemoveKey = (targetProvider: 'gemini' | 'openai' | 'custom') => {
    const patch: Partial<AppSettings> = {};
    if (targetProvider === 'gemini') {
      patch.geminiKey = '';
      setGeminiKey('');
    } else if (targetProvider === 'openai') {
      patch.openaiKey = '';
      setOpenaiKey('');
    } else if (targetProvider === 'custom') {
      patch.customKey = '';
      setCustomKey('');
    }

    // If removing the currently active provider, reset activeProvider
    if (settings.activeProvider === targetProvider) {
      patch.activeProvider = 'none';
    }

    const updated = saveStoredSettings(patch);
    setSettings(updated);
    setTestStatus('idle');
    setStatusMessage(`${targetProvider.toUpperCase()} key removed. Platform is no longer active.`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setStatusMessage(`Testing connection with ${selectedTab.toUpperCase()}...`);

    const keyToTest =
      selectedTab === 'openai'
        ? openaiKey
        : selectedTab === 'gemini'
        ? geminiKey
        : customKey;

    if (!keyToTest.trim()) {
      setTestStatus('error');
      setStatusMessage(`Please enter an API key for ${selectedTab.toUpperCase()} before testing.`);
      return;
    }

    try {
      await refineTranscript({
        transcript: 'আমি কাজটি দ্রুত শেষ করতে চাই।',
        provider: selectedTab,
        apiKey: keyToTest,
        model:
          selectedTab === 'openai'
            ? openaiModel
            : selectedTab === 'gemini'
            ? geminiModel
            : customModel,
        customEndpoint: selectedTab === 'custom' ? customEndpoint : undefined,
      });

      setTestStatus('success');
      setStatusMessage(`Verified! ${selectedTab.toUpperCase()} API key is valid and working.`);
    } catch (err: any) {
      setTestStatus('error');
      setStatusMessage(err.message || 'Connection test failed. Please verify your API key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#10192e] shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090e1a]">
          <div className="flex items-center gap-2.5">
            <Key className="h-4 w-4 text-sky-400" />
            <h3 className="font-['Cabinet_Grotesk'] text-base font-bold text-white">
              AI Provider & API Key Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PROMINENT RUNNING API KEY STATUS BANNER */}
        {activeInfo.hasActive ? (
          <div className="px-6 py-3 bg-[#0a1a1f] border-b border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
                  Currently Active & Running
                </span>
                <span className="text-sm font-bold text-white">
                  Running API Key: <strong className="text-emerald-300 font-extrabold">{activeInfo.name}</strong>
                  <span className="text-xs font-normal text-slate-300 ml-1.5">({activeInfo.model})</span>
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/90 border border-emerald-500/50 text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Running
            </span>
          </div>
        ) : (
          <div className="px-6 py-3 bg-[#13121d] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-500"></span>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                  No Active API Key
                </span>
                <span className="text-xs text-slate-300">
                  Configure an API key for Google, OpenAI, or Custom API below to activate.
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-400">
              No Running Key
            </span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto text-xs text-slate-300">
          {/* Provider Selection Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Platform Settings Panels
              </label>
              <span className="text-[10px] text-slate-400">
                Click tab to view/edit key (does not change running status)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* 1. Google API Tab */}
              <button
                type="button"
                onClick={() => setSelectedTab('gemini')}
                className={`relative p-3 rounded-lg border text-left transition-all ${
                  effectiveActive === 'gemini'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white ring-2 ring-emerald-500/40 shadow-emerald-500/10'
                    : selectedTab === 'gemini'
                    ? 'border-white/30 bg-white/10 text-white ring-1 ring-white/20'
                    : isGoogleConfigured
                    ? 'border-sky-500/30 bg-white/5 text-slate-200 hover:border-sky-500/60'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {effectiveActive === 'gemini' && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-bold text-sky-400 text-xs">Google API</div>
                  {selectedTab === 'gemini' && effectiveActive !== 'gemini' && (
                    <span className="text-[9px] text-slate-400 font-normal">Editing</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-300">Gemini Key</div>
                <div className="text-[9px] mt-1.5 font-semibold">
                  {effectiveActive === 'gemini' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">● Active / Running</span>
                  ) : isGoogleConfigured ? (
                    <span className="text-sky-300">Key Configured</span>
                  ) : (
                    <span className="text-slate-500">Not Configured</span>
                  )}
                </div>
              </button>

              {/* 2. OpenAI Tab */}
              <button
                type="button"
                onClick={() => setSelectedTab('openai')}
                className={`relative p-3 rounded-lg border text-left transition-all ${
                  effectiveActive === 'openai'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white ring-2 ring-emerald-500/40 shadow-emerald-500/10'
                    : selectedTab === 'openai'
                    ? 'border-white/30 bg-white/10 text-white ring-1 ring-white/20'
                    : isOpenAIConfigured
                    ? 'border-emerald-500/30 bg-white/5 text-slate-200 hover:border-emerald-500/60'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {effectiveActive === 'openai' && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-bold text-emerald-400 text-xs">OpenAI</div>
                  {selectedTab === 'openai' && effectiveActive !== 'openai' && (
                    <span className="text-[9px] text-slate-400 font-normal">Editing</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-300">GPT-4o Key</div>
                <div className="text-[9px] mt-1.5 font-semibold">
                  {effectiveActive === 'openai' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">● Active / Running</span>
                  ) : isOpenAIConfigured ? (
                    <span className="text-emerald-300">Key Configured</span>
                  ) : (
                    <span className="text-slate-500">Not Configured</span>
                  )}
                </div>
              </button>

              {/* 3. Custom API Tab */}
              <button
                type="button"
                onClick={() => setSelectedTab('custom')}
                className={`relative p-3 rounded-lg border text-left transition-all ${
                  effectiveActive === 'custom'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white ring-2 ring-emerald-500/40 shadow-emerald-500/10'
                    : selectedTab === 'custom'
                    ? 'border-white/30 bg-white/10 text-white ring-1 ring-white/20'
                    : isCustomConfigured
                    ? 'border-purple-500/30 bg-white/5 text-slate-200 hover:border-purple-500/60'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {effectiveActive === 'custom' && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-bold text-purple-400 text-xs">Custom API</div>
                  {selectedTab === 'custom' && effectiveActive !== 'custom' && (
                    <span className="text-[9px] text-slate-400 font-normal">Editing</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-300">Ollama / Proxy</div>
                <div className="text-[9px] mt-1.5 font-semibold">
                  {effectiveActive === 'custom' ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">● Active / Running</span>
                  ) : isCustomConfigured ? (
                    <span className="text-purple-300">Key Configured</span>
                  ) : (
                    <span className="text-slate-500">Not Configured</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Configuration Form for Selected Tab */}

          {/* 1. Google Gemini Panel */}
          {selectedTab === 'gemini' && (
            <div className={`space-y-3.5 p-4 rounded-lg border ${effectiveActive === 'gemini' ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-sky-500/30 bg-[#090e1a]'}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-sky-400" />
                  <span className="font-semibold text-white">Google Gemini API Configuration</span>
                </div>
                {effectiveActive === 'gemini' ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Running Active API
                  </span>
                ) : isGoogleConfigured ? (
                  <span className="text-[11px] text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                    Key Saved (Inactive)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    No Key Configured
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Google Gemini API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold hover:bg-white/10"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                  {isGoogleConfigured && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKey('gemini')}
                      className="px-2.5 py-2 rounded border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40"
                      title="Clear Google API Key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Obtain your key free from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-sky-400 underline">Google AI Studio</a>.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Gemini Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#10192e] px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended Fast Bilingual)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Cost-Efficient Flash Lite)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Nuance & Pro Reasoning)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (Always Latest Flash)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('gemini')}
                  className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Save & Activate Google API</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. OpenAI Panel */}
          {selectedTab === 'openai' && (
            <div className={`space-y-3.5 p-4 rounded-lg border ${effectiveActive === 'openai' ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-emerald-500/30 bg-[#090e1a]'}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-white">OpenAI API Configuration</span>
                </div>
                {effectiveActive === 'openai' ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Running Active API
                  </span>
                ) : isOpenAIConfigured ? (
                  <span className="text-[11px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Key Saved (Inactive)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    No Key Configured
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">OpenAI API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold hover:bg-white/10"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                  {isOpenAIConfigured && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKey('openai')}
                      className="px-2.5 py-2 rounded border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40"
                      title="Clear OpenAI API Key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Obtain from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-emerald-400 underline">platform.openai.com</a>.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">OpenAI Model</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#10192e] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                  <option value="gpt-4o">gpt-4o (Flagship Multilingual)</option>
                  <option value="o3-mini">o3-mini (High-Accuracy Reasoning)</option>
                  <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('openai')}
                  className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Save & Activate OpenAI</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Custom API Panel */}
          {selectedTab === 'custom' && (
            <div className={`space-y-3.5 p-4 rounded-lg border ${effectiveActive === 'custom' ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-purple-500/30 bg-[#090e1a]'}`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-400" />
                  <span className="font-semibold text-white">Custom / Local API Endpoint</span>
                </div>
                {effectiveActive === 'custom' ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Running Active API
                  </span>
                ) : isCustomConfigured ? (
                  <span className="text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    Key Saved (Inactive)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    No Key Configured
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Endpoint URL (OpenAI-compatible /chat/completions)</label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/v1/chat/completions"
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Custom Model Name</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="llama3:latest"
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">API Key / Bearer Token</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="Bearer token or API key"
                    className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-mono"
                  />
                  {isCustomConfigured && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKey('custom')}
                      className="px-2.5 py-2 rounded border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40"
                      title="Clear Custom Key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndActivate('custom')}
                  className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Save & Activate Custom API</span>
                </button>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : testStatus === 'error'
                  ? 'border-red-500/40 bg-red-950/30 text-red-300'
                  : 'border-sky-500/40 bg-sky-950/30 text-sky-300'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="h-4 w-4 animate-spin shrink-0" />}
              {testStatus === 'success' && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
              {testStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              {testStatus === 'testing' ? 'Testing...' : `Test Connection (${selectedTab.toUpperCase()})`}
            </button>
          </div>

          {/* Security Guarantee */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span>Zero-Leakage Security Guarantee</span>
            </div>
            <p>
              Your credentials are saved directly in your private browser sandbox. Only explicitly configured platforms show Active/Running status.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#090e1a] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {activeInfo.hasActive ? (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Active: <strong className="text-white">{activeInfo.name}</strong></span>
              </>
            ) : (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">No Active API Key</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
