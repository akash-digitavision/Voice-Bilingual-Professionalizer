import React from 'react';
import { Mic, Download, Settings, Github, Check } from 'lucide-react';

interface TopNavProps {
  activeTab: 'workbench' | 'simulator' | 'code' | 'docs';
  setActiveTab: (tab: 'workbench' | 'simulator' | 'code' | 'docs') => void;
  onOpenSettings: () => void;
  isDownloading: boolean;
  onDownloadExtension: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isDownloading,
  onDownloadExtension,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090e1a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 border border-sky-500/30">
            <Mic className="h-5 w-5" />
          </div>
          <span className="font-['Cabinet_Grotesk'] text-lg font-bold tracking-tight text-white">
            Voice Bilingual Professionalizer
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg bg-white/5 p-1 border border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'workbench'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Voice Workbench
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'simulator'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Extension Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'code'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manifest V3 Files
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'docs'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Architecture & Docs
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Settings & Key Configuration"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={onDownloadExtension}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? 'Packaging...' : 'Download Extension (.zip)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
