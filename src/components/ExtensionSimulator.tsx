import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Copy,
  Check,
  RotateCcw,
  Settings as SettingsIcon,
  Sidebar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { WebSpeechController } from '../services/speechService';
import { normalizeTranscript } from '../services/normalizer';
import { refineTranscript } from '../services/refinementService';

interface ExtensionSimulatorProps {
  onOpenSettings: () => void;
}

type SimulatorStage = 'voice' | 'loading' | 'result' | 'error';

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({ onOpenSettings }) => {
  const [stage, setStage] = useState<SimulatorStage>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [transcript, setTranscript] = useState('');
  const [banglaOutput, setBanglaOutput] = useState('');
  const [englishOutput, setEnglishOutput] = useState('');
  const [copiedType, setCopiedType] = useState<'none' | 'bn' | 'en' | 'both'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  const speechRef = useRef<WebSpeechController | null>(null);
  const timerRef = useRef<any>(null);

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
    if (isRecording) {
      handleStop();
    } else {
      setTranscript('');
      speechRef.current?.start();
    }
  };

  const handleStop = async () => {
    speechRef.current?.stop();
    setIsRecording(false);

    const cleaned = normalizeTranscript(transcript);
    if (!cleaned) {
      setErrorMessage('No voice input detected. Please try recording again.');
      setStage('error');
      return;
    }

    setStage('loading');
    try {
      const res = await refineTranscript({
        transcript: cleaned,
        tone: 'professional',
        provider: 'gateway',
        model: selectedModel,
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

  const handleCopy = (text: string, type: 'bn' | 'en' | 'both') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType('none'), 1800);
  };

  const formatTimer = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="text-center mb-6 space-y-1">
        <h2 className="font-['Cabinet_Grotesk'] text-xl font-bold text-white">
          Chrome Extension Live Preview
        </h2>
        <p className="text-xs text-slate-400">
          Accurate 380px compact viewport scaled for 14-inch laptops and desktop displays.
        </p>
      </div>

      {/* Extension Container (Exact styling of popup.html) */}
      <div className="w-[380px] min-h-[500px] rounded-xl border border-white/15 bg-[#090e1a] shadow-2xl overflow-hidden flex flex-col font-sans text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#10192e] border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">🎙</span>
            <span className="text-sm font-bold tracking-tight text-white">
              Voice Professionalizer
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
              title="Settings"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body based on Stage */}
        <div className="flex-1 p-4 flex flex-col">
          {stage === 'voice' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Mic & Waveform Cluster */}
              <div className="flex flex-col items-center pt-4">
                <div className="relative flex items-center justify-center mb-3">
                  {isRecording && (
                    <div className="absolute h-20 w-20 rounded-full bg-sky-500/20 animate-ping" />
                  )}
                  <button
                    onClick={handleMicClick}
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-sky-600 hover:bg-sky-500'
                    }`}
                  >
                    {isRecording ? (
                      <Square className="h-6 w-6 fill-current" />
                    ) : (
                      <Mic className="h-7 w-7" />
                    )}
                  </button>
                </div>

                <span className="font-mono text-base font-semibold text-sky-400 tabular-nums">
                  {formatTimer(recordingSeconds)}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  {isRecording ? 'Listening... Speak naturally' : 'Click microphone to speak'}
                </span>
              </div>

              {/* Language Switch */}
              <div className="flex rounded-lg bg-[#10192e] p-1 border border-white/10 text-xs my-3">
                <button
                  onClick={() => setSelectedLang('bn-BD')}
                  className={`flex-1 py-1.5 rounded font-medium transition-colors ${
                    selectedLang === 'bn-BD'
                      ? 'bg-[#18233e] text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇧🇩 বাংলা
                </button>
                <button
                  onClick={() => setSelectedLang('en-US')}
                  className={`flex-1 py-1.5 rounded font-medium transition-colors ${
                    selectedLang === 'en-US'
                      ? 'bg-[#18233e] text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>

              {/* Model Selector Strip */}
              <div className="flex items-center justify-between rounded-lg bg-[#10192e] px-2.5 py-1.5 border border-white/10 text-xs mb-3">
                <span className="text-[11px] text-slate-400 font-medium">Model:</span>
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

              {/* Live Transcript Preview */}
              <div className="flex-1 min-h-[90px] rounded-lg bg-[#10192e] border border-white/10 p-3 text-xs leading-relaxed text-slate-200 overflow-y-auto mb-3">
                {transcript ? (
                  <span>{transcript}</span>
                ) : (
                  <span className="italic text-slate-500">
                    Listening... speak naturally in Bangla, English or Banglish
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleStop}
                  disabled={!isRecording && !transcript}
                  className="flex-1 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
                >
                  Stop & Refine
                </button>
                <button
                  onClick={handleCancel}
                  className="py-2 px-3 rounded-lg bg-[#18233e] hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
              <p className="text-xs text-slate-300 text-center">
                Polishing into professional Bangla & English...
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
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
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
                    className="w-full bg-transparent font-['Noto_Sans_Bengali'] text-xs text-slate-100 outline-none resize-none leading-relaxed"
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
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
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

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#10192e] border-t border-white/10 text-center">
          <span className="text-[11px] text-slate-400">
            Shortcut: <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-slate-300">Ctrl+Shift+V</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
