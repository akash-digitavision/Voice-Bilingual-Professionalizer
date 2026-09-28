/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TopNav } from './components/TopNav';
import { VoiceWorkbench } from './components/VoiceWorkbench';
import { ExtensionSimulator } from './components/ExtensionSimulator';
import { CodeInspector } from './components/CodeInspector';
import { DocumentationViewer } from './components/DocumentationViewer';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workbench' | 'simulator' | 'code' | 'docs'>('workbench');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExtension = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = '/voice-bilingual-professionalizer-v1.0.0.zip';
    link.download = 'voice-bilingual-professionalizer-v1.0.0.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-sky-500 selection:text-white">
      {/* Top Bar Contract: 3 zones */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDownloading={isDownloading}
        onDownloadExtension={handleDownloadExtension}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workbench' && (
          <VoiceWorkbench onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeTab === 'simulator' && (
          <ExtensionSimulator onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeTab === 'code' && (
          <CodeInspector
            onDownloadExtension={handleDownloadExtension}
            isDownloading={isDownloading}
          />
        )}
        {activeTab === 'docs' && <DocumentationViewer />}
      </main>

      {/* Global Settings Drawer / Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-white/10 bg-[#090e1a] py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>Voice Bilingual Professionalizer</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-sky-400">Manifest V3 (v1.0.0)</span>
            <span>·</span>
            <span>Bangla & English Executive Voice Input</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Desktop Chrome (14" Laptop Optimized)</span>
            <span>·</span>
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-slate-300 transition-colors"
            >
              Security Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
