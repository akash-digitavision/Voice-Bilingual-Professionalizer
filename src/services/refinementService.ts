/**
 * Refinement Service
 * Dispatches to /api/refine (Server-Side Gemini Gateway) or client-configured direct keys.
 */

export interface RefinementResult {
  bangla: string;
  english: string;
}

export interface RefineOptions {
  transcript: string;
  tone?: 'professional' | 'executive' | 'friendly';
  conciseness?: 'concise' | 'balanced' | 'detailed';
  provider?: 'gateway' | 'openai' | 'gemini';
  apiKey?: string;
  model?: string;
}

export async function refineTranscript(options: RefineOptions): Promise<RefinementResult> {
  const { transcript, tone = 'professional', conciseness = 'balanced', provider = 'gateway' } = options;

  // Option B: Server-Side Gateway (Default for Web Workbench)
  if (provider === 'gateway') {
    const response = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, tone, conciseness, model: options.model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server gateway failed (HTTP ${response.status})`);
    }

    return await response.json();
  }

  // Option A: Direct OpenAI call if user explicitly entered their OpenAI API key in workbench
  if (provider === 'openai') {
    if (!options.apiKey) {
      throw new Error('OpenAI API Key is required.');
    }

    const sysPrompt = `You are a professional bilingual language refinement assistant.
Understand the intended meaning of the input (Bangla, English, Banglish, mixed speech, or rough transcript) and produce two polished versions:
1. Natural professional Bangla (authentic Bengali phrasing, respectful, standard formal/semi-formal, no literal word-for-word translation).
2. Natural professional English (executive, crisp, fluent, polite, no mechanical translation).
Preserve original meaning and factual details strictly. Tone: ${tone}. Length: ${conciseness}.
Return JSON only:
{"bangla": "...", "english": "..."}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: transcript },
        ],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenAI error ${res.status}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);
    return {
      bangla: parsed.bangla || '',
      english: parsed.english || '',
    };
  }

  // Option A: Direct Gemini call with user's key in workbench
  if (provider === 'gemini') {
    if (!options.apiKey) {
      throw new Error('Gemini API Key is required.');
    }

    let model = options.model || 'gemini-3.8-flash';
    if (model === 'gemini-2.5-flash') model = 'gemini-3.8-flash';

    const sysPrompt = `You are a professional bilingual language refinement assistant.
Understand the intended meaning of the input and produce two polished versions:
1. Natural professional Bangla
2. Natural professional English
Preserve original meaning and factual details strictly. Tone: ${tone}. Length: ${conciseness}.
Return JSON only:
{"bangla": "...", "english": "..."}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey.trim()}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: 'user', parts: [{ text: transcript }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini error ${res.status}`);
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(raw);
    return {
      bangla: parsed.bangla || '',
      english: parsed.english || '',
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
