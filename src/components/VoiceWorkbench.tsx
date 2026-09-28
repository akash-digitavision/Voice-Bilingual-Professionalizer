import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Volume2,
  AlertCircle,
  HelpCircle,
  Sliders,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { WebSpeechController } from '../services/speechService';
import { normalizeTranscript } from '../services/normalizer';
import { refineTranscript } from '../services/refinementService';

interface VoiceWorkbenchProps {
  onOpenSettings: () => void;
}

const SAMPLE_INPUTS = [
  {
    label: 'Banglish Email Draft',
    text: 'Ami apnake kal sokale email pathabo context ta check kore amake feedback janaben please.',
  },
  {
    label: 'Rough Bengali Speech',
    text: 'আমি আমি বলতে চাচ্ছিলাম যে প্রজেক্টের ডেলিভারি ডেটটা একটু পিছালে ভালো হতো কারণ কয়েকটা বাগ ফিক্স করতে হবে।',
  },
  {
    label: 'Informal English Request',
    text: 'Hey can you like review the document ASAP we need to send it to the client before 5pm or they will get mad.',
  },
  {
    label: 'Mixed Code-Switching',
    text: 'Client meeting e issue ta discuss kora hoyeche, unara bolchen budget barano jabe na but scope ta re-evaluate korte.',
  },
];

export const VoiceWorkbench: React.FC<VoiceWorkbenchProps> = ({ onOpenSettings }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [rawTranscript, setRawTranscript] = useState('');
  const [normalizedTranscript, setNormalizedTranscript] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [banglaResult, setBanglaResult] = useState('');
  const [englishResult, setEnglishResult] = useState('');
  const [copiedType, setCopiedType] = useState<'none' | 'bangla' | 'english' | 'both'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'professional' | 'executive' | 'friendly'>('professional');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');

  const speechRef = useRef<WebSpeechController | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize speech controller
  useEffect(() => {
    speechRef.current = new WebSpeechController(selectedLang, {
      onStart: () => {
        setIsRecording(true);
        setErrorMessage(null);
      },
      onResult: (data) => {
        setRawTranscript(data.full);
        setNormalizedTranscript(normalizeTranscript(data.full));
      },
      onError: (err) => {
        setIsRecording(false);
        setErrorMessage(err.message);
      },
      onEnd: (data) => {
        setIsRecording(false);
        if (data.final) {
          setRawTranscript(data.final);
          setNormalizedTranscript(normalizeTranscript(data.final));
        }
      },
    });

    return () => {
      speechRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedLang]);

  // Handle timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      speechRef.current?.stop();
      setIsRecording(false);
    } else {
      setRawTranscript('');
      setNormalizedTranscript('');
      setErrorMessage(null);
      speechRef.current?.start();
    }
  };

  const handleRefine = async (textToRefine?: string) => {
    const input = (textToRefine || normalizedTranscript || rawTranscript).trim();
    if (!input) {
      setErrorMessage('Please provide voice input or choose a sample prompt first.');
      return;
    }

    setIsRefining(true);
    setErrorMessage(null);

    try {
      const result = await refineTranscript({
        transcript: input,
        tone: tone,
        conciseness: 'balanced',
        provider: 'gateway',
        model: selectedModel,
      });

      setBanglaResult(result.bangla);
      setEnglishResult(result.english);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI refinement failed. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = (text: string, type: 'bangla' | 'english' | 'both') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType('none'), 2000);
    });
  };

  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-8">
      {/* Hero / Context Introduction */}
      <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
              <span>Speech-to-Bilingual Engine</span>
              <span>·</span>
              <span>Bangla + English Output</span>
            </div>
            <h1 className="font-['Cabinet_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Speak naturally. Receive executive Bangla & English.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Designed for Google Chrome to eliminate repetitive drafting. Handles pure Bangla, English, Banglish, and codeswitching without word-for-word translation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-lg border border-white/10 bg-[#090e1a] p-1 flex items-center text-xs">
              <button
                onClick={() => setSelectedLang('bn-BD')}
                className={`rounded px-3 py-1.5 transition-colors font-medium ${
                  selectedLang === 'bn-BD'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇧🇩 বাংলা (bn-BD)
              </button>
              <button
                onClick={() => setSelectedLang('en-US')}
                className={`rounded px-3 py-1.5 transition-colors font-medium ${
                  selectedLang === 'en-US'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 English (en-US)
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#090e1a] p-1 flex items-center text-xs">
              <span className="px-2 text-slate-400">Tone:</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-transparent text-white text-xs font-medium outline-none cursor-pointer pr-1"
              >
                <option value="professional" className="bg-[#10192e]">Professional</option>
                <option value="executive" className="bg-[#10192e]">Executive</option>
                <option value="friendly" className="bg-[#10192e]">Friendly</option>
              </select>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#090e1a] p-1 flex items-center text-xs">
              <span className="px-2 text-slate-400">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-sky-400 text-xs font-semibold outline-none cursor-pointer pr-1"
              >
                <option value="gemini-3.8-flash" className="bg-[#10192e] text-white">gemini-3.8-flash (Recommended)</option>
                <option value="gemini-3.1-flash-lite" className="bg-[#10192e] text-white">gemini-3.1-flash-lite (Fast Lite)</option>
                <option value="gemini-3.1-pro-preview" className="bg-[#10192e] text-white">gemini-3.1-pro-preview (Pro Reasoning)</option>
                <option value="gemini-flash-latest" className="bg-[#10192e] text-white">gemini-flash-latest (Latest Flash)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Recording & Transcript Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Capture & Normalization */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <span>01. Audio Input & Speech Recognition</span>
              </h2>
              <span className="font-mono text-xs tabular-nums text-sky-400 font-semibold bg-sky-950/60 px-2.5 py-1 rounded border border-sky-800/40">
                {formatTimer(recordingSeconds)}
              </span>
            </div>

            {/* Central Microphone Cluster */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <div className="absolute h-28 w-28 rounded-full bg-red-500/20 animate-ping" />
                )}
                <button
                  onClick={toggleRecording}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 ring-4 ring-red-500/30'
                      : 'bg-sky-600 hover:bg-sky-500 hover:scale-105 ring-4 ring-sky-500/20'
                  }`}
                  aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? (
                    <Square className="h-8 w-8 fill-current" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </button>
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-white">
                  {isRecording ? 'Listening... Speak now' : 'Click microphone to begin voice input'}
                </p>
                <p className="text-xs text-slate-400">
                  {isRecording
                    ? 'Speak in Bangla, English or Banglish codeswitching'
                    : 'Shortcut: Press Ctrl+Shift+V or click to record'}
                </p>
              </div>
            </div>

            {/* Live Transcript Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Raw Captured Speech</span>
                {rawTranscript && (
                  <button
                    onClick={() => {
                      setRawTranscript('');
                      setNormalizedTranscript('');
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={rawTranscript}
                onChange={(e) => {
                  setRawTranscript(e.target.value);
                  setNormalizedTranscript(normalizeTranscript(e.target.value));
                }}
                placeholder="Spoken words will stream here in real-time... (You can also type or paste directly)"
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-[#090e1a] p-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>

            {/* Normalization Diff Pill */}
            {normalizedTranscript && normalizedTranscript !== rawTranscript && (
              <div className="rounded-lg border border-sky-500/20 bg-sky-950/30 p-3 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Transcript Normalized (Stutters & Spacing Cleaned)</span>
                </div>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                  {normalizedTranscript}
                </p>
              </div>
            )}

            {/* Refinement Action Button */}
            <button
              onClick={() => handleRefine()}
              disabled={isRefining || (!rawTranscript && !normalizedTranscript)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
            >
              {isRefining ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Polishing into Professional Bangla & English...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Refine into Professional Versions</span>
                </>
              )}
            </button>

            {/* Sample Presets Strip */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-medium text-slate-400">Or try a test preset:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_INPUTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRawTranscript(sample.text);
                      setNormalizedTranscript(normalizeTranscript(sample.text));
                      handleRefine(sample.text);
                    }}
                    className="text-left p-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/15 transition-all text-xs text-slate-300"
                  >
                    <div className="font-semibold text-sky-400 mb-0.5">{sample.label}</div>
                    <div className="text-slate-400 line-clamp-1">{sample.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Bilingual Results */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#10192e] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                <span>02. Professional Dual Output</span>
              </h2>
              {banglaResult && englishResult && (
                <button
                  onClick={() =>
                    handleCopy(
                      `🇧🇩 বাংলা:\n${banglaResult}\n\n🇬🇧 English:\n${englishResult}`,
                      'both'
                    )
                  }
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  {copiedType === 'both' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Both Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Both</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-200 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Notice</p>
                  <p className="text-red-300">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Bangla Card */}
            <div className="rounded-lg border border-white/10 bg-[#090e1a] overflow-hidden focus-within:border-sky-500 transition-colors">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇧🇩</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Bangla Professional
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(banglaResult, 'bangla')}
                  disabled={!banglaResult}
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  {copiedType === 'bangla' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Bangla</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3.5">
                <textarea
                  value={banglaResult}
                  onChange={(e) => setBanglaResult(e.target.value)}
                  placeholder="পেশাদার বাংলা রূপান্তর এখানে প্রদর্শিত হবে..."
                  rows={4}
                  className="w-full bg-transparent font-['Noto_Sans_Bengali'] text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* English Card */}
            <div className="rounded-lg border border-white/10 bg-[#090e1a] overflow-hidden focus-within:border-sky-500 transition-colors">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.02] border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    English Professional
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(englishResult, 'english')}
                  disabled={!englishResult}
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  {copiedType === 'english' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy English</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3.5">
                <textarea
                  value={englishResult}
                  onChange={(e) => setEnglishResult(e.target.value)}
                  placeholder="Professional English refinement will appear here..."
                  rows={4}
                  className="w-full bg-transparent font-sans text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none resize-none"
                />
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
                <span>Executive Output Guarantee</span>
              </div>
              <p>
                Both versions are generated simultaneously with strict factual integrity. Factual details (names, dates, figures) are preserved while informal phrasing, stuttering, and transcription errors are corrected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
