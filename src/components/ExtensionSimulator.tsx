import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Copy,
  Check,
  RotateCcw,
  Settings as SettingsIcon,
  AlertTriangle,
  Loader2,
  Move,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { WebSpeechController } from '../services/speechService';
import { normalizeTranscript } from '../services/normalizer';
import { refineTranscript } from '../services/refinementService';
import {
  getStoredSettings,
  getActiveProviderInfo,
  getEffectiveActiveProvider,
  ActiveProviderInfo,
} from '../services/settingsState';

interface ExtensionSimulatorProps {
  onOpenSettings: () => void;
}

type SimulatorStage = 'voice' | 'loading' | 'result' | 'error';

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({ onOpenSettings }) => {
  const [stage, setStage] = useState<SimulatorStage>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [transcript, setTranscript] = useState('');
  const [banglaOutput, setBanglaOutput] = useState('');
  const [englishOutput, setEnglishOutput] = useState('');
  const [copiedType, setCopiedType] = useState<'none' | 'original' | 'bn' | 'en' | 'both'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeInfo, setActiveInfo] = useState<ActiveProviderInfo>(getActiveProviderInfo());
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [isDetachedMode, setIsDetachedMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vbp_sim_window_mode') !== 'attached';
    } catch {
      return true;
    }
  });

  // Movable Popup Coordinates with Persistence across sessions
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('vbp_popup_position');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load popup position:', e);
    }
    return { x: 0, y: 0 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const speechRef = useRef<WebSpeechController | null>(null);
  const timerRef = useRef<any>(null);

  // Sync active provider
  useEffect(() => {
    const updateActiveInfo = () => {
      setActiveInfo(getActiveProviderInfo());
    };
    updateActiveInfo();
    window.addEventListener('vbp-settings-changed', updateActiveInfo);
    return () => window.removeEventListener('vbp-settings-changed', updateActiveInfo);
  }, []);

  // Keyboard shortcut listener: Ctrl + Shift + X
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
        e.preventDefault();
        setIsPopupOpen(true);
        handleMicClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isPopupOpen]);

  useEffect(() => {
    speechRef.current = new WebSpeechController(selectedLang, {
      onStart: () => setIsRecording(true),
      onResult: (d) => setTranscript(d.full),
      onError: (err) => {
        setIsRecording(false);
        setErrorMessage(err.message);
        setStage('error');
      },
      onEnd: (d) => {
        setIsRecording(false);
        if (d.final) setTranscript(d.final);
      },
    });

    return () => {
      speechRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedLang]);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const handleMicClick = () => {
    setIsPopupOpen(true);
    if (isRecording) {
      handleStopRecording();
    } else {
      setTranscript('');
      setStage('voice');
      speechRef.current?.start();
    }
  };

  const handleStopRecording = () => {
    speechRef.current?.stop();
    setIsRecording(false);
  };

  const handleRefine = async () => {
    if (isRecording) {
      speechRef.current?.stop();
      setIsRecording(false);
    }

    const cleaned = normalizeTranscript(transcript);
    if (!cleaned) {
      setErrorMessage('No voice input detected. Please provide voice input first.');
      setStage('error');
      return;
    }

    setStage('loading');
    try {
      const currentSettings = getStoredSettings();
      const activeProvider = getEffectiveActiveProvider(currentSettings);

      if (activeProvider === 'none') {
        setErrorMessage('No API key has been configured yet. Please open Settings (top right) and configure your Google Gemini or OpenAI API key first.');
        setStage('error');
        return;
      }

      const res = await refineTranscript({
        transcript: cleaned,
        tone: 'professional',
        provider: activeProvider,
        apiKey:
          activeProvider === 'openai'
            ? currentSettings.openaiKey
            : activeProvider === 'gemini'
            ? currentSettings.geminiKey
            : activeProvider === 'custom'
            ? currentSettings.customKey
            : undefined,
        model:
          activeProvider === 'openai'
            ? currentSettings.openaiModel
            : activeProvider === 'gemini'
            ? currentSettings.geminiModel
            : activeProvider === 'custom'
            ? currentSettings.customModel
            : undefined,
        customEndpoint: activeProvider === 'custom' ? currentSettings.customEndpoint : undefined,
      });

      setBanglaOutput(res.bangla);
      setEnglishOutput(res.english);
      setStage('result');
    } catch (e: any) {
      setErrorMessage(e.message || 'Refinement service error.');
      setStage('error');
    }
  };

  const handleCancel = () => {
    speechRef.current?.abort();
    setIsRecording(false);
    setTranscript('');
    setRecordingSeconds(0);
  };

  const handleCopy = (text: string, type: 'original' | 'bn' | 'en' | 'both') => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType('none'), 1800);
  };

  const formatTimer = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Draggable logic
  const handleDragStart = (e: React.MouseEvent) => {
    // Only drag on left click and not on action buttons
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.initX + deltaX;
      const newY = dragRef.current.initY + deltaY;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Persist the exact position to localStorage
        setPosition((currentPos) => {
          localStorage.setItem('vbp_popup_position', JSON.stringify(currentPos));
          return currentPos;
        });
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleResetPosition = () => {
    const centered = { x: 0, y: 0 };
    setPosition(centered);
    localStorage.setItem('vbp_popup_position', JSON.stringify(centered));
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-4">
      {/* Top Banner / Information Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#10192e] border border-white/10 p-4 rounded-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <h2 className="font-['Cabinet_Grotesk'] text-lg font-bold text-white">
              Free-Floating Extension Live Simulator
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
              Movable & Persistent
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Grab the header to move this popup anywhere on screen. Position is remembered for all future activations.
          </p>
        </div>

        {/* ACTIVE RUNNING API KEY BADGE */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
              activeInfo.hasActive
                ? activeInfo.id === 'openai'
                  ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                  : activeInfo.id === 'gemini'
                  ? 'border-sky-500/50 bg-sky-950/60 text-sky-300'
                  : 'border-purple-500/50 bg-purple-950/60 text-purple-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300'
            }`}
            title="Click to view or switch active running API key in Settings"
          >
            {activeInfo.hasActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  Running API Key: <strong className="text-white underline decoration-dotted">{activeInfo.name}</strong>
                </span>
              </>
            ) : (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-slate-500"></span>
                <span>No API Key Configured (Click to set up)</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetPosition}
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Reset popup position to center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Pos</span>
          </button>
        </div>
      </div>

      {/* Simulated Browser Navigation Bar */}
      <div className="w-full bg-[#0d1424] border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70 inline-block"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70 inline-block"></span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
            chrome-extension://voice-bilingual-professionalizer/popup.html
          </span>
          <span className="font-mono text-[11px] text-slate-400 sm:hidden">
            Extension Browser Bar
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPopupOpen(true);
              setStage('voice');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              isPopupOpen
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 ring-1 ring-sky-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Click to toggle or activate extension voice recording"
          >
            <span>🎙</span>
            <span className="text-[10.5px]">
              {isPopupOpen ? 'Popup Open (Active)' : 'Activate Voice Recording'}
            </span>
          </button>
        </div>
      </div>

      {/* Spacious Movable Interactive Canvas */}
      <div className="relative w-full min-h-[580px] rounded-xl border border-dashed border-white/15 bg-[#050811] p-4 overflow-hidden flex items-center justify-center">
        {/* Subtle Canvas Grid Lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.2) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Position Tooltip indicator on canvas */}
        <div className="absolute top-3 left-3 pointer-events-none bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-2 z-10">
          <Move className="h-3 w-3 text-sky-400" />
          <span>
            Position: <strong className="text-white">{position.x}px</strong>, <strong className="text-white">{position.y}px</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">
            {isDetachedMode ? 'Free Window Mode (Coordinates Preserved ✓)' : 'Docked Mode'}
          </span>
        </div>

        {/* Closed Popup Activator Placeholder */}
        {!isPopupOpen && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#090e1a]/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl z-20 max-w-sm">
            <span className="text-3xl">🎙</span>
            <div>
              <h3 className="text-sm font-bold text-white">Voice Popup Closed</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isDetachedMode
                  ? `Free Window mode is active. Re-opening will open in your exact last position (${position.x}px, ${position.y}px).`
                  : 'Docked mode is active.'}
              </p>
            </div>
            <button
              onClick={() => {
                setIsPopupOpen(true);
                setStage('voice');
              }}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Activate Voice (Ctrl+Shift+X)</span>
            </button>
          </div>
        )}

        {/* THE MOVABLE POPUP */}
        {isPopupOpen && (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? 'grabbing' : 'default',
            }}
            className={`w-[310px] ${
              isTranscriptExpanded ? 'min-h-[340px]' : 'min-h-[215px]'
            } rounded-xl border border-white/20 bg-[#090e1a] shadow-2xl overflow-hidden flex flex-col font-sans text-slate-100 z-10 transition-all select-none ${
              isDragging ? 'ring-2 ring-sky-500 shadow-sky-500/20' : 'hover:border-white/30'
            }`}
          >
            {/* Draggable Header */}
            <div
              onMouseDown={handleDragStart}
              className="flex items-center justify-between px-2.5 py-1.5 bg-[#10192e] border-b border-white/10 cursor-grab active:cursor-grabbing group transition-colors hover:bg-[#131d36]"
              title="Click and drag to position this popup anywhere"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🎙</span>
                <span className="text-xs font-bold tracking-tight text-white">
                  Voice Professionalizer
                </span>
              </div>

              {/* Actions Indicator */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isDetachedMode;
                    setIsDetachedMode(next);
                    try {
                      localStorage.setItem('vbp_sim_window_mode', next ? 'detached' : 'attached');
                      if (!next) {
                        setPosition({ x: 0, y: 0 });
                        localStorage.setItem('vbp_popup_position', JSON.stringify({ x: 0, y: 0 }));
                      }
                    } catch (e) {}
                  }}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold transition-colors ${
                    isDetachedMode
                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={isDetachedMode ? 'Dock popup to top position' : 'Make popup free and movable anywhere'}
                >
                  <Move className="h-2.5 w-2.5" />
                  <span>{isDetachedMode ? 'Free Window' : 'Docked'}</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  title="Settings"
                >
                  <SettingsIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  title="Close popup"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* ACTIVE API SUB-BANNER */}
            <div className="px-2.5 py-1 bg-[#0c1424] border-b border-white/5 flex items-center justify-between text-[10px]">
              {activeInfo.hasActive ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold truncate max-w-[200px]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <span className="truncate">Running API: {activeInfo.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 flex-shrink-0"></span>
                  <span>No API Key Active</span>
                </div>
              )}
              <span className="font-mono text-[8.5px] text-slate-500">Ctrl+Shift+X</span>
            </div>

            {/* Body based on Stage */}
            <div className="flex-1 p-2 flex flex-col justify-between">
              {stage === 'voice' && (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Voice Action Row: Voice Icon (Far Left) -> Bangla + English (Strictly Centered) -> Timer (Far Right) */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/10 mb-2">
                    {/* 1. Voice Icon on the Far Left */}
                    <div className="relative flex items-center justify-start flex-shrink-0 h-9 w-9 justify-self-start">
                      {isRecording && (
                        <div className="absolute h-9 w-9 rounded-full bg-red-500/20 animate-ping" />
                      )}
                      <button
                        onClick={handleMicClick}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-all ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-500 scale-105'
                            : 'bg-sky-600 hover:bg-sky-500'
                        }`}
                        title={isRecording ? 'Click to stop' : 'Click to speak'}
                      >
                        {isRecording ? (
                          <Square className="h-3 w-3 fill-current" />
                        ) : (
                          <Mic className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* 2. Bangla and English Buttons in the Exact Center */}
                    <div className="flex rounded bg-[#10192e] p-0.5 border border-white/10 text-[9.5px] justify-self-center">
                      <button
                        onClick={() => setSelectedLang('bn-BD')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          selectedLang === 'bn-BD'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Bangla Voice Recognition"
                      >
                        🇧🇩 Bangla
                      </button>
                      <button
                        onClick={() => setSelectedLang('en-US')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          selectedLang === 'en-US'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="English Voice Recognition"
                      >
                        🇬🇧 English
                      </button>
                    </div>

                    {/* 3. Timer on the Far Right */}
                    <div className="flex flex-col items-end min-w-[50px] justify-self-end">
                      <span className="font-mono text-[11px] font-bold text-sky-400 tabular-nums">
                        {formatTimer(recordingSeconds)}
                      </span>
                    </div>
                  </div>

                  {/* Input Text Area: Expanded by Default with Collapse option */}
                  <div className="rounded-lg bg-[#10192e] border border-white/10 overflow-hidden mb-2 flex flex-col transition-all">
                    <div className="flex items-center justify-between text-[9.5px] text-slate-400 px-2.5 py-1 border-b border-white/5 bg-white/[0.02]">
                      <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">
                        Input Text Field
                      </span>
                      <div className="flex items-center gap-1.5">
                        {transcript && (
                          <button
                            onClick={() => handleCopy(transcript, 'original')}
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[9.5px] font-semibold px-1 py-0.5 rounded hover:bg-white/5"
                            title="Copy voice input directly"
                          >
                            {copiedType === 'original' ? (
                              <>
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-2.5 w-2.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                          className="text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/10 transition-colors text-[9.5px]"
                          title={isTranscriptExpanded ? 'Collapse text area' : 'Expand text area'}
                        >
                          {isTranscriptExpanded ? (
                            <>
                              <Minimize2 className="h-3 w-3 text-sky-400" />
                              <span className="text-slate-300">Collapse</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-3 w-3" />
                              <span className="text-slate-300">Expand</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Text Field: Full/expanded by default, minimized to 1-2 lines when collapsed */}
                    <div
                      className={`px-2.5 py-2 text-[11.5px] leading-relaxed text-slate-200 transition-all ${
                        isTranscriptExpanded
                          ? 'min-h-[120px] max-h-[180px] overflow-y-auto'
                          : 'h-8 min-h-[32px] max-h-[36px] overflow-hidden'
                      }`}
                    >
                      {transcript ? (
                        <span className="text-slate-100">{transcript}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Four Action Buttons Arranged in Two Columns:
                      Left Column: Copy and Refine
                      Right Column: Stop and Cancel */}
                  <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
                    {/* Left Column: Copy & Refine */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => handleCopy(transcript, 'original')}
                        disabled={!transcript.trim()}
                        className="w-full py-1.5 px-2 rounded-md bg-[#18233e] hover:bg-[#202e52] border border-white/10 disabled:opacity-40 text-[11px] font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                        title="Copy voice input directly"
                      >
                        {copiedType === 'original' ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5 text-sky-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleRefine}
                        disabled={!transcript.trim()}
                        className="w-full py-1.5 px-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[11px] font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        title="Refine into professional versions"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Refine</span>
                      </button>
                    </div>

                    {/* Right Column: Stop & Cancel */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={handleStopRecording}
                        disabled={!isRecording}
                        className={`w-full py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse cursor-pointer'
                            : 'bg-white/5 text-slate-500 opacity-40 cursor-not-allowed'
                        }`}
                        title={isRecording ? 'Stop recording voice' : 'Not recording'}
                      >
                        <Square className="h-2.5 w-2.5 fill-current" />
                        <span>Stop</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full py-1.5 px-2 rounded-md bg-[#18233e] hover:bg-white/10 text-[11px] font-medium text-slate-300 transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        title="Cancel and clear"
                      >
                        <X className="h-2.5 w-2.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {stage === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
                <p className="text-xs text-slate-300 text-center">
                  Polishing via {activeInfo.name}...
                </p>
              </div>
            )}

            {stage === 'result' && (
              <div className="flex-1 flex flex-col gap-3">
                {/* Bangla Card */}
                <div className="rounded-lg bg-[#10192e] border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/10">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      🇧🇩 Bangla Professional
                    </span>
                    <button
                      onClick={() => handleCopy(banglaOutput, 'bn')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {copiedType === 'bn' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5">
                    <textarea
                      value={banglaOutput}
                      onChange={(e) => setBanglaOutput(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-xs text-slate-100 outline-none resize-none font-['Noto_Sans_Bengali'] leading-relaxed"
                    />
                  </div>
                </div>

                {/* English Card */}
                <div className="rounded-lg bg-[#10192e] border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-b border-white/10">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      🇬🇧 English Professional
                    </span>
                    <button
                      onClick={() => handleCopy(englishOutput, 'en')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {copiedType === 'en' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5">
                    <textarea
                      value={englishOutput}
                      onChange={(e) => setEnglishOutput(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-xs text-slate-100 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setStage('voice');
                      setTranscript('');
                      speechRef.current?.start();
                    }}
                    className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Record Again</span>
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(
                        `🇧🇩 বাংলা:\n${banglaOutput}\n\n🇬🇧 English:\n${englishOutput}`,
                        'both'
                      )
                    }
                    className="py-2 px-3 rounded-lg bg-[#18233e] hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
                  >
                    {copiedType === 'both' ? 'Both Copied ✓' : 'Copy Both'}
                  </button>
                </div>
              </div>
            )}

            {stage === 'error' && (
              <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
                <div className="p-3 rounded-full bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-red-300">Notice</h4>
                  <p className="text-xs text-slate-400">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setStage('voice')}
                  className="py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer with Developed by Akash strictly aligned to the left */}
          <div className="w-full px-3.5 py-2 bg-[#10192e] border-t border-white/10 flex items-center justify-between text-[10.5px]">
            <span className="font-medium text-slate-300 text-left mr-auto">
              Developed by <strong className="text-sky-400 font-bold">Akash</strong>
            </span>
            <span className="text-slate-400 font-mono text-[9px] flex items-center gap-1 ml-auto">
              Shortcut: <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-sky-200 font-semibold">Ctrl+Shift+X</kbd>
            </span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
