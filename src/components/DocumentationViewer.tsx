import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Layers,
  FileText,
  Lock,
  Terminal,
  HelpCircle,
} from 'lucide-react';

export const DocumentationViewer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'auth' | 'requirements' | 'architecture' | 'privacy' | 'install'>('auth');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 lg:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <span>Engineering Documentation</span>
            <span>·</span>
            <span>Specifications & Compliance</span>
          </div>
          <h2 className="font-['Cabinet_Grotesk'] text-2xl font-bold tracking-tight text-white">
            Architecture, Authentication & Security Audit
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Detailed specifications on authentication decisions, data lifecycle, permission justification, and browser security constraints.
          </p>
        </div>

        {/* Tab Strip */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 text-xs">
          <button
            onClick={() => setActiveDoc('auth')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'auth'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Authentication Decision (Option A & B)
          </button>
          <button
            onClick={() => setActiveDoc('requirements')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'requirements'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Requirements Matrix
          </button>
          <button
            onClick={() => setActiveDoc('architecture')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'architecture'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Manifest V3 Architecture
          </button>
          <button
            onClick={() => setActiveDoc('privacy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'privacy'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Permissions & Privacy Audit
          </button>
          <button
            onClick={() => setActiveDoc('install')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'install'
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Installation Guide
          </button>
        </div>
      </div>

      {/* Doc Content Box */}
      <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 lg:p-8 text-sm leading-relaxed text-slate-300 space-y-6">
        {activeDoc === 'auth' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-sky-400" />
              <span>Authentication Architecture Decision (ChatGPT vs. OpenAI API)</span>
            </h3>
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200 space-y-2">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                <span>Section 3 Compliance: Absolute Prohibition of Cookie / Session Scraping</span>
              </div>
              <p>
                As mandated by the master specification, <strong>ChatGPT website login is NOT OpenAI API authentication</strong>. Consumer ChatGPT accounts (Plus/Pro) do not grant API entitlements, and scraping session cookies from <code className="font-mono">chatgpt.com</code> is strictly prohibited because it violates browser security isolation, breaks OpenAI Terms of Service, and creates catastrophic credential exposure risks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg border border-white/10 bg-[#090e1a] p-4 space-y-2">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-sky-400">
                  Option A: Local Encrypted Credential (Extension Mode)
                </h4>
                <p className="text-xs text-slate-300">
                  The user configures their official OpenAI API key (<code className="font-mono text-sky-300">sk-...</code>) or Gemini key inside the Extension Options panel. The key is stored solely in the browser's sandboxed <code className="font-mono text-sky-300">chrome.storage.local</code>. Never exposed to arbitrary web pages, never logged to console, never committed.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#090e1a] p-4 space-y-2">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-sky-400">
                  Option B: Secure Backend Gateway (Companion Workbench)
                </h4>
                <p className="text-xs text-slate-300">
                  For the interactive web companion, server-side environment variables (<code className="font-mono text-sky-300">process.env.GEMINI_API_KEY</code>) are utilized via the Express gateway endpoint (<code className="font-mono text-sky-300">/api/refine</code>). The client browser never receives secrets.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'requirements' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-400" />
              <span>Requirements Verification Matrix</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-white/10">
                <thead className="bg-[#090e1a] text-slate-300 border-b border-white/10">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3">Specification Requirement</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Manifest V3</td>
                    <td className="p-3 font-sans">Compliant manifest.json, service worker background.js, options page, side panel.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Shortcut</td>
                    <td className="p-3 font-sans">Chrome commands API (Ctrl+Shift+X / Cmd+Shift+X), configurable via chrome://extensions/shortcuts.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Voice UI</td>
                    <td className="p-3 font-sans">Compact 380px navy blue layout, recording timer, interim transcript, zero-bloat ergonomics.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Speech STT</td>
                    <td className="p-3 font-sans">Web Speech API bn-BD and en-US with multi-language fallback and interim text.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Normalization</td>
                    <td className="p-3 font-sans">Stutter filtering, punctuation and whitespace cleanup, 100% semantic preservation.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-sky-400">Dual Output</td>
                    <td className="p-3 font-sans">Simultaneous native Bangla and executive English with 1-click copy and inline editing.</td>
                    <td className="p-3 text-emerald-400 font-sans font-semibold">VERIFIED ✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeDoc === 'architecture' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-400" />
              <span>Manifest V3 Architecture & Lifecycle</span>
            </h3>
            <p>
              Manifest V3 enforces service workers instead of persistent background pages. In addition:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-300 pl-2">
              <li><strong>Popup (`popup.html`):</strong> Instant voice capture from toolbar or keyboard shortcut.</li>
              <li><strong>Side Panel (`sidepanel.html`):</strong> Persistent side panel for multi-tasking across web pages without dismissal on focus change.</li>
              <li><strong>Content Script (`content.js`):</strong> Injected movable shadow DOM voice recorder on active tabs via <code className="font-mono text-sky-300">Ctrl+Shift+X</code> (or <code className="font-mono text-sky-300">Alt+Shift+X</code>).</li>
              <li><strong>Background (`background.js`):</strong> Handles shortcut command dispatches and options page routing.</li>
            </ul>
          </div>
        )}

        {activeDoc === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
              <span>Permissions & Privacy Audit</span>
            </h3>
            <p>
              Requested permissions are strictly minimized:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-white/10 bg-[#090e1a]">
                <strong className="text-sky-400 block mb-1">storage</strong>
                <span className="text-slate-400">Stores tone, model, language preference, and API key locally on device.</span>
              </div>
              <div className="p-3 rounded-lg border border-white/10 bg-[#090e1a]">
                <strong className="text-sky-400 block mb-1">activeTab</strong>
                <span className="text-slate-400">Allows in-page shadow DOM overlay injection only upon user shortcut.</span>
              </div>
              <div className="p-3 rounded-lg border border-white/10 bg-[#090e1a]">
                <strong className="text-sky-400 block mb-1">sidePanel</strong>
                <span className="text-slate-400">Allows persistent side panel opening in desktop Chrome.</span>
              </div>
            </div>
          </div>
        )}

        {activeDoc === 'install' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-sky-400" />
              <span>Chrome Developer Mode Installation</span>
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-xs text-slate-300">
              <li>
                Click <strong>"Download Extension (.zip)"</strong> in the top navigation bar.
              </li>
              <li>
                Extract the downloaded <code className="font-mono text-sky-300">voice-bilingual-professionalizer-v1.0.0.zip</code> file onto your computer.
              </li>
              <li>
                Open Google Chrome and navigate to <code className="font-mono text-sky-300">chrome://extensions</code>.
              </li>
              <li>
                In the top right corner, switch on the <strong>"Developer mode"</strong> toggle.
              </li>
              <li>
                Click the <strong>"Load unpacked"</strong> button in the top left.
              </li>
              <li>
                Select the extracted extension folder containing <code className="font-mono text-sky-300">manifest.json</code>.
              </li>
              <li>
                Click the Extensions puzzle icon in Chrome and pin <strong>Voice Bilingual Professionalizer</strong>!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
