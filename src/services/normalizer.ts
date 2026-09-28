/**
 * Transcript Normalization Engine
 * Cleans speech-recognition noise without modifying semantic meaning.
 */

export function normalizeTranscript(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let text = rawText;

  // 1. Normalize line endings and duplicate whitespace
  text = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

  // 2. Remove speech-recognition stutter / immediate duplicate words
  // Unicode-aware regex matching Bangla and Latin word boundaries
  text = text.replace(/\b([\p{L}\p{M}\d]+)\s+\1\b/giu, '$1');

  // Handle common repetitive hesitation sounds
  text = text.replace(/\b(umm+|uhh+|aah+|hmm+)\b/gi, '');

  // 3. Fix misplaced or duplicate punctuation artifacts from STT
  text = text
    .replace(/([,;:.?!])\s*[,;:.?!]+/g, '$1')
    .replace(/\s+([,;:.?!])/g, '$1')
    .replace(/([,;:.?!])([^\s\d])/g, '$1 $2');

  // 4. Clean trailing and leading punctuation artifacts
  text = text.replace(/^[,;:\s]+/, '').replace(/[,;:\s]+$/, '');

  // 5. Final whitespace normalization
  return text.replace(/\s+/g, ' ').trim();
}
