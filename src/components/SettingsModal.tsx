import React, { useState } from 'react';
import { X, Key, Check, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';
import { refineTranscript } from '../services/refinementService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'gateway' | 'openai' | 'gemini'>('gateway');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setStatusMessage('Testing provider connection...');

    try {
      await refineTranscript({
        transcript: 'আমি কাজটি দ্রুত শেষ করতে চাই।',
        provider,
        apiKey: provider === 'openai' ? openaiKey : provider === 'gemini' ? geminiKey : undefined,
        model: provider === 'openai' ? openaiModel : provider === 'gemini' ? geminiModel : undefined,
      });

      setTestStatus('success');
      setStatusMessage('Connection verified! Bilingual engine active ✓');
    } catch (err: any) {
      setTestStatus('error');
      setStatusMessage(err.message || 'Connection failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#10192e] shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090e1a]">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-sky-400" />
            <h3 className="font-['Cabinet_Grotesk'] text-base font-bold text-white">
              AI Provider & Engine Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('gateway')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  provider === 'gateway'
                    ? 'border-sky-500 bg-sky-950/40 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-sky-400 mb-0.5">Gemini Gateway</div>
                <div className="text-[10px] text-slate-400">Zero setup · Server-side</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  provider === 'gemini'
                    ? 'border-sky-500 bg-sky-950/40 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-sky-400 mb-0.5">Gemini API Key</div>
                <div className="text-[10px] text-slate-400">Direct user key</div>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  provider === 'openai'
                    ? 'border-sky-500 bg-sky-950/40 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-sky-400 mb-0.5">OpenAI Key</div>
                <div className="text-[10px] text-slate-400">Direct API key</div>
              </button>
            </div>
          </div>

          {/* Gemini Direct Key Input */}
          {provider === 'gemini' && (
            <div className="space-y-3 p-3.5 rounded-lg border border-white/10 bg-[#090e1a]">
              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Gemini API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Obtain from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="text-sky-400 underline">Google AI Studio</a>.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">Gemini Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#10192e] px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Latest & Recommended - Fast Bilingual)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Cost-Efficient Flash Lite)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Nuance & Pro Reasoning)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (Always Latest Flash)</option>
                </select>
              </div>
            </div>
          )}

          {/* OpenAI Key Input if Selected */}
          {provider === 'openai' && (
            <div className="space-y-3 p-3.5 rounded-lg border border-white/10 bg-[#090e1a]">
              <div className="space-y-1">
                <label className="font-semibold text-slate-200">OpenAI API Key</label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block pt-1">
                  Stored strictly in your local session. ChatGPT web sessions cannot be used as API credentials.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-200">OpenAI Model</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#10192e] px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                  <option value="gpt-4o">gpt-4o (Flagship Multilingual)</option>
                  <option value="o3-mini">o3-mini (High-Accuracy Reasoning)</option>
                  <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
                </select>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                  : testStatus === 'error'
                  ? 'border-red-500/30 bg-red-950/20 text-red-300'
                  : 'border-sky-500/30 bg-sky-950/20 text-sky-300'
              }`}
            >
              {testStatus === 'testing' && <RefreshCw className="h-4 w-4 animate-spin" />}
              {testStatus === 'success' && <Check className="h-4 w-4 text-emerald-400" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Test Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Security Notice */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
              <span>Zero-Leakage Guarantee</span>
            </div>
            <p>
              Your credentials are never transmitted to unauthorized parties or logged in console logs. The built-in Gemini Gateway executes server-side with <code className="font-mono text-sky-300">aistudio-build</code> telemetry headers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#090e1a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
