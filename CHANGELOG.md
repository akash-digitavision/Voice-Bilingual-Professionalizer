# Changelog — Voice Bilingual Professionalizer

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-09-28
### Added
- Greenfield Chrome Extension built to Google Chrome Manifest V3 standards.
- Speech-to-text layer using Web Speech API with support for Bangla (`bn-BD`) and English (`en-US`).
- Algorithmic transcript normalizer to remove stutters, repeated words, and punctuation artifacts without altering semantic meaning.
- AI bilingual refinement layer generating simultaneous natural Bangladeshi Bangla and executive English.
- Provider abstraction supporting OpenAI, Google Gemini, and OpenAI-compatible custom endpoints with normalized error handling.
- Compact 380px Voice UI with dark navy aesthetic optimized for 14-inch laptops and desktop displays.
- Chrome Commands API integration for keyboard shortcut `Ctrl+Shift+V` / `Command+Shift+V`.
- In-page floating voice widget via encapsulated Shadow DOM (`content.js`).
- Chrome Side Panel integration (`sidepanel.html`) for non-dismissible multitasking.
- Complete settings panel (`options.html`) with password-masked key storage, show/hide toggle, and credential testing.
- Secure backend gateway route (`/api/refine`) for zero-configuration testing in the companion workbench.
- Verified ZIP package builder creating `voice-bilingual-professionalizer-v1.0.0.zip`.
- Comprehensive engineering documentation (`docs/`).
