import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Folder,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface CodeInspectorProps {
  onDownloadExtension: () => void;
  isDownloading: boolean;
}

const EXTENSION_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'options.css',
  'sidepanel.html',
  'sidepanel.js',
  'modules/ai-providers.js',
  'modules/speech.js',
  'modules/normalizer.js',
  'modules/storage.js',
  'modules/clipboard.js',
];

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  onDownloadExtension,
  isDownloading,
}) => {
  const [selectedFile, setSelectedFile] = useState('manifest.json');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/extension-file-content?path=${encodeURIComponent(selectedFile)}`)
      .then((res) => res.text())
      .then((text) => {
        setFileContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        setFileContent(`// Error loading file: ${err.message}`);
        setIsLoading(false);
      });
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <span>Manifest V3 Compliance</span>
              <span>·</span>
              <span>Production Extension Source</span>
            </div>
            <h2 className="font-['Cabinet_Grotesk'] text-2xl font-bold tracking-tight text-white">
              Inspected & Verified Chrome MV3 Architecture
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every file listed below is packaged into the ready-to-install ZIP. Clean, modern, decoupled JavaScript with zero secret leaks and minimal permissions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDownloadExtension}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>{isDownloading ? 'Packaging...' : 'Download Extension ZIP (v1.0.0)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Viewer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: File List */}
        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#10192e] p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Extension Tree (/extension)
          </div>
          <div className="space-y-1">
            {EXTENSION_FILES.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors text-left ${
                  selectedFile === file
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <FileCode className="h-4 w-4 shrink-0 text-sky-400" />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          {/* Quick Install Checklist */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-white">Chrome Installation Steps:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Download & extract the ZIP file</li>
              <li>Navigate to <code className="text-sky-300 font-mono">chrome://extensions</code></li>
              <li>Toggle <strong className="text-slate-200">Developer mode</strong> (top-right)</li>
              <li>Click <strong className="text-slate-200">Load unpacked</strong> and select folder</li>
            </ol>
          </div>
        </div>

        {/* Main: Source Code Display */}
        <div className="lg:col-span-8 rounded-xl border border-white/10 bg-[#090e1a] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#10192e] border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-sky-400 font-semibold">{selectedFile}</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied ✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 flex-1 overflow-x-auto max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-slate-500 font-mono">Loading file...</div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed text-slate-300">
                <code>{fileContent}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
